import { describe, expect, it, vi } from 'vitest';

import { EXPORT_HEADERS } from './orders-export';
import {
  OrdersService,
  type AuditWriter,
  type SupabaseLike,
} from './orders.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const SECOND_ORDER_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = '44444444-4444-4444-4444-444444444444';
const PRODUCT_ID = '66666666-6666-6666-6666-666666666666';
const VARIANT_ID = '77777777-7777-7777-7777-777777777777';
const CREATE_BODY = {
  paymentMethod: 'cod' as const,
  addressJson: {},
  items: [{ variantId: VARIANT_ID, qty: 1 }],
};

function orderPayload(orderId: string, status: string) {
  return {
    order: {
      id: orderId,
      status,
      paymentMethod: 'cod',
      currency: 'VND',
      subtotalVnd: '1000',
      totalVnd: '1000',
      createdAt: '2026-07-24T10:00:00.000Z',
      updatedAt: '2026-07-24T10:00:00.000Z',
    },
    items: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        productId: '66666666-6666-6666-6666-666666666666',
        variantId: '77777777-7777-7777-7777-777777777777',
        titleSnapshot: 'Black / L',
        skuSnapshot: 'AT-DEN-L',
        qty: 1,
        unitPriceVnd: '1000',
        lineTotalVnd: '1000',
      },
    ],
  };
}

function auditMock() {
  return {
    writeAudit: vi.fn(async () => ({ audit: { id: 'audit-id' } })),
  } satisfies AuditWriter;
}

function autoConfirmClient(input: { stockQty: number }) {
  let stockQty = input.stockQty;
  const orders: Array<Record<string, unknown>> = [];
  const idempotentResponses = new Map<string, ReturnType<typeof orderPayload>>();
  const client = {
    rpc: vi.fn(async (fn: string, args: Record<string, unknown>) => {
      expect(fn).toBe('create_and_confirm_order');
      const idempotencyKey = String(args.p_idempotency_key);

      const existing = idempotentResponses.get(idempotencyKey);
      if (existing) {
        return {
          data: { ...existing, _idempotencyReplayed: true },
          error: null,
        };
      }

      if (stockQty < 1) {
        return {
          data: null,
          error: { code: 'P0001', hint: 'insufficient_stock' },
        };
      }

      stockQty -= 1;
      const payload = orderPayload(ORDER_ID, 'confirmed');
      orders.push(payload.order);
      idempotentResponses.set(idempotencyKey, payload);

      return {
        data: { ...payload, _idempotencyReplayed: false },
        error: null,
      };
    }),
    from(table: string) {
      const chain = {
        select() {
          return chain;
        },
        eq() {
          return chain;
        },
        is() {
          return chain;
        },
        maybeSingle: async () => {
          if (table === 'organizations') {
            return {
              data: { id: ORG_ID, settings_json: { auto_confirm: true } },
              error: null,
            };
          }
          if (table === 'product_variants') {
            return {
              data: {
                id: VARIANT_ID,
                org_id: ORG_ID,
                product_id: PRODUCT_ID,
                sku: 'AT-DEN-L',
                title: 'Black / L',
                price_vnd: '1000',
                stock_qty: stockQty,
              },
              error: null,
            };
          }
          if (table === 'products') {
            return { data: { id: PRODUCT_ID }, error: null };
          }
          throw new Error(`unexpected table ${table}`);
        },
      };

      return chain;
    },
  } as unknown as SupabaseLike;

  return {
    client,
    orders,
    get stockQty() {
      return stockQty;
    },
  };
}

