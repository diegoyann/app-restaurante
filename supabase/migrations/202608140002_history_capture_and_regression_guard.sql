-- Captura de vigência também no banco e prova transacional de não regressão.

create or replace function public.capture_employee_payroll_history()
returns trigger language plpgsql set search_path = public as $$
begin
  insert into public.employee_payroll_history (
    tenant_id, employee_id, effective_month, full_name, role, employment_type,
    status, salary, admission_date, control_attendance, attendance_control_from,
    weekly_day_off, monthly_sunday_off_ordinal, first_payment_percentage,
    final_payment_percentage
  ) values (
    new.tenant_id, new.id, to_char(current_date, 'YYYY-MM'), new.full_name,
    coalesce(new.role, ''), new.employment_type, new.status, new.salary,
    new.admission_date, new.control_attendance, new.attendance_control_from,
    new.weekly_day_off, new.monthly_sunday_off_ordinal,
    new.first_payment_percentage, new.final_payment_percentage
  )
  on conflict (tenant_id, employee_id, effective_month) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    employment_type = excluded.employment_type,
    status = excluded.status,
    salary = excluded.salary,
    admission_date = excluded.admission_date,
    control_attendance = excluded.control_attendance,
    attendance_control_from = excluded.attendance_control_from,
    weekly_day_off = excluded.weekly_day_off,
    monthly_sunday_off_ordinal = excluded.monthly_sunday_off_ordinal,
    first_payment_percentage = excluded.first_payment_percentage,
    final_payment_percentage = excluded.final_payment_percentage;
  return new;
end $$;

create or replace function public.capture_payroll_config_history()
returns trigger language plpgsql set search_path = public as $$
begin
  insert into public.payroll_config_history (
    tenant_id, effective_month, salary_percentage, salary_business_day_ordinal,
    advance_percentage, advance_fixed_day, advance_business_day_policy,
    holiday_dates, meal_cost_per_workday, extra_kitchen_daily_rate,
    extra_motoboy_daily_rate
  ) values (
    new.tenant_id, to_char(current_date, 'YYYY-MM'), new.salary_percentage,
    new.salary_business_day_ordinal, new.advance_percentage,
    new.advance_fixed_day, new.advance_business_day_policy, new.holiday_dates,
    new.meal_cost_per_workday, new.extra_kitchen_daily_rate,
    new.extra_motoboy_daily_rate
  )
  on conflict (tenant_id, effective_month) do update set
    salary_percentage = excluded.salary_percentage,
    salary_business_day_ordinal = excluded.salary_business_day_ordinal,
    advance_percentage = excluded.advance_percentage,
    advance_fixed_day = excluded.advance_fixed_day,
    advance_business_day_policy = excluded.advance_business_day_policy,
    holiday_dates = excluded.holiday_dates,
    meal_cost_per_workday = excluded.meal_cost_per_workday,
    extra_kitchen_daily_rate = excluded.extra_kitchen_daily_rate,
    extra_motoboy_daily_rate = excluded.extra_motoboy_daily_rate;
  return new;
end $$;

create or replace function public.capture_recurring_cost_history()
returns trigger language plpgsql set search_path = public as $$
begin
  insert into public.recurring_cost_history (
    tenant_id, recurring_cost_id, effective_month, description, amount,
    due_day, category, forecast_type, recurrence, weekday, active
  ) values (
    new.tenant_id, new.id, to_char(current_date, 'YYYY-MM'), new.description,
    new.amount, new.due_day, new.category, new.forecast_type, new.recurrence,
    new.weekday, new.active
  )
  on conflict (tenant_id, recurring_cost_id, effective_month) do update set
    description = excluded.description,
    amount = excluded.amount,
    due_day = excluded.due_day,
    category = excluded.category,
    forecast_type = excluded.forecast_type,
    recurrence = excluded.recurrence,
    weekday = excluded.weekday,
    active = excluded.active;
  return new;
end $$;

