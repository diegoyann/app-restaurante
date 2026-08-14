-- A regra padrão de Marketing deve valer para toda a competência em que foi criada,
-- inclusive segundas anteriores à data da implantação.
update public.recurring_costs
set effective_from = date_trunc('month', current_date)::date
where normalized_key = 'marketing'
  and source_type = 'SYSTEM_RULE'
  and recurrence = 'WEEKLY';
