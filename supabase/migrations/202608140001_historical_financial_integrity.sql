-- Integridade histórica por competência: vigências mensais, trava de fechamento
-- e restauração auditável de Julho/2026 da filial Bady Bassitt.

create table if not exists public.employee_payroll_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  effective_month text not null check (effective_month ~ '^\d{4}-\d{2}$'),
  full_name text not null,
  role text not null default '',
  employment_type text not null,
  status text not null,
  salary numeric(12,2) not null default 0,
  admission_date date,
  control_attendance boolean not null default false,
  attendance_control_from date,
  weekly_day_off smallint,
  monthly_sunday_off_ordinal smallint,
  first_payment_percentage numeric(5,2),
  final_payment_percentage numeric(5,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, employee_id, effective_month)
);

create table if not exists public.payroll_config_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  effective_month text not null check (effective_month ~ '^\d{4}-\d{2}$'),
  salary_percentage numeric(10,2) not null,
  salary_business_day_ordinal integer not null,
  advance_percentage numeric(10,2) not null,
  advance_fixed_day integer not null,
  advance_business_day_policy text not null,
  holiday_dates jsonb not null default '[]'::jsonb,
  meal_cost_per_workday numeric(12,2) not null,
  extra_kitchen_daily_rate numeric(12,2) not null,
  extra_motoboy_daily_rate numeric(12,2) not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, effective_month)
);

create table if not exists public.recurring_cost_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recurring_cost_id uuid not null references public.recurring_costs(id) on delete cascade,
  effective_month text not null check (effective_month ~ '^\d{4}-\d{2}$'),
  description text not null,
  amount numeric(12,2) not null,
  due_day integer not null,
  category text not null,
  forecast_type text not null,
  recurrence text not null,
  weekday smallint,
  active boolean not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, recurring_cost_id, effective_month)
);

create index if not exists employee_payroll_history_lookup_idx
  on public.employee_payroll_history (tenant_id, employee_id, effective_month desc);
create index if not exists payroll_config_history_lookup_idx
  on public.payroll_config_history (tenant_id, effective_month desc);
create index if not exists recurring_cost_history_lookup_idx
  on public.recurring_cost_history (tenant_id, recurring_cost_id, effective_month desc);

alter table public.employee_payroll_history enable row level security;
alter table public.payroll_config_history enable row level security;
alter table public.recurring_cost_history enable row level security;

drop policy if exists "employee payroll history by tenant access" on public.employee_payroll_history;
create policy "employee payroll history by tenant access" on public.employee_payroll_history
  for all to authenticated using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "payroll config history by tenant access" on public.payroll_config_history;
create policy "payroll config history by tenant access" on public.payroll_config_history
  for all to authenticated using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "recurring cost history by tenant access" on public.recurring_cost_history;
