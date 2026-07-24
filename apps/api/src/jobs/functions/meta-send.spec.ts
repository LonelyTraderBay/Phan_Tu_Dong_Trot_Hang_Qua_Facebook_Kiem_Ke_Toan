import { describe, expect, it, vi } from "vitest";

import { MetaSendJobService, type SupabaseLike } from "./meta-send";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const CONVERSATION_ID = "22222222-2222-2222-2222-222222222222";
const CONNECTION_ID = "33333333-3333-3333-3333-333333333333";
const CONTACT_ID = "44444444-4444-4444-4444-444444444444";

type Row = Record<string, unknown>;
type TableName = "conversations" | "channel_connections" | "contacts";

type State = Record<TableName, Row[]>;

function createState(overrides: Partial<State> = {}): State {
  return {
    conversations: [
      {
        id: CONVERSATION_ID,
        org_id: ORG_ID,
        channel: "messenger",
        channel_connection_id: CONNECTION_ID,
        contact_id: CONTACT_ID,
        bot_paused: false,
        bot_epoch: 8,
      },
    ],
    channel_connections: [],
    contacts: [],
    ...overrides,
  };
}

function mockSupabase(state: State) {
  const client = {
    from(table: TableName) {
      return {
        select() {
          return queryBuilder(state, table);
        },
      };
    },
  } as unknown as SupabaseLike;

  return client;
}

function queryBuilder(state: State, table: TableName) {
  const filters: Array<{ field: string; value: unknown }> = [];
  const query = {
    eq(field: string, value: unknown) {
      filters.push({ field, value });
      return query;
    },
    maybeSingle: async () => {
      const data =
        state[table].find((candidate) =>
          filters.every(({ field, value }) => candidate[field] === value),
        ) ?? null;
      return { data, error: null };
    },
  };

  return query;
}

describe("MetaSendJobService", () => {
  it("drops before Graph send when bot_epoch does not match", async () => {
    const sendMessage = vi.fn();
    const service = new MetaSendJobService({
      env: { TOKEN_ENCRYPTION_KEY: "x".repeat(32) },
      graph: { sendMessage },
      supabase: mockSupabase(createState()),
    });

    await expect(
      service.send({
        orgId: ORG_ID,
        conversationId: CONVERSATION_ID,
        botEpoch: 7,
        replyText: "Co, shop con hang.",
      }),
    ).resolves.toEqual({
      ok: true,
      action: "dropped",
      reason: "epoch_mismatch",
    });

    expect(sendMessage).not.toHaveBeenCalled();
  });
});
