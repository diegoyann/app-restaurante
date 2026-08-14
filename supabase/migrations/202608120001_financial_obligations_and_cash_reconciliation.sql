-- Evolução financeira aditiva: cadastro mestre -> obrigação -> pagamento.
-- Nenhum lançamento histórico é removido. Julho/2026 é registrado antes da migração.

alter table public.recurring_costs
  add column if not exists normalized_key text not null default '',
  add column if not exists category text not null default 'CUSTO_FIXO',
  add column if not exists forecast_type text not null default 'FIXED',
  add column if not exists recurrence text not null default 'MONTHLY',
  add column if not exists active boolean not null default true,
  add column if not exists aliases jsonb not null default '[]'::jsonb,
  add column if not exists source_type text not null default 'MANUAL',
  add column if not exists original_import_label text not null default '',
  add column if not exists merged_into_id uuid references public.recurring_costs(id),
  add column if not exists requires_duplicate_review boolean not null default false;

alter table public.recurring_costs drop constraint if exists recurring_costs_forecast_type_check;
alter table public.recurring_costs add constraint recurring_costs_forecast_type_check check (forecast_type in ('FIXED', 'ESTIMATED'));
alter table public.recurring_costs drop constraint if exists recurring_costs_recurrence_check;
alter table public.recurring_costs add constraint recurring_costs_recurrence_check check (recurrence in ('MONTHLY'));

create table if not exists public.financial_obligations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  recurring_cost_id uuid references public.recurring_costs(id),
  employee_id uuid references public.employees(id),
  extra_weekly_closing_id uuid references public.extra_weekly_closings(id),
  description text not null,
  economic_category text not null,
  source_type text not null,
  source_id text not null,
  original_import_label text not null default '',
  competence_month text not null check (competence_month ~ '^\d{4}-\d{2}$'),
  forecast_type text not null default 'FIXED' check (forecast_type in ('FIXED', 'ESTIMATED')),
  forecast_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2),
  due_date date not null,
  status text not null default 'EXPECTED' check (status in ('EXPECTED', 'DUE_SOON', 'OVERDUE', 'PARTIAL', 'PAID')),
  paid_amount numeric(12,2) not null default 0,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, source_type, source_id, competence_month)
);

create table if not exists public.financial_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  obligation_id uuid not null references public.financial_obligations(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null,
  financial_origin text not null check (financial_origin in ('BANK', 'CASH')),
  payment_method text not null check (payment_method in ('PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER')),
  observation text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  reconciliation_date date not null,
  gross_revenue numeric(12,2) not null default 0,
  cash_revenue numeric(12,2) not null default 0,
  opening_cash_balance numeric(12,2) not null default 0,
  counted_closing_cash numeric(12,2),
  observation text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, reconciliation_date),
  check (cash_revenue >= 0 and gross_revenue >= cash_revenue)
);

create table if not exists public.recurring_cost_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  left_cost_id uuid not null references public.recurring_costs(id),
  right_cost_id uuid not null references public.recurring_costs(id),
  reason text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'REJECTED')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, left_cost_id, right_cost_id)
);

create table if not exists public.financial_migration_audits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  audit_key text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, audit_key)
);

alter table public.transactions
  add column if not exists economic_category text not null default '',
  add column if not exists financial_origin text not null default '',
  add column if not exists obligation_id uuid references public.financial_obligations(id),
  add column if not exists payment_id uuid references public.financial_payments(id);

create index if not exists financial_obligations_tenant_competence_idx on public.financial_obligations (tenant_id, competence_month);
create index if not exists financial_obligations_tenant_due_idx on public.financial_obligations (tenant_id, due_date, status);
create index if not exists financial_payments_obligation_idx on public.financial_payments (obligation_id, payment_date);
create index if not exists daily_cash_reconciliations_tenant_date_idx on public.daily_cash_reconciliations (tenant_id, reconciliation_date);
alter table public.financial_obligations enable row level security;
alter table public.financial_payments enable row level security;
alter table public.daily_cash_reconciliations enable row level security;
alter table public.recurring_cost_duplicate_candidates enable row level security;
alter table public.financial_migration_audits enable row level security;

