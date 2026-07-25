import { describe, expect, it, vi } from 'vitest';

import {
  EinvoiceService,
  type SupabaseLike,
} from './einvoice.service';
import type { EinvoiceProvider } from './stub-einvoice.provider';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const JOB_ID = '33333333-3333-3333-3333-333333333333';
const CREATED_AT = '2026-07-27T21:00:00.000Z';

describe('EinvoiceService', () => {
  it('creates a pending job and marks stub issue as sent', async () => {
    const issue = vi.fn(async () => ({
      provider: 'stub' as const,
      externalId: 'stub-order',
      sentAt: CREATED_AT,
    }));
    const updates: unknown[] = [];
    const client = {
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
          };
        }

        expect(table).toBe('einvoice_jobs');
        return {
          insert() {
            return {
              select() {
                return {
                  single: async () => ({
                    data: jobRow({ status: 'pending', attempts: 0 }),
                    error: null,
                  }),
                };
              },
            };
          },
          update(values: unknown) {
            updates.push(values);
            return {
              eq() {
                return {
                  eq() {
                    return {
                      select() {
                        return {
                          single: async () => ({
                            data: jobRow({
                              status: 'sent',
                              attempts: 1,
                              sent_at: CREATED_AT,
                            }),
                            error: null,
                          }),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseLike;
    const provider = { issue } satisfies EinvoiceProvider;

    const service = new EinvoiceService(client, provider);
    const result = await service.issue(ORG_ID, {
      orderId: ORDER_ID,
      provider: 'stub',
    });

    expect(issue).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: ORG_ID, orderId: ORDER_ID }),
    );
    expect(updates[0]).toMatchObject({ status: 'sent', attempts: 1 });
    expect(result.job).toMatchObject({
      orderId: ORDER_ID,
      provider: 'stub',
      status: 'sent',
      attempts: 1,
    });
  });

  it('maps http_sandbox provider failure into failed job status', async () => {
    const updates: unknown[] = [];
    const inserts: unknown[] = [];
    const client = {
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
          };
        }

        return {
          insert(values: unknown) {
            inserts.push(values);
            return {
              select() {
                return {
                  single: async () => ({
                    data: jobRow({
                      provider: 'http_sandbox',
                      status: 'pending',
                      attempts: 0,
                    }),
                    error: null,
                  }),
                };
              },
            };
          },
          update(values: unknown) {
            updates.push(values);
            return {
              eq() {
                return {
                  eq() {
                    return {
                      select() {
                        return {
                          single: async () => ({
                            data: jobRow({
                              provider: 'http_sandbox',
                              status: 'failed',
                              attempts: 1,
                              last_error:
                                'http_sandbox provider failed with HTTP 500',
                            }),
                            error: null,
                          }),
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    } as unknown as SupabaseLike;

    const failingProvider: EinvoiceProvider = {
      issue: async () => {
        throw new Error('http_sandbox provider failed with HTTP 500');
      },
    };

    const service = new EinvoiceService(client, undefined, {
      http_sandbox: failingProvider,
    });
    const result = await service.issue(ORG_ID, {
      orderId: ORDER_ID,
      provider: 'http_sandbox',
    });

    expect(inserts[0]).toMatchObject({ provider: 'http_sandbox' });
    expect(updates[0]).toMatchObject({
      status: 'failed',
      attempts: 1,
      last_error: 'http_sandbox provider failed with HTTP 500',
    });
    expect(result.job).toMatchObject({
      provider: 'http_sandbox',
      status: 'failed',
      attempts: 1,
    });
  });
});

function orderRow() {
  return {
    id: ORDER_ID,
    org_id: ORG_ID,
    status: 'done',
    payment_method: 'cod',
    customer_name: 'Nguyen Van A',
    phone_e164: '+84901234567',
    total_vnd: '120000',
    done_at: CREATED_AT,
    created_at: CREATED_AT,
  };
}

function jobRow(overrides: Record<string, unknown>) {
  return {
    id: JOB_ID,
    org_id: ORG_ID,
    order_id: ORDER_ID,
    provider: 'stub',
    status: 'pending',
    attempts: 0,
    last_error: null,
    payload_json: {},
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
    sent_at: null,
    ...overrides,
  };
}
