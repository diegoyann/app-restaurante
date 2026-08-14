-- Uma obrigação financeira por pedido e tipos de diária configuráveis por funcionário extra.

alter table public.financial_obligations
  add column if not exists purchase_order_id uuid references public.purchase_orders(id) on delete restrict;

create unique index if not exists financial_obligations_purchase_order_unique
  on public.financial_obligations (tenant_id, purchase_order_id)
  where purchase_order_id is not null;

alter table public.financial_obligations
  drop constraint if exists financial_obligations_status_check;
alter table public.financial_obligations
  add constraint financial_obligations_status_check
  check (status in ('EXPECTED', 'DUE_SOON', 'OVERDUE', 'PARTIAL', 'PAID', 'CANCELLED'));

create table if not exists public.employee_daily_rate_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  applies_weekdays boolean not null default true,
  applies_weekends boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, employee_id, name)
);

create table if not exists public.employee_work_log_rate_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  work_log_id uuid not null references public.employee_work_logs(id) on delete cascade,
  daily_rate_type_id uuid references public.employee_daily_rate_types(id) on delete set null,
  type_name text not null,
  amount_snapshot numeric(12,2) not null check (amount_snapshot > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (work_log_id, daily_rate_type_id)
);

create index if not exists employee_daily_rate_types_employee_idx
  on public.employee_daily_rate_types (tenant_id, employee_id, active);
create index if not exists employee_work_log_rate_types_log_idx
  on public.employee_work_log_rate_types (tenant_id, work_log_id);

insert into public.employee_daily_rate_types (tenant_id, employee_id, name, amount, applies_weekdays, applies_weekends)
select
  employee.tenant_id,
  employee.id,
  'Diária padrão',
  case
    when employee.role ~* '(moto|entrega)' then coalesce(nullif(config.extra_motoboy_daily_rate, 0), 60)
    else coalesce(nullif(config.extra_kitchen_daily_rate, 0), 70)
  end,
  true,
  true
from public.employees employee
left join public.payroll_configs config on config.tenant_id = employee.tenant_id
where employee.employment_type = 'external'
on conflict (tenant_id, employee_id, name) do nothing;

insert into public.employee_work_log_rate_types (
  tenant_id,
  work_log_id,
  daily_rate_type_id,
  type_name,
  amount_snapshot
)
select
  work_log.tenant_id,
  work_log.id,
  default_type.id,
  default_type.name,
  work_log.daily_rate
from public.employee_work_logs work_log
join public.employees employee
  on employee.id = work_log.employee_id
 and employee.tenant_id = work_log.tenant_id
join lateral (
  select rate_type.id, rate_type.name
  from public.employee_daily_rate_types rate_type
  where rate_type.tenant_id = work_log.tenant_id
    and rate_type.employee_id = work_log.employee_id
    and rate_type.active = true
  order by rate_type.created_at
  limit 1
) default_type on true
where employee.employment_type = 'external'
  and work_log.worked = true
  and work_log.daily_rate > 0
on conflict (work_log_id, daily_rate_type_id) do nothing;

alter table public.employee_daily_rate_types enable row level security;
alter table public.employee_work_log_rate_types enable row level security;

drop policy if exists employee_daily_rate_types_tenant_access on public.employee_daily_rate_types;
create policy employee_daily_rate_types_tenant_access on public.employee_daily_rate_types
  for all to authenticated
  using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));

drop policy if exists employee_work_log_rate_types_tenant_access on public.employee_work_log_rate_types;
create policy employee_work_log_rate_types_tenant_access on public.employee_work_log_rate_types
  for all to authenticated
  using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists employee_daily_rate_types_set_updated_at on public.employee_daily_rate_types;
create trigger employee_daily_rate_types_set_updated_at
  before update on public.employee_daily_rate_types
  for each row execute function public.handle_updated_at();

comment on table public.employee_daily_rate_types is 'Tipos configuráveis de diária de cada funcionário extra.';
comment on table public.employee_work_log_rate_types is 'Snapshots imutáveis dos tipos e valores usados em uma presença.';
