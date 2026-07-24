import { afterEach, describe, expect, it, vi } from "vitest";

import {
  enqueueOutbox,
  OutboxPublisher,
  type InngestSender,
  type SupabaseLike,
} from "./outbox.publisher";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const OUTBOX_ID = "22222222-2222-2222-2222-222222222222";
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

type QueryResult = {
  data: unknown;
  error: null;
};

type SupabaseCall = {
  op: string;
  table?: string;
  columns?: string;
  values?: unknown;
  field?: string;
  value?: unknown;
};

function mockSupabase(input: {
  selectResults?: QueryResult[];
  insertResults?: QueryResult[];
  updateResults?: QueryResult[];
}) {
  const calls: SupabaseCall[] = [];
  const selectResults = [...(input.selectResults ?? [])];
  const insertResults = [...(input.insertResults ?? [])];
  const updateResults = [...(input.updateResults ?? [])];

  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          calls.push({ op: "select", table, columns });
          const query = {
            is(field: string, value: unknown) {
              calls.push({ op: "is", field, value });
              return query;
            },
            lt(field: string, value: unknown) {
              calls.push({ op: "lt", field, value });
              return query;
            },
            order(field: string, value: unknown) {
              calls.push({ op: "order", field, value });
              return query;
            },
            limit: async (value: unknown) => {
              calls.push({ op: "limit", value });
              return selectResults.shift() ?? { data: [], error: null };
            },
          };
          return query;
        },
        insert(values: unknown) {
          calls.push({ op: "insert", table, values });
          return {
            select(columns: string) {
              calls.push({ op: "select", table, columns });
              return {
                single: async () =>
                  insertResults.shift() ?? { data: { id: "inserted" }, error: null },
              };
            },
          };
        },
        update(values: unknown) {
          calls.push({ op: "update", table, values });
          const query = {
            eq(field: string, value: unknown) {
              calls.push({ op: "eq", field, value });
              return query;
            },
            is(field: string, value: unknown) {
              calls.push({ op: "is", field, value });
              return query;
            },
            select(columns: string) {
              calls.push({ op: "select", table, columns });
              return {
                maybeSingle: async () =>
                  updateResults.shift() ?? { data: { id: "updated" }, error: null },
              };
            },
          };
          return query;
        },
      };
    },
  } as unknown as SupabaseLike;

  return { calls, client };
}

function outboxRow(overrides: Record<string, unknown> = {}) {
  return {
    id: OUTBOX_ID,
    org_id: ORG_ID,
    event_name: "platform.noop",
    payload_json: { source: "test" },
    created_at: "2026-07-24T10:00:00.000Z",
    published_at: null,
    attempts: 0,
    ...overrides,
  };
}

