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
import type { CreateDraftOrderBody, OrderStatus } from './dto';

export const ORDERS_SUPABASE = Symbol('ORDERS_SUPABASE');

export type SupabaseLike = Pick<SupabaseClient, 'from' | 'rpc'>;
export type AuditWriter = {
  writeAudit(input: WriteAuditInput): Promise<unknown>;
};

type JsonObject = Record<string, unknown>;
type PaymentMethod = 'cod' | 'bank_transfer' | 'other';

type OrderRow = {
  id: string;
  org_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer_name: string | null;
  phone_e164: string | null;
  address_text: string | null;
  address_json: JsonObject;
  currency: 'VND';
  subtotal_vnd: number | string;
  total_vnd: number | string;
  idempotency_key: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItemRow[] | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  variant_id: string;
  title_snapshot: string;
  sku_snapshot: string;
  qty: number;
  unit_price_vnd: number | string;
  line_total_vnd: number | string;
};

type VariantRow = {
  id: string;
  org_id: string;
  product_id: string;
  sku: string;
  title: string;
  price_vnd: number | string;
  stock_qty: number;
};

type OrganizationSettingsRow = {
  id: string;
  settings_json: JsonObject;
};

type VariantSnapshot = {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  qty: number;
  unitPriceVnd: bigint;
  lineTotalVnd: bigint;
};

type SupabaseError = {
  code?: string;
  message?: string;
  hint?: string;
};

type IdempotencyRow = {
  key: string;
  method: string;
  path: string;
  status_code: number;
  response_json: JsonObject;
};

type OrderPayload = {
  order: {
    id: string;
    status: OrderStatus;
    [key: string]: unknown;
  };
  items: unknown[];
};

type LifecycleRpcName = 'confirm_order' | 'cancel_order' | 'ship_order';

const ORDER_SELECT =
  'id, org_id, conversation_id, contact_id, status, payment_method, customer_name, phone_e164, address_text, address_json, currency, subtotal_vnd, total_vnd, idempotency_key, confirmed_at, shipped_at, cancelled_at, done_at, created_at, updated_at';
const ITEM_SELECT =
  'id, product_id, variant_id, title_snapshot, sku_snapshot, qty, unit_price_vnd, line_total_vnd';
const ORDER_WITH_ITEMS_SELECT = `${ORDER_SELECT}, items:order_items(${ITEM_SELECT})`;
const VARIANT_SELECT =
  'id, org_id, product_id, sku, title, price_vnd, stock_qty';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_PENDING_STATUS = 102;

@Injectable()
export class OrdersService {
  private readonly supabase: SupabaseLike;
  private readonly audit: AuditWriter;

  constructor(
    @Optional()
    @Inject(ORDERS_SUPABASE)
    supabase: SupabaseLike | undefined,
    @Inject(AuditService)
    audit: AuditWriter,
  ) {
    this.supabase = supabase ?? createSupabaseServiceClient();
    this.audit = audit;
  }

