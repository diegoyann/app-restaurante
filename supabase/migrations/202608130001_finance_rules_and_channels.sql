-- Regras financeiras reutilizando as fontes existentes: recurring_costs,
-- sales_channels e transactions. channel_settlements é necessário para que
-- recebível de adquirente não seja confundido com receita ou saldo bancário.

alter table public.recurring_costs
  add column if not exists weekday smallint,
  add column if not exists effective_from date;

update public.recurring_costs
set effective_from = coalesce(effective_from, created_at::date, current_date)
where effective_from is null;

alter table public.recurring_costs
  alter column effective_from set default current_date,
  alter column effective_from set not null;

alter table public.recurring_costs drop constraint if exists recurring_costs_recurrence_check;
alter table public.recurring_costs add constraint recurring_costs_recurrence_check
  check (recurrence in ('MONTHLY', 'WEEKLY', 'SPECIAL'));
alter table public.recurring_costs drop constraint if exists recurring_costs_weekday_check;
alter table public.recurring_costs add constraint recurring_costs_weekday_check
  check (weekday is null or weekday between 0 and 6);

-- Marketing existente passa a representar a regra real: R$ 400 por segunda.
update public.recurring_costs
set recurrence = 'WEEKLY', weekday = 1, amount = 400
where normalized_key = 'marketing' and merged_into_id is null;

insert into public.recurring_costs (tenant_id, description, amount, due_day, normalized_key, category, forecast_type, recurrence, weekday, effective_from, active, source_type)
select t.id, 'Marketing', 400, 1, 'marketing', 'MARKETING', 'FIXED', 'WEEKLY', 1, current_date, true, 'SYSTEM_RULE'
from public.tenants t
where not exists (
  select 1 from public.recurring_costs c
  where c.tenant_id = t.id and c.active = true and c.normalized_key = 'marketing'
);

delete from public.financial_obligations o
using public.recurring_costs c
where o.recurring_cost_id = c.id
  and o.source_type = 'RECURRING'
  and o.source_id = c.id::text
  and c.recurrence = 'WEEKLY'
  and coalesce(o.paid_amount, 0) = 0;

alter table public.sales_channels
  add column if not exists active boolean not null default true,
  add column if not exists fee_percent numeric(7,4) not null default 0,
  add column if not exists settlement_type text not null default 'IMMEDIATE',
  add column if not exists settlement_frequency text not null default 'NONE',
  add column if not exists settlement_weekday smallint,
  add column if not exists settlement_delay_days integer not null default 0,
  add column if not exists notes text not null default '';

alter table public.sales_channels drop constraint if exists sales_channels_fee_percent_check;
alter table public.sales_channels add constraint sales_channels_fee_percent_check check (fee_percent between 0 and 100);
alter table public.sales_channels drop constraint if exists sales_channels_settlement_type_check;
alter table public.sales_channels add constraint sales_channels_settlement_type_check check (settlement_type in ('IMMEDIATE', 'SCHEDULED'));
alter table public.sales_channels drop constraint if exists sales_channels_settlement_frequency_check;
alter table public.sales_channels add constraint sales_channels_settlement_frequency_check check (settlement_frequency in ('NONE', 'DAILY', 'WEEKLY'));
alter table public.sales_channels drop constraint if exists sales_channels_settlement_weekday_check;
alter table public.sales_channels add constraint sales_channels_settlement_weekday_check check (settlement_weekday is null or settlement_weekday between 0 and 6);

insert into public.sales_channels (tenant_id, name, active, fee_percent, settlement_type, settlement_frequency, notes)
select t.id, 'Anota Aí', true, 0, 'IMMEDIATE', 'NONE', 'Aceita composição em dinheiro e online/banco.'
from public.tenants t
where not exists (
  select 1 from public.sales_channels c where c.tenant_id = t.id and lower(c.name) in ('anota aí', 'anota ai')
);

insert into public.sales_channels (tenant_id, name, active, fee_percent, settlement_type, settlement_frequency, settlement_weekday, settlement_delay_days, notes)
select t.id, 'iFood', true, 15, 'SCHEDULED', 'WEEKLY', 3, 3, 'Período de segunda a domingo; repasse na quarta-feira seguinte.'
from public.tenants t
where not exists (
  select 1 from public.sales_channels c where c.tenant_id = t.id and lower(c.name) = 'ifood'
);

update public.sales_channels
set active = true, fee_percent = 15, settlement_type = 'SCHEDULED', settlement_frequency = 'WEEKLY',
    settlement_weekday = 3, settlement_delay_days = 3,
    notes = 'Período de segunda a domingo; repasse na quarta-feira seguinte.'
where lower(name) = 'ifood';

alter table public.transactions add column if not exists batch_id uuid;

create index if not exists transactions_tenant_batch_idx on public.transactions (tenant_id, batch_id) where batch_id is not null;

alter table public.daily_cash_reconciliations
  add column if not exists bank_revenue numeric(12,2) not null default 0,
  add column if not exists receivable_revenue numeric(12,2) not null default 0;

create table if not exists public.channel_settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sales_channel_id uuid not null references public.sales_channels(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  gross_amount numeric(12,2) not null default 0,
  fee_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  expected_date date not null,
  received_date date,
  status text not null default 'EXPECTED' check (status in ('EXPECTED', 'DUE_SOON', 'OVERDUE', 'RECEIVED')),
  bank_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, sales_channel_id, period_start, period_end)
);

create index if not exists channel_settlements_tenant_expected_idx on public.channel_settlements (tenant_id, expected_date);
alter table public.channel_settlements enable row level security;
drop policy if exists "channel settlements by tenant access" on public.channel_settlements;
create policy "channel settlements by tenant access" on public.channel_settlements for all to authenticated
using (public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists channel_settlements_set_updated_at on public.channel_settlements;
create trigger channel_settlements_set_updated_at before update on public.channel_settlements
for each row execute function public.handle_updated_at();
