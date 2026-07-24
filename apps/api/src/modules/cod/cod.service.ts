import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import { AuditService, type WriteAuditInput } from '../audit/audit.service';
import type {
  ReconcileCodBatchBody,
  RecordCodCollectionBody,
} from './dto';

export const COD_SUPABASE = Symbol('COD_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;
export type AuditWriter = {
  writeAudit(input: WriteAuditInput): Promise<unknown>;
};

type PaymentMethod = 'cod' | 'bank_transfer' | 'other';
type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'done' | 'cancelled' | 'returned';
type CodExpectationStatus = 'open' | 'matched' | 'discrepancy' | 'written_off';
type CodDiscrepancyStatus = 'open' | 'resolved';
type CodCollectionSource = 'manual' | 'carrier_file' | 'carrier_api';

type OrderRow = {
  id: string;
  org_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer_name: string | null;
  phone_e164: string | null;
  total_vnd: string | number;
  shipped_at: string | null;
  created_at: string;
};

type OrderSnapshot = {
  id?: unknown;
  status?: unknown;
  paymentMethod?: unknown;
  totalVnd?: unknown;
};

type CodExpectationRow = {
  id: string;
  org_id: string;
  order_id: string;
  expected_vnd: string | number;
  status: CodExpectationStatus;
  created_at: string;
};

type CodCollectionRow = {
  id: string;
  org_id: string;
  order_id: string;
  amount_vnd: string | number;
  collected_at: string;
  source: CodCollectionSource;
  note: string | null;
  created_at: string;
};

type CodDiscrepancyRow = {
  id: string;
  org_id: string;
  order_id: string;
  expected_vnd: string | number;
  collected_vnd: string | number;
  delta_vnd: string | number;
  status: CodDiscrepancyStatus;
  note: string | null;
  created_at: string;
  resolved_at: string | null;
};

type SupabaseError = {
  code?: string;
  message?: string;
  hint?: string;
};

const EXPECTATION_SELECT =
  'id, org_id, order_id, expected_vnd, status, created_at';
const COLLECTION_SELECT =
  'id, org_id, order_id, amount_vnd, collected_at, source, note, created_at';
const DISCREPANCY_SELECT =
  'id, org_id, order_id, expected_vnd, collected_vnd, delta_vnd, status, note, created_at, resolved_at';
const ORDER_SELECT =
  'id, org_id, status, payment_method, customer_name, phone_e164, total_vnd, shipped_at, created_at';

@Injectable()
export class CodService {
  private readonly supabase: SupabaseLike;
  private readonly audit?: AuditWriter;

  constructor(
    @Optional()
    @Inject(COD_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(AuditService)
    audit?: AuditWriter,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.audit = audit;
  }

  async ensureExpectationForOrder(input: {
    orgId: string;
    orderId: string;
    actorUserId?: string;
    order?: OrderSnapshot;
  }) {
    const order = await this.resolveOrderSnapshot(input);
    if (order.paymentMethod !== 'cod' || order.status !== 'shipped') {
      return null;
    }

    // Plan F 2C uses orders.total_vnd as the COD expected amount. Shipping fee
    // is tracked separately on shipments/orders and is not added here.
    const expectedVnd = toBigintVnd(order.totalVnd);
    const { data, error } = await this.supabase
      .from('cod_expectations')
      .upsert(
        {
          org_id: input.orgId,
          order_id: input.orderId,
          expected_vnd: expectedVnd.toString(),
        },
        { onConflict: 'org_id,order_id' },
      )
      .select(EXPECTATION_SELECT)
      .single();

    if (error) {
      throwCodError(error, 'Could not create COD expectation');
    }

    const expectation = mapExpectation(data as CodExpectationRow);
    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: input.actorUserId ? 'user' : 'system',
      action: 'cod.expectation_upserted',
      entityType: 'order',
      entityId: input.orderId,
      meta: {
        expectedVnd: expectation.expectedVnd,
        source: 'orders.total_vnd',
      },
    });

    return { expectation };
  }

  async handleReturnedOrder(input: {
    orgId: string;
    orderId: string;
    actorUserId?: string;
    order?: OrderSnapshot;
    reason?: string | null;
  }) {
    const order = await this.resolveOrderSnapshot(input);
    if (order.paymentMethod !== 'cod' || order.status !== 'returned') {
      return null;
    }

    const expectation = await this.maybeExpectation(input.orgId, input.orderId);
    if (!expectation || expectation.status === 'matched') {
      return null;
    }

    if (expectation.status === 'open') {
      const updated = await this.updateExpectationStatus(
        input.orgId,
        input.orderId,
        'written_off',
      );
      await this.audit?.writeAudit({
        orgId: input.orgId,
        actorUserId: input.actorUserId,
        actorType: input.actorUserId ? 'user' : 'system',
        action: 'cod.expectation_written_off',
        entityType: 'order',
        entityId: input.orderId,
        meta: {
          reason: normalizeNote(input.reason ?? undefined),
          source: 'order_returned',
        },
      });
      return { expectation: updated };
    }

    if (expectation.status === 'discrepancy') {
      await this.appendReturnDiscrepancyNote(
        input.orgId,
        input.orderId,
        returnDiscrepancyNote(input.reason ?? undefined),
      );
    }

    return { expectation: mapExpectation(expectation) };
  }

  async recordCollection(input: {
    orgId: string;
    actorUserId: string;
    body: RecordCodCollectionBody;
  }) {
    await this.requireExpectation(input.orgId, input.body.orderId);

    const amountVnd = toBigintVnd(input.body.amountVnd);
    const note = normalizeNote(input.body.note);
    const { data, error } = await this.supabase
      .from('cod_collections')
      .insert({
        org_id: input.orgId,
        order_id: input.body.orderId,
        amount_vnd: amountVnd.toString(),
        collected_at: input.body.collectedAt ?? new Date().toISOString(),
        source: input.body.source,
        note,
      })
      .select(COLLECTION_SELECT)
      .single();

    if (error) {
      throwCodError(error, 'Could not record COD collection');
    }

    const collection = mapCollection(data as CodCollectionRow);
    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'cod.collection_recorded',
      entityType: 'order',
      entityId: input.body.orderId,
      meta: {
        amountVnd: collection.amountVnd,
        source: collection.source,
      },
    });

    return { collection };
  }

  async reconcileOrder(input: {
    orgId: string;
    actorUserId: string;
    orderId: string;
    note?: string;
  }) {
    const expectation = await this.requireExpectation(input.orgId, input.orderId);
    const expected = toBigintVnd(expectation.expected_vnd);
    const collected = await this.sumCollections(input.orgId, input.orderId);
    const delta = collected - expected;

    if (delta === 0n) {
      const updated = await this.updateExpectationStatus(
        input.orgId,
        input.orderId,
        'matched',
      );
      await this.resolveDiscrepancy(input.orgId, input.orderId);
      await this.writeReconcileAudit(input, expected, collected, delta, 'matched');
      return {
        expectation: mapExpectationForReconcile(updated, collected, delta),
        discrepancy: null,
        summary: mapReconcileSummary(expected, collected, delta),
      };
    }

    const updated = await this.updateExpectationStatus(
      input.orgId,
      input.orderId,
      'discrepancy',
    );
    const discrepancy = await this.upsertDiscrepancy({
      orgId: input.orgId,
      orderId: input.orderId,
      expected,
      collected,
      delta,
      note: normalizeNote(input.note),
    });
    await this.writeReconcileAudit(
      input,
      expected,
      collected,
      delta,
      'discrepancy',
    );

    return {
      expectation: mapExpectationForReconcile(updated, collected, delta),
      discrepancy,
      summary: mapReconcileSummary(expected, collected, delta),
    };
  }

  async reconcileBatch(input: {
    orgId: string;
    actorUserId: string;
    body: ReconcileCodBatchBody;
  }) {
    const orderIds =
      input.body.orderIds && input.body.orderIds.length > 0
        ? input.body.orderIds
        : await this.listReconcilableOrderIds(input.orgId);
    const results = [];

    for (const orderId of orderIds) {
      results.push(
        await this.reconcileOrder({
          orgId: input.orgId,
          actorUserId: input.actorUserId,
          orderId,
        }),
      );
    }

    return {
      reconciled: results.length,
      results,
    };
  }

  async getReport(orgId: string) {
    const { data: expectationRows, error: expectationError } = await this.supabase
      .from('cod_expectations')
      .select(EXPECTATION_SELECT)
      .eq('org_id', orgId)
      .in('status', ['open', 'discrepancy'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (expectationError) {
      throwCodError(expectationError, 'Could not load COD expectations');
    }

    const expectations = (expectationRows ?? []) as CodExpectationRow[];
    const orderIds = expectations.map((row) => row.order_id);
    const ordersById = await this.loadOrdersById(orgId, orderIds);
    const collectedByOrderId = await this.loadCollectionTotals(orgId, orderIds);
    const discrepancies = await this.listOpenDiscrepancies(orgId);
    const expectedTotal = expectations.reduce(
      (sum, row) => sum + toBigintVnd(row.expected_vnd),
      0n,
    );
    const collectedTotal = expectations.reduce(
      (sum, row) => sum + (collectedByOrderId.get(row.order_id) ?? 0n),
      0n,
    );

    return {
      summary: {
        openCount: expectations.filter((row) => row.status === 'open').length,
        discrepancyCount: discrepancies.length,
        expectedVnd: expectedTotal.toString(),
        collectedVnd: collectedTotal.toString(),
        deltaVnd: (collectedTotal - expectedTotal).toString(),
      },
      expectations: expectations.map((row) =>
        mapExpectationForReport(
          row,
          ordersById.get(row.order_id) ?? null,
          collectedByOrderId.get(row.order_id) ?? 0n,
        ),
      ),
      discrepancies: discrepancies.map(mapDiscrepancy),
    };
  }

  private async resolveOrderSnapshot(input: {
    orgId: string;
    orderId: string;
    order?: OrderSnapshot;
  }) {
    if (
      typeof input.order?.paymentMethod === 'string' &&
      typeof input.order?.status === 'string' &&
      (typeof input.order?.totalVnd === 'string' ||
        typeof input.order?.totalVnd === 'number')
    ) {
      return {
        paymentMethod: input.order.paymentMethod,
        status: input.order.status,
        totalVnd: input.order.totalVnd,
      };
    }

    const { data, error } = await this.supabase
      .from('orders')
      .select('id, org_id, status, payment_method, total_vnd')
      .eq('org_id', input.orgId)
      .eq('id', input.orderId)
      .maybeSingle();

    if (error) {
      throwCodError(error, 'Could not read order for COD expectation');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    const row = data as Pick<
      OrderRow,
      'status' | 'payment_method' | 'total_vnd'
    >;
    return {
      paymentMethod: row.payment_method,
      status: row.status,
      totalVnd: row.total_vnd,
    };
  }

  private async requireExpectation(orgId: string, orderId: string) {
    const data = await this.maybeExpectation(orgId, orderId);
    if (!data) {
      throw new NotFoundException({
        code: 'cod_expectation_not_found',
        message: 'COD expectation was not found for this order',
      });
    }

    return data;
  }

  private async maybeExpectation(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('cod_expectations')
      .select(EXPECTATION_SELECT)
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      throwCodError(error, 'Could not read COD expectation');
    }

    return (data as CodExpectationRow | null) ?? null;
  }

  private async sumCollections(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('cod_collections')
      .select('amount_vnd')
      .eq('org_id', orgId)
      .eq('order_id', orderId);

    if (error) {
      throwCodError(error, 'Could not read COD collections');
    }

    return ((data ?? []) as Array<{ amount_vnd: string | number }>).reduce(
      (sum, row) => sum + toBigintVnd(row.amount_vnd),
      0n,
    );
  }

  private async updateExpectationStatus(
    orgId: string,
    orderId: string,
    status: CodExpectationStatus,
  ) {
    const { data, error } = await this.supabase
      .from('cod_expectations')
      .update({ status })
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .select(EXPECTATION_SELECT)
      .single();

    if (error) {
      throwCodError(error, 'Could not update COD expectation');
    }

    return mapExpectation(data as CodExpectationRow);
  }

  private async resolveDiscrepancy(orgId: string, orderId: string) {
    const { error } = await this.supabase
      .from('cod_discrepancies')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .eq('status', 'open');

    if (error) {
      throwCodError(error, 'Could not resolve COD discrepancy');
    }
  }

  private async appendReturnDiscrepancyNote(
    orgId: string,
    orderId: string,
    note: string,
  ) {
    const { data, error } = await this.supabase
      .from('cod_discrepancies')
      .select(DISCREPANCY_SELECT)
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .eq('status', 'open')
      .maybeSingle();

    if (error) {
      throwCodError(error, 'Could not read COD discrepancy');
    }
    if (!data) {
      return null;
    }

    const row = data as CodDiscrepancyRow;
    const existing = row.note ?? '';
    if (existing.includes(note)) {
      return mapDiscrepancy(row);
    }

    const { data: updated, error: updateError } = await this.supabase
      .from('cod_discrepancies')
      .update({
        note: [existing, note].filter(Boolean).join('\n'),
      })
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .eq('status', 'open')
      .select(DISCREPANCY_SELECT)
      .single();

    if (updateError) {
      throwCodError(updateError, 'Could not update COD discrepancy');
    }

    return mapDiscrepancy(updated as CodDiscrepancyRow);
  }

  private async upsertDiscrepancy(input: {
    orgId: string;
    orderId: string;
    expected: bigint;
    collected: bigint;
    delta: bigint;
    note: string | null;
  }) {
    const { data, error } = await this.supabase
      .from('cod_discrepancies')
      .upsert(
        {
          org_id: input.orgId,
          order_id: input.orderId,
          expected_vnd: input.expected.toString(),
          collected_vnd: input.collected.toString(),
          delta_vnd: input.delta.toString(),
          status: 'open',
          note: input.note,
          resolved_at: null,
        },
        { onConflict: 'org_id,order_id' },
      )
      .select(DISCREPANCY_SELECT)
      .single();

    if (error) {
      throwCodError(error, 'Could not upsert COD discrepancy');
    }

    return mapDiscrepancy(data as CodDiscrepancyRow);
  }

  private async listReconcilableOrderIds(orgId: string) {
    const { data, error } = await this.supabase
      .from('cod_expectations')
      .select('order_id')
      .eq('org_id', orgId)
      .in('status', ['open', 'discrepancy'])
      .limit(100);

    if (error) {
      throwCodError(error, 'Could not list COD expectations');
    }

    return ((data ?? []) as Array<{ order_id: string }>).map(
      (row) => row.order_id,
    );
  }

  private async loadOrdersById(orgId: string, orderIds: string[]) {
    const ordersById = new Map<string, ReturnType<typeof mapOrderSummary>>();
    if (orderIds.length === 0) {
      return ordersById;
    }

    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('org_id', orgId)
      .in('id', orderIds);

    if (error) {
      throwCodError(error, 'Could not load COD order summaries');
    }

    for (const row of (data ?? []) as OrderRow[]) {
      ordersById.set(row.id, mapOrderSummary(row));
    }
    return ordersById;
  }

  private async loadCollectionTotals(orgId: string, orderIds: string[]) {
    const totals = new Map<string, bigint>();
    if (orderIds.length === 0) {
      return totals;
    }

    const { data, error } = await this.supabase
      .from('cod_collections')
      .select('order_id, amount_vnd')
      .eq('org_id', orgId)
      .in('order_id', orderIds);

    if (error) {
      throwCodError(error, 'Could not load COD collection totals');
    }

    for (const row of (data ?? []) as Array<{
      order_id: string;
      amount_vnd: string | number;
    }>) {
      totals.set(
        row.order_id,
        (totals.get(row.order_id) ?? 0n) + toBigintVnd(row.amount_vnd),
      );
    }
    return totals;
  }

  private async listOpenDiscrepancies(orgId: string) {
    const { data, error } = await this.supabase
      .from('cod_discrepancies')
      .select(DISCREPANCY_SELECT)
      .eq('org_id', orgId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throwCodError(error, 'Could not list COD discrepancies');
    }

    return (data ?? []) as CodDiscrepancyRow[];
  }

  private async writeReconcileAudit(
    input: {
      orgId: string;
      actorUserId: string;
      orderId: string;
    },
    expected: bigint,
    collected: bigint,
    delta: bigint,
    result: 'matched' | 'discrepancy',
  ) {
    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'cod.reconciled',
      entityType: 'order',
      entityId: input.orderId,
      meta: {
        expectedVnd: expected.toString(),
        collectedVnd: collected.toString(),
        deltaVnd: delta.toString(),
        result,
      },
    });
  }
}

