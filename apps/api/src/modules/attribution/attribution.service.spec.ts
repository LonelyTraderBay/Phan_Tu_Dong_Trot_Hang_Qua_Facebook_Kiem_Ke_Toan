import { describe, expect, it } from 'vitest';

import { PnlService } from '../pnl/pnl.service';
import { AttributionService, type SupabaseLike } from './attribution.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_ORG_ID = '99999999-9999-9999-9999-999999999999';

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

function createClient(seed: Partial<Tables> = {}) {
  const tables: Tables = {
    orders: [...(seed.orders ?? [])],
    ad_spend: [...(seed.ad_spend ?? [])],
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

  it('counts only revenue-recognized orders, never draft/cancelled/returned', async () => {
    // The status predicate was missing entirely, so an unconverted `draft`
    // order contributed its full `total_vnd` to attribution revenue while /pnl
    // correctly reported zero for it.
    const { client } = createClient({
      orders: [
        order({ id: 'shipped', status: 'shipped', total_vnd: '150000' }),
        order({ id: 'done', status: 'done', total_vnd: '120000' }),
        order({ id: 'draft', status: 'draft', total_vnd: '999999' }),
        order({ id: 'confirmed', status: 'confirmed', total_vnd: '888888' }),
        order({ id: 'cancelled', status: 'cancelled', total_vnd: '777777' }),
        order({ id: 'returned', status: 'returned', total_vnd: '666666' }),
      ],
    });
    const service = new AttributionService(client);

    const result = await service.summary(ORG_ID, {
      from: '2026-07-27',
      to: '2026-07-27',
    });

    expect(result.totalOrders).toBe(2);
    expect(result.totalRevenueVnd).toBe('270000');
    expect(result.sources).toEqual([
      {
        utmSource: 'facebook',
        label: 'facebook',
        orderCount: 2,
        revenueVnd: '270000',
      },
    ]);
  });

  it('reports the same revenue as P&L for one shared dataset', async () => {
    // The strongest form of the fix: run both services over a single fixture
    // and assert the two reports reconcile. Before the status filter, /pnl said
    // 270000 and /attribution said 3603330 for this exact window.
    const orders = [
      order({
        id: 'shipped-today',
        status: 'shipped',
        total_vnd: '150000',
        created_at: '2026-07-27T08:00:00.000Z',
        shipped_at: '2026-07-27T10:00:00.000Z',
      }),
      order({
        id: 'done-today',
        status: 'done',
        utm_source: 'zalo',
        total_vnd: '120000',
        created_at: '2026-07-27T09:00:00.000Z',
        shipped_at: '2026-07-27T10:30:00.000Z',
        done_at: '2026-07-27T11:00:00.000Z',
      }),
      order({ id: 'draft', status: 'draft', total_vnd: '999999' }),
      order({ id: 'confirmed', status: 'confirmed', total_vnd: '888888' }),
      order({ id: 'cancelled', status: 'cancelled', total_vnd: '777777' }),
      order({ id: 'returned', status: 'returned', total_vnd: '666666' }),
    ];
    const range = { from: '2026-07-27', to: '2026-07-27' };

    const attribution = await new AttributionService(
      createClient({ orders }).client,
    ).summary(ORG_ID, range);
    const pnl = await new PnlService(createClient({ orders }).client).getSummary(
      ORG_ID,
      range,
    );

    expect(attribution.totalRevenueVnd).toBe(pnl.revenueVnd);
    expect(attribution.totalOrders).toBe(pnl.orderCount);
    expect(attribution.totalRevenueVnd).toBe('270000');
  });

  it('deliberately buckets on created_at, so a late-shipping order lands in a different day than P&L', async () => {
    // Documented divergence, not a bug: attribution is a click-date question
    // (which source produced this order, against the ad spend of the day the
    // ads ran), P&L is a revenue-recognition question. An order clicked in July
    // and shipped in August therefore belongs to July for attribution and to
    // August for P&L. See AttributionService.loadOrders.
    const orders = [
      order({
        id: 'clicked-july-shipped-august',
        status: 'shipped',
        total_vnd: '150000',
        created_at: '2026-07-27T08:00:00.000Z',
        shipped_at: '2026-08-05T10:00:00.000Z',
      }),
    ];

    const july = { from: '2026-07-27', to: '2026-07-27' };
    const august = { from: '2026-08-05', to: '2026-08-05' };

    const julyAttribution = await new AttributionService(
      createClient({ orders }).client,
    ).summary(ORG_ID, july);
    const julyPnl = await new PnlService(
      createClient({ orders }).client,
    ).getSummary(ORG_ID, july);
    const augustAttribution = await new AttributionService(
      createClient({ orders }).client,
    ).summary(ORG_ID, august);
    const augustPnl = await new PnlService(
      createClient({ orders }).client,
    ).getSummary(ORG_ID, august);

    expect(julyAttribution.totalRevenueVnd).toBe('150000');
    expect(julyPnl.revenueVnd).toBe('0');
    expect(augustAttribution.totalRevenueVnd).toBe('0');
    expect(augustPnl.revenueVnd).toBe('150000');
  });
});

function order(overrides: Row = {}) {
  const row = {
    id: `order-${Math.random()}`,
    org_id: ORG_ID,
    status: 'shipped',
    utm_source: 'facebook',
    total_vnd: '100000',
    shipping_fee_vnd: '0',
    shipped_at: null,
    done_at: null,
    created_at: '2026-07-27T12:00:00.000Z',
    items: [],
    ...overrides,
  };

  // Mirrors the `orders.sold_at` generated column so one fixture can be read by
  // both AttributionService (created_at) and PnlService (sold_at).
  return {
    ...row,
    sold_at: row.done_at ?? row.shipped_at ?? row.created_at,
  };
}

class Query {
  private filters: Array<{
    column: string;
    value: unknown;
    op: 'eq' | 'gte' | 'lte';
  }> = [];
  private inFilters: Array<{ column: string; values: readonly unknown[] }> = [];
  private limitCount: number | null = null;
  private orderBy: Array<{ column: string; ascending: boolean }> = [];
  private offsets: { from: number; to: number } | null = null;

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

  in(column: string, values: readonly unknown[]) {
    this.inFilters.push({ column, values });
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

  /** PostgREST `.range()` is inclusive on both bounds. */
  range(from: number, to: number) {
    this.offsets = { from, to };
    return this;
  }

  then(resolve: (value: { data?: Row[]; error: null }) => void) {
    resolve({ data: this.applyFilters(), error: null });
  }

  private applyFilters() {
    let rows = this.tables[this.table].filter(
      (row) =>
        this.filters.every((filter) => {
          const value = row[filter.column];
          if (filter.op === 'gte') {
            return String(value) >= String(filter.value);
          }
          if (filter.op === 'lte') {
            return String(value) <= String(filter.value);
          }
          return value === filter.value;
        }) &&
        this.inFilters.every((filter) =>
          filter.values.includes(row[filter.column]),
        ),
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
    if (this.offsets) {
      rows = rows.slice(this.offsets.from, this.offsets.to + 1);
    }
    return rows;
  }
}
