import { buildApiHeaders, getActiveOrgId } from './org-context';
import {
  getAccessToken,
  type OrganizationRole,
  type StoredOrganization,
} from './auth-session';

export type ChannelConnection = {
  id: string;
  provider: string;
  externalPageId: string;
  status: 'active' | 'needs_reauth' | 'revoked' | string;
  createdAt: string;
};

export type InboxConversation = {
  id: string;
  channel: 'messenger' | 'instagram' | string;
  status: string;
  botPaused: boolean;
  botEpoch: number;
  assigneeUserId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    displayName: string | null;
    pageScopedId: string | null;
    igScopedId: string | null;
  };
  channelConnection?: {
    id: string;
    provider: string;
    externalPageId: string;
    externalIgId: string | null;
  };
};

export type InboxMessage = {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound' | string;
  senderType: 'customer' | 'ai' | 'staff' | 'system' | string;
  rawType: string;
  bodyText: string | null;
  providerMessageId: string | null;
  createdAt: string;
};

export type ProductStatus = 'active' | 'archived';

export type CatalogProduct = {
  id: string;
  title: string;
  description: string | null;
  status: ProductStatus;
  attrs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  variants?: CatalogVariant[];
};

export type CatalogVariant = {
  id: string;
  productId: string;
  sku: string;
  title: string;
  priceVnd: string;
  stockQty: number;
  attrs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  title: string;
  description?: string | null;
  status?: ProductStatus;
  attrs?: Record<string, unknown>;
  variants?: VariantInput[];
};

export type VariantInput = {
  sku: string;
  title: string;
  priceVnd: string;
  stockQty: number;
  attrs?: Record<string, unknown>;
};

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'shipped'
  | 'done'
  | 'cancelled'
  | 'returned';

export type Order = {
  id: string;
  conversationId: string | null;
  contactId: string | null;
  status: OrderStatus;
  paymentMethod: 'cod' | 'bank_transfer' | 'other' | string;
  customerName: string | null;
  phoneE164: string | null;
  addressText: string | null;
  addressJson: Record<string, unknown>;
  currency: 'VND' | string;
  subtotalVnd: string;
  shippingFeeVnd?: string;
  totalVnd: string;
  idempotencyKey: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  cancelledAt: string | null;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
};

export type ShippingProvider = 'manual' | 'ghn';

