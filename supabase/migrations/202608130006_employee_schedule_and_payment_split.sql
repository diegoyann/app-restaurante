alter table public.employees
  add column if not exists weekly_day_off smallint,
  add column if not exists monthly_sunday_off_ordinal smallint,
  add column if not exists first_payment_percentage numeric(5,2),
  add column if not exists final_payment_percentage numeric(5,2);

alter table public.employees
  drop constraint if exists employees_weekly_day_off_check,
  add constraint employees_weekly_day_off_check
    check (weekly_day_off is null or weekly_day_off between 0 and 6),
  drop constraint if exists employees_monthly_sunday_off_ordinal_check,
  add constraint employees_monthly_sunday_off_ordinal_check
    check (monthly_sunday_off_ordinal is null or monthly_sunday_off_ordinal between 1 and 5),
  drop constraint if exists employees_payment_split_check,
  add constraint employees_payment_split_check check (
    (first_payment_percentage is null and final_payment_percentage is null)
    or (
      first_payment_percentage between 0 and 100
      and final_payment_percentage between 0 and 100
      and first_payment_percentage + final_payment_percentage = 100
    )
  );

update public.employees employee
set weekly_day_off = source.weekday
from (
  select distinct on (employee_id) employee_id, weekday
  from public.employee_scheduled_days_off
  where kind = 'WEEKLY' and active = true and weekday is not null
  order by employee_id, created_at
) source
where employee.id = source.employee_id
  and employee.weekly_day_off is null;

comment on column public.employees.weekly_day_off is
  'Folga semanal principal do funcionário fixo: 0=domingo até 6=sábado.';
comment on column public.employees.monthly_sunday_off_ordinal is
  'Domingo mensal de folga: ordinal entre 1 e 5.';
comment on column public.employees.first_payment_percentage is
  'Percentual individual da primeira parcela; nulo usa o padrão da empresa.';
comment on column public.employees.final_payment_percentage is
  'Percentual individual da parcela final; nulo usa o padrão da empresa.';
