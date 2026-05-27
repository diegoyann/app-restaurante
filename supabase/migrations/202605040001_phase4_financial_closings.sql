alter table public.transactions
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_id text not null default '';

create unique index if not exists transactions_tenant_source_idx
on public.transactions (tenant_id, source_type, source_id)
where source_id <> '';

create index if not exists transactions_tenant_date_type_idx
on public.transactions (tenant_id, transaction_date, type);

create table if not exists public.financial_closings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  period_type text not null,
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(12,2) not null default 0,
  net_revenue numeric(12,2) not null default 0,
  order_income numeric(12,2) not null default 0,
  manual_income numeric(12,2) not null default 0,
  manual_expenses numeric(12,2) not null default 0,
  fixed_costs numeric(12,2) not null default 0,
  payroll_costs numeric(12,2) not null default 0,
  delivery_costs numeric(12,2) not null default 0,
  channel_fees numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  status text not null default 'closed',
  snapshot jsonb not null default '{}'::jsonb,
  closed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint financial_closings_period_type_check check (period_type in ('daily', 'weekly', 'monthly')),
  constraint financial_closings_status_check check (status in ('closed', 'reopened')),
  constraint financial_closings_period_order_check check (period_end >= period_start),
  constraint financial_closings_unique_period unique (tenant_id, period_type, period_start, period_end)
);

create index if not exists financial_closings_tenant_period_idx
on public.financial_closings (tenant_id, period_start desc, period_end desc);

alter table public.financial_closings enable row level security;

drop policy if exists "financial_closings tenant access" on public.financial_closings;
create policy "financial_closings tenant access"
on public.financial_closings
for all
to authenticated
using (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id));

drop trigger if exists financial_closings_set_updated_at on public.financial_closings;
create trigger financial_closings_set_updated_at
before update on public.financial_closings
for each row execute function public.handle_updated_at();
