import { describe, expect, it } from "vitest";

import { IdentityService, type SupabaseLike } from "./identity.service";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";

type InsertCall = {
  table: string;
  values: unknown;
};

type RpcCall = {
  fn: string;
  args: unknown;
};

type QueryResult = {
  data: unknown;
  error: null;
};

function mockSupabase(results: QueryResult[]) {
  const insertCalls: InsertCall[] = [];
  const rpcCalls: RpcCall[] = [];

  const client = {
    rpc(fn: string, args: unknown) {
      rpcCalls.push({ fn, args });
      return {
        single: async () => {
          const result = results.shift();
          if (!result) {
            throw new Error("Unexpected Supabase rpc");
          }
          return result;
        },
      };
    },
    from(table: string) {
      return {
        insert(values: unknown) {
          insertCalls.push({ table, values });
          return {
            select: () => ({
              single: async () => {
                const result = results.shift();
                if (!result) {
                  throw new Error("Unexpected Supabase insert");
                }
                return result;
              },
            }),
          };
        },
      };
    },
  } as unknown as SupabaseLike;

  return { client, insertCalls, rpcCalls };
}

describe("IdentityService", () => {
  it("creates org owner membership and default entitlements", async () => {
    const { client, insertCalls, rpcCalls } = mockSupabase([
      {
        data: {
          organization: {
            id: ORG_ID,
            name: "Shop A",
            slug: "shop-a",
            plan: "free",
            settings_json: {},
            timezone: "Asia/Ho_Chi_Minh",
            locale: "vi",
            suspended_at: null,
            created_at: "2026-07-24T10:00:00.000Z",
            updated_at: "2026-07-24T10:00:00.000Z",
          },
          membership: {
            id: "33333333-3333-3333-3333-333333333333",
            org_id: ORG_ID,
            user_id: USER_ID,
            role: "owner",
          },
          entitlements: {
            org_id: ORG_ID,
            max_pages: 0,
            ai_monthly_token_limit: 0,
            auto_confirm_allowed: false,
            updated_at: "2026-07-24T10:00:00.000Z",
          },
        },
        error: null,
      },
    ]);
    const service = new IdentityService(client);

    const result = await service.createOrganization(
      { id: USER_ID, email: "owner@example.com" },
      { name: "Shop A", slug: "shop-a" },
    );

    expect(rpcCalls).toEqual([
      {
        fn: "create_organization_with_owner",
        args: {
          p_name: "Shop A",
          p_owner_user_id: USER_ID,
          p_slug: "shop-a",
        },
      },
    ]);
    expect(insertCalls).toEqual([]);
    expect(result.entitlements).toMatchObject({
      orgId: ORG_ID,
      maxPages: 0,
      aiMonthlyTokenLimit: 0,
      autoConfirmAllowed: false,
    });
  });
});
