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

import {
  decryptToken,
  encryptToken,
} from '../../common/crypto/token-crypto';
import { loadEnv, type Env } from '../../config/env';
import { enqueueOutbox } from '../../jobs/outbox.publisher';
import { AuditService, type WriteAuditInput } from '../audit/audit.service';
import { CodService } from '../cod/cod.service';
import type {
  CreateShipmentBody,
  ShippingProviderBody,
  UpsertCarrierConnectionBody,
} from './dto';
import { GhnShippingProvider, type FetchLike } from './ghn-shipping.provider';
import { ManualShippingProvider } from './manual-shipping.provider';
import type {
  ShippingConnection,
  ShippingOrder,
  ShippingProvider,
  ShippingProviderCode,
} from './shipping-provider';

export const SHIPPING_SUPABASE = Symbol('SHIPPING_SUPABASE');
export const SHIPPING_ENV = Symbol('SHIPPING_ENV');
export const SHIPPING_FETCH = Symbol('SHIPPING_FETCH');

export type SupabaseLike = Pick<SupabaseClient, 'from' | 'rpc'>;
export type AuditWriter = {
  writeAudit(input: WriteAuditInput): Promise<unknown>;
};
export type ShippingEnv = Pick<
  Env,
  'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY' | 'TOKEN_ENCRYPTION_KEY'
>;

type JsonObject = Record<string, unknown>;

