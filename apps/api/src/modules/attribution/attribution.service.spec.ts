import { describe, expect, it } from 'vitest';

import { AttributionService, type SupabaseLike } from './attribution.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ORG_ID = '99999999-9999-9999-9999-999999999999';

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

function createClient(seed: Partial<Tables> = {}) {
  const tables: Tables = {
    orders: [...(seed.orders ?? [])],
  };

  return {
    client: {
      from(table: string) {
        if (!tables[table]) {
          tables[table] = [];
        }
        return new Query(tables, table);
      },
    } as unknown as SupabaseLike,
  };
}

describe('AttributionService', () => {
  it('summarizes order counts and bigint revenue by utm source', async () => {
    const { client } = createClient({
      orders: [
        order({ utm_source: 'facebook', total_vnd: '120000' }),
        order({ utm_source: 'Facebook', total_vnd: '30000' }),
        order({ utm_source: 'zalo', total_vnd: 40000 }),
        order({ utm_source: null, total_vnd: '10000' }),
        order({
          org_id: OTHER_ORG_ID,
          utm_source: 'facebook',
          total_vnd: '999999',
        }),
        order({ created_at: '2026-07-19T23:59:59.000Z', total_vnd: '888888' }),
      ],
    });
    const service = new AttributionService(client);

    await expect(
      service.summary(ORG_ID, { from: '2026-07-20', to: '2026-07-27' }),
    ).resolves.toEqual({
      totalOrders: 4,
      totalRevenueVnd: '200000',
      sources: [
        {
          utmSource: 'facebook',
          label: 'facebook',
          orderCount: 2,
          revenueVnd: '150000',
        },
        {
          utmSource: 'zalo',
          label: 'zalo',
          orderCount: 1,
          revenueVnd: '40000',
        },
        {
          utmSource: null,
          label: 'Không rõ nguồn',
          orderCount: 1,
          revenueVnd: '10000',
        },
      ],
    });
  });
});

function order(overrides: Row = {}) {
  return {
    id: `order-${Math.random()}`,
    org_id: ORG_ID,
    utm_source: 'facebook',
    total_vnd: '100000',
    created_at: '2026-07-27T12:00:00.000Z',
    ...overrides,
  };
}

class Query {
  private filters: Array<{
    column: string;
    value: unknown;
    op: 'eq' | 'gte' | 'lte';
  }> = [];
  private limitCount: number | null = null;
  private orderBy: Array<{ column: string; ascending: boolean }> = [];

  constructor(
    private readonly tables: Tables,
    private readonly table: string,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value, op: 'eq' });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ column, value, op: 'gte' });
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push({ column, value, op: 'lte' });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy.push({ column, ascending: options.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  then(resolve: (value: { data?: Row[]; error: null }) => void) {
    resolve({ data: this.applyFilters(), error: null });
  }

  private applyFilters() {
    let rows = this.tables[this.table].filter((row) =>
      this.filters.every((filter) => {
        const value = row[filter.column];
        if (filter.op === 'gte') {
          return String(value) >= String(filter.value);
        }
        if (filter.op === 'lte') {
          return String(value) <= String(filter.value);
        }
        return value === filter.value;
      }),
    );

    for (const orderBy of this.orderBy.slice().reverse()) {
      rows = [...rows].sort((left, right) => {
        const comparison = String(left[orderBy.column]).localeCompare(
          String(right[orderBy.column]),
        );
        return orderBy.ascending ? comparison : -comparison;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }
    return rows;
  }
}
