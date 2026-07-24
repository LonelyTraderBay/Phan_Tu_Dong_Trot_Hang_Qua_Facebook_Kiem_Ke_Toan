import { describe, expect, it, vi } from 'vitest';

import { OrdersController } from './orders.controller';
import { type OrdersService } from './orders.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '44444444-4444-4444-4444-444444444444';
const VARIANT_ID = '77777777-7777-7777-7777-777777777777';

describe('OrdersController createDraftOrder', () => {
  it('rejects POST /v1/orders when Idempotency-Key is missing', () => {
    const service = {
      createDraftOrder: vi.fn(),
    } as unknown as OrdersService;
    const controller = new OrdersController(service);

    let thrown: unknown;
    try {
      controller.createDraftOrder(
        ORG_ID,
        { id: USER_ID },
        { originalUrl: '/v1/orders' } as never,
        {
          paymentMethod: 'cod',
          addressJson: {},
          items: [{ variantId: VARIANT_ID, qty: 1 }],
        },
      );
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({
      response: expect.objectContaining({
        code: 'missing_idempotency_key',
      }),
      status: 400,
    });
    expect(service.createDraftOrder).not.toHaveBeenCalled();
  });
});
