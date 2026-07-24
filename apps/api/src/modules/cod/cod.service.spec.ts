import { describe, expect, it, vi } from 'vitest';

import { CodService, type SupabaseLike } from './cod.service';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ORDER_ID = '22222222-2222-2222-2222-222222222222';
const USER_ID = '33333333-3333-3333-3333-333333333333';
const CREATED_AT = '2026-07-27T11:00:00.000Z';

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

function auditMock() {
  return {
    writeAudit: vi.fn(async () => ({})),
  };
}

function expectation(overrides: Row = {}) {
  return {
    id: 'exp-1',
    org_id: ORG_ID,
    order_id: ORDER_ID,
    expected_vnd: '150000',
    status: 'open',
    created_at: CREATED_AT,
    ...overrides,
  };
}

function createClient(seed: Partial<Tables> = {}) {
  const tables: Tables = {
    cod_expectations: [...(seed.cod_expectations ?? [])],
    cod_collections: [...(seed.cod_collections ?? [])],
    cod_discrepancies: [...(seed.cod_discrepancies ?? [])],
    orders: [...(seed.orders ?? [])],
  };

  return {
    tables,
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

describe('CodService', () => {
  it('upserts an expectation for shipped COD orders using total_vnd', async () => {
    const db = createClient();
    const audit = auditMock();
    const service = new CodService(db.client, audit);

    const result = await service.ensureExpectationForOrder({
      orgId: ORG_ID,
      orderId: ORDER_ID,
      actorUserId: USER_ID,
      order: {
        status: 'shipped',
        paymentMethod: 'cod',
        totalVnd: '150000',
      },
    });

    expect(result?.expectation).toMatchObject({
      orderId: ORDER_ID,
      expectedVnd: '150000',
      status: 'open',
    });
    expect(db.tables.cod_expectations[0]).toMatchObject({
      org_id: ORG_ID,
      order_id: ORDER_ID,
      expected_vnd: '150000',
    });
    expect(audit.writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cod.expectation_upserted',
        meta: expect.objectContaining({ expectedVnd: '150000' }),
      }),
    );
  });

  it('records a collection and marks an order matched when sums equal expectation', async () => {
    const db = createClient({ cod_expectations: [expectation()] });
    const audit = auditMock();
    const service = new CodService(db.client, audit);

    const collection = await service.recordCollection({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      body: {
        orderId: ORDER_ID,
        amountVnd: '150000',
        source: 'manual',
      },
    });
    const reconciled = await service.reconcileOrder({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      orderId: ORDER_ID,
    });

    expect(collection.collection).toMatchObject({
      orderId: ORDER_ID,
      amountVnd: '150000',
      source: 'manual',
    });
    expect(reconciled.expectation).toMatchObject({
      orderId: ORDER_ID,
      status: 'matched',
    });
    expect(reconciled.discrepancy).toBeNull();
    expect(reconciled.summary).toEqual({
      expectedVnd: '150000',
      collectedVnd: '150000',
      deltaVnd: '0',
    });
  });

  it('opens a discrepancy when collected COD does not match expected COD', async () => {
    const db = createClient({
      cod_expectations: [expectation()],
      cod_collections: [
        {
          id: 'col-1',
          org_id: ORG_ID,
          order_id: ORDER_ID,
          amount_vnd: '90000',
          collected_at: CREATED_AT,
          source: 'manual',
          note: null,
          created_at: CREATED_AT,
        },
      ],
    });
    const service = new CodService(db.client, auditMock());

    const result = await service.reconcileOrder({
      orgId: ORG_ID,
      actorUserId: USER_ID,
      orderId: ORDER_ID,
    });

    expect(result.expectation).toMatchObject({
      orderId: ORDER_ID,
      status: 'discrepancy',
    });
    expect(result.discrepancy).toMatchObject({
      orderId: ORDER_ID,
      expectedVnd: '150000',
      collectedVnd: '90000',
      deltaVnd: '-60000',
      status: 'open',
    });
    expect(db.tables.cod_discrepancies).toHaveLength(1);
  });
});

class Query {
  private filters: Array<{ column: string; value: unknown; values?: unknown[] }> = [];
  private limitCount: number | null = null;
  private insertValues: Row | null = null;
  private updateValues: Row | null = null;
  private upsertValues: Row | null = null;

  constructor(
    private readonly tables: Tables,
    private readonly table: string,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, value: undefined, values });
    return this;
  }

  order() {
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  insert(values: Row) {
    this.insertValues = values;
    return this;
  }

  update(values: Row) {
    this.updateValues = values;
    return this;
  }

  upsert(values: Row) {
    this.upsertValues = values;
    return this;
  }

  async maybeSingle() {
    const rows = this.applyFilters();
    return { data: rows[0] ?? null, error: null };
  }

  async single() {
    if (this.insertValues) {
      const row = this.withDefaults(this.insertValues);
      this.tables[this.table].push(row);
      return { data: row, error: null };
    }

    if (this.upsertValues) {
      const existing = this.tables[this.table].find(
        (row) =>
          row.org_id === this.upsertValues?.org_id &&
          row.order_id === this.upsertValues?.order_id,
      );
      if (existing) {
        Object.assign(existing, this.upsertValues);
        return { data: existing, error: null };
      }
      const row = this.withDefaults(this.upsertValues);
      this.tables[this.table].push(row);
      return { data: row, error: null };
    }

    if (this.updateValues) {
      const row = this.applyFilters()[0];
      if (row) {
        Object.assign(row, this.updateValues);
      }
      return { data: row ?? null, error: null };
    }

    const rows = this.applyFilters();
    return { data: rows[0] ?? null, error: null };
  }

  then(resolve: (value: { data?: Row[]; error: null }) => void) {
    if (this.updateValues) {
      for (const row of this.applyFilters()) {
        Object.assign(row, this.updateValues);
      }
      resolve({ error: null });
      return;
    }
    resolve({ data: this.applyFilters(), error: null });
  }

  private applyFilters() {
    let rows = this.tables[this.table].filter((row) =>
      this.filters.every((filter) =>
        filter.values
          ? filter.values.includes(row[filter.column])
          : row[filter.column] === filter.value,
      ),
    );
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }
    return rows;
  }

  private withDefaults(values: Row) {
    return {
      id: `${this.table}-${this.tables[this.table].length + 1}`,
      created_at: CREATED_AT,
      ...(this.table === 'cod_expectations' ? { status: 'open' } : {}),
      ...(this.table === 'cod_discrepancies' ? { status: 'open' } : {}),
      ...values,
    };
  }
}
