import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { loadEnv } from "../config/env";
import { inngest } from "./inngest.client";

export const OUTBOX_SUPABASE = Symbol("OUTBOX_SUPABASE");
export const OUTBOX_INNGEST = Symbol("OUTBOX_INNGEST");
export const OUTBOX_PUBLISHER_OPTIONS = Symbol("OUTBOX_PUBLISHER_OPTIONS");

const OUTBOX_SELECT =
  "id, org_id, event_name, payload_json, created_at, published_at, attempts";
const DEFAULT_BATCH_SIZE = 25;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_PUBLISH_INTERVAL_MS = 2_000;

export type SupabaseLike = Pick<SupabaseClient, "from">;
export type JsonObject = Record<string, unknown>;

export type EnqueueOutboxInput = {
  orgId: string;
  eventName: string;
  payload: JsonObject;
};

export type InngestSender = {
  send(event: { name: string; data: JsonObject }): Promise<unknown>;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type OutboxRow = {
  id: string;
  org_id: string;
  event_name: string;
  payload_json: JsonObject | null;
  created_at: string;
  published_at: string | null;
  attempts: number;
};

type OutboxPublisherOptions = {
  maxAttempts?: number;
  now?: () => Date;
  publishIntervalMs?: number;
};

export async function enqueueOutbox(
  tx: SupabaseLike,
  input: EnqueueOutboxInput,
) {
  const { data, error } = await tx
    .from("outbox_events")
    .insert({
      org_id: input.orgId,
      event_name: input.eventName,
      payload_json: input.payload,
      published_at: null,
      attempts: 0,
    })
    .select(OUTBOX_SELECT)
    .single();

  if (error) {
    throwOutboxError(error, "Could not enqueue outbox event");
  }

  return mapOutboxRow(data as OutboxRow);
}

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private readonly supabase: SupabaseLike;
  private readonly inngestClient: InngestSender;
  private readonly maxAttempts: number;
  private readonly now: () => Date;
  private readonly publishIntervalMs: number;
  private publishTimer: ReturnType<typeof setInterval> | undefined;
  private isPublishing = false;

  constructor(
    @Optional()
    @Inject(OUTBOX_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(OUTBOX_INNGEST)
    inngestClient?: InngestSender,
    @Optional()
    @Inject(OUTBOX_PUBLISHER_OPTIONS)
    options: OutboxPublisherOptions = {},
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.inngestClient = inngestClient ?? inngest;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.now = options.now ?? (() => new Date());
    this.publishIntervalMs =
      options.publishIntervalMs ?? DEFAULT_PUBLISH_INTERVAL_MS;
  }

  onModuleInit() {
    if (process.env.NODE_ENV === "test" || this.publishTimer) {
      return;
    }

    this.publishTimer = setInterval(() => {
      void this.publishPendingOnce();
    }, this.publishIntervalMs);

    const timer = this.publishTimer as { unref?: () => void };
    timer.unref?.();
  }

  onModuleDestroy() {
    if (!this.publishTimer) {
      return;
    }

    clearInterval(this.publishTimer);
    this.publishTimer = undefined;
  }

  async publishPending(batchSize = DEFAULT_BATCH_SIZE) {
    const { data, error } = await this.supabase
      .from("outbox_events")
      .select(OUTBOX_SELECT)
      .is("published_at", null)
      .lt("attempts", this.maxAttempts)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (error) {
      throwOutboxError(error, "Could not read pending outbox events");
    }

    const rows = (data ?? []) as OutboxRow[];
    let published = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const row of rows) {
      try {
        await this.inngestClient.send({
          name: toInngestEventName(row.event_name),
          data: {
            ...(row.payload_json ?? {}),
            orgId: row.org_id,
            outboxEventId: row.id,
          },
        });
        await this.markPublished(row.id, this.now().toISOString());
        published += 1;
      } catch (error) {
        const nextAttempts = row.attempts + 1;
        await this.markFailed(row.id, nextAttempts);
        failed += 1;

        if (nextAttempts >= this.maxAttempts) {
          await this.writeDeadLetter(row, nextAttempts, error);
          deadLettered += 1;
        }
      }
    }

    return { published, failed, deadLettered };
  }

  private async publishPendingOnce() {
    if (this.isPublishing) {
      return;
    }

    this.isPublishing = true;
    try {
      await this.publishPending();
    } catch (error) {
      this.logger.error(
        "Outbox publish interval failed",
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isPublishing = false;
    }
  }

  private async markPublished(id: string, publishedAt: string) {
    const { error } = await this.supabase
      .from("outbox_events")
      .update({ published_at: publishedAt })
      .eq("id", id)
      .is("published_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throwOutboxError(error, "Could not mark outbox event published");
    }
  }

  private async markFailed(id: string, attempts: number) {
    const { error } = await this.supabase
      .from("outbox_events")
      .update({ attempts })
      .eq("id", id)
      .is("published_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      throwOutboxError(error, "Could not update outbox attempts");
    }
  }

  private async writeDeadLetter(
    row: OutboxRow,
    attempts: number,
    error: unknown,
  ) {
    const { error: insertError } = await this.supabase
      .from("job_dead_letters")
      .insert({
        job_name: row.event_name,
        payload_json: {
          orgId: row.org_id,
          outboxEventId: row.id,
          payload: row.payload_json ?? {},
        },
        error_text: errorToText(error),
        attempts,
      })
      .select("id")
      .single();

    if (insertError) {
      throwOutboxError(insertError, "Could not write outbox dead letter");
    }
  }
}

function mapOutboxRow(row: OutboxRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    eventName: row.event_name,
    payload: row.payload_json ?? {},
    createdAt: row.created_at,
    publishedAt: row.published_at,
    attempts: row.attempts,
  };
}

function toInngestEventName(eventName: string) {
  return eventName.replaceAll(".", "/");
}

function errorToText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function throwOutboxError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: "outbox_failed",
    message,
  });
}

function createSupabaseServiceClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
