import { describe, expect, it, vi } from 'vitest';

import {
  CatalogService,
  type OutboxEnqueuer,
  type SupabaseLike,
} from './catalog.service';
import { CreateProductBodySchema } from './dto';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_ID = '22222222-2222-2222-2222-222222222222';
const VARIANT_ID = '33333333-3333-3333-3333-333333333333';
const CREATED_AT = '2026-07-24T10:00:00.000Z';

function productRow() {
  return {
    id: PRODUCT_ID,
    org_id: ORG_ID,
    title: 'T-shirt',
    description: 'Cotton',
    status: 'active',
    attrs_json: { color: 'black' },
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    deleted_at: null,
  };
}

function variantRow(overrides: Record<string, unknown> = {}) {
  return {
    id: VARIANT_ID,
    org_id: ORG_ID,
    product_id: PRODUCT_ID,
    sku: 'AT-DEN-L',
    title: 'Black / L',
    price_vnd: '1234567890123',
    stock_qty: 7,
    attrs_json: { size: 'L' },
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    ...overrides,
  };
}

function catalogSupabaseMock() {
  const inserts: Array<{ table: string; values: unknown }> = [];
  const client = {
    from(table: string) {
      if (table === 'products') {
        return {
          insert(values: unknown) {
            inserts.push({ table, values });
            return {
              select() {
                return {
                  single: async () => ({
                    data: productRow(),
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === 'product_variants') {
        return {
          insert(values: unknown) {
            inserts.push({ table, values });
            return {
              select: async () => ({
                data: [variantRow()],
                error: null,
              }),
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  } as unknown as SupabaseLike;

  return { client, inserts };
}

describe('CatalogService', () => {
  it('creates a product with a bigint VND variant and enqueues reindex', async () => {
    const { client, inserts } = catalogSupabaseMock();
    const enqueue = vi.fn(async () => ({ id: 'outbox-1' })) as OutboxEnqueuer;
    const service = new CatalogService(client, enqueue);

    const result = await service.createProduct(
      ORG_ID,
      CreateProductBodySchema.parse({
        title: 'T-shirt',
        description: 'Cotton',
        attrs: { color: 'black' },
        variants: [
          {
            sku: 'AT-DEN-L',
            title: 'Black / L',
            priceVnd: '1234567890123',
            stockQty: 7,
            attrs: { size: 'L' },
          },
        ],
      }),
    );

    expect(inserts).toEqual([
      {
        table: 'products',
        values: {
          org_id: ORG_ID,
          title: 'T-shirt',
          description: 'Cotton',
          status: 'active',
          attrs_json: { color: 'black' },
        },
      },
      {
        table: 'product_variants',
        values: [
          {
            org_id: ORG_ID,
            product_id: PRODUCT_ID,
            sku: 'AT-DEN-L',
            title: 'Black / L',
            price_vnd: '1234567890123',
            stock_qty: 7,
            attrs_json: { size: 'L' },
          },
        ],
      },
    ]);
    expect(result.product.variants).toEqual([
      expect.objectContaining({
        id: VARIANT_ID,
        priceVnd: '1234567890123',
      }),
    ]);
    expect(enqueue).toHaveBeenCalledWith(client, {
      orgId: ORG_ID,
      eventName: 'knowledge.reindex',
      payload: {
        orgId: ORG_ID,
        sourceType: 'product',
        sourceId: PRODUCT_ID,
      },
    });
  });
});
