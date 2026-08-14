-- Corrige normalização de letras maiúsculas acentuadas (Água -> agua).
-- Remove somente previsões derivadas, futuras/não pagas, do cadastro duplicado.

drop index if exists public.recurring_costs_active_normalized_key_idx;

update public.recurring_costs
set normalized_key = trim(regexp_replace(translate(lower(description),
  'áàâãäéèêëíìîïóòôõöúùûüç',
  'aaaaaeeeeiiiiooooouuuuc'), '\s+', ' ', 'g'));

update public.recurring_costs imported
set merged_into_id = master.id, active = false
from public.recurring_costs master
where imported.tenant_id = master.tenant_id
  and imported.id <> master.id
  and imported.source_type = 'IMPORTED_SPREADSHEET'
  and master.source_type <> 'IMPORTED_SPREADSHEET'
  and imported.category = master.category
  and imported.normalized_key = master.normalized_key;

delete from public.financial_obligations obligation
using public.recurring_costs imported
where obligation.tenant_id = imported.tenant_id
  and obligation.source_type = 'RECURRING'
  and obligation.source_id = imported.id::text
  and obligation.paid_amount = 0
  and imported.merged_into_id is not null;

create unique index recurring_costs_active_normalized_key_idx
  on public.recurring_costs (tenant_id, category, normalized_key)
  where active and merged_into_id is null and normalized_key <> '';