  async listOrders(input: { orgId: string; status?: OrderStatus }) {
    let query = this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('org_id', input.orgId);

    if (input.status) {
      query = query.eq('status', input.status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throwOrdersError(error, 'Could not list orders');
    }

    return { orders: ((data ?? []) as OrderRow[]).map((row) => mapOrder(row)) };
  }

  async getOrder(input: { orgId: string; orderId: string }) {
    const order = await this.getOrderRow(input.orgId, input.orderId);
    return { order: mapOrder(order, { includeItems: true }) };
  }

  async createDraftOrder(input: {
    orgId: string;
    actorUserId: string;
    body: CreateDraftOrderBody;
    idempotencyKey?: string;
    path: string;
  }) {
    return this.withIdempotency(
      {
        orgId: input.orgId,
        key: input.idempotencyKey,
        method: 'POST',
        path: input.path,
        statusCode: 201,
      },
      async () => {
        const settings = await this.getOrgSettings(input.orgId);
        const items = await this.resolveOrderItems(input.orgId, input.body.items);

        await this.verifyOptionalOwner(
          'conversations',
          input.orgId,
          input.body.conversationId,
        );
        await this.verifyOptionalOwner(
          'contacts',
          input.orgId,
          input.body.contactId,
        );

        const draft = await this.createDraftOrderRpc(input, items);
        if (!autoConfirmEnabled(settings.settings_json)) {
          return draft;
        }

        return this.confirmOrder({
          orgId: input.orgId,
          orderId: draft.order.id,
          actorUserId: input.actorUserId,
          autoConfirm: true,
        });
      },
    );
  }

  async confirmOrder(input: {
    orgId: string;
    orderId: string;
    actorUserId: string;
    idempotencyKey?: string;
    path?: string;
    now?: Date;
    autoConfirm?: boolean;
  }) {
    return this.withIdempotency(
      {
        orgId: input.orgId,
        key: input.idempotencyKey,
        method: 'POST',
        path: input.path ?? `/v1/orders/${input.orderId}/confirm`,
        statusCode: 200,
      },
      async () => {
        const payload = await this.callLifecycleRpc('confirm_order', {
          p_org_id: input.orgId,
          p_order_id: input.orderId,
          p_confirmed_at: (input.now ?? new Date()).toISOString(),
        });

        await this.audit.writeAudit({
          orgId: input.orgId,
          actorUserId: input.actorUserId,
          actorType: input.autoConfirm ? 'system' : 'user',
          action: 'order.confirmed',
          entityType: 'order',
          entityId: input.orderId,
          meta: {
            autoConfirm: input.autoConfirm === true,
          },
        });

        return payload;
      },
    );
  }

  async cancelOrder(input: {
    orgId: string;
    orderId: string;
    actorUserId: string;
    now?: Date;
  }) {
    const payload = await this.callLifecycleRpc('cancel_order', {
      p_org_id: input.orgId,
      p_order_id: input.orderId,
      p_cancelled_at: (input.now ?? new Date()).toISOString(),
    });

    await this.audit.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'order.cancelled',
      entityType: 'order',
      entityId: input.orderId,
      meta: {},
    });