export type CarrierConnection = {
  id: string;
  provider: ShippingProvider;
  displayName: string;
  config: Record<string, unknown>;
  enabled: boolean;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Shipment = {
  id: string;
  orgId: string;
  orderId: string;
  carrierConnectionId: string | null;
  provider: ShippingProvider;
  externalShipmentId: string | null;
  trackingCode: string | null;
  status: string;
  feeVnd: string;
  labelUrl: string | null;
  raw: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CodExpectation = {
  id: string;
  orgId: string;
  orderId: string;
  expectedVnd: string;
  collectedVnd: string;
  deltaVnd: string;
  status: 'open' | 'matched' | 'discrepancy' | 'written_off' | string;
  createdAt: string;
  order: {
    id: string;
    status: OrderStatus | string;
    paymentMethod: string;
    customerName: string | null;
    phoneE164: string | null;
    totalVnd: string;
    shippedAt: string | null;
    createdAt: string;
  } | null;
};

export type CodCollection = {
  id: string;
  orgId: string;
  orderId: string;
  amountVnd: string;
  collectedAt: string;
  source: 'manual' | 'carrier_file' | 'carrier_api' | string;
  note: string | null;
  createdAt: string;
};

export type CodDiscrepancy = {
  id: string;
  orgId: string;
  orderId: string;
  expectedVnd: string;
  collectedVnd: string;
  deltaVnd: string;
  status: 'open' | 'resolved' | string;
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type CodReport = {
  summary: {
    openCount: number;
    discrepancyCount: number;
    expectedVnd: string;
    collectedVnd: string;
    deltaVnd: string;
  };
  expectations: CodExpectation[];
  discrepancies: CodDiscrepancy[];
};

export type OrderItem = {
  id: string;
  productId: string;
  variantId: string;
  titleSnapshot: string;
  skuSnapshot: string;
  qty: number;
  unitPriceVnd: string;
  lineTotalVnd: string;
};

export type OrdersExportFormat = 'csv' | 'xlsx' | 'pdf';

export type ApiAuthContext = {
  accessToken: string;
  orgId: string;
};

export type OrganizationMembership = {
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    settingsJson?: Record<string, unknown>;
    timezone: string;
    locale: string;
    suspendedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  membership: {
    id: string;
    orgId: string;
    userId: string;
    role: OrganizationRole;
  };
};

export type MembershipInvite = {
  id: string;
  orgId: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
  createdAt: string;
};

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
}

export function getApiAuthContext(): ApiAuthContext | null {
  const accessToken = getAccessToken();
  const orgId = getActiveOrgId();

  if (!accessToken || !orgId) {
    return null;
  }

  return { accessToken, orgId };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: {
    requireOrg?: boolean;
    accessToken?: string;
  } = {},
): Promise<T> {
  const accessToken = options.accessToken ?? getAccessToken();
  if (!accessToken) {
    throw new ApiClientError(
      'missing_auth',
      'Thiếu phiên đăng nhập.',
    );
  }

  const requireOrg = options.requireOrg ?? true;
  const orgId = getActiveOrgId();
  if (requireOrg && !orgId) {
    throw new ApiClientError('missing_auth', 'Thiếu tổ chức đang chọn.');
  }

  const headers = new Headers(init.headers);
  const defaultHeaders = requireOrg
    ? buildApiHeaders({ accessToken, orgId: orgId as string })
    : {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

  for (const [key, value] of Object.entries(defaultHeaders)) {
    headers.set(key, headers.get(key) ?? value);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Yêu cầu API thất bại (${response.status})`;
    let code = 'api_error';

    try {
      const body = (await response.json()) as {
        code?: string;
        message?: string;
      };
      if (body.code) {
        code = body.code;
      }
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Ignore non-JSON error bodies.
    }

    throw new ApiClientError(code, message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function listChannels(): Promise<ChannelConnection[]> {
  return apiFetch<ChannelConnection[]>('/v1/channels');
}

export async function listInboxConversations(): Promise<InboxConversation[]> {
  const { conversations } = await apiFetch<{
    conversations: InboxConversation[];
  }>('/v1/inbox/conversations');

  return conversations;
}

export async function listInboxMessages(
  conversationId: string,
): Promise<InboxMessage[]> {
  const { messages } = await apiFetch<{ messages: InboxMessage[] }>(
    `/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`,
  );

  return messages;
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const { products } = await apiFetch<{ products: CatalogProduct[] }>(
    '/v1/catalog/products',
  );

  return products;
}

export async function getProduct(productId: string): Promise<CatalogProduct> {
  const { product } = await apiFetch<{ product: CatalogProduct }>(
    `/v1/catalog/products/${encodeURIComponent(productId)}`,
  );

  return product;
}

export async function createProduct(
  input: ProductInput,
): Promise<CatalogProduct> {
  const { product } = await apiFetch<{ product: CatalogProduct }>(
    '/v1/catalog/products',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

  return product;
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<CatalogProduct> {
  const { product } = await apiFetch<{ product: CatalogProduct }>(
    `/v1/catalog/products/${encodeURIComponent(productId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );

  return product;
}

export async function deleteProduct(productId: string): Promise<CatalogProduct> {
  const { product } = await apiFetch<{ product: CatalogProduct }>(
    `/v1/catalog/products/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  );

  return product;
}

export async function createVariant(
  productId: string,
  input: VariantInput,
): Promise<CatalogVariant> {
  const { variant } = await apiFetch<{ variant: CatalogVariant }>(
    `/v1/catalog/products/${encodeURIComponent(productId)}/variants`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

  return variant;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: VariantInput,
): Promise<CatalogVariant> {
  const { variant } = await apiFetch<{ variant: CatalogVariant }>(
    `/v1/catalog/products/${encodeURIComponent(
      productId,
    )}/variants/${encodeURIComponent(variantId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );

  return variant;
}

export async function deleteVariant(
  productId: string,
  variantId: string,
): Promise<CatalogVariant> {
  const { variant } = await apiFetch<{ variant: CatalogVariant }>(
    `/v1/catalog/products/${encodeURIComponent(
      productId,
    )}/variants/${encodeURIComponent(variantId)}`,
    { method: 'DELETE' },
  );

  return variant;
}

export type StockMovement = {
  id: string;
  orgId: string;
  variantId: string;
  movementType: string;
  qtyDelta: number;
  stockAfter: number;
  orderId: string | null;
  reason: string | null;
  actorUserId: string | null;
  createdAt: string;
};

export async function listStockMovements(input?: {
  variantId?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  const params = new URLSearchParams();
  if (input?.variantId) {
    params.set('variantId', input.variantId);
  }
  if (input?.limit) {
    params.set('limit', String(input.limit));
  }
  const query = params.size > 0 ? `?${params.toString()}` : '';
  const { movements } = await apiFetch<{ movements: StockMovement[] }>(
    `/v1/inventory/movements${query}`,
  );
  return movements;
}

export async function listLowStock(threshold?: number): Promise<{
  threshold: number;
  variants: CatalogVariant[];
}> {
  const query =
    threshold === undefined
      ? ''
      : `?threshold=${encodeURIComponent(String(threshold))}`;
  return apiFetch<{ threshold: number; variants: CatalogVariant[] }>(
    `/v1/inventory/low-stock${query}`,
  );
}

export async function adjustStock(input: {
  variantId: string;
  qtyDelta: number;
  reason?: string;
  movementType?: 'adjust' | 'inbound' | 'outbound';
}): Promise<{ variant: CatalogVariant; movement: StockMovement }> {
  return apiFetch<{ variant: CatalogVariant; movement: StockMovement }>(
    '/v1/inventory/adjust',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { orders } = await apiFetch<{ orders: Order[] }>(`/v1/orders${query}`);

  return orders;
}

export async function getOrder(orderId: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(
    `/v1/orders/${encodeURIComponent(orderId)}`,
  );

  return order;
}

export async function confirmOrder(orderId: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(
    `/v1/orders/${encodeURIComponent(orderId)}/confirm`,
    { method: 'POST' },
  );

  return order;
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(
    `/v1/orders/${encodeURIComponent(orderId)}/cancel`,
    { method: 'POST' },
  );

  return order;
}

export async function shipOrder(orderId: string): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>(
    `/v1/orders/${encodeURIComponent(orderId)}/ship`,
    { method: 'POST' },
  );

  return order;
}

export async function createShipment(input: {
  orderId: string;
  provider?: ShippingProvider;
  carrierConnectionId?: string;
}): Promise<{ shipment: Shipment; order?: Order; items?: OrderItem[] }> {
  return apiFetch<{ shipment: Shipment; order?: Order; items?: OrderItem[] }>(
    '/v1/shipping/shipments',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function listShipments(orderId: string): Promise<Shipment[]> {
  const { shipments } = await apiFetch<{ shipments: Shipment[] }>(
    `/v1/shipping/shipments?orderId=${encodeURIComponent(orderId)}`,
  );

  return shipments;
}

export async function getCodReport(): Promise<CodReport> {
  return apiFetch<CodReport>('/v1/cod/report');
}

export async function recordCodCollection(input: {
  orderId: string;
  amountVnd: string;
  note?: string;
}): Promise<CodCollection> {
  const { collection } = await apiFetch<{ collection: CodCollection }>(
    '/v1/cod/collections',
    {
      method: 'POST',
      body: JSON.stringify({
        orderId: input.orderId,
        amountVnd: input.amountVnd,
        source: 'manual',
        ...(input.note ? { note: input.note } : {}),
      }),
    },
  );

  return collection;
}

export async function reconcileCodOrder(orderId: string) {
  return apiFetch<{
    expectation: CodExpectation;
    discrepancy: CodDiscrepancy | null;
    summary: {
      expectedVnd: string;
      collectedVnd: string;
      deltaVnd: string;
    };
  }>('/v1/cod/reconcile', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

export async function reconcileCodBatch(orderIds?: string[]) {
  return apiFetch<{ reconciled: number; results: unknown[] }>(
    '/v1/cod/reconcile/batch',
    {
      method: 'POST',
      body: JSON.stringify(orderIds ? { orderIds } : {}),
    },
  );
}

export async function downloadOrdersExport(input: {
  format: OrdersExportFormat;
  status?: OrderStatus;
}): Promise<{ blob: Blob; filename: string }> {
  const params = new URLSearchParams({ format: input.format });
  if (input.status) {
    params.set('status', input.status);
  }

  const response = await rawApiFetch(`/v1/orders/export?${params.toString()}`);
  const disposition = response.headers.get('content-disposition');

  return {
    blob: await response.blob(),
    filename:
      disposition?.match(/filename="([^"]+)"/i)?.[1] ??
      `orders.${input.format}`,
  };
}

export async function takeoverInboxConversation(
  conversationId: string,
): Promise<InboxConversation> {
  const { conversation } = await apiFetch<{ conversation: InboxConversation }>(
    `/v1/inbox/conversations/${encodeURIComponent(conversationId)}/takeover`,
    { method: 'POST' },
  );

  return conversation;
}

export async function listOrganizations(
  accessToken?: string,
): Promise<OrganizationMembership[]> {
  return apiFetch<OrganizationMembership[]>('/v1/orgs', {}, {
    accessToken,
    requireOrg: false,
  });
}

export function mapOrganizationMemberships(
  memberships: OrganizationMembership[],
): StoredOrganization[] {
  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    role: membership.membership.role,
  }));
}

export async function createInvite(input: {
  orgId: string;
  email: string;
  role: OrganizationRole;
}): Promise<{ invite: MembershipInvite }> {
  return apiFetch<{ invite: MembershipInvite }>(
    `/v1/orgs/${encodeURIComponent(input.orgId)}/invites`,
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        role: input.role,
      }),
    },
  );
}

export async function getMetaOAuthUrl(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/v1/channels/meta/oauth-url');
}

export async function completeMetaOAuth(
  code: string,
  state: string,
): Promise<{ connections: ChannelConnection[] }> {
  return apiFetch<{ connections: ChannelConnection[] }>(
    '/v1/channels/meta/complete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    },
  );
}

async function rawApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = getAccessToken();
  const orgId = getActiveOrgId();
  if (!accessToken || !orgId) {
    throw new ApiClientError('missing_auth', 'Thiếu phiên đăng nhập.');
  }

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(
    buildApiHeaders({ accessToken, orgId }),
  )) {
    headers.set(key, headers.get(key) ?? value);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new ApiClientError(
      'api_error',
      `Yêu cầu API thất bại (${response.status})`,
      response.status,
    );
  }

  return response;
}
