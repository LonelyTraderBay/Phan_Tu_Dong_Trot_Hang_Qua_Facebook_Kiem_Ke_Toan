import { describe, expect, it, vi } from "vitest";

import {
  IdentityService,
  type AuditWriter,
  type SupabaseLike,
} from "./identity.service";

const ORG_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";
const ORDER_ID = "33333333-3333-3333-3333-333333333333";

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

type QueryCall = {
  table: string;
  select: string;
  filters: Array<{ column: string; value: string }>;
  orderBy?: { column: string; options: unknown };
  limit?: number;
  maybeSingle?: boolean;
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

function auditMock() {
  return {
    writeAudit: vi.fn(async () => ({ audit: { id: "audit-id" } })),
  } satisfies AuditWriter;
}

function mockExportSupabase(tables: Record<string, unknown[]>) {
  const queryCalls: QueryCall[] = [];

  const client = {
    rpc() {
      throw new Error("rpc() should not be called");
    },
    from(table: string) {
      return {
        select(select: string) {
          const call: QueryCall = { table, select, filters: [] };
          queryCalls.push(call);
          const chain = {
            eq(column: string, value: string) {
              call.filters.push({ column, value });
              return chain;
            },
            order(column: string, options: unknown) {
              call.orderBy = { column, options };
              return chain;
            },
            limit(limit: number) {
              call.limit = limit;
              return Promise.resolve({
                data: tables[table] ?? [],
                error: null,
              });
            },
            maybeSingle() {
              call.maybeSingle = true;
              return Promise.resolve({
                data: tables[table]?.[0] ?? null,
                error: null,
              });
            },
          };
          return chain;
        },
      };
    },
  } as unknown as SupabaseLike;

  return { client, queryCalls };
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

  it("exports a practical org-scoped PDPA bundle and audits the export", async () => {
    const { client, queryCalls } = mockExportSupabase({
      organizations: [
        {
          id: ORG_ID,
          name: "Shop A",
          slug: "shop-a",
          plan: "free",
          settings_json: { locale: "vi" },
          timezone: "Asia/Ho_Chi_Minh",
          locale: "vi",
          suspended_at: null,
          created_at: "2026-07-24T10:00:00.000Z",
          updated_at: "2026-07-24T10:00:00.000Z",
        },
      ],
      memberships: [
        {
          id: "44444444-4444-4444-4444-444444444444",
          org_id: ORG_ID,
          user_id: USER_ID,
          role: "owner",
          created_at: "2026-07-24T10:00:00.000Z",
          updated_at: "2026-07-24T10:00:00.000Z",
        },
      ],
      contacts: [
        {
          id: "55555555-5555-5555-5555-555555555555",
          org_id: ORG_ID,
          display_name: "Khach A",
          phone_e164: "+84900000000",
          page_scoped_id: "psid-1",
          ig_scoped_id: null,
          tags_json: ["vip"],
          created_at: "2026-07-24T10:01:00.000Z",
          updated_at: "2026-07-24T10:01:00.000Z",
        },
      ],
      conversations: [
        {
          id: "66666666-6666-6666-6666-666666666666",
          org_id: ORG_ID,
          channel: "messenger",
          channel_connection_id: "77777777-7777-7777-7777-777777777777",
          contact_id: "55555555-5555-5555-5555-555555555555",
          status: "open",
          bot_paused: false,
          bot_epoch: 1,
          assignee_user_id: null,
          last_message_at: "2026-07-24T10:02:00.000Z",
          created_at: "2026-07-24T10:01:00.000Z",
          updated_at: "2026-07-24T10:02:00.000Z",
        },
      ],
      orders: [
        {
          id: ORDER_ID,
          org_id: ORG_ID,
          conversation_id: "66666666-6666-6666-6666-666666666666",
          contact_id: "55555555-5555-5555-5555-555555555555",
          status: "confirmed",
          payment_method: "cod",
          customer_name: "Khach A",
          phone_e164: "+84900000000",
          address_text: "Quan 1",
          address_json: {},
          currency: "VND",
          subtotal_vnd: 2500,
          total_vnd: "2500",
          idempotency_key: null,
          confirmed_at: "2026-07-24T10:03:00.000Z",
          shipped_at: null,
          cancelled_at: null,
          done_at: null,
          created_at: "2026-07-24T10:03:00.000Z",
          updated_at: "2026-07-24T10:03:00.000Z",
          items: [
            {
              id: "88888888-8888-8888-8888-888888888888",
              product_id: "99999999-9999-9999-9999-999999999999",
              variant_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              title_snapshot: "Ao thun den",
              sku_snapshot: "AT-DEN",
              qty: 1,
              unit_price_vnd: 2500,
              line_total_vnd: "2500",
            },
          ],
        },
      ],
    });
    const audit = auditMock();
    const service = new IdentityService(client, undefined, audit);

    const bundle = await service.exportOrganizationData({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      now: new Date("2026-07-25T00:00:00.000Z"),
    });

    expect(bundle).toMatchObject({
      exportedAt: "2026-07-25T00:00:00.000Z",
      orgId: ORG_ID,
      generatedByUserId: USER_ID,
      organization: { id: ORG_ID, name: "Shop A" },
      memberships: [{ userId: USER_ID, role: "owner" }],
      contacts: [{ displayName: "Khach A", phoneE164: "+84900000000" }],
      conversations: [
        {
          id: "66666666-6666-6666-6666-666666666666",
          channel: "messenger",
        },
      ],
      orders: [
        {
          id: ORDER_ID,
          totalVnd: "2500",
          items: [{ skuSnapshot: "AT-DEN", lineTotalVnd: "2500" }],
        },
      ],
    });
    expect(queryCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "organizations",
          filters: [{ column: "id", value: ORG_ID }],
        }),
        expect.objectContaining({
          table: "contacts",
          filters: [{ column: "org_id", value: ORG_ID }],
        }),
        expect.objectContaining({
          table: "orders",
          filters: [{ column: "org_id", value: ORG_ID }],
        }),
      ]),
    );
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: ORG_ID,
        actorUserId: USER_ID,
        actorType: "user",
        action: "organization.pdpa_exported",
        entityType: "organization",
        entityId: ORG_ID,
        meta: {
          exportedAt: "2026-07-25T00:00:00.000Z",
          counts: {
            memberships: 1,
            contacts: 1,
            conversations: 1,
            orders: 1,
          },
        },
      }),
    );
  });

  it("records a pending organization delete request in audit logs", async () => {
    const { client } = mockExportSupabase({});
    const audit = auditMock();
    const service = new IdentityService(client, undefined, audit);

    const result = await service.requestOrganizationDelete({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      now: new Date("2026-07-25T01:00:00.000Z"),
    });

    expect(result).toEqual({
      deleteRequest: {
        orgId: ORG_ID,
        status: "pending",
        requestedByUserId: USER_ID,
        requestedAt: "2026-07-25T01:00:00.000Z",
      },
    });
    expect(audit.writeAudit).toHaveBeenCalledWith({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      actorType: "user",
      action: "organization.delete_requested",
      entityType: "organization",
      entityId: ORG_ID,
      meta: result.deleteRequest,
    });
  });
});