describe("outbox publisher", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (ORIGINAL_NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    }
  });

  it("inserts the expected outbox event shape", async () => {
    const { calls, client } = mockSupabase({
      insertResults: [{ data: outboxRow(), error: null }],
    });

    const row = await enqueueOutbox(client, {
      orgId: ORG_ID,
      eventName: "platform.noop",
      payload: { source: "test" },
    });

    expect(calls).toContainEqual({
      op: "insert",
      table: "outbox_events",
      values: {
        org_id: ORG_ID,
        event_name: "platform.noop",
        payload_json: { source: "test" },
        published_at: null,
        attempts: 0,
      },
    });
    expect(row).toMatchObject({
      eventName: "platform.noop",
      publishedAt: null,
      attempts: 0,
    });
  });

  it("sends pending events to Inngest and marks them published", async () => {
    const fixedNow = new Date("2026-07-24T11:00:00.000Z");
    const { calls, client } = mockSupabase({
      selectResults: [{ data: [outboxRow()], error: null }],
    });
    const sentEvents: unknown[] = [];
    const inngestClient: InngestSender = {
      send: async (event) => {
        sentEvents.push(event);
        return { ids: ["evt_1"] };
      },
    };
    const publisher = new OutboxPublisher(client, inngestClient, {
      now: () => fixedNow,
    });

    await expect(publisher.publishPending(10)).resolves.toEqual({
      published: 1,
      failed: 0,
      deadLettered: 0,
    });
    expect(sentEvents).toEqual([
      {
        name: "platform/noop",
        data: {
          source: "test",
          orgId: ORG_ID,
          outboxEventId: OUTBOX_ID,
        },
      },
    ]);
    expect(calls).toContainEqual({
      op: "update",
      table: "outbox_events",
      values: { published_at: fixedNow.toISOString() },
    });
  });

  it("maps meta.inbound to the persist inbound Inngest event", async () => {
    const { client } = mockSupabase({
      selectResults: [
        {
          data: [
            outboxRow({
              event_name: "meta.inbound",
              payload_json: { object: "page", entry: [] },
            }),
          ],
          error: null,
        },
      ],
    });
    const sentEvents: unknown[] = [];
    const publisher = new OutboxPublisher(client, {
      send: async (event) => {
        sentEvents.push(event);
        return { ids: ["evt_1"] };
      },
    });

    await publisher.publishPending(10);

    expect(sentEvents).toEqual([
      {
        name: "meta/persist_inbound",
        data: {
          object: "page",
          entry: [],
          orgId: ORG_ID,
          outboxEventId: OUTBOX_ID,
        },
      },
    ]);
  });

  it("maps knowledge.reindex to the knowledge reindex Inngest event", async () => {
    const { client } = mockSupabase({
      selectResults: [
        {
          data: [
            outboxRow({
              event_name: "knowledge.reindex",
              payload_json: {
                sourceType: "product",
                sourceId: "33333333-3333-3333-3333-333333333333",
              },
            }),
          ],
          error: null,
        },
      ],
    });
    const sentEvents: unknown[] = [];
    const publisher = new OutboxPublisher(client, {
      send: async (event) => {
        sentEvents.push(event);
        return { ids: ["evt_1"] };
      },
    });

    await publisher.publishPending(10);

    expect(sentEvents).toEqual([
      {
        name: "knowledge/reindex",
        data: {
          sourceType: "product",
          sourceId: "33333333-3333-3333-3333-333333333333",
          orgId: ORG_ID,
          outboxEventId: OUTBOX_ID,
        },
      },
    ]);
  });

  it("increments attempts and dead-letters exhausted events", async () => {
    const { calls, client } = mockSupabase({
      selectResults: [{ data: [outboxRow()], error: null }],
    });
    const publisher = new OutboxPublisher(
      client,
      {
        send: async () => {
          throw new Error("inngest unavailable");
        },
      },
      { maxAttempts: 1 },
    );

    await expect(publisher.publishPending()).resolves.toEqual({
      published: 0,
      failed: 1,
      deadLettered: 1,
    });
    expect(calls).toContainEqual({
      op: "update",
      table: "outbox_events",
      values: { attempts: 1 },
    });
    expect(calls).toContainEqual({
      op: "insert",
      table: "job_dead_letters",
      values: expect.objectContaining({
        job_name: "platform.noop",
        error_text: "inngest unavailable",
        attempts: 1,
      }),
    });
  });

  it("publishes on an interval outside test env and clears on destroy", async () => {
    vi.useFakeTimers();
    process.env.NODE_ENV = "development";
    const { client } = mockSupabase({});
    const publisher = new OutboxPublisher(
      client,
      { send: async () => ({ ids: [] }) },
      { publishIntervalMs: 2_000 },
    );
    const publishPending = vi
      .spyOn(publisher, "publishPending")
      .mockResolvedValue({ published: 0, failed: 0, deadLettered: 0 });

    publisher.onModuleInit();
    await vi.advanceTimersByTimeAsync(2_000);

    expect(publishPending).toHaveBeenCalledTimes(1);

    publisher.onModuleDestroy();
    await vi.advanceTimersByTimeAsync(2_000);

    expect(publishPending).toHaveBeenCalledTimes(1);
  });
});
