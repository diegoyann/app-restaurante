alter table public.financial_obligations
  add column if not exists suggested_payment_method text,
  add column if not exists suggested_financial_origin text;

alter table public.financial_obligations
  drop constraint if exists financial_obligations_suggested_payment_method_check;
alter table public.financial_obligations
  add constraint financial_obligations_suggested_payment_method_check
  check (suggested_payment_method is null or suggested_payment_method in ('PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER'));

alter table public.financial_obligations
  drop constraint if exists financial_obligations_suggested_financial_origin_check;
alter table public.financial_obligations
  add constraint financial_obligations_suggested_financial_origin_check
  check (suggested_financial_origin is null or suggested_financial_origin in ('BANK', 'CASH'));

comment on column public.financial_obligations.suggested_payment_method is 'Sugestão copiada da condição comercial no momento em que a obrigação nasce; não limita pagamentos mistos.';
comment on column public.financial_obligations.suggested_financial_origin is 'Origem financeira sugerida no recebimento; cada pagamento ainda pode escolher banco ou dinheiro.';
