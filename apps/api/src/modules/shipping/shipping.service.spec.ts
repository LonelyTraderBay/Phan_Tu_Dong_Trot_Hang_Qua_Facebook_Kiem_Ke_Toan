import { describe, expect, it, vi } from 'vitest';

import { decryptToken } from '../../common/crypto/token-crypto';
import { GhnShippingProvider } from './ghn-shipping.provider';
import { ManualShippingProvider } from './manual-shipping.provider';
import {
  ShippingService,
  type ShippingEnv,
  type SupabaseLike,
} from './shipping.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = '33333333-3333-3333-3333-333333333333';
const CONNECTION_ID = '44444444-4444-4444-4444-444444444444';
const SHIPMENT_ID = '55555555-5555-5555-5555-555555555555';
const TOKEN_KEY = 'shipping-token-encryption-key-32chars';
const CREATED_AT = '2026-07-27T10:00:00.000Z';

const env = {
  SUPABASE_URL: 'https://supabase.example.com',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  TOKEN_ENCRYPTION_KEY: TOKEN_KEY,
} satisfies ShippingEnv;

function shippingOrder() {
  return {
    id: ORDER_ID,
    customerName: 'Nguyen Van A',
    phoneE164: '+84901234567',
    addressText: '1 Nguyen Hue, Q1',
    addressJson: {},
    items: [
      {
        id: '66666666-6666-6666-6666-666666666666',
        productId: '77777777-7777-7777-7777-777777777777',
        variantId: '88888888-8888-8888-8888-888888888888',
        titleSnapshot: 'Ao thun',
        skuSnapshot: 'AT-1',
        qty: 1,
        unitPriceVnd: '100000',
        lineTotalVnd: '100000',
      },
    ],
  };
}

function orderRow(status = 'confirmed') {
  return {
    id: ORDER_ID,
    org_id: ORG_ID,
    status,
    payment_method: 'cod',
    customer_name: 'Nguyen Van A',
    phone_e164: '+84901234567',
    address_text: '1 Nguyen Hue, Q1',
    address_json: {},
    total_vnd: '100000',
    items: [
      {
        id: '66666666-6666-6666-6666-666666666666',
        product_id: '77777777-7777-7777-7777-777777777777',
        variant_id: '88888888-8888-8888-8888-888888888888',
        title_snapshot: 'Ao thun',
        sku_snapshot: 'AT-1',
        qty: 1,
        unit_price_vnd: '100000',
        line_total_vnd: '100000',
      },
    ],
  };
}

function shipmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: SHIPMENT_ID,
    org_id: ORG_ID,
    order_id: ORDER_ID,
    carrier_connection_id: null,
    provider: 'manual',
    external_shipment_id: 'MANUAL-22222222',
    tracking_code: 'MANUAL-22222222',
    status: 'created',
    fee_vnd: '0',
    label_url: null,
    raw_json: {},
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...overrides,
  };
}

describe('shipping providers', () => {
  it('manual provider creates a deterministic tracking code with configured fee', async () => {
    const provider = new ManualShippingProvider();

    const result = await provider.createShipment({
      orgId: ORG_ID,
      order: shippingOrder(),
      connection: {
        id: null,
        provider: 'manual',
        displayName: 'Thu cong',
        config: { feeVnd: '25000' },
        credentials: {},
      },
    });

    expect(result.trackingCode).toBe('MANUAL-22222222');
    expect(result.feeVnd).toBe(25000n);
  });

  it('GHN provider returns a clear configuration error without a token', async () => {
    const provider = new GhnShippingProvider();

    await expect(
      provider.createShipment({
        orgId: ORG_ID,
        order: shippingOrder(),
        connection: {
          id: CONNECTION_ID,
          provider: 'ghn',
          displayName: 'GHN',
          config: {},
          credentials: {},
        },
      }),
    ).rejects.toMatchObject({
      response: { code: 'carrier_not_configured' },
      status: 400,
    });
  });
});

