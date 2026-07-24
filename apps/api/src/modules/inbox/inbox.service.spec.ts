import { describe, expect, it } from 'vitest';

import { InboxService, type SupabaseLike } from './inbox.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const CONVERSATION_ID = '33333333-3333-3333-3333-333333333333';

type Row = Record<string, unknown>;
type SupabaseCall = {
  columns?: string;
  field?: string;
  op: string;
  table?: string;
  value?: unknown;
  values?: unknown;
};

function conversationRow(overrides: Row = {}) {
  return {
    id: CONVERSATION_ID,
    org_id: ORG_ID,
    channel: 'messenger',
    channel_connection_id: '44444444-4444-4444-4444-444444444444',
    contact_id: '55555555-5555-5555-5555-555555555555',
    status: 'open',
    bot_paused: false,
    bot_epoch: 4,
    assignee_user_id: null,
    last_message_at: '2026-07-24T10:00:00.000Z',
    created_at: '2026-07-24T09:00:00.000Z',
    updated_at: '2026-07-24T10:00:00.000Z',
    ...overrides,
  };
}

function mockSupabase(row: Row) {
  const calls: SupabaseCall[] = [];
  const state = { conversation: { ...row } };

  const client = {
    from(table: string) {
      if (table !== 'conversations') {
        throw new Error(`Unexpected table ${table}`);
      }

      return {
        select(columns: string) {
          calls.push({ columns, op: 'select', table });
          return filteredConversationQuery(calls, state.conversation);
        },
        update(values: Row) {
          calls.push({ op: 'update', table, values });
          const filters: Array<{ field: string; value: unknown }> = [];
          const query = {
            eq(field: string, value: unknown) {
              calls.push({ field, op: 'eq', value });
              filters.push({ field, value });
              return query;
            },
            select(columns: string) {
              calls.push({ columns, op: 'select', table });
              return {
                maybeSingle: async () => {
                  if (!matches(state.conversation, filters)) {
                    return { data: null, error: null };
                  }
                  Object.assign(state.conversation, values);
                  return { data: state.conversation, error: null };
                },
              };
            },
          };
          return query;
        },
      };
    },
  } as unknown as SupabaseLike;

  return { calls, client, state };
}

function filteredConversationQuery(calls: SupabaseCall[], row: Row) {
  const filters: Array<{ field: string; value: unknown }> = [];
  const query = {
    eq(field: string, value: unknown) {
      calls.push({ field, op: 'eq', value });
      filters.push({ field, value });
      return query;
    },
    maybeSingle: async () => ({
      data: matches(row, filters) ? row : null,
      error: null,
    }),
  };

  return query;
}

function matches(row: Row, filters: Array<{ field: string; value: unknown }>) {
  return filters.every(({ field, value }) => row[field] === value);
}

describe('InboxService', () => {
  it('takeover pauses the bot, increments epoch, and writes audit', async () => {
    const fixedNow = new Date('2026-07-24T12:00:00.000Z');
    const { calls, client } = mockSupabase(conversationRow());
    const auditCalls: unknown[] = [];
    const service = new InboxService(client, {
      writeAudit: async (input) => {
        auditCalls.push(input);
        return { audit: { id: 'audit-1' } };
      },
    });

    await expect(
      service.takeoverConversation({
        orgId: ORG_ID,
        conversationId: CONVERSATION_ID,
        actorUserId: USER_ID,
        now: fixedNow,
      }),
    ).resolves.toMatchObject({
      conversation: {
        id: CONVERSATION_ID,
        botPaused: true,
        botEpoch: 5,
      },
    });

    expect(calls).toContainEqual({
      op: 'update',
      table: 'conversations',
      values: {
        bot_paused: true,
        bot_epoch: 5,
        updated_at: fixedNow.toISOString(),
      },
    });
    expect(auditCalls).toEqual([
      {
        orgId: ORG_ID,
        actorUserId: USER_ID,
        actorType: 'user',
        action: 'inbox.takeover',
        entityType: 'conversation',
        entityId: CONVERSATION_ID,
        meta: {
          previousBotEpoch: 4,
          nextBotEpoch: 5,
        },
      },
    ]);
  });
});
