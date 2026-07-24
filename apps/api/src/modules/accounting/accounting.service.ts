import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import type { AccountingExportQuery } from './dto';

export const ACCOUNTING_SUPABASE = Symbol('ACCOUNTING_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;

export type AccountingExportFile = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

type OrderItemRow = {
  cogs_unit_vnd?: string | number | null;
  qty: number;
};

type OrderRow = {
  id: string;
  status: 'shipped' | 'done' | string;
  total_vnd: string | number;
  shipped_at: string | null;
  done_at: string | null;
  created_at: string;
  items?: OrderItemRow[] | null;
};

type ShipmentRow = {
  id: string;
  order_id: string;
  fee_vnd: string | number;
  created_at: string;
};

type CodCollectionRow = {
  id: string;
  order_id: string;
  amount_vnd: string | number;
  collected_at: string;
};

type AdSpendRow = {
  id: string;
  date: string;
  campaign_name: string;
  amount_vnd: string | number;
};

type JournalLine = {
  date: string;
  accountHint: string;
  amountVnd: string;
  ref: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

const ORDER_SELECT =
  'id, status, total_vnd, shipped_at, done_at, created_at, items:order_items(cogs_unit_vnd, qty)';
const SHIPMENT_SELECT = 'id, order_id, fee_vnd, created_at';
const COD_SELECT = 'id, order_id, amount_vnd, collected_at';
const AD_SPEND_SELECT = 'id, date, campaign_name, amount_vnd';
const SOLD_STATUSES = ['shipped', 'done'];

@Injectable()
export class AccountingService {
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(ACCOUNTING_SUPABASE)
    supabase?: SupabaseLike,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
  }

  async export(orgId: string, query: AccountingExportQuery) {
    const [orders, shipments, codCollections, adSpend] = await Promise.all([
      this.loadOrders(orgId, query),
      this.loadShipments(orgId, query),
      this.loadCodCollections(orgId, query),
      this.loadAdSpend(orgId, query),
    ]);

    const lines: JournalLine[] = [];
    for (const order of orders) {
      const date = soldAt(order).slice(0, 10);
      lines.push({
        date,
        accountHint: 'sales_revenue',
        amountVnd: toBigintVnd(order.total_vnd).toString(),
        ref: `order:${order.id}`,
      });

      const cogs = orderCogs(order);
      if (cogs > 0n) {
        lines.push({
          date,
          accountHint: 'cogs',
          amountVnd: (-cogs).toString(),
          ref: `order:${order.id}`,
        });
      }
    }

    for (const shipment of shipments) {
      const fee = toBigintVnd(shipment.fee_vnd);
      if (fee > 0n) {
        lines.push({
          date: shipment.created_at.slice(0, 10),
          accountHint: 'shipping_fee',
          amountVnd: (-fee).toString(),
          ref: `shipment:${shipment.id}:order:${shipment.order_id}`,
        });
      }
    }

    for (const collection of codCollections) {
      lines.push({
        date: collection.collected_at.slice(0, 10),
        accountHint: 'cod_cash',
        amountVnd: toBigintVnd(collection.amount_vnd).toString(),
        ref: `cod:${collection.id}:order:${collection.order_id}`,
      });
    }

    for (const spend of adSpend) {
      const amount = toBigintVnd(spend.amount_vnd);
      if (amount > 0n) {
        lines.push({
          date: spend.date,
          accountHint: 'ad_spend',
          amountVnd: (-amount).toString(),
          ref: `ad_spend:${spend.id}:${spend.campaign_name}`,
        });
      }
    }

    lines.sort((left, right) =>
      `${left.date}:${left.accountHint}:${left.ref}`.localeCompare(
        `${right.date}:${right.accountHint}:${right.ref}`,
      ),
    );

    return buildCsvExport(query, lines);
  }

  private async loadOrders(orgId: string, query: AccountingExportQuery) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('org_id', orgId)
      .in('status', SOLD_STATUSES)
      .order('created_at', { ascending: false })
      .limit(10_000);

    if (error) {
      throwAccountingError(error, 'Could not load accounting orders');
    }

    const range = normalizeRange(query);
    return ((data ?? []) as unknown as OrderRow[]).filter((order) => {
      const at = new Date(soldAt(order)).getTime();
      return (
        (range.from === null || at >= range.from) &&
        (range.to === null || at <= range.to)
      );
    });
  }

  private async loadShipments(orgId: string, query: AccountingExportQuery) {
    let builder = this.supabase
      .from('shipments')
      .select(SHIPMENT_SELECT)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10_000);
    if (query.from) {
      builder = builder.gte('created_at', dateIso(query.from, 'from'));
    }
    if (query.to) {
      builder = builder.lte('created_at', dateIso(query.to, 'to'));
    }
    const { data, error } = await builder;
    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throwAccountingError(error, 'Could not load accounting shipments');
    }
    return (data ?? []) as ShipmentRow[];
  }

  private async loadCodCollections(orgId: string, query: AccountingExportQuery) {
    let builder = this.supabase
      .from('cod_collections')
      .select(COD_SELECT)
      .eq('org_id', orgId)
      .order('collected_at', { ascending: false })
      .limit(10_000);
    if (query.from) {
      builder = builder.gte('collected_at', dateIso(query.from, 'from'));
    }
    if (query.to) {
      builder = builder.lte('collected_at', dateIso(query.to, 'to'));
    }
    const { data, error } = await builder;
    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throwAccountingError(error, 'Could not load accounting COD collections');
    }
    return (data ?? []) as CodCollectionRow[];
  }

  private async loadAdSpend(orgId: string, query: AccountingExportQuery) {
    let builder = this.supabase
      .from('ad_spend')
      .select(AD_SPEND_SELECT)
      .eq('org_id', orgId)
      .order('date', { ascending: false })
      .limit(10_000);
    if (query.from) {
      builder = builder.gte('date', dateOnly(query.from, 'from'));
    }
    if (query.to) {
      builder = builder.lte('date', dateOnly(query.to, 'to'));
    }
    const { data, error } = await builder;
    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throwAccountingError(error, 'Could not load accounting ad spend');
    }
    return (data ?? []) as AdSpendRow[];
  }
}

