import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { decryptToken } from "../../common/crypto/token-crypto";
import { loadEnv, type Env } from "../../config/env";
import {
  createGraphClientFromEnv,
  type GraphClient,
} from "../../integrations/meta/graph.client";
import { inngest } from "../inngest.client";

export type SupabaseLike = Pick<SupabaseClient, "from">;
export type JsonObject = Record<string, unknown>;

type MetaSendInput = JsonObject & {
  botEpoch?: unknown;
  conversationId?: unknown;
  orgId?: unknown;
  replyText?: unknown;
};

type MetaSendEnv = Pick<
  Env,
  "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "TOKEN_ENCRYPTION_KEY"
>;

type GraphMessenger = Pick<GraphClient, "sendMessage">;

type MetaSendJobOptions = {
  env?: Pick<Env, "TOKEN_ENCRYPTION_KEY">;
  graph?: GraphMessenger;
  supabase?: SupabaseLike;
};

type ConversationRow = {
  id: string;
  org_id: string;
  channel: "messenger" | "instagram";
  channel_connection_id: string;
  contact_id: string;
  bot_paused: boolean;
  bot_epoch: number;
};

type ChannelConnectionRow = {
  id: string;
  org_id: string;
  provider: "meta_page" | "meta_ig";
  external_page_id: string;
  external_ig_id: string | null;
  access_token_enc: string;
  status: "active" | "needs_reauth" | "revoked";
};

type ContactRow = {
  id: string;
  org_id: string;
  page_scoped_id: string | null;
  ig_scoped_id: string | null;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

const CONVERSATION_SELECT =
  "id, org_id, channel, channel_connection_id, contact_id, bot_paused, bot_epoch";
const CHANNEL_CONNECTION_SELECT =
  "id, org_id, provider, external_page_id, external_ig_id, access_token_enc, status";
const CONTACT_SELECT = "id, org_id, page_scoped_id, ig_scoped_id";

export class MetaSendJobService {
  private readonly env: Pick<Env, "TOKEN_ENCRYPTION_KEY">;
  private readonly graph: GraphMessenger;
  private readonly supabase: SupabaseLike;

  constructor(options: MetaSendJobOptions = {}) {
    this.env = options.env ?? loadEnv();
    this.graph = options.graph ?? createGraphClientFromEnv();
    this.supabase = options.supabase ?? createSupabaseServiceClient();
  }

  async send(input: MetaSendInput) {
    const event = parseMetaSendEvent(input);
    const conversation = await this.loadConversation(
      event.orgId,
      event.conversationId,
    );
    if (!conversation) {
      return { ok: true, action: "dropped", reason: "conversation_not_found" };
    }
    if (conversation.bot_epoch !== event.botEpoch) {
      return { ok: true, action: "dropped", reason: "epoch_mismatch" };
    }
    if (conversation.bot_paused) {
      return { ok: true, action: "dropped", reason: "bot_paused" };
    }

    const [connection, contact] = await Promise.all([
      this.loadChannelConnection(event.orgId, conversation.channel_connection_id),
      this.loadContact(event.orgId, conversation.contact_id),
    ]);
    if (!connection || connection.status !== "active") {
      return { ok: true, action: "dropped", reason: "channel_inactive" };
    }
    if (!contact) {
      return { ok: true, action: "dropped", reason: "contact_not_found" };
    }

    const recipientId = recipientForChannel(conversation.channel, contact);
    const senderId = senderForChannel(conversation.channel, connection);
    if (!recipientId || !senderId) {
      return { ok: true, action: "dropped", reason: "missing_meta_identity" };
    }

    const accessToken = decryptToken(
      connection.access_token_enc,
      this.env.TOKEN_ENCRYPTION_KEY,
    );
    const sent = await this.graph.sendMessage({
      accessToken,
      recipientId,
      senderId,
      text: event.replyText,
    });

    return {
      ok: true,
      action: "sent",
      providerMessageId: sent.message_id ?? null,
    };
  }

  private async loadConversation(orgId: string, conversationId: string) {
    const { data, error } = await this.supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .eq("id", conversationId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) {
      throwSendError(error, "Could not read conversation for Meta send");
    }

    return data as ConversationRow | null;
  }

  private async loadChannelConnection(orgId: string, connectionId: string) {
    const { data, error } = await this.supabase
      .from("channel_connections")
      .select(CHANNEL_CONNECTION_SELECT)
      .eq("id", connectionId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) {
      throwSendError(error, "Could not read channel connection for Meta send");
    }

    return data as ChannelConnectionRow | null;
  }

  private async loadContact(orgId: string, contactId: string) {
    const { data, error } = await this.supabase
      .from("contacts")
      .select(CONTACT_SELECT)
      .eq("id", contactId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (error) {
      throwSendError(error, "Could not read contact for Meta send");
    }

    return data as ContactRow | null;
  }
}

export const metaSend = inngest.createFunction(
  { id: "meta-send", triggers: { event: "meta/send" } },
  async ({ event }) => {
    const service = new MetaSendJobService();
    return service.send((event.data ?? {}) as MetaSendInput);
  },
);

function parseMetaSendEvent(input: MetaSendInput) {
  return {
    orgId: toUuid(input.orgId, "orgId"),
    conversationId: toUuid(input.conversationId, "conversationId"),
    botEpoch: toInteger(input.botEpoch, "botEpoch"),
    replyText: toNonEmptyString(input.replyText, "replyText"),
  };
}

function recipientForChannel(channel: ConversationRow["channel"], contact: ContactRow) {
  return channel === "instagram" ? contact.ig_scoped_id : contact.page_scoped_id;
}

function senderForChannel(
  channel: ConversationRow["channel"],
  connection: ChannelConnectionRow,
) {
  return channel === "instagram"
    ? connection.external_ig_id
    : connection.external_page_id;
}

function toUuid(value: unknown, fieldName: string) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error(`meta/send requires UUID ${fieldName}`);
  }

  return value;
}

function toInteger(value: unknown, fieldName: string) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`meta/send requires integer ${fieldName}`);
  }

  return value as number;
}

function toNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`meta/send requires ${fieldName}`);
  }

  return value.trim();
}

function throwSendError(error: SupabaseError, message: string): never {
  throw new Error(`${message}: ${error.message ?? error.code ?? "unknown"}`);
}

function createSupabaseServiceClient() {
  const env = loadEnv() as MetaSendEnv;
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
