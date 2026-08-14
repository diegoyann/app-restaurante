-- Converte a conferência diária já importada da planilha para a estrutura nova.
-- Mantém os lançamentos originais como trilha de auditoria e não cria receita na DRE.

update public.transactions
set financial_origin = case
      when category ~* 'saída de dinheiro' then 'CASH'
      when category ~* 'saída de conta' then 'BANK'
      else financial_origin
    end,
    economic_category = case
      when note ~* 'insumo' and category ~* 'saída' then 'INSUMO'
      else economic_category
    end
where type = 'controle'
  and category ~* '^Conferência \| Saída de (dinheiro|conta)$';

with legacy_daily as (
  select
    tenant_id,
    transaction_date,
    coalesce(sum(amount) filter (where category = 'Conferência | Entrada'), 0) as gross_revenue,
    coalesce(sum(amount) filter (where category = 'Conferência | Dinheiro'), 0) as cash_revenue,
    coalesce(sum(amount) filter (where category = 'Conferência | Saída de dinheiro'), 0) as cash_outflow,
    sum(amount) filter (where category = 'Conferência | Perda') as cash_difference
  from public.transactions
  where type = 'controle'
    and category in (
      'Conferência | Entrada',
      'Conferência | Dinheiro',
      'Conferência | Saída de dinheiro',
      'Conferência | Perda'
    )
  group by tenant_id, transaction_date
)
insert into public.daily_cash_reconciliations (
  tenant_id,
  reconciliation_date,
  gross_revenue,
  cash_revenue,
  opening_cash_balance,
  counted_closing_cash,
  observation
)
select
  tenant_id,
  transaction_date,
  gross_revenue,
  least(cash_revenue, gross_revenue),
  0,
  case
    when cash_difference is null then null
    else greatest(cash_revenue - cash_outflow + cash_difference, 0)
  end,
  'Importado da conferência diária da planilha; lançamentos originais preservados.'
from legacy_daily
where gross_revenue > 0
on conflict (tenant_id, reconciliation_date) do nothing;
