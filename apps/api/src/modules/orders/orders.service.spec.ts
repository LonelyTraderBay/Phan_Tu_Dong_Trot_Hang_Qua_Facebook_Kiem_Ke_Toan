import { describe, expect, it, vi } from 'vitest';

import {
  OrdersService,
  type AuditWriter,
  type SupabaseLike,
} from './orders.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const SECOND_ORDER_ID = '33333333-3333-3333-3333-333333333333';
const USER_ID = '44444444-4444-4444-4444-444444444444';

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
