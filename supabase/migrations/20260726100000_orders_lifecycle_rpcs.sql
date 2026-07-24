-- Plan D Task 2: human-facing order lifecycle RPCs.
-- Core API calls these with service_role after Nest authz/org checks.

create or replace function private.order_lifecycle_payload(
  p_org_id uuid,
  p_order_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with order_row as (
    select o.*
    from public.orders o
    where o.org_id = p_org_id
      and o.id = p_order_id
  ),
  items_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'variantId', oi.variant_id,
          'titleSnapshot', oi.title_snapshot,
          'skuSnapshot', oi.sku_snapshot,
          'qty', oi.qty,
          'unitPriceVnd', oi.unit_price_vnd::text,
          'lineTotalVnd', oi.line_total_vnd::text
        )
        order by oi.id
      ),
      '[]'::jsonb
    ) as items
    from public.order_items oi
    where oi.org_id = p_org_id
      and oi.order_id = p_order_id
  )
  select jsonb_build_object(
    'order',
    jsonb_build_object(
      'id', o.id,
      'orgId', o.org_id,
      'conversationId', o.conversation_id,
      'contactId', o.contact_id,
      'status', o.status,
      'paymentMethod', o.payment_method,
      'customerName', o.customer_name,
      'phoneE164', o.phone_e164,
      'addressText', o.address_text,
      'addressJson', o.address_json,
      'currency', o.currency,
      'subtotalVnd', o.subtotal_vnd::text,
      'totalVnd', o.total_vnd::text,
      'idempotencyKey', o.idempotency_key,
      'confirmedAt', o.confirmed_at,
      'shippedAt', o.shipped_at,
      'cancelledAt', o.cancelled_at,
      'doneAt', o.done_at,
      'createdAt', o.created_at,
      'updatedAt', o.updated_at
    ),
    'items',
    items_json.items
  )
  from order_row o
  cross join items_json;
$$;

revoke all on function private.order_lifecycle_payload(uuid, uuid)
from public, anon, authenticated;

grant execute on function private.order_lifecycle_payload(uuid, uuid)
to service_role;

create or replace function public.confirm_order(
  p_org_id uuid,
  p_order_id uuid,
  p_confirmed_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_at timestamptz := coalesce(p_confirmed_at, now());
  v_required_count int;
  v_updated_count int;
begin
  select *
  into v_order
  from public.orders
  where org_id = p_org_id
    and id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.status in ('confirmed', 'shipped', 'done') then
    return private.order_lifecycle_payload(p_org_id, p_order_id);
  end if;

  if v_order.status <> 'draft' then
    raise exception 'order cannot be confirmed from status %', v_order.status
      using errcode = 'P0001', hint = 'invalid_order_status';
  end if;

  with required as (
    select oi.variant_id, sum(oi.qty)::int as qty
    from public.order_items oi
    where oi.org_id = p_org_id
      and oi.order_id = p_order_id
    group by oi.variant_id
  ),
  updated as (
    update public.product_variants pv
    set stock_qty = pv.stock_qty - required.qty,
        updated_at = v_at
    from required
    where pv.org_id = p_org_id
      and pv.id = required.variant_id
      and pv.stock_qty >= required.qty
    returning pv.id
  )
  select
    (select count(*) from required),
    (select count(*) from updated)
  into v_required_count, v_updated_count;

  if v_required_count = 0 then
    raise exception 'order requires at least one item'
      using errcode = '22023', hint = 'invalid_order_items';
  end if;

  if v_required_count <> v_updated_count then
    raise exception 'insufficient stock for order'
      using errcode = 'P0001', hint = 'insufficient_stock';
  end if;

  update public.orders
  set status = 'confirmed',
      confirmed_at = v_at,
      updated_at = v_at
  where org_id = p_org_id
    and id = p_order_id;

  return private.order_lifecycle_payload(p_org_id, p_order_id);
end;
$$;

revoke all on function public.confirm_order(uuid, uuid, timestamptz)
from public, anon, authenticated;

grant execute on function public.confirm_order(uuid, uuid, timestamptz)
to service_role;

create or replace function public.cancel_order(
  p_org_id uuid,
  p_order_id uuid,
  p_cancelled_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_at timestamptz := coalesce(p_cancelled_at, now());
begin
  select *
  into v_order
  from public.orders
  where org_id = p_org_id
    and id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.status = 'cancelled' then
    return private.order_lifecycle_payload(p_org_id, p_order_id);
  end if;

  if v_order.status in ('shipped', 'done', 'returned') then
    raise exception 'order cannot be cancelled from status %', v_order.status
      using errcode = 'P0001', hint = 'invalid_order_status';
  end if;

  if v_order.status = 'confirmed' then
    with required as (
      select oi.variant_id, sum(oi.qty)::int as qty
      from public.order_items oi
      where oi.org_id = p_org_id
        and oi.order_id = p_order_id
      group by oi.variant_id
    )
    update public.product_variants pv
    set stock_qty = pv.stock_qty + required.qty,
        updated_at = v_at
    from required
    where pv.org_id = p_org_id
      and pv.id = required.variant_id;
  end if;

  update public.orders
  set status = 'cancelled',
      cancelled_at = v_at,
      updated_at = v_at
  where org_id = p_org_id
    and id = p_order_id;

  return private.order_lifecycle_payload(p_org_id, p_order_id);
end;
$$;

revoke all on function public.cancel_order(uuid, uuid, timestamptz)
from public, anon, authenticated;

grant execute on function public.cancel_order(uuid, uuid, timestamptz)
to service_role;

create or replace function public.ship_order(
  p_org_id uuid,
  p_order_id uuid,
  p_shipped_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_at timestamptz := coalesce(p_shipped_at, now());
begin
  select *
  into v_order
  from public.orders
  where org_id = p_org_id
    and id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.status in ('shipped', 'done') then
    return private.order_lifecycle_payload(p_org_id, p_order_id);
  end if;

  if v_order.status <> 'confirmed' then
    raise exception 'order cannot be shipped from status %', v_order.status
      using errcode = 'P0001', hint = 'invalid_order_status';
  end if;

  update public.orders
  set status = 'shipped',
      shipped_at = v_at,
      updated_at = v_at
  where org_id = p_org_id
    and id = p_order_id;

  return private.order_lifecycle_payload(p_org_id, p_order_id);
end;
$$;

revoke all on function public.ship_order(uuid, uuid, timestamptz)
from public, anon, authenticated;

grant execute on function public.ship_order(uuid, uuid, timestamptz)
to service_role;