describe('ShippingService', () => {
  it('creates a manual shipment, stores fee on the order, and ships confirmed order', async () => {
    const inserts: unknown[] = [];
    const updates: unknown[] = [];
    const rpc = vi.fn(async () => ({
      data: {
        order: {
          id: ORDER_ID,
          status: 'shipped',
          shippingFeeVnd: '0',
        },
        items: [],
      },
      error: null,
    }));
    const client = {
      rpc,
      from(table: string) {
        if (table === 'orders') {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        maybeSingle: async () => ({
                          data: orderRow(),
                          error: null,
                        }),
                      };
                    },
                  };
                },
              };
            },
            update(values: unknown) {
              updates.push(values);
              return {
                eq() {
                  return {
                    eq: async () => ({ error: null }),
                  };
                },
              };
            },
          };
        }

        if (table === 'carrier_connections') {
          return {
            select() {
              return {
                eq() {
                  return {
                    eq() {
                      return {
                        maybeSingle: async () => ({ data: null, error: null }),
                      };
                    },
                  };
                },
              };
            },
          };
        }

        if (table === 'shipments') {
          return {
            insert(values: unknown) {
              inserts.push(values);
              return {
                select() {
                  return {
                    single: async () => ({
                      data: shipmentRow(),
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        }

        throw new Error(`unexpected table ${table}`);
      },
    } as unknown as SupabaseLike;
    const cod = {
      ensureExpectationForOrder: vi.fn(async () => null),
    };
    const service = new ShippingService(
      client,
      env,
      undefined,
      undefined,
      cod,
    );

    const result = await service.createShipment({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      body: { orderId: ORDER_ID, provider: 'manual' },
    });

    expect(inserts[0]).toMatchObject({
      org_id: ORG_ID,
      order_id: ORDER_ID,
      provider: 'manual',
      tracking_code: 'MANUAL-22222222',
      fee_vnd: '0',
    });
    expect(updates[0]).toMatchObject({ shipping_fee_vnd: '0' });
    expect(rpc).toHaveBeenCalledWith('ship_order', {
      p_org_id: ORG_ID,
      p_order_id: ORDER_ID,
      p_shipped_at: expect.any(String),
    });
    expect(cod.ensureExpectationForOrder).toHaveBeenCalledWith({
      orgId: ORG_ID,
      orderId: ORDER_ID,
      actorUserId: USER_ID,
      order: {
        status: 'shipped',
        paymentMethod: 'cod',
        totalVnd: '100000',
      },
    });
    expect(result.shipment.trackingCode).toBe('MANUAL-22222222');
    expect(result.order).toMatchObject({ status: 'shipped' });
  });

  it('encrypts carrier credentials and omits them from the returned DTO', async () => {
    const inserts: Array<Record<string, unknown>> = [];
    const client = {
      rpc() {
        throw new Error('rpc should not be called');
      },
      from(table: string) {
        if (table !== 'carrier_connections') {
          throw new Error(`unexpected table ${table}`);
        }

        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({ data: null, error: null }),
                    };
                  },
                };
              },
            };
          },
          insert(values: Record<string, unknown>) {
            inserts.push(values);
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      id: CONNECTION_ID,
                      org_id: ORG_ID,
                      provider: 'ghn',
                      display_name: 'GHN',
                      credentials_enc: values.credentials_enc,
                      config_json: values.config_json,
                      enabled: true,
                      created_at: CREATED_AT,
                      updated_at: CREATED_AT,
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseLike;
    const service = new ShippingService(client, env);

    const result = await service.upsertConnection({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      body: {
        provider: 'ghn',
        credentials: { token: 'GHN_TOKEN', shopId: 123 },
        config: { sandboxUrl: 'https://sandbox.example.com/ghn' },
        enabled: true,
      },
    });

    expect(JSON.stringify(result)).not.toContain('GHN_TOKEN');
    expect(result.connection).toMatchObject({
      id: CONNECTION_ID,
      provider: 'ghn',
      hasCredentials: true,
    });
    expect(
      decryptToken(String(inserts[0].credentials_enc), TOKEN_KEY),
    ).toBe(JSON.stringify({ token: 'GHN_TOKEN', shopId: 123 }));
  });
});
