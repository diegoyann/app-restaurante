-- Controle individual de faltas, folgas programadas e ajustes auditáveis da folha fixa.

alter table public.employees
  add column if not exists control_attendance boolean not null default false,
  add column if not exists attendance_control_from date;

create table if not exists public.employee_scheduled_days_off (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  kind text not null check (kind in ('WEEKLY', 'DATE')),
  weekday integer check (weekday between 0 and 6),
  off_date date,
  note text not null default '',
  active boolean not null default true,
  cancelled_at timestamptz,
  cancellation_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (kind = 'WEEKLY' and weekday is not null and off_date is null)
    or (kind = 'DATE' and off_date is not null and weekday is null)
  )
);

create unique index if not exists employee_scheduled_days_off_weekly_unique
  on public.employee_scheduled_days_off (tenant_id, employee_id, weekday)
  where kind = 'WEEKLY' and active = true;
create unique index if not exists employee_scheduled_days_off_date_unique
  on public.employee_scheduled_days_off (tenant_id, employee_id, off_date)
  where kind = 'DATE' and active = true;
create index if not exists employee_scheduled_days_off_employee_idx
  on public.employee_scheduled_days_off (tenant_id, employee_id, active);

create table if not exists public.payroll_adjustments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  competence_month text not null check (competence_month ~ '^\d{4}-\d{2}$'),
  adjustment_date date not null,
  -- Texto aberto: os quatro códigos iniciais são oferecidos pela interface,
  -- mas novos tipos podem ser acrescentados sem uma nova migration.
  category text not null check (length(trim(category)) > 0),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELLED')),
  cancelled_at timestamptz,
  cancellation_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists payroll_adjustments_employee_competence_idx
  on public.payroll_adjustments (tenant_id, employee_id, competence_month, status);

alter table public.employee_scheduled_days_off enable row level security;
alter table public.payroll_adjustments enable row level security;

drop policy if exists employee_scheduled_days_off_tenant_access on public.employee_scheduled_days_off;
create policy employee_scheduled_days_off_tenant_access on public.employee_scheduled_days_off
  for all to authenticated
  using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));

drop policy if exists payroll_adjustments_tenant_access on public.payroll_adjustments;
create policy payroll_adjustments_tenant_access on public.payroll_adjustments
  for all to authenticated
  using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists employee_scheduled_days_off_set_updated_at on public.employee_scheduled_days_off;
create trigger employee_scheduled_days_off_set_updated_at
  before update on public.employee_scheduled_days_off
  for each row execute function public.handle_updated_at();

drop trigger if exists payroll_adjustments_set_updated_at on public.payroll_adjustments;
create trigger payroll_adjustments_set_updated_at
  before update on public.payroll_adjustments
  for each row execute function public.handle_updated_at();

comment on column public.employees.control_attendance is 'Quando ativo, ausências em dias esperados viram faltas na folha fixa.';
comment on column public.employees.attendance_control_from is 'Evita criar faltas retroativas anteriores ao início do controle.';
comment on table public.employee_scheduled_days_off is 'Folgas recorrentes e datas específicas; cancelamentos preservam histórico.';
comment on table public.payroll_adjustments is 'Descontos auditáveis por funcionário e competência, sem lançamento adicional na DRE.';
