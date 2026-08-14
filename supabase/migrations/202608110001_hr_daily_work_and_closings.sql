alter table public.payroll_configs
  add column if not exists meal_cost_per_workday numeric(12,2) not null default 15,
  add column if not exists extra_kitchen_daily_rate numeric(12,2) not null default 70,
  add column if not exists extra_motoboy_daily_rate numeric(12,2) not null default 60;

create table if not exists public.employee_work_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  worked boolean not null default true,
  daily_rate numeric(12,2) not null default 0,
  meal_cost numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, employee_id, work_date)
);

create table if not exists public.extra_weekly_closings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  total_daily_rates numeric(12,2) not null default 0,
  total_delivery_fees numeric(12,2) not null default 0,
  total_payment numeric(12,2) not null default 0,
  expected_payment_date date not null,
  paid_amount numeric(12,2) not null default 0,
  paid_at date,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, employee_id, period_start, period_end)
);

create index if not exists employee_work_logs_tenant_date_idx on public.employee_work_logs (tenant_id, work_date);
create index if not exists extra_weekly_closings_tenant_period_idx on public.extra_weekly_closings (tenant_id, period_start, period_end);

alter table public.employee_work_logs enable row level security;
alter table public.extra_weekly_closings enable row level security;

create policy "work logs by tenant access" on public.employee_work_logs for all to authenticated
using (public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_has_tenant_access(tenant_id));

create policy "extra closings by tenant access" on public.extra_weekly_closings for all to authenticated
using (public.current_user_has_tenant_access(tenant_id))
with check (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists employee_work_logs_set_updated_at on public.employee_work_logs;
create trigger employee_work_logs_set_updated_at before update on public.employee_work_logs for each row execute function public.handle_updated_at();
drop trigger if exists extra_weekly_closings_set_updated_at on public.extra_weekly_closings;
create trigger extra_weekly_closings_set_updated_at before update on public.extra_weekly_closings for each row execute function public.handle_updated_at();
