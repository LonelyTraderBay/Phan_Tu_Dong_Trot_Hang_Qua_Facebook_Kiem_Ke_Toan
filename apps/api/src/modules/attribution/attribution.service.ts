import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import type { AttributionSummaryQuery } from './dto';

export const ATTRIBUTION_SUPABASE = Symbol('ATTRIBUTION_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;

type SupabaseError = {
  code?: string;
  message?: string;
};

type OrderAttributionRow = {
  id: string;
  utm_source: string | null;
  total_vnd: string | number;
  created_at: string;
};

const ORDER_ATTRIBUTION_SELECT = 'id, utm_source, total_vnd, created_at';

@Injectable()
export class AttributionService {
  private readonly supabase: SupabaseLike;

  constructor(
    @Optional()
    @Inject(ATTRIBUTION_SUPABASE)
    supabase?: SupabaseLike,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
  }

  async summary(orgId: string, query: AttributionSummaryQuery) {
    const rows = await this.loadOrders(orgId, query);
    const bySource = new Map<string, { count: number; revenue: bigint }>();
    let totalOrders = 0;
    let totalRevenue = 0n;

    for (const row of rows) {
      const key = sourceKey(row.utm_source);
      const bucket = bySource.get(key) ?? { count: 0, revenue: 0n };
      const revenue = toBigintVnd(row.total_vnd);

      bucket.count += 1;
      bucket.revenue += revenue;
      bySource.set(key, bucket);
      totalOrders += 1;
      totalRevenue += revenue;
    }

    return {
      totalOrders,
      totalRevenueVnd: totalRevenue.toString(),
      sources: [...bySource.entries()]
        .sort(([leftKey, left], [rightKey, right]) => {
          if (left.revenue === right.revenue) {
            return leftKey.localeCompare(rightKey);
          }
          return left.revenue > right.revenue ? -1 : 1;
        })
        .map(([key, bucket]) => ({
          utmSource: key === 'unknown' ? null : key,
          label: key === 'unknown' ? 'Không rõ nguồn' : key,
          orderCount: bucket.count,
          revenueVnd: bucket.revenue.toString(),
        })),
    };
  }

  private async loadOrders(orgId: string, query: AttributionSummaryQuery) {
    let builder = this.supabase
      .from('orders')
      .select(ORDER_ATTRIBUTION_SELECT)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10_000);

    if (query.from) {
      builder = builder.gte('created_at', `${query.from}T00:00:00.000Z`);
    }
    if (query.to) {
      builder = builder.lte('created_at', `${query.to}T23:59:59.999Z`);
    }

    const { data, error } = await builder;
    if (error) {
      throwAttributionError(error, 'Could not summarize attribution');
    }

    return (data ?? []) as OrderAttributionRow[];
  }
}

function sourceKey(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || 'unknown';
}

function toBigintVnd(value: string | number) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throwAttributionError(
        {},
        'Order total must be a non-negative integer VND amount',
      );
    }
    return BigInt(value);
  }

  if (!/^\d+$/.test(value)) {
    throwAttributionError(
      {},
      'Order total must be a non-negative integer VND amount',
    );
  }
  return BigInt(value);
}

function throwAttributionError(error: SupabaseError, message: string): never {
  throw new InternalServerErrorException({
    code: 'attribution_failed',
    message,
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
