import { describe, expect, it } from 'vitest';

import { neutralizeSpreadsheetFormula } from '../../common/csv/csv-formula-guard';
import { AccountingService, type SupabaseLike } from './accounting.service';
import type { AccountingExportQuery } from './dto';

const ORG_ID = '11111111-1111-1111-1111-111111111111';
const QUERY = { format: 'csv' } as AccountingExportQuery;

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

class Query {
  private eqFilters: Array<{ column: string; value: unknown }> = [];

  constructor(
    private readonly tables: Tables,
    private readonly table: string,
  ) {}

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.eqFilters.push({ column, value });
    return this;
  }

  in() {
    return this;
  }

  gte() {
    return this;
  }

  lte() {
    return this;
  }

  order() {
    return this;
  }

  limit() {
    return this;
  }

  range() {
    return this;
  }

  then(resolve: (value: { data: Row[]; error: null }) => void) {
    const rows = (this.tables[this.table] ?? []).filter((row) =>
      this.eqFilters.every((filter) => row[filter.column] === filter.value),
    );
    resolve({ data: rows, error: null });
  }
}

function createClient(seed: Partial<Tables>): SupabaseLike {
  const tables: Tables = {
    orders: [...(seed.orders ?? [])],
    shipments: [...(seed.shipments ?? [])],
    cod_collections: [...(seed.cod_collections ?? [])],
    ad_spend: [...(seed.ad_spend ?? [])],
  };

  return {
    from(table: string) {
      return new Query(tables, table);
    },
  } as unknown as SupabaseLike;
}

async function exportCsv(seed: Partial<Tables>) {
  const service = new AccountingService(createClient(seed));
  const file = await service.export(ORG_ID, QUERY);
  return file.buffer.toString('utf8');
}

function adSpend(overrides: Row = {}): Row {
  return {
    id: 'ad-1',
    org_id: ORG_ID,
    date: '2026-07-01',
    campaign_name: 'Tết Sale',
    amount_vnd: '500000',
    ...overrides,
  };
}

function codCollection(overrides: Row = {}): Row {
  return {
    id: 'cod-1',
    org_id: ORG_ID,
    order_id: 'order-1',
    amount_vnd: '250000',
    collected_at: '2026-07-02T08:00:00.000Z',
    ...overrides,
  };
}

describe('AccountingService CSV export', () => {
  it('leaves the header row untouched', async () => {
    const csv = await exportCsv({ ad_spend: [adSpend()] });

    expect(csv.split('\n')[0]).toBe('"date","account_hint","amount_vnd","ref"');
  });

  it('neutralizes a formula-leading cell with an apostrophe inside the quotes', async () => {
    // A hostile value reaching a leading cell position is neutralized even
    // though quoting alone would not stop a spreadsheet from evaluating it.
    const csv = await exportCsv({ ad_spend: [adSpend({ date: '=1+1' })] });

    expect(csv.split('\n')[1]).toContain(`"'=1+1"`);
  });

  it('leaves a positive amount and ordinary text alone', async () => {
    const csv = await exportCsv({ cod_collections: [codCollection()] });

    expect(csv.split('\n')[1]).toBe(
      '"2026-07-02","cod_cash","250000","cod:cod-1:order:order-1"',
    );
  });

  it('still doubles an embedded quote', async () => {
    const csv = await exportCsv({
      cod_collections: [codCollection({ order_id: 'a"b' })],
    });

    expect(csv.split('\n')[1]).toContain('"cod:cod-1:order:a""b"');
  });

  it('does not prefix a campaign name embedded mid-cell', async () => {
    // `ref` always starts with an `ad_spend:` literal, so a hostile campaign
    // name never occupies the leading position a spreadsheet parses as a formula.
    const csv = await exportCsv({
      ad_spend: [adSpend({ campaign_name: "=cmd|'/c calc'!A0" })],
    });

    expect(csv.split('\n')[1]).toContain(`"ad_spend:ad-1:=cmd|'/c calc'!A0"`);
  });

  it('leaves legitimately negative amounts as numbers, so SUM() still works', async () => {
    // cogs, shipping fees and ad spend are legitimately negative VND. A pure
    // integer literal cannot be a formula (a formula needs an operator, function
    // or cell reference), so the guard exempts `^-?\d+$` — the cell stays a
    // number and the shop owner's SUM() over the ledger keeps working.
    const csv = await exportCsv({ ad_spend: [adSpend()] });

    expect(csv.split('\n')[1]).toBe(
      `"2026-07-01","ad_spend","-500000","ad_spend:ad-1:Tết Sale"`,
    );
  });

  it('still neutralizes a formula that merely starts with a minus sign', async () => {
    // The numeric carve-out must not become an injection hole: `-1+1` is a real
    // formula (Excel evaluates it to 0) and does not match `^-?\d+$`.
    expect(neutralizeSpreadsheetFormula('-1+1')).toBe("'-1+1");
    expect(neutralizeSpreadsheetFormula('-500000')).toBe('-500000');
  });
});