describe('OrdersService lifecycle stock handling', () => {
  it('does not oversell when two orders concurrently confirm against one stock unit', async () => {
    let stockQty = 1;
    const client = {
      rpc: vi.fn(async (fn: string, args: Record<string, string>) => {
        expect(fn).toBe('confirm_order');
        if (stockQty > 0) {
          stockQty -= 1;
          return {
            data: orderPayload(args.p_order_id, 'confirmed'),
            error: null,
          };
        }

        return {
          data: null,
          error: { code: 'P0001', hint: 'insufficient_stock' },
        };
      }),
      from() {
        throw new Error('from() should not be called');
      },
    } as unknown as SupabaseLike;
    const audit = auditMock();
    const service = new OrdersService(client, audit);

    const results = await Promise.allSettled([
      service.confirmOrder({
        orgId: ORG_ID,
        orderId: ORDER_ID,
        actorUserId: USER_ID,
      }),
      service.confirmOrder({
        orgId: ORG_ID,
        orderId: SECOND_ORDER_ID,
        actorUserId: USER_ID,
      }),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
      1,
    );
    expect(stockQty).toBe(0);
    expect(client.rpc).toHaveBeenCalledTimes(2);
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
  });

  it('maps insufficient stock from the confirm RPC to a 400 problem', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: 'P0001', hint: 'insufficient_stock' },
      })),
      from() {
        throw new Error('from() should not be called');
      },
    } as unknown as SupabaseLike;
    const service = new OrdersService(client, auditMock());

    await expect(
      service.confirmOrder({
        orgId: ORG_ID,
        orderId: ORDER_ID,
        actorUserId: USER_ID,
      }),
    ).rejects.toMatchObject({
      response: { code: 'insufficient_stock' },
      status: 400,
    });
  });

  it('uses the cancel RPC that restores confirmed unshipped stock', async () => {
    let stockQty = 0;
    const client = {
      rpc: vi.fn(async (fn: string) => {
        expect(fn).toBe('cancel_order');
        stockQty += 2;
        return {
          data: orderPayload(ORDER_ID, 'cancelled'),
          error: null,
        };
      }),
      from() {
        throw new Error('from() should not be called');
      },
    } as unknown as SupabaseLike;
    const audit = auditMock();
    const service = new OrdersService(client, audit);

    await service.cancelOrder({
      orgId: ORG_ID,
      orderId: ORDER_ID,
      actorUserId: USER_ID,
    });

    expect(stockQty).toBe(2);
    expect(client.rpc).toHaveBeenCalledWith('cancel_order', {
      p_org_id: ORG_ID,
      p_order_id: ORDER_ID,
      p_cancelled_at: expect.any(String),
    });
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'order.cancelled',
        entityId: ORDER_ID,
      }),
    );
  });
});

describe('OrdersService auto-confirm create', () => {
  it('does not leave an order row when auto-confirm stock is insufficient', async () => {
    const db = autoConfirmClient({ stockQty: 0 });
    const audit = auditMock();
    const service = new OrdersService(db.client, audit);

    await expect(
      service.createDraftOrder({
        orgId: ORG_ID,
        actorUserId: USER_ID,
        body: CREATE_BODY,
        idempotencyKey: 'create-no-stock',
        path: '/v1/orders',
      }),
    ).rejects.toMatchObject({
      response: { code: 'insufficient_stock' },
      status: 400,
    });

    expect(db.orders).toHaveLength(0);
    expect(db.client.rpc).toHaveBeenCalledTimes(1);
    expect(db.client.rpc).toHaveBeenCalledWith(
      'create_and_confirm_order',
      expect.objectContaining({
        p_idempotency_key: 'create-no-stock',
      }),
    );
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('confirms once when auto-confirm create is replayed with the same idempotency key', async () => {
    const db = autoConfirmClient({ stockQty: 1 });
    const audit = auditMock();
    const service = new OrdersService(db.client, audit);
    const input = {
      orgId: ORG_ID,
      actorUserId: USER_ID,
      body: CREATE_BODY,
      idempotencyKey: 'create-confirm-once',
      path: '/v1/orders',
    };

    const first = await service.createDraftOrder(input);
    const replay = await service.createDraftOrder(input);

    expect(first.order.status).toBe('confirmed');
    expect(replay.order.status).toBe('confirmed');
    expect(db.orders).toHaveLength(1);
    expect(db.stockQty).toBe(0);
    expect(db.client.rpc).toHaveBeenCalledTimes(2);
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'system',
        action: 'order.confirmed',
        entityId: ORDER_ID,
        meta: { autoConfirm: true },
      }),
    );
  });
});

