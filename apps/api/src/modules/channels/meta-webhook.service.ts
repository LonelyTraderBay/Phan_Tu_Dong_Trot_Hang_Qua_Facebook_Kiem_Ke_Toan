import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

import { loadEnv, type Env } from "../../config/env";
import { verifyMetaSignature } from "../../integrations/meta/signature";
import {
  enqueueOutbox,
  type JsonObject,
} from "../../jobs/outbox.publisher";

export const META_WEBHOOK_SUPABASE = Symbol("META_WEBHOOK_SUPABASE");
export const META_WEBHOOK_ENV = Symbol("META_WEBHOOK_ENV");

export type SupabaseLike = Pick<SupabaseClient, "from">;
export type MetaWebhookEnv = Pick<
  Env,
  | "META_APP_SECRET"
  | "META_VERIFY_TOKEN"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_URL"
>;

type VerifySubscriptionInput = {
  challenge: string | undefined;
  mode: string | undefined;
  verifyToken: string | undefined;
};

type IngestInput = {
  payload: unknown;
  rawBody: Buffer;
  signatureHeader: string | undefined;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type ChannelConnectionRow = {
  org_id: string;
};

@Injectable()
export class MetaWebhookService {
  private readonly env: MetaWebhookEnv;
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(META_WEBHOOK_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(META_WEBHOOK_ENV)
    env?: MetaWebhookEnv,
  ) {
    this.env = env ?? loadEnv();
    this.supabase = supabase ?? createSupabaseServiceClient(this.env);
  }

  verifySubscription(input: VerifySubscriptionInput) {
    if (
      input.mode === "subscribe" &&
      input.verifyToken === this.env.META_VERIFY_TOKEN &&
      input.challenge !== undefined
    ) {
      return input.challenge;
    }

    throw new UnauthorizedException({
      code: "meta_verify_failed",
      message: "Meta webhook verify token is invalid",
    });
  }

  async ingest(input: IngestInput) {
    if (
      !verifyMetaSignature(
        input.rawBody,
        input.signatureHeader,
        this.env.META_APP_SECRET,
      )
    ) {
      throw new UnauthorizedException({
        code: "meta_signature_invalid",
        message: "Meta webhook signature is invalid",
      });
    }

    const payload = toJsonObject(input.payload);
    const payloadHash = hashPayload(input.rawBody);
    const receiptKey = getReceiptKey(payload, payloadHash);
    const orgId = await this.findOrgId(payload);
    const receiptInserted = await this.insertReceipt({
      orgId,
      payloadHash,
      receiptKey,
    });

    if (receiptInserted && orgId) {
      await enqueueOutbox(this.supabase, {
        orgId,
        eventName: "meta.inbound",
        payload,
      });
    }

    return { ok: true };
  }

  private async findOrgId(payload: JsonObject) {
    const pageIds = getEntryPageIds(payload);
    if (pageIds.length === 0) {
      return null;
    }

    const { data, error } = await this.supabase
      .from("channel_connections")
      .select("org_id")
      .eq("provider", "meta_page")
      .eq("status", "active")
      .in("external_page_id", pageIds)
      .limit(1);

    if (error) {
      throwWebhookError(error, "Could not map Meta page to organization");
    }

    const row = ((data ?? []) as ChannelConnectionRow[])[0];
    return row?.org_id ?? null;
  }

  private async insertReceipt(input: {
    orgId: string | null;
    payloadHash: string;
    receiptKey: string;
  }) {
    const { data, error } = await this.supabase
      .from("webhook_receipts")
      .upsert(
        {
          provider: "meta",
          receipt_key: input.receiptKey,
          org_id: input.orgId,
          payload_hash: input.payloadHash,
        },
        {
          ignoreDuplicates: true,
          onConflict: "provider,receipt_key",
        },
      )
      .select("id")
      .maybeSingle();

    if (error) {
      throwWebhookError(error, "Could not record Meta webhook receipt");
    }

    return Boolean(data);
  }
}

function toJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return {};
}

function hashPayload(rawBody: Buffer) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function getReceiptKey(payload: JsonObject, payloadHash: string) {
  return (
    getFirstMessageMid(payload) ??
    `${getFirstEntryId(payload) ?? "unknown"}-${
      getFirstEntryTime(payload) ?? payloadHash
    }`
  );
}

function getEntryPageIds(payload: JsonObject) {
  return getEntries(payload)
    .map((entry) => toNonEmptyString(entry.id))
    .filter((id): id is string => id !== undefined);
}

function getFirstEntryId(payload: JsonObject) {
  return toNonEmptyString(getEntries(payload)[0]?.id);
}

function getFirstEntryTime(payload: JsonObject) {
  return toNonEmptyString(getEntries(payload)[0]?.time);
}

function getFirstMessageMid(payload: JsonObject) {
  for (const entry of getEntries(payload)) {
    for (const event of getMessagingEvents(entry)) {
      const mid = toNonEmptyString(asRecord(event.message)?.mid);
      if (mid) {
        return mid;
      }
    }
  }

  return undefined;
}

function getEntries(payload: JsonObject) {
  return toRecordArray(payload.entry);
}

function getMessagingEvents(entry: Record<string, unknown>) {
  return toRecordArray(entry.messaging);
}

function toRecordArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          item !== null && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function asRecord(value: unknown) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function toNonEmptyString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function throwWebhookError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: "meta_webhook_failed",
    message,
  });
}

function createSupabaseServiceClient(env: MetaWebhookEnv) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
