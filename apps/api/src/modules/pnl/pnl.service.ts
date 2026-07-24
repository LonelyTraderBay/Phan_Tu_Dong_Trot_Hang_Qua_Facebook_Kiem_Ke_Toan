import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import type { PnlDateRangeQuery } from './dto';

export const PNL_SUPABASE = Symbol('PNL_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;

type OrderStatus = 'shipped' | 'done';

type OrderItemRow = {
  sku_snapshot: string;
  qty: number;
  line_total_vnd: string | number;
  cogs_unit_vnd?: string | number | null;
};

type OrderRow = {
  id: string;
  status: OrderStatus;
  total_vnd: string | number;
  shipped_at: string | null;
  done_at: string | null;
  created_at: string;
  items?: OrderItemRow[] | null;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

type MoneyAggregate = {
  revenue: bigint;
  cogs: bigint;
  grossProfit: bigint;
  orderCount: number;
};

type SkuAggregate = MoneyAggregate & {
  sku: string;
  qty: number;
  orderIds: Set<string>;
};

const SOLD_STATUSES: OrderStatus[] = ['shipped', 'done'];
const ORDER_WITH_ITEMS_SELECT =
  'id, status, total_vnd, shipped_at, done_at, created_at, items:order_items(sku_snapshot, qty, line_total_vnd, cogs_unit_vnd)';

@Injectable()
export class PnlService {
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(PNL_SUPABASE)
    supabase?: SupabaseLike,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
  }

  async getSummary(orgId: string, query: PnlDateRangeQuery) {
    const orders = await this.loadSoldOrders(orgId, query);
    const totals = emptyAggregate();
    const byDay = new Map<string, MoneyAggregate>();

    for (const order of orders) {
      const soldDate = soldAt(order);
      const day = soldDate.slice(0, 10);
      const dayAggregate = byDay.get(day) ?? emptyAggregate();
      const revenue = toBigintVnd(order.total_vnd);
      const cogs = orderCogs(order);

      addOrder(totals, revenue, cogs);
      addOrder(dayAggregate, revenue, cogs);
      byDay.set(day, dayAggregate);
    }

    return {
      ...serializeAggregate(totals),
      days: [...byDay.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([day, aggregate]) => ({
          day,
          ...serializeAggregate(aggregate),
        })),
    };
  }

  async getBySku(orgId: string, query: PnlDateRangeQuery) {
    const orders = await this.loadSoldOrders(orgId, query);
    const bySku = new Map<string, SkuAggregate>();

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const sku = item.sku_snapshot || '(no sku)';
        const aggregate = bySku.get(sku) ?? emptySkuAggregate(sku);
        const revenue = toBigintVnd(item.line_total_vnd);
        const cogs = itemCogs(item);

        aggregate.revenue += revenue;
        aggregate.cogs += cogs;
        aggregate.grossProfit += revenue - cogs;
        aggregate.qty += item.qty;
        aggregate.orderIds.add(order.id);
        aggregate.orderCount = aggregate.orderIds.size;
        bySku.set(sku, aggregate);
      }
    }

    return {
      items: [...bySku.values()]
        .sort((left, right) => left.sku.localeCompare(right.sku))
        .map((aggregate) => ({
          sku: aggregate.sku,
          qty: aggregate.qty,
          ...serializeAggregate(aggregate),
        })),
    };
  }

  private async loadSoldOrders(orgId: string, query: PnlDateRangeQuery) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('org_id', orgId)
      .in('status', SOLD_STATUSES)
      .order('created_at', { ascending: false })
      .limit(10_000);

    if (error) {
      throwPnlError(error, 'Could not load P&L orders');
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
}

function emptyAggregate(): MoneyAggregate {
  return {
    revenue: 0n,
    cogs: 0n,
    grossProfit: 0n,
    orderCount: 0,
  };
}

function emptySkuAggregate(sku: string): SkuAggregate {
  return {
    ...emptyAggregate(),
    sku,
    qty: 0,
    orderIds: new Set<string>(),
  };
}

function addOrder(aggregate: MoneyAggregate, revenue: bigint, cogs: bigint) {
  aggregate.revenue += revenue;
  aggregate.cogs += cogs;
  aggregate.grossProfit += revenue - cogs;
  aggregate.orderCount += 1;
}

function serializeAggregate(aggregate: MoneyAggregate) {
  return {
    revenueVnd: aggregate.revenue.toString(),
    cogsVnd: aggregate.cogs.toString(),
    grossProfitVnd: aggregate.grossProfit.toString(),
    orderCount: aggregate.orderCount,
  };
}

function soldAt(order: OrderRow) {
  return order.done_at ?? order.shipped_at ?? order.created_at;
}

function orderCogs(order: OrderRow) {
  return (order.items ?? []).reduce((sum, item) => sum + itemCogs(item), 0n);
}

function itemCogs(item: OrderItemRow) {
  return toBigintVnd(item.cogs_unit_vnd ?? '0') * BigInt(item.qty);
}

function normalizeRange(query: PnlDateRangeQuery) {
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

function throwPnlError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: 'pnl_failed',
    message: error.message ?? message,
  });
}

function createSupabaseServiceClient() {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