type CarrierConnectionRow = {
  id: string;
  org_id: string;
  provider: ShippingProviderCode;
  display_name: string;
  credentials_enc: string | null;
  config_json: JsonObject;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type OrderStatus = 'draft' | 'confirmed' | 'shipped' | 'done' | 'cancelled' | 'returned';
type PaymentMethod = 'cod' | 'bank_transfer' | 'other';

type OrderRow = {
  id: string;
  org_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  customer_name: string | null;
  phone_e164: string | null;
  address_text: string | null;
  address_json: JsonObject;
  total_vnd: string | number;
  items?: OrderItemRow[] | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  variant_id: string;
  title_snapshot: string;
  sku_snapshot: string;
  qty: number;
  unit_price_vnd: string | number;
  line_total_vnd: string | number;
};

type ShipmentRow = {
  id: string;
  org_id: string;
  order_id: string;
  carrier_connection_id: string | null;
  provider: ShippingProviderCode;
  external_shipment_id: string | null;
  tracking_code: string | null;
  status: string;
  fee_vnd: string | number;
  label_url: string | null;
  raw_json: JsonObject;
  created_at: string;
  updated_at: string;
};

type SupabaseError = {
  code?: string;
  message?: string;
  hint?: string;
};

type OrderPayload = {
  order: Record<string, unknown>;
  items: unknown[];
};

const CONNECTION_SELECT =
  'id, org_id, provider, display_name, credentials_enc, config_json, enabled, created_at, updated_at';
const ORDER_ITEM_SELECT =
  'id, product_id, variant_id, title_snapshot, sku_snapshot, qty, unit_price_vnd, line_total_vnd';
const ORDER_WITH_ITEMS_SELECT =
  `id, org_id, status, payment_method, customer_name, phone_e164, address_text, address_json, total_vnd, items:order_items(${ORDER_ITEM_SELECT})`;
const SHIPMENT_SELECT =
  'id, org_id, order_id, carrier_connection_id, provider, external_shipment_id, tracking_code, status, fee_vnd, label_url, raw_json, created_at, updated_at';

/**
 * Shipment statuses that mean "a parcel for this order is live at the carrier".
 * Full vocabulary (shipments_status_check): `created | picking | delivering |
 * delivered | cancelled | failed`. `cancelled` and `failed` are excluded so a
 * cancelled or failed booking can be re-attempted; everything else blocks a
 * second booking, because that would mint a second real waybill and a second
 * carrier fee.
 */
const LIVE_SHIPMENT_STATUSES = [
  'created',
  'picking',
  'delivering',
  'delivered',
];

@Injectable()
export class ShippingService {
  private readonly supabase: SupabaseLike;
  private readonly env: ShippingEnv;
  private readonly audit?: AuditWriter;

  constructor(
    @Optional()
    @Inject(SHIPPING_SUPABASE)
    supabase?: SupabaseLike,
    @Optional()
    @Inject(SHIPPING_ENV)
    env?: ShippingEnv,
    @Optional()
    @Inject(AuditService)
    audit?: AuditWriter,
    @Optional()
    @Inject(SHIPPING_FETCH)
    private readonly fetchImpl?: FetchLike,
    @Optional()
    @Inject(CodService)
    private readonly cod?: Pick<CodService, 'ensureExpectationForOrder'>,
  ) {
    this.env = env ?? loadEnv();
    this.supabase = supabase ?? createSupabaseServiceClient(this.env);
    this.audit = audit;
  }

  async listConnections(orgId: string) {
    const { data, error } = await this.supabase
      .from('carrier_connections')
      .select(CONNECTION_SELECT)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throwShippingError(error, 'Could not list carrier connections');
    }

    return {
      connections: ((data ?? []) as CarrierConnectionRow[]).map(mapConnection),
    };
  }

  async upsertConnection(input: {
    orgId: string;
    actorUserId: string;
    body: UpsertCarrierConnectionBody;
  }) {
    const now = new Date().toISOString();
    const existing = await this.findConnectionByProvider(
      input.orgId,
      input.body.provider,
    );
    const credentialsEnc =
      input.body.credentials === undefined
        ? undefined
        : encryptToken(
            JSON.stringify(input.body.credentials),
            this.env.TOKEN_ENCRYPTION_KEY,
          );

    const displayName =
      input.body.displayName ?? defaultDisplayName(input.body.provider);
    const values = {
      display_name: displayName,
      config_json: input.body.config,
      enabled: input.body.enabled,
      updated_at: now,
      ...(credentialsEnc === undefined
        ? {}
        : { credentials_enc: credentialsEnc }),
    };

    const { data, error } = existing
      ? await this.supabase
          .from('carrier_connections')
          .update(values)
          .eq('id', existing.id)
          .eq('org_id', input.orgId)
          .select(CONNECTION_SELECT)
          .single()
      : await this.supabase
          .from('carrier_connections')
          .insert({
            org_id: input.orgId,
            provider: input.body.provider,
            ...values,
          })
          .select(CONNECTION_SELECT)
          .single();

    if (error) {
      throwShippingError(error, 'Could not save carrier connection');
    }

    const connection = mapConnection(data as CarrierConnectionRow);
    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'carrier_connection.upserted',
      entityType: 'carrier_connection',
      entityId: connection.id,
      meta: {
        provider: connection.provider,
        enabled: connection.enabled,
      },
    });

    return { connection };
  }

  async createShipment(input: {
    orgId: string;
    actorUserId: string;
    body: CreateShipmentBody;
  }) {
    const order = await this.getShipmentOrder(input.orgId, input.body.orderId);
    if (order.status !== 'confirmed' && order.status !== 'shipped') {
      throw new BadRequestException({
        code: 'invalid_order_status',
        message: 'Order must be confirmed or already shipped before shipment creation',
      });
    }

    // `provider.createShipment(...)` books a REAL waybill and incurs a REAL
    // carrier fee. It used to run first, with the local shipment row, the fee
    // update and the ship transition happening only afterwards — so if any of
    // those threw, or the request timed out, the client retried and the carrier
    // was called a second time: two live waybills, two fees charged, and
    // `orders.shipping_fee_vnd` reflecting only the last one. Refuse the second
    // booking before the provider is ever reached.
    const live = await this.findLiveShipment(input.orgId, order.id);
    if (live) {
      throw new ConflictException({
        code: 'shipment_already_exists',
        message:
          'Order already has an active shipment. Cancel it before booking another.',
        shipmentId: live.id,
        trackingCode: live.tracking_code,
        status: live.status,
      });
    }

    const connection = await this.resolveConnection(
      input.orgId,
      input.body.provider,
      input.body.carrierConnectionId,
    );
    const provider = this.providerFor(connection.provider);
    const providerResult = await provider.createShipment({
      orgId: input.orgId,
      order: mapShippingOrder(order),
      connection,
    });

    const isMock = providerResult.isMock === true;

    const shipment = await this.insertShipment({
      orgId: input.orgId,
      orderId: order.id,
      carrierConnectionId: connection.id,
      provider: connection.provider,
      externalShipmentId: providerResult.externalShipmentId,
      trackingCode: providerResult.trackingCode,
      status: providerResult.status,
      feeVnd: providerResult.feeVnd,
      labelUrl: providerResult.labelUrl,
      raw: providerResult.raw,
    });

    // A mock shipment is a traceability record only. Its fee is unknown (not
    // zero) and no parcel exists, so it must not overwrite the order's shipping
    // fee, must not advance the order to `shipped`, and must not create a COD
    // expectation the shop would later try to reconcile against a real carrier.
    if (isMock) {
      await this.audit?.writeAudit({
        orgId: input.orgId,
        actorUserId: input.actorUserId,
        actorType: 'user',
        action: 'shipment.created_mock',
        entityType: 'shipment',
        entityId: shipment.id,
        meta: {
          orderId: order.id,
          provider: shipment.provider,
          trackingCode: shipment.trackingCode,
          note: 'No carrier contacted; order status, shipping fee and COD were left untouched.',
        },
      });

      return { shipment, mock: true as const };
    }

    await this.updateOrderShippingFee(
      input.orgId,
      order.id,
      providerResult.feeVnd,
    );

    let orderPayload: OrderPayload | null = null;
    if (order.status === 'confirmed') {
      orderPayload = await this.shipConfirmedOrder(input.orgId, order.id);
      await this.audit?.writeAudit({
        orgId: input.orgId,
        actorUserId: input.actorUserId,
        actorType: 'user',
        action: 'order.shipped',
        entityType: 'order',
        entityId: order.id,
        meta: {
          via: 'shipping.createShipment',
          shipmentId: shipment.id,
        },
      });
      // Fire the same `order.shipped` outbound event the orders ship path emits
      // (OrdersService.shipOrder), so subscribers get identical outbox rows no
      // matter which fulfilment path transitioned the order to `shipped`.
      await enqueueOutbox(this.supabase, {
        orgId: input.orgId,
        eventName: 'order.shipped',
        payload: {
          event: 'order.shipped',
          orderId: order.id,
          status: 'shipped',
        },
      });
    }

    await this.cod?.ensureExpectationForOrder({
      orgId: input.orgId,
      orderId: order.id,
      actorUserId: input.actorUserId,
      order: {
        status: orderPayload?.order.status ?? order.status,
        paymentMethod: orderPayload?.order.paymentMethod ?? order.payment_method,
        totalVnd: orderPayload?.order.totalVnd ?? order.total_vnd,
      },
    });

    await this.audit?.writeAudit({
      orgId: input.orgId,
      actorUserId: input.actorUserId,
      actorType: 'user',
      action: 'shipment.created',
      entityType: 'shipment',
      entityId: shipment.id,
      meta: {
        orderId: order.id,
        provider: shipment.provider,
        trackingCode: shipment.trackingCode,
        feeVnd: shipment.feeVnd,
      },
    });

    return {
      shipment,
      ...(orderPayload
        ? { order: orderPayload.order, items: orderPayload.items }
        : {}),
    };
  }

  async listShipments(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('shipments')
      .select(SHIPMENT_SELECT)
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      throwShippingError(error, 'Could not list shipments');
    }

    return {
      shipments: ((data ?? []) as ShipmentRow[]).map(mapShipment),
    };
  }

  private async findConnectionByProvider(
    orgId: string,
    provider: ShippingProviderBody,
  ) {
    const { data, error } = await this.supabase
      .from('carrier_connections')
      .select(CONNECTION_SELECT)
      .eq('org_id', orgId)
      .eq('provider', provider)
      .maybeSingle();

    if (error) {
      throwShippingError(error, 'Could not read carrier connection');
    }

    return data as CarrierConnectionRow | null;
  }

  private async getConnectionById(orgId: string, connectionId: string) {
    const { data, error } = await this.supabase
      .from('carrier_connections')
      .select(CONNECTION_SELECT)
      .eq('org_id', orgId)
      .eq('id', connectionId)
      .maybeSingle();

    if (error) {
      throwShippingError(error, 'Could not read carrier connection');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'carrier_connection_not_found',
        message: 'Carrier connection was not found',
      });
    }

    return data as CarrierConnectionRow;
  }

  private async resolveConnection(
    orgId: string,
    provider: ShippingProviderBody,
    connectionId?: string,
  ): Promise<ShippingConnection> {
    const row = connectionId
      ? await this.getConnectionById(orgId, connectionId)
      : await this.findConnectionByProvider(orgId, provider);

    if (!row) {
      if (provider === 'manual') {
        return {
          id: null,
          provider: 'manual',
          displayName: defaultDisplayName('manual'),
          config: {},
          credentials: {},
        };
      }
      throw new BadRequestException({
        code: 'carrier_not_configured',
        message: 'Carrier connection is not configured',
      });
    }
    if (!row.enabled) {
      throw new BadRequestException({
        code: 'carrier_disabled',
        message: 'Carrier connection is disabled',
      });
    }

    return {
      id: row.id,
      provider: row.provider,
      displayName: row.display_name,
      config: row.config_json ?? {},
      credentials: decryptCredentials(row.credentials_enc, this.env),
    };
  }

  private async getShipmentOrder(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('org_id', orgId)
      .eq('id', orderId)
      .maybeSingle();

    if (error) {
      throwShippingError(error, 'Could not read order');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    return data as unknown as OrderRow;
  }

  /**
   * The newest shipment for an order that represents a real parcel at a
   * carrier, or null when a new booking is legitimate.
   *
   * Mock rows are skipped on purpose: they are traceability records where no
   * carrier was contacted (see `GhnShippingProvider`, `raw_json.mode = 'mock'`),
   * so they cost nothing and must never block a genuine booking. Blocking on
   * them would change mock semantics, which stay untouched.
   */
  private async findLiveShipment(orgId: string, orderId: string) {
    const { data, error } = await this.supabase
      .from('shipments')
      .select(SHIPMENT_SELECT)
      .eq('org_id', orgId)
      .eq('order_id', orderId)
      .in('status', LIVE_SHIPMENT_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      throwShippingError(error, 'Could not read existing shipments');
    }

    return (
      ((data ?? []) as ShipmentRow[]).find((row) => !isMockShipmentRow(row)) ??
      null
    );
  }

  private async insertShipment(input: {
    orgId: string;
    orderId: string;
    carrierConnectionId: string | null;
    provider: ShippingProviderCode;
    externalShipmentId: string | null;
    trackingCode: string | null;
    status: string;
    feeVnd: bigint;
    labelUrl: string | null;
    raw: JsonObject;
  }) {
    const { data, error } = await this.supabase
      .from('shipments')
      .insert({
        org_id: input.orgId,
        order_id: input.orderId,
        carrier_connection_id: input.carrierConnectionId,
        provider: input.provider,
        external_shipment_id: input.externalShipmentId,
        tracking_code: input.trackingCode,
        status: input.status,
        fee_vnd: input.feeVnd.toString(),
        label_url: input.labelUrl,
        raw_json: input.raw,
      })
      .select(SHIPMENT_SELECT)
      .single();

    if (error) {
      throwShippingError(error, 'Could not create shipment');
    }

    return mapShipment(data as ShipmentRow);
  }

  private async updateOrderShippingFee(
    orgId: string,
    orderId: string,
    feeVnd: bigint,
  ) {
    const { error } = await this.supabase
      .from('orders')
      .update({
        shipping_fee_vnd: feeVnd.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('id', orderId);

    if (error) {
      throwShippingError(error, 'Could not update order shipping fee');
    }
  }

  private async shipConfirmedOrder(orgId: string, orderId: string) {
    const { data, error } = await this.supabase.rpc('ship_order', {
      p_org_id: orgId,
      p_order_id: orderId,
      p_shipped_at: new Date().toISOString(),
    });

    if (error) {
      throwShippingError(error, 'Could not ship order');
    }
    if (!data) {
      throw new NotFoundException({
        code: 'order_not_found',
        message: 'Order was not found',
      });
    }

    return data as OrderPayload;
  }

  private providerFor(provider: ShippingProviderCode): ShippingProvider {
    if (provider === 'manual') {
      return new ManualShippingProvider();
    }
    return new GhnShippingProvider(this.fetchImpl);
  }
}

function mapConnection(row: CarrierConnectionRow) {
  return {
    id: row.id,
    provider: row.provider,
    displayName: row.display_name,
    config: row.config_json ?? {},
    enabled: row.enabled,
    hasCredentials: Boolean(row.credentials_enc),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapShipment(row: ShipmentRow) {
  return {
    id: row.id,
    orgId: row.org_id,
    orderId: row.order_id,
    carrierConnectionId: row.carrier_connection_id,
    provider: row.provider,
    externalShipmentId: row.external_shipment_id,
    trackingCode: row.tracking_code,
    status: row.status,
    feeVnd: row.fee_vnd.toString(),
    labelUrl: row.label_url,
    raw: row.raw_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMockShipmentRow(row: ShipmentRow) {
  return (row.raw_json ?? {}).mode === 'mock';
}

function mapShippingOrder(row: OrderRow): ShippingOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    phoneE164: row.phone_e164,
    addressText: row.address_text,
    addressJson: row.address_json ?? {},
    items: (row.items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      titleSnapshot: item.title_snapshot,
      skuSnapshot: item.sku_snapshot,
      qty: item.qty,
      unitPriceVnd: item.unit_price_vnd.toString(),
      lineTotalVnd: item.line_total_vnd.toString(),
    })),
  };
}

function decryptCredentials(
  encrypted: string | null,
  env: ShippingEnv,
): JsonObject {
  if (!encrypted) {
    return {};
  }

  try {
    const parsed = JSON.parse(
      decryptToken(encrypted, env.TOKEN_ENCRYPTION_KEY),
    ) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : {};
  } catch {
    throw new BadRequestException({
      code: 'carrier_not_configured',
      message: 'Carrier credentials could not be read',
    });
  }
}

function defaultDisplayName(provider: ShippingProviderBody) {
  return provider === 'manual' ? 'Thủ công' : 'GHN';
}

function throwShippingError(error: SupabaseError, message: string): never {
  if (error.code === '23505') {
    throw new ConflictException({
      code: 'shipping_conflict',
      message: error.message ?? message,
    });
  }
  if (error.hint === 'invalid_order_status') {
    throw new BadRequestException({
      code: 'invalid_order_status',
      message: error.message ?? message,
    });
  }

  throw new InternalServerErrorException({
    code: 'shipping_failed',
    message,
  });
}

function createSupabaseServiceClient(env: ShippingEnv): SupabaseLike {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