    return payload;
  }

  async shipOrder(input: {
    orgId: string;
    orderId: string;
    actorUserId: string;
    now?: Date;
  }) {
    const payload = await this.callLifecycleRpc('ship_order', {
      p_org_id: input.orgId,
      p_order_id: input.orderId,
      p_shipped_at: (input.now ?? new Date()).toISOString(),
    });

    await this.audit.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'order.shipped',
      entityType: 'order',
      entityId: input.orderId,
      meta: {},
    });

    return payload;
  }

  private async createDraftOrderRpc(
    input: {
      orgId: string;
      body: CreateDraftOrderBody;
      idempotencyKey?: string;
    },
    items: VariantSnapshot[],
  ) {
    const { data, error } = await this.supabase.rpc('create_draft_order', {
      p_org_id: input.orgId,
      p_conversation_id: input.body.conversationId ?? null,
      p_contact_id: input.body.contactId ?? null,
      p_payment_method: input.body.paymentMethod,
      p_customer_name: input.body.customerName ?? null,
      p_phone_e164: input.body.phoneE164 ?? null,
      p_address_text: input.body.addressText ?? null,
      p_address_json: input.body.addressJson,
      p_idempotency_key: input.idempotencyKey ?? null,
      p_items: items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId,
        title_snapshot: item.title,
        sku_snapshot: item.sku,
        qty: item.qty,
        unit_price_vnd: item.unitPriceVnd.toString(),
        line_total_vnd: item.lineTotalVnd.toString(),
      })),
    });

    if (error) {
      if (error.code === '23505' && input.idempotencyKey) {
        return this.getOrderByIdempotencyKey(input.orgId, input.idempotencyKey);
      }
      throwOrdersError(error, 'Could not create draft order');
    }

    return data as OrderPayload;
  }

  private async callLifecycleRpc(
    rpc: LifecycleRpcName,
    args: Record<string, unknown>,
  ) {
    const { data, error } = await this.supabase.rpc(rpc, args);

    if (error) {
      throwOrdersError(error, `Could not ${rpc.replace('_order', '')} order`);
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    return data as OrderPayload;
  }

  private async getOrderRow(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('id', orderId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not get order');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    return data as unknown as OrderRow;
  }

  private async getOrderByIdempotencyKey(orgId: string, key: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('org_id', orgId)
      .eq('idempotency_key', key)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not load idempotent order');
    }
    if (!data) {
      throw new ConflictException({
        code: 'idempotency_conflict',
        message: 'Idempotent request is already in progress',
      });
    }

    return {
      order: mapOrder(data as unknown as OrderRow, { includeItems: true }),
      items: ((data as unknown as OrderRow).items ?? []).map(mapOrderItem),
    };
  }

  private async getOrgSettings(orgId: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('id, settings_json')
      .eq('id', orgId)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not read organization settings');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'organization_not_found',
        message: 'Organization was not found',
      });
    }

    return data as OrganizationSettingsRow;
  }

  private async resolveOrderItems(
    orgId: string,
    items: CreateDraftOrderBody['items'],
  ) {
    const snapshots: VariantSnapshot[] = [];
    const verifiedProducts = new Set<string>();

    for (const item of items) {
      const variant = await this.getVariant(orgId, item.variantId);

      if (!verifiedProducts.has(variant.product_id)) {
        await this.verifyActiveProduct(orgId, variant.product_id);
        verifiedProducts.add(variant.product_id);
      }

      const unitPriceVnd = toBigintVnd(variant.price_vnd);
      snapshots.push({
        productId: variant.product_id,
        variantId: variant.id,
        sku: variant.sku,
        title: variant.title,
        qty: item.qty,
        unitPriceVnd,
        lineTotalVnd: unitPriceVnd * BigInt(item.qty),
      });
    }

    return snapshots;
  }

  private async getVariant(orgId: string, variantId: string) {
    const { data, error } = await this.supabase
      .from('product_variants')
      .select(VARIANT_SELECT)
      .eq('id', variantId)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not read product variant');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'product_variant_not_found',
        message: 'Product variant was not found',
      });
    }

    return data as VariantRow;
  }

  private async verifyActiveProduct(orgId: string, productId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not verify product');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'product_not_found',
        message: 'Product was not found',
      });
    }
  }

  private async verifyOptionalOwner(
    table: 'contacts' | 'conversations',
    orgId: string,
    id: string | null | undefined,
  ) {
    if (!id) {
      return;
    }

    const { data, error } = await this.supabase
      .from(table)
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, `Could not verify ${table} ownership`);
    }
    if (!data) {
      throw new NotFoundException({
        code: `${table.slice(0, -1)}_not_found`,
        message: `${table.slice(0, -1)} was not found`,
      });
    }
  }

  private async withIdempotency<T extends JsonObject>(
    input: {
      orgId: string;
      key?: string;
      method: string;
      path: string;
      statusCode: number;
    },
    handler: () => Promise<T>,
  ) {
    const key = input.key?.trim();
    if (!key) {
      return handler();
    }
    if (key.length > 128) {
      throw new BadRequestException({
        code: 'invalid_idempotency_key',
        message: 'Idempotency-Key must be at most 128 characters',
      });
    }

    const claimed = await this.claimIdempotencyKey(input.orgId, key, input);
    if (!claimed) {
      const existing = await this.getIdempotencyRow(input.orgId, key);
      if (!existing) {
        throw new ConflictException({
          code: 'idempotency_conflict',
          message: 'Idempotent request is already in progress',
        });
      }
      return this.resolveIdempotencyReplay(existing, input);
    }

    try {
      const response = await handler();
      await this.completeIdempotencyKey(
        input.orgId,
        key,
        input.statusCode,
        response,
      );
      return response;
    } catch (error) {
      await this.releaseIdempotencyKey(input.orgId, key);
      throw error;
    }
  }

  private resolveIdempotencyReplay<T extends JsonObject>(
    row: IdempotencyRow,
    input: { method: string; path: string },
  ): T {
    if (this.isPendingIdempotency(row)) {
      throw new ConflictException({
        code: 'idempotency_conflict',
        message: 'Idempotent request is already in progress',
      });
    }
    if (row.method !== input.method || row.path !== input.path) {
      throw new ConflictException({
        code: 'idempotency_key_reused',
        message: 'Idempotency-Key was already used for another request',
      });
    }
    return row.response_json as T;
  }

  private isPendingIdempotency(row: IdempotencyRow) {
    return row.status_code === IDEMPOTENCY_PENDING_STATUS;
  }

  private async claimIdempotencyKey(
    orgId: string,
    key: string,
    input: { method: string; path: string },
  ) {
    const { error } = await this.supabase.from('idempotency_keys').insert({
      org_id: orgId,
      key,
      method: input.method,
      path: input.path,
      status_code: IDEMPOTENCY_PENDING_STATUS,
      response_json: { _pending: true },
      expires_at: new Date(Date.now() + IDEMPOTENCY_TTL_MS).toISOString(),
    });

    if (error?.code === '23505') {
      return false;
    }
    if (error) {
      throwOrdersError(error, 'Could not claim idempotency key');
    }
    return true;
  }

  private async completeIdempotencyKey(
    orgId: string,
    key: string,
    statusCode: number,
    response: JsonObject,
  ) {
    const { error } = await this.supabase
      .from('idempotency_keys')
      .update({
        status_code: statusCode,
        response_json: response,
      })
      .eq('org_id', orgId)
      .eq('key', key);

    if (error) {
      throwOrdersError(error, 'Could not persist idempotency key');
    }
  }

  private async releaseIdempotencyKey(orgId: string, key: string) {
    await this.supabase
      .from('idempotency_keys')
      .delete()
      .eq('org_id', orgId)
      .eq('key', key);
  }

  private async getIdempotencyRow(orgId: string, key: string) {
    const { data, error } = await this.supabase
      .from('idempotency_keys')
      .select('key, method, path, status_code, response_json')
      .eq('org_id', orgId)
      .eq('key', key)
      .maybeSingle();

    if (error) {
      throwOrdersError(error, 'Could not read idempotency key');
    }

    return data as IdempotencyRow | null;
  }
}

