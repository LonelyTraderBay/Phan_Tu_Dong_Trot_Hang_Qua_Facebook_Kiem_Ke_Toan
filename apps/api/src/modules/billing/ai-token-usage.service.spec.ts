import { describe, expect, it } from "vitest";

import {
  AI_TOKEN_USAGE_KIND,
  AiTokenUsageService,
  type SupabaseLike,
} from "./ai-token-usage.service";

const ORG_ID = "11111111-1111-1111-1111-111111111111";

type SupabaseCall = {
  op: string;
  table?: string;
  field?: string;
  value?: unknown;
  values?: unknown;
};

function mockSupabase(input: {
  limit: number | string;
  usageRows?: Array<{ quantity: number | string }>;
}) {
  const calls: SupabaseCall[] = [];
  const client = {
    from(table: string) {
      return {
        select(values: string) {
          calls.push({ op: "select", table, values });
          const filters: Array<{ field: string; value: unknown; op: string }> =
            [];
          const query = {
            eq(field: string, value: unknown) {
              calls.push({ op: "eq", table, field, value });
              filters.push({ field, value, op: "eq" });
              return query;
            },
            gte(field: string, value: unknown) {
              calls.push({ op: "gte", table, field, value });
              filters.push({ field, value, op: "gte" });
              if (table === "usage_events") {
                return Promise.resolve({
                  data: input.usageRows ?? [],
                  error: null,
                });
              }
              return query;
            },
            maybeSingle: async () => {
              if (table === "entitlements") {
                return {
                  data: {
                    org_id: ORG_ID,
                    ai_monthly_token_limit: input.limit,
                  },
                  error: null,
                };
              }
              return { data: null, error: null };
            },
          };

          if (table === "usage_events") {
            return query;
          }

          return query;
        },
        insert(values: unknown) {
          calls.push({ op: "insert", table, values });
          return Promise.resolve({ error: null });
        },
      };
    },
  } as unknown as SupabaseLike;

  return { calls, client };
}

describe("AiTokenUsageService", () => {
  it("reports quota exceeded when monthly usage meets the entitlement limit", async () => {
    const { client } = mockSupabase({
      limit: 100,
      usageRows: [{ quantity: 60 }, { quantity: 40 }],
    });
    const service = new AiTokenUsageService(client);

    await expect(service.getQuotaStatus(ORG_ID)).resolves.toMatchObject({
      allowed: false,
      exceeded: true,
      used: 100,
      limit: 100,
    });
  });

  it("allows usage below the monthly entitlement limit", async () => {
    const { client } = mockSupabase({
      limit: 1_000,
      usageRows: [{ quantity: 250 }],
    });
    const service = new AiTokenUsageService(client);

    await expect(service.getQuotaStatus(ORG_ID)).resolves.toMatchObject({
      allowed: true,
      exceeded: false,
      used: 250,
      limit: 1_000,
    });
  });

  it("records ai token usage events", async () => {
    const { client, calls } = mockSupabase({ limit: 1_000, usageRows: [] });
    const service = new AiTokenUsageService(client);

    await service.recordUsage({
      orgId: ORG_ID,
      quantity: 17,
      refType: "message",
      refId: "33333333-3333-3333-3333-333333333333",
    });

    expect(calls).toContainEqual({
      op: "insert",
      table: "usage_events",
      values: {
        org_id: ORG_ID,
        kind: AI_TOKEN_USAGE_KIND,
        quantity: 17,
        ref_type: "message",
        ref_id: "33333333-3333-3333-3333-333333333333",
      },
    });
  });
});