function buildCsvExport(
  query: AccountingExportQuery,
  lines: JournalLine[],
): AccountingExportFile {
  const rows = [
    ['date', 'account_hint', 'amount_vnd', 'ref'],
    ...lines.map((line) => [
      line.date,
      line.accountHint,
      line.amountVnd,
      line.ref,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const from = query.from ? dateOnly(query.from, 'from') : 'all';
  const to = query.to ? dateOnly(query.to, 'to') : 'all';
  return {
    buffer: Buffer.from(csv, 'utf8'),
    contentType: 'text/csv; charset=utf-8',
    filename: `accounting-${from}-${to}.csv`,
  };
}

function soldAt(order: OrderRow) {
  return order.done_at ?? order.shipped_at ?? order.created_at;
}

function orderCogs(order: OrderRow) {
  return (order.items ?? []).reduce((sum, item) => {
    return sum + toBigintVnd(item.cogs_unit_vnd ?? '0') * BigInt(item.qty);
  }, 0n);
}

function normalizeRange(query: AccountingExportQuery) {
  return {
    from: query.from ? dateBound(query.from, 'from') : null,
    to: query.to ? dateBound(query.to, 'to') : null,
  };
}

function dateBound(value: string, bound: 'from' | 'to') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return bound === 'from'
      ? new Date(`${value}T00:00:00.000Z`).getTime()
      : new Date(`${value}T23:59:59.999Z`).getTime();
  }
  return new Date(value).getTime();
}

function dateIso(value: string, bound: 'from' | 'to') {
  return new Date(dateBound(value, bound)).toISOString();
}

function dateOnly(value: string, bound: 'from' | 'to') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return dateIso(value, bound).slice(0, 10);
}

function toBigintVnd(value: string | number | unknown) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new BadRequestException({
        code: 'invalid_money_amount',
        message: 'Money amount must be a non-negative integer VND value',
      });
    }
    return BigInt(value);
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new BadRequestException({
      code: 'invalid_money_amount',
      message: 'Money amount must be a non-negative integer VND value',
    });
  }
  return BigInt(value);
}

function throwAccountingError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: 'accounting_failed',
    message: error.message ?? message,
  });
}

function createSupabaseServiceClient(): SupabaseLike {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
