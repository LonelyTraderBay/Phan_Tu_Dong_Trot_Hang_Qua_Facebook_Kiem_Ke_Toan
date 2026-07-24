import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import { AuditService, type WriteAuditInput } from '../audit/audit.service';

export const INBOX_SUPABASE = Symbol('INBOX_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;
export type AuditWriter = {
  writeAudit(input: WriteAuditInput): Promise<unknown>;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type ContactProjection = {
  id: string;
  display_name: string | null;
  page_scoped_id: string | null;
  ig_scoped_id: string | null;
};

type ChannelConnectionProjection = {
  id: string;
  provider: string;
  external_page_id: string;
  external_ig_id: string | null;
};

type ConversationRow = {
  id: string;
  org_id: string;
  channel: 'messenger' | 'instagram';
  channel_connection_id: string;
  contact_id: string;
  status: string;
  bot_paused: boolean;
  bot_epoch: number;
  assignee_user_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  contact?: ContactProjection | ContactProjection[] | null;
  channel_connection?:
    ChannelConnectionProjection | ChannelConnectionProjection[] | null;
};

type MessageRow = {
  id: string;
  org_id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'customer' | 'ai' | 'staff' | 'system';
  raw_type: string;
  body_text: string | null;
  payload_json: Record<string, unknown>;
  provider_message_id: string | null;
  created_at: string;
};

const CONVERSATION_SELECT =
  'id, org_id, channel, channel_connection_id, contact_id, status, bot_paused, bot_epoch, assignee_user_id, last_message_at, created_at, updated_at, contact:contacts(id, display_name, page_scoped_id, ig_scoped_id), channel_connection:channel_connections(id, provider, external_page_id, external_ig_id)';
const CONVERSATION_BASE_SELECT =
  'id, org_id, channel, channel_connection_id, contact_id, status, bot_paused, bot_epoch, assignee_user_id, last_message_at, created_at, updated_at';
const MESSAGE_SELECT =
  'id, org_id, conversation_id, direction, sender_type, raw_type, body_text, payload_json, provider_message_id, created_at';

@Injectable()
export class InboxService {
  private readonly supabase: SupabaseLike;
  private readonly audit?: AuditWriter;

  constructor(
    @Optional()
    @Inject(INBOX_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(AuditService)
    audit?: AuditWriter,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.audit = audit;
  }

  async listConversations(orgId: string) {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('org_id', orgId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      throwInboxError(error, 'Could not list inbox conversations');
    }

    return {
      conversations: ((data ?? []) as ConversationRow[]).map(mapConversation),
    };
  }

  async listMessages(orgId: string, conversationId: string) {
    await this.requireConversation(orgId, conversationId);

    const { data, error } = await this.supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('org_id', orgId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      throwInboxError(error, 'Could not list inbox messages');
    }

    return { messages: ((data ?? []) as MessageRow[]).map(mapMessage) };
  }

  async takeoverConversation(input: {
    orgId: string;
    conversationId: string;
    actorUserId: string;
    now?: Date;
  }) {
    const conversation = await this.requireConversation(
      input.orgId,
      input.conversationId,
    );
    const previousEpoch = conversation.bot_epoch;
    const nextEpoch = previousEpoch + 1;
    const { data, error } = await this.supabase
      .from('conversations')
      .update({
        bot_paused: true,
        bot_epoch: nextEpoch,
        updated_at: (input.now ?? new Date()).toISOString(),
      })
      .eq('id', input.conversationId)
      .eq('org_id', input.orgId)
      .select(CONVERSATION_BASE_SELECT)
      .maybeSingle();

    if (error) {
      throwInboxError(error, 'Could not takeover inbox conversation');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'conversation_not_found',
        message: 'Conversation was not found',
      });
    }

    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'inbox.takeover',
      entityType: 'conversation',
      entityId: input.conversationId,
      meta: {
        previousBotEpoch: previousEpoch,
        nextBotEpoch: nextEpoch,
      },
    });

    return { conversation: mapConversation(data as ConversationRow) };
  }

  private async requireConversation(orgId: string, conversationId: string) {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(CONVERSATION_BASE_SELECT)
      .eq('id', conversationId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      throwInboxError(error, 'Could not find inbox conversation');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'conversation_not_found',
        message: 'Conversation was not found',
      });
    }

    return data as ConversationRow;
  }
}

function mapConversation(row: ConversationRow) {
  const contact = firstRelation(row.contact);
  const channelConnection = firstRelation(row.channel_connection);

  return {
    id: row.id,
    channel: row.channel,
    status: row.status,
    botPaused: row.bot_paused,
    botEpoch: row.bot_epoch,
    assigneeUserId: row.assignee_user_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contact: contact
      ? {
          id: contact.id,
          displayName: contact.display_name,
          pageScopedId: contact.page_scoped_id,
          igScopedId: contact.ig_scoped_id,
        }
      : undefined,
    channelConnection: channelConnection
      ? {
          id: channelConnection.id,
          provider: channelConnection.provider,
          externalPageId: channelConnection.external_page_id,
          externalIgId: channelConnection.external_ig_id,
        }
      : undefined,
  };
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    senderType: row.sender_type,
    rawType: row.raw_type,
    bodyText: row.body_text,
    providerMessageId: row.provider_message_id,
    createdAt: row.created_at,
  };
}

function throwInboxError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: 'inbox_failed',
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