function mapExpectation(row: CodExpectationRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    orderId: row.order_id,
    expectedVnd: row.expected_vnd.toString(),
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCollection(row: CodCollectionRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    orderId: row.order_id,
    amountVnd: row.amount_vnd.toString(),
    collectedAt: row.collected_at,
    source: row.source,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapDiscrepancy(row: CodDiscrepancyRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    orderId: row.order_id,
    expectedVnd: row.expected_vnd.toString(),
    collectedVnd: row.collected_vnd.toString(),
    deltaVnd: row.delta_vnd.toString(),
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function mapOrderSummary(row: OrderRow) {
  return {
    id: row.id,
    status: row.status,
    paymentMethod: row.payment_method,
    customerName: row.customer_name,
    phoneE164: row.phone_e164,
    totalVnd: row.total_vnd.toString(),
    shippedAt: row.shipped_at,
    createdAt: row.created_at,
  };
}

function mapExpectationForReport(
  row: CodExpectationRow,
  order: ReturnType<typeof mapOrderSummary> | null,
  collected: bigint,
) {
  const expected = toBigintVnd(row.expected_vnd);
  return {
    ...mapExpectation(row),
    collectedVnd: collected.toString(),
    deltaVnd: (collected - expected).toString(),
    order,
  };
}

function mapReconcileSummary(expected: bigint, collected: bigint, delta: bigint) {
  return {
    expectedVnd: expected.toString(),
    collectedVnd: collected.toString(),
    deltaVnd: delta.toString(),
  };
}

function mapExpectationForReconcile(
  expectation: ReturnType<typeof mapExpectation>,
  collected: bigint,
  delta: bigint,
) {
  return {
    ...expectation,
    collectedVnd: collected.toString(),
    deltaVnd: delta.toString(),
    order: null,
  };
}

function normalizeNote(note: string | undefined) {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

function returnDiscrepancyNote(reason: string | undefined) {
  const normalized = normalizeNote(reason);
  return normalized
    ? `Order returned; COD discrepancy left open: ${normalized}`
    : 'Order returned; COD discrepancy left open';
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

function throwCodError(error: SupabaseError, message: string): never {
  if (error.code === '23505') {
    throw new ConflictException({
      code: 'cod_conflict',
      message: error.message ?? message,
    });
  }

  throw new InternalServerErrorException({
    code: 'cod_failed',
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