create policy "recurring cost history by tenant access" on public.recurring_cost_history
  for all to authenticated using (public.current_user_has_tenant_access(tenant_id))
  with check (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists employee_payroll_history_set_updated_at on public.employee_payroll_history;
create trigger employee_payroll_history_set_updated_at before update on public.employee_payroll_history
  for each row execute function public.handle_updated_at();
drop trigger if exists payroll_config_history_set_updated_at on public.payroll_config_history;
create trigger payroll_config_history_set_updated_at before update on public.payroll_config_history
  for each row execute function public.handle_updated_at();
drop trigger if exists recurring_cost_history_set_updated_at on public.recurring_cost_history;
create trigger recurring_cost_history_set_updated_at before update on public.recurring_cost_history
  for each row execute function public.handle_updated_at();

-- O primeiro snapshot começa na competência atual. Não inventamos salários
-- históricos para Julho: a folha consolidada importada continua sendo a fonte.
insert into public.employee_payroll_history (
  tenant_id, employee_id, effective_month, full_name, role, employment_type,
  status, salary, admission_date, control_attendance, attendance_control_from,
  weekly_day_off, monthly_sunday_off_ordinal, first_payment_percentage,
  final_payment_percentage
)
select tenant_id, id, to_char(current_date, 'YYYY-MM'), full_name, coalesce(role, ''),
  employment_type, status, salary, admission_date, control_attendance,
  attendance_control_from, weekly_day_off, monthly_sunday_off_ordinal,
  first_payment_percentage, final_payment_percentage
from public.employees
on conflict (tenant_id, employee_id, effective_month) do nothing;

insert into public.payroll_config_history (
  tenant_id, effective_month, salary_percentage, salary_business_day_ordinal,
  advance_percentage, advance_fixed_day, advance_business_day_policy,
  holiday_dates, meal_cost_per_workday, extra_kitchen_daily_rate,
  extra_motoboy_daily_rate
)
select tenant_id, to_char(current_date, 'YYYY-MM'), salary_percentage,
  salary_business_day_ordinal, advance_percentage, advance_fixed_day,
  advance_business_day_policy, holiday_dates, meal_cost_per_workday,
  extra_kitchen_daily_rate, extra_motoboy_daily_rate
from public.payroll_configs
on conflict (tenant_id, effective_month) do nothing;

insert into public.recurring_cost_history (
  tenant_id, recurring_cost_id, effective_month, description, amount, due_day,
  category, forecast_type, recurrence, weekday, active
)
select tenant_id, id, to_char(current_date, 'YYYY-MM'), description, amount,
  due_day, category, forecast_type, recurrence, weekday, active
from public.recurring_costs
on conflict (tenant_id, recurring_cost_id, effective_month) do nothing;

-- Trava também no banco: nem service role pode alterar silenciosamente uma
-- fonte do DRE de uma competência fechada.
create or replace function public.protected_competence_month(p_table text, p_row jsonb)
returns text language plpgsql stable set search_path = public as $$
declare v_month text;
begin
  if p_table = 'financial_obligations' then return p_row->>'competence_month'; end if;
  if p_table = 'financial_payments' then
    select competence_month into v_month from public.financial_obligations
    where id = (p_row->>'obligation_id')::uuid;
    return v_month;
  end if;
  if p_table = 'transactions' then return left(p_row->>'transaction_date', 7); end if;
  if p_table = 'daily_cash_reconciliations' then return left(p_row->>'reconciliation_date', 7); end if;
  if p_table = 'employee_work_logs' then return left(p_row->>'work_date', 7); end if;
  if p_table = 'payroll_adjustments' then return p_row->>'competence_month'; end if;
  if p_table = 'employee_scheduled_days_off' then
    return case when p_row->>'kind' = 'DATE' then left(p_row->>'off_date', 7) else to_char(current_date, 'YYYY-MM') end;
  end if;
  if p_table = 'extra_weekly_closings' then return left(p_row->>'period_start', 7); end if;
  return null;
end $$;

create or replace function public.prevent_closed_competence_mutation()
returns trigger language plpgsql set search_path = public as $$
declare
  v_tenant uuid;
  v_old_month text;
  v_new_month text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_tenant := (to_jsonb(old)->>'tenant_id')::uuid;
    v_old_month := public.protected_competence_month(tg_table_name, to_jsonb(old));
    if v_old_month is not null and exists (
      select 1 from public.financial_closings
      where tenant_id = v_tenant and period_type = 'monthly'
        and period_start = (v_old_month || '-01')::date and status = 'closed'
    ) then
      raise exception 'Competência % fechada. Reabra explicitamente antes de alterar o histórico.', v_old_month
        using errcode = 'P0001';
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_tenant := (to_jsonb(new)->>'tenant_id')::uuid;
    v_new_month := public.protected_competence_month(tg_table_name, to_jsonb(new));
    if v_new_month is not null and exists (
      select 1 from public.financial_closings
      where tenant_id = v_tenant and period_type = 'monthly'
        and period_start = (v_new_month || '-01')::date and status = 'closed'
    ) then
      raise exception 'Competência % fechada. Reabra explicitamente antes de alterar o histórico.', v_new_month
        using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

do $$
declare v_table text;
begin
  foreach v_table in array array[
    'financial_obligations', 'financial_payments', 'transactions',
    'daily_cash_reconciliations', 'employee_work_logs', 'payroll_adjustments',
    'employee_scheduled_days_off', 'extra_weekly_closings'
  ] loop
    execute format('drop trigger if exists protect_closed_competence on public.%I', v_table);
    execute format('create trigger protect_closed_competence before insert or update or delete on public.%I for each row execute function public.prevent_closed_competence_mutation()', v_table);
  end loop;
end $$;

-- Registra o estado corrompido antes da restauração. A diferença é explicada,
-- e não compensada: +3.800 de RH duplicado e -1.600 de Marketing sobrescrito.
insert into public.financial_migration_audits (tenant_id, audit_key, snapshot)
select id, 'DRE_2026-07_CORRUPTED_AFTER_NEW_RULES', '{
  "revenueGross": 59438.77,
  "revenueDeductions": 2008.94,
  "revenueNet": 57429.83,
  "costOfSales": 26497.52,
  "fixedPayroll": 7480.00,
  "extraPayroll": 14370.00,
  "employeeMeals": 0,
  "taxes": 784.48,
  "marketing": 400.00,
  "otherFixedCosts": 7210.02,
  "otherExpenses": 477.21,
  "netIncome": 210.60,
  "causes": [
    {"component":"FOLHA_FIXA","difference":3800.00,"reason":"Obrigações RH atuais foram geradas sobre a folha consolidada importada."},
    {"component":"MARKETING","difference":-1600.00,"reason":"O valor histórico de R$ 2.000 foi sobrescrito pela regra atual de R$ 400."}
  ]
}'::jsonb
from public.tenants where slug = 'bady-bassitt'
on conflict (tenant_id, audit_key) do nothing;

