create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  document text not null default '',
  address_line text not null default '',
  address_number text not null default '',
  address_complement text not null default '',
  district text not null default '',
  city text not null default '',
  state text not null default '',
  postal_code text not null default '',
  notes text not null default '',
  status public.app_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  kind text not null default 'other',
  requires_change boolean not null default false,
  status public.app_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint payment_methods_kind_check check (kind in ('cash', 'credit_card', 'debit_card', 'pix', 'voucher', 'other'))
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  order_number text not null default '',
  channel text not null default 'manual',
  order_type text not null default 'delivery',
  status text not null default 'draft',
  subtotal_amount numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  change_amount numeric(12,2) not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint orders_order_type_check check (order_type in ('delivery', 'pickup', 'dine_in')),
  constraint orders_status_check check (status in ('draft', 'placed', 'accepted', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled'))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  item_name text not null,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists customers_tenant_phone_idx on public.customers (tenant_id, phone);
create index if not exists payment_methods_tenant_status_idx on public.payment_methods (tenant_id, status);
create index if not exists orders_tenant_created_at_idx on public.orders (tenant_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.customers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'customers',
    'payment_methods',
    'orders',
    'order_items'
  ]
  loop
    execute format('drop policy if exists "%1$s tenant access" on public.%1$s;', tbl);
    execute format('create policy "%1$s tenant access" on public.%1$s for all to authenticated using (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id));', tbl);
  end loop;
end $$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.handle_updated_at();

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at before update on public.payment_methods for each row execute function public.handle_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.handle_updated_at();
