create table if not exists public.delivery_drivers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  vehicle text not null default 'moto',
  daily_rate numeric(12,2) not null default 0,
  per_delivery_rate numeric(12,2) not null default 0,
  status public.app_status not null default 'active',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.orders
  add column if not exists delivery_driver_id uuid references public.delivery_drivers(id) on delete set null,
  add column if not exists delivery_status text not null default 'waiting',
  add column if not exists dispatched_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_cost numeric(12,2) not null default 0,
  add column if not exists driver_daily_amount numeric(12,2) not null default 0,
  add column if not exists driver_delivery_amount numeric(12,2) not null default 0,
  add column if not exists cash_change_required numeric(12,2) not null default 0,
  add column if not exists card_machine_code text not null default '';

alter table public.orders
  drop constraint if exists orders_delivery_status_check;

alter table public.orders
  add constraint orders_delivery_status_check check (delivery_status in ('waiting', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'));

create index if not exists delivery_drivers_tenant_status_idx on public.delivery_drivers (tenant_id, status);
create index if not exists orders_delivery_driver_idx on public.orders (tenant_id, delivery_driver_id);
create index if not exists orders_delivery_status_idx on public.orders (tenant_id, delivery_status);

alter table public.delivery_drivers enable row level security;

drop policy if exists "delivery_drivers tenant access" on public.delivery_drivers;
create policy "delivery_drivers tenant access"
on public.delivery_drivers
for all
to authenticated
using (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id));

drop trigger if exists delivery_drivers_set_updated_at on public.delivery_drivers;
create trigger delivery_drivers_set_updated_at
before update on public.delivery_drivers
for each row execute function public.handle_updated_at();