describe('OrdersService idempotency', () => {
  it('does not double-audit concurrent confirm requests with the same idempotency key', async () => {
    let releaseRpc: (() => void) | undefined;
    const rpcGate = new Promise<void>((resolve) => {
      releaseRpc = resolve;
    });
    const idempotencyRows = new Map<string, Record<string, unknown>>();
    const client = {
      rpc: vi.fn(async () => {
        await rpcGate;
        return {
          data: orderPayload(ORDER_ID, 'confirmed'),
          error: null,
        };
      }),
      from(table: string) {
        if (table !== 'idempotency_keys') {
          throw new Error(`unexpected table ${table}`);
        }

        return {
          insert(row: Record<string, unknown>) {
            const mapKey = `${row.org_id}:${row.key}`;
            if (idempotencyRows.has(mapKey)) {
              return Promise.resolve({ error: { code: '23505' } });
            }
            idempotencyRows.set(mapKey, { ...row });
            return Promise.resolve({ error: null });
          },
          select() {
            return {
              eq(column: string, value: string) {
                const filters: Record<string, string> = { [column]: value };
                return {
                  eq(nextColumn: string, nextValue: string) {
                    filters[nextColumn] = nextValue;
                    return {
                      maybeSingle: async () => {
                        const row = idempotencyRows.get(
                          `${filters.org_id}:${filters.key}`,
                        );
                        if (!row) {
                          return { data: null, error: null };
                        }
                        return {
                          data: {
                            key: row.key,
                            method: row.method,
                            path: row.path,
                            status_code: row.status_code,
                            response_json: row.response_json,
                          },
                          error: null,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          update(values: Record<string, unknown>) {
            return {
              eq(column: string, value: string) {
                const filters: Record<string, string> = { [column]: value };
                return {
                  eq(nextColumn: string, nextValue: string) {
                    filters[nextColumn] = nextValue;
                    const mapKey = `${filters.org_id}:${filters.key}`;
                    const row = idempotencyRows.get(mapKey);
                    if (row) {
                      idempotencyRows.set(mapKey, { ...row, ...values });
                    }
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
          },
          delete() {
            return {
              eq(column: string, value: string) {
                const filters: Record<string, string> = { [column]: value };
                return {
                  eq(nextColumn: string, nextValue: string) {
                    filters[nextColumn] = nextValue;
                    idempotencyRows.delete(`${filters.org_id}:${filters.key}`);
                    return Promise.resolve({ error: null });
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseLike;
    const audit = auditMock();
    const service = new OrdersService(client, audit);
    const confirmInput = {
      orgId: ORG_ID,
      orderId: ORDER_ID,
      actorUserId: USER_ID,
      idempotencyKey: 'confirm-once',
      path: `/v1/orders/${ORDER_ID}/confirm`,
    };

    const inFlight = Promise.allSettled([
      service.confirmOrder(confirmInput),
      service.confirmOrder(confirmInput),
    ]);
    await Promise.resolve();
    releaseRpc?.();
    const results = await inFlight;

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(rejected).toHaveLength(1);
    if (rejected[0].status === 'rejected') {
      expect(rejected[0].reason).toMatchObject({
        response: { code: 'idempotency_conflict' },
      });
    }
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(audit.writeAudit).toHaveBeenCalledTimes(1);
  });
});

describe('OrdersService export', () => {
  it('returns a non-empty CSV buffer scoped to org filters', async () => {
    const orderRow = {
      id: ORDER_ID,
      org_id: ORG_ID,
      conversation_id: null,
      contact_id: null,
      status: 'confirmed',
      payment_method: 'cod',
      customer_name: 'Nguyen Van A',
      phone_e164: '+84901234567',
      address_text: '123 Nguyen Hue, Q1, TP.HCM',
      items: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          product_id: '66666666-6666-6666-6666-666666666666',
          variant_id: '77777777-7777-7777-7777-777777777777',
          title_snapshot: 'Black / L',
          sku_snapshot: 'AT-DEN-L',
          qty: 2,
          unit_price_vnd: '500',
          line_total_vnd: '1000',
        },
      ],
      address_json: {},
      currency: 'VND',
      subtotal_vnd: '1000',
      total_vnd: '1000',
      idempotency_key: null,
      confirmed_at: '2026-07-24T10:05:00.000Z',
      shipped_at: null,
      cancelled_at: null,
      done_at: null,
      created_at: '2026-07-24T10:00:00.000Z',
      updated_at: '2026-07-24T10:05:00.000Z',
    };
    const client = {
      rpc: vi.fn(),
      from(table: string) {
        expect(table).toBe('orders');
        const filters: Record<string, unknown> = {};
        const chain = {
          select() {
            return chain;
          },
          eq(column: string, value: unknown) {
            filters[column] = value;
            return chain;
          },
          gte(column: string, value: unknown) {
            filters[column] = value;
            return chain;
          },
          lte(column: string, value: unknown) {
            filters[column] = value;
            return chain;
          },
          order() {
            return chain;
          },
          limit() {
            return Promise.resolve({ data: [orderRow], error: null });
          },
        };
        return chain;
      },
    } as unknown as SupabaseLike;
    const service = new OrdersService(client, auditMock());

    const file = await service.exportOrders({
      orgId: ORG_ID,
      format: 'csv',
      status: 'confirmed',
    });

    const csv = file.buffer.toString('utf8');
    const headerLine = csv.split('\n')[0] ?? '';

    expect(file.buffer.length).toBeGreaterThan(0);
    expect(file.contentType).toContain('text/csv');
    expect(headerLine).toBe(EXPORT_HEADERS.join(','));
    for (const header of ['Mã đơn', 'Địa chỉ', 'Mã SKU', 'Số lượng', 'Tên sản phẩm']) {
      expect(headerLine).toContain(header);
    }
    expect(csv).toContain(ORDER_ID);
    expect(csv).toContain('Nguyen Van A');
    expect(csv).toContain('123 Nguyen Hue, Q1, TP.HCM');
    expect(csv).toContain('AT-DEN-L');
    expect(csv).toContain('Black / L');
    expect(csv).toContain(',2,');
  });
});