drop policy if exists "financial obligations by tenant access" on public.financial_obligations;
create policy "financial obligations by tenant access" on public.financial_obligations for all to authenticated
using (public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "financial payments by tenant access" on public.financial_payments;
create policy "financial payments by tenant access" on public.financial_payments for all to authenticated
using (public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "cash reconciliations by tenant access" on public.daily_cash_reconciliations;
create policy "cash reconciliations by tenant access" on public.daily_cash_reconciliations for all to authenticated
using (public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "duplicate candidates by tenant access" on public.recurring_cost_duplicate_candidates;
create policy "duplicate candidates by tenant access" on public.recurring_cost_duplicate_candidates for all to authenticated
using (public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_has_tenant_access(tenant_id));
drop policy if exists "financial audits by tenant access" on public.financial_migration_audits;
create policy "financial audits by tenant access" on public.financial_migration_audits for select to authenticated
using (public.current_user_has_tenant_access(tenant_id));

drop trigger if exists financial_obligations_set_updated_at on public.financial_obligations;
create trigger financial_obligations_set_updated_at before update on public.financial_obligations for each row execute function public.handle_updated_at();
drop trigger if exists daily_cash_reconciliations_set_updated_at on public.daily_cash_reconciliations;
create trigger daily_cash_reconciliations_set_updated_at before update on public.daily_cash_reconciliations for each row execute function public.handle_updated_at();

-- Snapshot imutável calculado antes da migração para a filial alvo.
insert into public.financial_migration_audits (tenant_id, audit_key, snapshot)
select id, 'DRE_2026-07_BEFORE_OBLIGATIONS', '{
  "revenueGross": 59438.77,
  "revenueDeductions": 2008.94,
  "revenueNet": 57429.83,
  "costOfSales": 26497.52,
  "administrativeExpenses": 28521.71,
  "personnelCost": 18050.00,
  "operatingResult": 2410.60,
  "netIncome": 2410.60,
  "totalOutflows": 57028.17,
  "cmvPercent": 46.13894904442517
}'::jsonb
from public.tenants where slug = 'bady-bassitt'
on conflict (tenant_id, audit_key) do nothing;

-- Preserva o rótulo original e limpa apenas o nome visual.
update public.recurring_costs
set original_import_label = description,
    source_type = 'IMPORTED_SPREADSHEET',
    description = trim(regexp_replace(description, '^Planilha\s+[^—-]+\s+[—-]\s+Custos\s+Fixos\s+[—-]\s+', '', 'i'))
where description ~* '^Planilha\s+' and original_import_label = '';

update public.recurring_costs
set normalized_key = trim(regexp_replace(lower(translate(description,
  'áàâãäéèêëíìîïóòôõöúùûüç',
  'aaaaaeeeeiiiiooooouuuuc')), '\s+', ' ', 'g')),
    category = case
      when description ~* 'folha\s*fix' then 'FOLHA_FIXA'
      when description ~* 'folha\s*extra' then 'FOLHA_EXTRA'
      when description ~* 'imposto' then 'IMPOSTO'
      when description ~* 'marketing' then 'MARKETING'
      else 'CUSTO_FIXO'
    end,
    forecast_type = case when description ~* 'água|agua|luz|imposto' then 'ESTIMATED' else 'FIXED' end;

-- Folhas históricas são competência importada, não cadastros recorrentes.
update public.recurring_costs set active = false
where source_type = 'IMPORTED_SPREADSHEET' and category in ('FOLHA_FIXA', 'FOLHA_EXTRA');

-- Match exato normalizado: mantém o mestre e preserva o registro importado vinculado.
update public.recurring_costs imported
set merged_into_id = master.id, active = false
from public.recurring_costs master
where imported.tenant_id = master.tenant_id
  and imported.id <> master.id
  and imported.source_type = 'IMPORTED_SPREADSHEET'
  and master.source_type <> 'IMPORTED_SPREADSHEET'
  and imported.category = master.category
  and imported.normalized_key = master.normalized_key;

-- Contador x Contadora é apenas candidato; não ocorre fusão silenciosa.
insert into public.recurring_cost_duplicate_candidates (tenant_id, left_cost_id, right_cost_id, reason)
select a.tenant_id, a.id, b.id, 'Nomes semelhantes: revisão humana necessária'
from public.recurring_costs a
join public.recurring_costs b on b.tenant_id = a.tenant_id and a.id < b.id
where (a.normalized_key = 'contador' and b.normalized_key = 'contadora')
   or (a.normalized_key = 'contadora' and b.normalized_key = 'contador')
on conflict (tenant_id, left_cost_id, right_cost_id) do nothing;

update public.recurring_costs set requires_duplicate_review = true
where normalized_key in ('contador', 'contadora')
  and tenant_id in (select tenant_id from public.recurring_cost_duplicate_candidates where status = 'PENDING');

-- Enquanto a revisão não ocorre, o item importado semelhante não gera uma segunda obrigação futura.
update public.recurring_costs set active = false
where source_type = 'IMPORTED_SPREADSHEET' and requires_duplicate_review = true;

create unique index if not exists recurring_costs_active_normalized_key_idx
  on public.recurring_costs (tenant_id, category, normalized_key)
  where active and merged_into_id is null and normalized_key <> '';
