alter table public.orders
  add column if not exists external_source text not null default '',
  add column if not exists external_id text not null default '',
  add column if not exists external_payload jsonb not null default '{}'::jsonb,
  add column if not exists platform_fee_amount numeric(12,2) not null default 0;

create unique index if not exists orders_tenant_external_source_id_key
on public.orders (tenant_id, external_source, external_id)
where external_source <> '' and external_id <> '';

create index if not exists orders_tenant_channel_status_idx
on public.orders (tenant_id, channel, status, created_at desc);

create table if not exists public.external_order_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source text not null,
  external_id text not null,
  order_id uuid references public.orders(id) on delete set null,
  status text not null default 'imported',
  raw_payload jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, source, external_id),
  constraint external_order_imports_status_check check (status in ('imported', 'updated', 'ignored', 'failed'))
);

create index if not exists external_order_imports_tenant_source_idx
on public.external_order_imports (tenant_id, source, imported_at desc);

alter table public.external_order_imports enable row level security;

drop policy if exists "external_order_imports tenant access" on public.external_order_imports;
create policy "external_order_imports tenant access"
on public.external_order_imports
for all
to authenticated
using (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id));

drop trigger if exists external_order_imports_set_updated_at on public.external_order_imports;
create trigger external_order_imports_set_updated_at
before update on public.external_order_imports
for each row execute function public.handle_updated_at();