-- Remove somente a duplicação automática comprovada. Pagamentos impedem a
-- exclusão, preservando qualquer movimento financeiro efetivamente realizado.
delete from public.financial_obligations rh
where rh.tenant_id in (select id from public.tenants where slug = 'bady-bassitt')
  and rh.competence_month = '2026-07'
  and rh.source_type = 'RH'
  and not exists (select 1 from public.financial_payments p where p.obligation_id = rh.id)
  and exists (
    select 1 from public.financial_obligations imported
    where imported.tenant_id = rh.tenant_id
      and imported.competence_month = '2026-07'
      and imported.source_type = 'IMPORTED_SPREADSHEET'
      and imported.economic_category = 'FOLHA_FIXA'
  );

-- Restaura a fonte original comprovada pela planilha e pelo snapshot imutável.
update public.financial_obligations marketing
set forecast_amount = 2000.00,
    final_amount = 2000.00,
    paid_amount = 2000.00,
    status = 'PAID',
    note = 'Valor histórico restaurado da Planilha Jul/2026; não acompanha a regra vigente de Agosto.'
where marketing.tenant_id in (select id from public.tenants where slug = 'bady-bassitt')
  and marketing.competence_month = '2026-07'
  and marketing.source_type = 'IMPORTED_SPREADSHEET'
  and marketing.economic_category = 'MARKETING';

insert into public.financial_migration_audits (tenant_id, audit_key, snapshot)
select id, 'DRE_2026-07_RESTORED_AND_CLOSED', '{
  "revenueGross": 59438.77,
  "revenueDeductions": 2008.94,
  "revenueNet": 57429.83,
  "costOfSales": 26497.52,
  "fixedPayroll": 3680.00,
  "extraPayroll": 14370.00,
  "employeeMeals": 0,
  "taxes": 784.48,
  "marketing": 2000.00,
  "otherFixedCosts": 7210.02,
  "otherExpenses": 477.21,
  "netIncome": 2410.60,
  "cmvPercent": 46.13894904442517
}'::jsonb
from public.tenants where slug = 'bady-bassitt'
on conflict (tenant_id, audit_key) do update set snapshot = excluded.snapshot;

insert into public.financial_closings (
  tenant_id, period_type, period_start, period_end, gross_revenue, net_revenue,
  manual_expenses, fixed_costs, payroll_costs, total_expenses, balance, status,
  snapshot, closed_at
)
select id, 'monthly', date '2026-07-01', date '2026-07-31', 59438.77,
  57429.83, 477.21, 9994.50, 18050.00, 55019.23, 2410.60, 'closed',
  '{
    "version": 1,
    "source": "DRE_2026-07_RESTORED_AND_CLOSED",
    "dre": {
      "month": "2026-07",
      "revenueGross": 59438.77,
      "revenueDeductions": 2008.94,
      "revenueNet": 57429.83,
      "officialRevenue": 57429.83,
      "costOfSales": 26497.52,
      "sellingExpenses": 2000.00,
      "administrativeExpenses": 25737.23,
      "financialExpenses": 0,
      "incomeTaxes": 784.48,
      "netIncome": 2410.60,
      "cmvPercent": 46.13894904442517,
      "details": {
        "fixedPayroll": 3680.00,
        "extraPayroll": 14370.00,
        "employeeMeals": 0,
        "otherFixedCosts": 7210.02,
        "otherExpenses": 477.21,
        "marketing": 2000.00,
        "taxes": 784.48
      }
    },
    "closedReason": "Restauração auditável do consolidado original de Julho/2026."
  }'::jsonb,
  timezone('utc', now())
from public.tenants where slug = 'bady-bassitt'
on conflict (tenant_id, period_type, period_start, period_end) do update
set gross_revenue = excluded.gross_revenue,
    net_revenue = excluded.net_revenue,
    manual_expenses = excluded.manual_expenses,
    fixed_costs = excluded.fixed_costs,
    payroll_costs = excluded.payroll_costs,
    total_expenses = excluded.total_expenses,
    balance = excluded.balance,
    status = 'closed',
    snapshot = excluded.snapshot,
    closed_at = excluded.closed_at;
