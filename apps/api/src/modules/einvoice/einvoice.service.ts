import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { loadEnv } from '../../config/env';
import type {
  EinvoiceJobStatus,
  EinvoiceProviderCode,
  IssueEinvoiceBody,
} from './dto';
import {
  StubEinvoiceProvider,
  type EinvoiceProvider,
  type EinvoiceIssueResult,
} from './stub-einvoice.provider';

export const EINVOICE_SUPABASE = Symbol('EINVOICE_SUPABASE');
export const EINVOICE_PROVIDER = Symbol('EINVOICE_PROVIDER');

export type SupabaseLike = Pick<SupabaseClient, 'from'>;

type JsonObject = Record<string, unknown>;

type OrderRow = {
  id: string;
  org_id: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  phone_e164: string | null;
  total_vnd: string | number;
  done_at: string | null;
  created_at: string;
};

type EinvoiceJobRow = {
  id: string;
  org_id: string;
  order_id: string;
  provider: EinvoiceProviderCode;
  status: EinvoiceJobStatus;
  attempts: number;
  last_error: string | null;
  payload_json: JsonObject;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
};

type SupabaseError = {
  code?: string;
  message?: string;
};

const ORDER_SELECT =
  'id, org_id, status, payment_method, customer_name, phone_e164, total_vnd, done_at, created_at';
const JOB_SELECT =
  'id, org_id, order_id, provider, status, attempts, last_error, payload_json, created_at, updated_at, sent_at';

@Injectable()
export class EinvoiceService {
  private readonly supabase: SupabaseLike;
  private readonly provider: EinvoiceProvider;

  constructor(
    @Optional()
    @Inject(EINVOICE_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(EINVOICE_PROVIDER)
    provider?: EinvoiceProvider,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.provider = provider ?? new StubEinvoiceProvider();
  }

  async listJobs(orgId: string, status?: EinvoiceJobStatus) {
    let query = this.supabase
      .from('einvoice_jobs')
      .select(JOB_SELECT)
      .eq('org_id', orgId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      throwEinvoiceError(error, 'Could not list e-invoice jobs');
    }

    return { jobs: ((data ?? []) as EinvoiceJobRow[]).map(mapJob) };
  }

  async issue(orgId: string, body: IssueEinvoiceBody) {
    const order = await this.requireOrder(orgId, body.orderId);
    if (order.status !== 'done') {
      throw new BadRequestException({
        code: 'order_not_done',
        message: 'E-invoice can only be issued for done orders',
      });
    }

    const payload = buildPayload(order);
    const { data, error } = await this.supabase
      .from('einvoice_jobs')
      .insert({
        org_id: orgId,
        order_id: body.orderId,
        provider: body.provider,
        status: 'pending',
        attempts: 0,
        payload_json: payload,
      })
      .select(JOB_SELECT)
      .single();

    if (error) {
      throwEinvoiceError(error, 'Could not create e-invoice job');
    }

    const job = data as EinvoiceJobRow;
    return { job: mapJob(await this.runJob(job, payload)) };
  }

  private async requireOrder(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('org_id', orgId)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throwEinvoiceError(error, 'Could not read order for e-invoice');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    return data as OrderRow;
  }

  private async runJob(job: EinvoiceJobRow, payload: JsonObject) {
    const attempts = job.attempts + 1;
    try {
      const result = await this.provider.issue({
        orgId: job.org_id,
        orderId: job.order_id,
        payload,
      });
      return await this.updateJob(job, {
        status: 'sent',
        attempts,
        last_error: null,
        sent_at: result.sentAt,
        payload_json: {
          ...payload,
          result: serializeProviderResult(result),
        },
      });
    } catch (err) {
      const lastError =
        err instanceof Error ? err.message : 'E-invoice provider failed';
      return await this.updateJob(job, {
        status: attempts >= 3 ? 'dead' : 'failed',
        attempts,
        last_error: lastError,
      });
    }
  }

  private async updateJob(
    job: EinvoiceJobRow,
    values: Partial<{
      status: EinvoiceJobStatus;
      attempts: number;
      last_error: string | null;
      sent_at: string | null;
      payload_json: JsonObject;
    }>,
  ) {
    const { data, error } = await this.supabase
      .from('einvoice_jobs')
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', job.org_id)
      .eq('id', job.id)
      .select(JOB_SELECT)
      .single();

    if (error) {
      throwEinvoiceError(error, 'Could not update e-invoice job');
    }

    return data as EinvoiceJobRow;
  }
}

function buildPayload(order: OrderRow): JsonObject {
  return {
    orderId: order.id,
    status: order.status,
    paymentMethod: order.payment_method,
    customerName: order.customer_name,
    phoneE164: order.phone_e164,
    totalVnd: String(order.total_vnd),
    doneAt: order.done_at,
    createdAt: order.created_at,
  };
}

function serializeProviderResult(result: EinvoiceIssueResult): JsonObject {
  return {
    provider: result.provider,
    externalId: result.externalId,
    sentAt: result.sentAt,
  };
}

function mapJob(row: EinvoiceJobRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    orderId: row.order_id,
    provider: row.provider,
    status: row.status,
    attempts: row.attempts,
    lastError: row.last_error,
    payload: row.payload_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  };
}

function throwEinvoiceError(error: SupabaseError, message: string): never {
  if (error.code === '23503') {
    throw new BadRequestException({
      code: 'invalid_einvoice_reference',
      message: error.message ?? 'Order was not found',
    });
  }

  throw new InternalServerErrorException({
    code: 'einvoice_failed',
    message: error.message ?? message,
  });
}

function createSupabaseServiceClient(): SupabaseLike {
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