function mapOrder(
  row: OrderRow,
  options: { includeItems?: boolean } = {},
) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    contactId: row.contact_id,
    status: row.status,
    paymentMethod: row.payment_method,
    customerName: row.customer_name,
    phoneE164: row.phone_e164,
    addressText: row.address_text,
    addressJson: row.address_json,
    currency: row.currency,
    subtotalVnd: row.subtotal_vnd.toString(),
    totalVnd: row.total_vnd.toString(),
    idempotencyKey: row.idempotency_key,
    confirmedAt: row.confirmed_at,
    shippedAt: row.shipped_at,
    cancelledAt: row.cancelled_at,
    doneAt: row.done_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(options.includeItems
      ? { items: (row.items ?? []).map(mapOrderItem) }
      : {}),
  };
}

function mapOrderItem(row: OrderItemRow) {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    titleSnapshot: row.title_snapshot,
    skuSnapshot: row.sku_snapshot,
    qty: row.qty,
    unitPriceVnd: row.unit_price_vnd.toString(),
    lineTotalVnd: row.line_total_vnd.toString(),
  };
}

function autoConfirmEnabled(settings: JsonObject) {
  return settings.auto_confirm === true || settings.autoConfirm === true;
}

function toBigintVnd(value: string | number) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new InternalServerErrorException({
        code: 'invalid_catalog_price',
        message: 'Catalog price must be a non-negative integer VND amount',
      });
    }
    return BigInt(value);
  }

  if (!/^\d+$/.test(value)) {
    throw new InternalServerErrorException({
      code: 'invalid_catalog_price',
      message: 'Catalog price must be a non-negative integer VND amount',
    });
  }
  return BigInt(value);
}

function throwOrdersError(error: SupabaseError, message: string): never {
  if (error.code === '23505') {
    throw new ConflictException({
      code: 'orders_conflict',
      message: error.message ?? message,
    });
  }
  if (error.code === '22023' || error.hint === 'invalid_order_items') {
    throw new BadRequestException({
      code: 'invalid_order',
      message: error.message ?? message,
    });
  }
  if (error.hint === 'insufficient_stock') {
    throw new BadRequestException({
      code: 'insufficient_stock',
      message: 'Insufficient stock to confirm order',
    });
  }
  if (error.hint === 'invalid_order_status') {
    throw new BadRequestException({
      code: 'invalid_order_status',
      message: error.message ?? message,
    });
  }

  throw new InternalServerErrorException({
    code: 'orders_failed',
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
