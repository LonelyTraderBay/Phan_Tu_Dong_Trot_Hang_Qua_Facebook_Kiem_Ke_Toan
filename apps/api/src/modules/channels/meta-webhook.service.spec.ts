import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  MetaWebhookService,
  type MetaWebhookEnv,
  type SupabaseLike,
} from "./meta-webhook.service";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const OUTBOX_ID = "22222222-2222-2222-2222-222222222222";
const RECEIPT_ID = "33333333-3333-3333-3333-333333333333";

const env = {
  META_APP_SECRET: "meta-app-secret",
  META_VERIFY_TOKEN: "verify-token",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  SUPABASE_URL: "https://supabase.example.com",
} satisfies MetaWebhookEnv;

type SupabaseCall = {
  columns?: string;
  field?: string;
  op: string;
  options?: unknown;
  table?: string;
  value?: unknown;
  values?: unknown;
};

function signedPayload(payload: Record<string, unknown>) {
  const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
  return {
    payload,
    rawBody,
    signatureHeader:
      "sha256=" +
      createHmac("sha256", env.META_APP_SECRET).update(rawBody).digest("hex"),
  };
}

function metaPayload(overrides: Record<string, unknown> = {}) {
  return {
    object: "page",
    entry: [
      {
        id: "page-1",
        time: 1_721_824_400,
        messaging: [
          {
            sender: { id: "customer-1" },
            recipient: { id: "page-1" },
            timestamp: 1_721_824_400_000,
            message: {
              mid: "m_page_1",
              text: "hello",
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

function outboxRow() {
  return {
    id: OUTBOX_ID,
    org_id: ORG_ID,
    event_name: "meta.inbound",
    payload_json: metaPayload(),
    created_at: "2026-07-24T10:00:00.000Z",
    published_at: null,
    attempts: 0,
  };
}

function mockSupabase(input: {
  orgId?: string | null;
  receiptInserted?: boolean;
}) {
  const calls: SupabaseCall[] = [];

  const client = {
    from(table: string) {
      if (table === "channel_connections") {
        const query = {
          select(columns: string) {
            calls.push({ op: "select", table, columns });
            return query;
          },
          eq(field: string, value: unknown) {
            calls.push({ op: "eq", field, value });
            return query;
          },
          in(field: string, value: unknown) {
            calls.push({ op: "in", field, value });
            return query;
          },
          limit: async (value: unknown) => {
            calls.push({ op: "limit", value });
            return {
              data: input.orgId ? [{ org_id: input.orgId }] : [],
              error: null,
            };
          },
        };
        return query;
      }

      if (table === "webhook_receipts") {
        return {
          upsert(values: unknown, options: unknown) {
            calls.push({ op: "upsert", table, values, options });
            return {
              select(columns: string) {
                calls.push({ op: "select", table, columns });
                return {
                  maybeSingle: async () => ({
                    data: input.receiptInserted ? { id: RECEIPT_ID } : null,
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "outbox_events") {
        return {
          insert(values: unknown) {
            calls.push({ op: "insert", table, values });
            return {
              select(columns: string) {
                calls.push({ op: "select", table, columns });
                return {
                  single: async () => ({
                    data: outboxRow(),
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  } as unknown as SupabaseLike;

  return { calls, client };
}

describe("MetaWebhookService", () => {
  it("returns challenge when verify token matches", () => {
    const service = new MetaWebhookService({} as SupabaseLike, env);

    expect(
      service.verifySubscription({
        challenge: "challenge-123",
        mode: "subscribe",
        verifyToken: env.META_VERIFY_TOKEN,
      }),
    ).toBe("challenge-123");
  });

  it("rejects bad signature", async () => {
    const { calls, client } = mockSupabase({ orgId: ORG_ID });
    const service = new MetaWebhookService(client, env);
    const request = signedPayload(metaPayload());

    await expect(
      service.ingest({
        ...request,
        signatureHeader: "sha256=bad",
      }),
    ).rejects.toMatchObject({ status: 401 });
    expect(calls).toEqual([]);
  });

  it("enqueues outbox once for new receipt", async () => {
    const { calls, client } = mockSupabase({
      orgId: ORG_ID,
      receiptInserted: true,
    });
    const service = new MetaWebhookService(client, env);
    const request = signedPayload(metaPayload());

    await expect(service.ingest(request)).resolves.toEqual({ ok: true });
    expect(calls).toContainEqual({
      op: "upsert",
      table: "webhook_receipts",
      values: expect.objectContaining({
        provider: "meta",
        receipt_key: "m_page_1",
        org_id: ORG_ID,
      }),
      options: {
        ignoreDuplicates: true,
        onConflict: "provider,receipt_key",
      },
    });
    expect(calls).toContainEqual({
      op: "insert",
      table: "outbox_events",
      values: {
        org_id: ORG_ID,
        event_name: "meta.inbound",
        payload_json: request.payload,
        published_at: null,
        attempts: 0,
      },
    });
  });

  it("uses entry id and time when message mid is absent", async () => {
    const { calls, client } = mockSupabase({
      orgId: ORG_ID,
      receiptInserted: true,
    });
    const service = new MetaWebhookService(client, env);
    const request = signedPayload(
      metaPayload({
        entry: [
          {
            id: "page-1",
            time: 1_721_824_400,
            messaging: [{ message: { text: "hello" } }],
          },
        ],
      }),
    );

    await expect(service.ingest(request)).resolves.toEqual({ ok: true });
    expect(calls).toContainEqual({
      op: "upsert",
      table: "webhook_receipts",
      values: expect.objectContaining({
        receipt_key: "page-1-1721824400",
      }),
      options: {
        ignoreDuplicates: true,
        onConflict: "provider,receipt_key",
      },
    });
  });

  it("skips outbox on duplicate receipt_key", async () => {
    const { calls, client } = mockSupabase({
      orgId: ORG_ID,
      receiptInserted: false,
    });
    const service = new MetaWebhookService(client, env);

    await expect(service.ingest(signedPayload(metaPayload()))).resolves.toEqual({
      ok: true,
    });
    expect(calls).toContainEqual(
      expect.objectContaining({
        op: "upsert",
        table: "webhook_receipts",
      }),
    );
    expect(calls).not.toContainEqual(
      expect.objectContaining({
        op: "insert",
        table: "outbox_events",
      }),
    );
  });
});