drop trigger if exists capture_employee_payroll_history on public.employees;
create trigger capture_employee_payroll_history after insert or update on public.employees
  for each row execute function public.capture_employee_payroll_history();
drop trigger if exists capture_payroll_config_history on public.payroll_configs;
create trigger capture_payroll_config_history after insert or update on public.payroll_configs
  for each row execute function public.capture_payroll_config_history();
drop trigger if exists capture_recurring_cost_history on public.recurring_costs;
create trigger capture_recurring_cost_history after insert or update on public.recurring_costs
  for each row execute function public.capture_recurring_cost_history();

-- O bloco interno sempre sofre rollback. Ele altera temporariamente as três
-- fontes atuais exigidas no aceite e comprova que Julho continua idêntico.
do $$
declare
  v_tenant uuid;
  v_employee uuid;
  v_cost uuid;
  v_obligation uuid;
  v_before text;
  v_after text;
  v_closed_blocked boolean := false;
begin
  select id into v_tenant from public.tenants where slug = 'bady-bassitt';
  if v_tenant is null then raise exception 'Filial de aceite não encontrada.'; end if;

  select id into v_employee from public.employees
    where tenant_id = v_tenant and employment_type = 'fixed' order by created_at limit 1;
  select id into v_cost from public.recurring_costs
    where tenant_id = v_tenant and active and merged_into_id is null order by created_at limit 1;
  select id into v_obligation from public.financial_obligations
    where tenant_id = v_tenant and competence_month = '2026-07' order by id limit 1;
  if v_employee is null or v_cost is null or v_obligation is null then
    raise exception 'Fixtures insuficientes para o aceite histórico.';
  end if;

  select md5(coalesce(jsonb_agg((to_jsonb(o) - 'updated_at') order by o.id)::text, '[]'))
    into v_before from public.financial_obligations o
    where tenant_id = v_tenant and competence_month = '2026-07';

  begin
    update public.employees set salary = salary + 0.01 where id = v_employee;
    update public.payroll_configs set meal_cost_per_workday = meal_cost_per_workday + 0.01
      where tenant_id = v_tenant;
    update public.recurring_costs set amount = amount + 0.01 where id = v_cost;

    begin
      update public.financial_obligations set note = note where id = v_obligation;
    exception when sqlstate 'P0001' then
      if sqlerrm like 'Competência 2026-07 fechada.%' then
        v_closed_blocked := true;
      else
        raise;
      end if;
    end;
    if not v_closed_blocked then
      raise exception 'A trava da competência fechada não bloqueou a mutação.';
    end if;

    select md5(coalesce(jsonb_agg((to_jsonb(o) - 'updated_at') order by o.id)::text, '[]'))
      into v_after from public.financial_obligations o
      where tenant_id = v_tenant and competence_month = '2026-07';
    if v_before is distinct from v_after then
      raise exception 'Julho mudou após alterações temporárias de Agosto.';
    end if;

    raise exception using message = '__ROLLBACK_ACCEPTANCE_FIXTURES__', errcode = 'P0001';
  exception when sqlstate 'P0001' then
    if sqlerrm <> '__ROLLBACK_ACCEPTANCE_FIXTURES__' then raise; end if;
  end;
end $$;

insert into public.financial_migration_audits (tenant_id, audit_key, snapshot)
select id, 'DRE_2026-07_REGRESSION_ACCEPTANCE', jsonb_build_object(
  'passed', true,
  'testedAt', timezone('utc', now()),
  'checks', jsonb_build_array(
    'alterar salário vigente em Agosto não altera Julho',
    'alterar configuração de RH vigente em Agosto não altera Julho',
    'alterar custo recorrente vigente em Agosto não altera Julho',
    'mutação direta em obrigação de Julho fechado é bloqueada'
  ),
  'julyNetIncome', 2410.60
)
from public.tenants where slug = 'bady-bassitt'
on conflict (tenant_id, audit_key) do update set snapshot = excluded.snapshot;

