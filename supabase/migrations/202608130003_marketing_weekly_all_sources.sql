-- O cadastro de Marketing já podia existir como importado/manual. A regra semanal
-- vale para a competência completa independentemente da origem do cadastro mestre.
update public.recurring_costs
set effective_from = least(effective_from, date_trunc('month', current_date)::date)
where normalized_key = 'marketing'
  and recurrence = 'WEEKLY'
  and active = true;
