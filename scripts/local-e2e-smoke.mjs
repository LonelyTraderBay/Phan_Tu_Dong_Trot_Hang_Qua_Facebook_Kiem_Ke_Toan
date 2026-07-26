#!/usr/bin/env node
/**
 * A2 local e2e smoke (API-level, no Meta / no Playwright).
 * Happy path: health → signup → org → invite accept → catalog → stock →
 * draft → confirm → export CSV.
 *
 * Prerequisites: Docker Supabase + `pnpm run dev:local` (API :3001).
 * Env: SUPABASE_URL + SUPABASE_ANON_KEY (parent `.env` or process env).
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PARENT = resolve(ROOT, '../..');

const API_BASE = (process.env.API_BASE_URL ?? 'http://127.0.0.1:3001').replace(
  /\/$/,
  '',
);
const stamp = Date.now().toString(36);
const suffix = randomBytes(3).toString('hex');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

for (const path of [
  resolve(ROOT, '.env'),
  resolve(PARENT, '.env'),
  resolve(ROOT, 'apps/api/.env'),
]) {
  loadEnvFile(path);
}

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  '';

function fail(step, detail) {
  console.error(`FAIL [${step}] ${detail}`);
  process.exit(1);
}

function ok(step, detail = '') {
  console.log(`PASS [${step}]${detail ? ` ${detail}` : ''}`);
}

async function api(path, { method = 'GET', token, orgId, body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { 'x-org-id': orgId } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

async function authSignup(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      authorization: `Bearer ${ANON_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail('auth.signup', `${email} → ${res.status} ${JSON.stringify(json)}`);
  }
  const accessToken = json.access_token ?? json.session?.access_token;
  if (accessToken) {
    return {
      accessToken,
      userId: json.user?.id ?? json.id,
      email,
    };
  }
  // Email confirm enabled: fall back to password grant or admin confirm.
  return authSignIn(email, password);
}

async function authSignIn(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (res.ok && json.access_token) {
    return { accessToken: json.access_token, userId: json.user?.id, email };
  }

  if (!SERVICE_KEY) {
    fail(
      'auth.signin',
      `${email} → ${res.status} ${JSON.stringify(json)} (no SERVICE_ROLE for admin confirm)`,
    );
  }

  // Admin create+confirm when local confirmations block password grant.
  const adminRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });
  const adminJson = await adminRes.json().catch(() => ({}));
  if (!adminRes.ok && adminRes.status !== 422) {
    fail(
      'auth.admin',
      `${email} → ${adminRes.status} ${JSON.stringify(adminJson)}`,
    );
  }

  const retry = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        authorization: `Bearer ${ANON_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const retryJson = await retry.json().catch(() => ({}));
  if (!retry.ok || !retryJson.access_token) {
    fail('auth.signin', `${email} → ${retry.status} ${JSON.stringify(retryJson)}`);
  }
  return {
    accessToken: retryJson.access_token,
    userId: retryJson.user?.id,
    email,
  };
}

async function main() {
  console.log(`local-e2e-smoke → API ${API_BASE}`);

  let health;
  try {
    health = await api('/health');
  } catch (err) {
    fail(
      'health',
      `API unreachable at ${API_BASE}/health — start stack: pnpm run dev:local (${err.message})`,
    );
  }
  if (!health.res.ok || health.json?.status !== 'ok') {
    fail(
      'health',
      `expected 200 {"status":"ok"}, got ${health.res.status} ${health.text}`,
    );
  }
  ok('health');

  if (!SUPABASE_URL || !ANON_KEY) {
    fail(
      'env',
      'SUPABASE_URL and SUPABASE_ANON_KEY required (parent .env or process env)',
    );
  }

  const password = `Smoke_${suffix}_Aa1!`;
  const ownerEmail = `owner.${stamp}.${suffix}@example.com`;
  const cskhEmail = `cskh.${stamp}.${suffix}@example.com`;
  const slug = `smoke-${stamp}-${suffix}`;

  const owner = await authSignup(ownerEmail, password);
  ok('auth.owner', owner.email);

  const cskh = await authSignup(cskhEmail, password);
  ok('auth.cskh', cskh.email);

  const orgRes = await api('/v1/orgs', {
    method: 'POST',
    token: owner.accessToken,
    body: { name: `Smoke Org ${stamp}`, slug },
  });
  if (!orgRes.res.ok) {
    fail('org.create', `${orgRes.res.status} ${orgRes.text}`);
  }
  const orgId = orgRes.json?.organization?.id;
  if (!orgId) fail('org.create', `missing organization.id: ${orgRes.text}`);
  ok('org.create', orgId);

  const inviteRes = await api(`/v1/orgs/${orgId}/invites`, {
    method: 'POST',
    token: owner.accessToken,
    orgId,
    body: { email: cskhEmail, role: 'cskh' },
  });
  if (!inviteRes.res.ok) {
    fail('invite.create', `${inviteRes.res.status} ${inviteRes.text}`);
  }
  const token = inviteRes.json?.token;
  if (!token || token.length < 32) {
    fail('invite.create', `missing raw token: ${inviteRes.text}`);
  }
  ok('invite.create', inviteRes.json?.invite?.id ?? 'token');

  const acceptRes = await api('/v1/invites/accept', {
    method: 'POST',
    token: cskh.accessToken,
    body: { token },
  });
  if (!acceptRes.res.ok) {
    fail('invite.accept', `${acceptRes.res.status} ${acceptRes.text}`);
  }
  if (acceptRes.json?.membership?.role !== 'cskh') {
    fail('invite.accept', `expected role cskh: ${acceptRes.text}`);
  }
  ok('invite.accept', acceptRes.json.membership.role);

  const sku = `SMOKE-${suffix}`.toUpperCase();
  const productRes = await api('/v1/catalog/products', {
    method: 'POST',
    token: owner.accessToken,
    orgId,
    body: {
      title: `Smoke Product ${stamp}`,
      description: 'A2 local e2e smoke',
      variants: [
        {
          sku,
          title: 'Default',
          priceVnd: '99000',
          stockQty: 0,
          cogsVnd: '40000',
        },
      ],
    },
  });
  if (!productRes.res.ok) {
    fail('catalog.product', `${productRes.res.status} ${productRes.text}`);
  }
  const variantId = productRes.json?.product?.variants?.[0]?.id;
  if (!variantId) {
    fail('catalog.product', `missing variant id: ${productRes.text}`);
  }
  ok('catalog.product', `${productRes.json.product.id} / ${variantId}`);

  const stockRes = await api('/v1/inventory/adjust', {
    method: 'POST',
    token: owner.accessToken,
    orgId,
    body: {
      variantId,
      qtyDelta: 10,
      reason: 'a2-smoke',
      movementType: 'inbound',
    },
  });
  if (!stockRes.res.ok) {
    fail('inventory.adjust', `${stockRes.res.status} ${stockRes.text}`);
  }
  ok('inventory.adjust');

  const draftKey = `smoke-draft-${randomUUID()}`;
  const draftRes = await api('/v1/orders', {
    method: 'POST',
    token: owner.accessToken,
    orgId,
    headers: { 'idempotency-key': draftKey },
    body: {
      paymentMethod: 'cod',
      customerName: 'Smoke Customer',
      phoneE164: '+84901234567',
      addressText: '1 Smoke St, HCMC',
      items: [{ variantId, qty: 1 }],
    },
  });
  if (!draftRes.res.ok) {
    fail('orders.draft', `${draftRes.res.status} ${draftRes.text}`);
  }
  const orderId = draftRes.json?.order?.id;
  const draftStatus = draftRes.json?.order?.status;
  if (!orderId) fail('orders.draft', `missing order.id: ${draftRes.text}`);
  // auto_confirm orgs may return confirmed already — still exercise confirm when draft.
  if (draftStatus === 'confirmed') {
    ok('orders.draft', `${orderId} (auto-confirmed)`);
  } else if (draftStatus !== 'draft') {
    fail('orders.draft', `unexpected status ${draftStatus}: ${draftRes.text}`);
  } else {
    ok('orders.draft', orderId);
    const confirmRes = await api(`/v1/orders/${orderId}/confirm`, {
      method: 'POST',
      token: owner.accessToken,
      orgId,
      headers: { 'idempotency-key': `smoke-confirm-${randomUUID()}` },
    });
    if (!confirmRes.res.ok) {
      fail('orders.confirm', `${confirmRes.res.status} ${confirmRes.text}`);
    }
    if (confirmRes.json?.order?.status !== 'confirmed') {
      fail('orders.confirm', `expected confirmed: ${confirmRes.text}`);
    }
    ok('orders.confirm', orderId);
  }

  const exportRes = await api('/v1/orders/export?format=csv', {
    token: owner.accessToken,
    orgId,
  });
  if (!exportRes.res.ok) {
    fail('orders.export', `${exportRes.res.status} ${exportRes.text.slice(0, 200)}`);
  }
  const ctype = exportRes.res.headers.get('content-type') ?? '';
  if (!exportRes.text || exportRes.text.length < 10) {
    fail('orders.export', 'empty CSV body');
  }
  ok('orders.export', `${exportRes.res.status} ${ctype || 'text'} (${exportRes.text.length}b)`);

  // Fingerprint for logs only — not a secret.
  const runId = createHash('sha256')
    .update(`${orgId}:${orderId}:${stamp}`)
    .digest('hex')
    .slice(0, 12);
  console.log(`GREEN local e2e smoke ok run=${runId} org=${orgId} order=${orderId}`);
}

main().catch((err) => {
  fail('unhandled', err?.stack ?? String(err));
});
