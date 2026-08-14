-- Estoque e Compras V1: extensão aditiva sobre ingredients e financeiro existentes.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  document text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  notes text not null default '',
  order_weekday integer check (order_weekday between 0 and 6),
  delivery_lead_days integer not null default 0 check (delivery_lead_days >= 0),
  payment_term_type text not null default 'DAYS_AFTER_RECEIPT' check (payment_term_type in ('ON_RECEIPT', 'DAYS_AFTER_RECEIPT', 'FIXED_DATE')),
  payment_term_days integer not null default 0 check (payment_term_days >= 0),
  default_payment_method text not null default 'BOLETO' check (default_payment_method in ('PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER')),
  default_financial_origin text not null default 'BANK' check (default_financial_origin in ('BANK', 'CASH')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, name)
);

alter table public.ingredients
  add column if not exists category text not null default 'GERAL',
  add column if not exists stock_minimum numeric(14,3),
  add column if not exists active boolean not null default true,
  add column if not exists primary_supplier_id uuid references public.suppliers(id) on delete set null;

create table if not exists public.supplier_ingredients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  supplier_sku text not null default '',
  default_unit text not null default '',
  last_price numeric(12,4),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, supplier_id, ingredient_id)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  order_date date not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ORDERED', 'AWAITING_DELIVERY', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
  notes text not null default '',
  payment_term_type text not null default 'DAYS_AFTER_RECEIPT' check (payment_term_type in ('ON_RECEIPT', 'DAYS_AFTER_RECEIPT', 'FIXED_DATE')),
  payment_term_days integer not null default 0 check (payment_term_days >= 0),
  default_payment_method text not null default 'BOLETO' check (default_payment_method in ('PIX', 'TRANSFER', 'BOLETO', 'CARD', 'CASH', 'OTHER')),
  default_financial_origin text not null default 'BANK' check (default_financial_origin in ('BANK', 'CASH')),
  created_by uuid,
  cancelled_at timestamptz,
  cancellation_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  ordered_quantity numeric(14,3) not null check (ordered_quantity > 0),
  unit text not null,
  estimated_unit_price numeric(12,4),
  observation text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (purchase_order_id, ingredient_id)
);

create table if not exists public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  received_at date not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVERSED')),
  total_amount numeric(12,2) not null default 0,
  financial_obligation_id uuid,
  observation text not null default '',
  received_by uuid,
  reversed_at timestamptz,
  reversed_by uuid,
  reversal_reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.purchase_receipt_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  purchase_receipt_id uuid not null references public.purchase_receipts(id) on delete restrict,
  purchase_order_item_id uuid not null references public.purchase_order_items(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  received_quantity numeric(14,3) not null check (received_quantity > 0),
  unit text not null,
  actual_unit_price numeric(12,4) not null check (actual_unit_price >= 0),
  total_amount numeric(12,2) not null default 0,
  observation text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  movement_date date not null,
  movement_type text not null check (movement_type in ('RECEIPT', 'RECEIPT_REVERSAL', 'INVENTORY_ADJUSTMENT', 'OPENING_ROLLOVER')),
  quantity numeric(14,3) not null,
  unit_cost numeric(12,4) not null default 0,
  total_value numeric(12,2) not null default 0,
  source_type text not null,
  source_id text not null,
  observation text not null default '',
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, source_type, source_id, ingredient_id)
);

create table if not exists public.ingredient_price_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  purchase_receipt_item_id uuid not null references public.purchase_receipt_items(id) on delete restrict,
  price_date date not null,
  unit text not null,
  unit_price numeric(12,4) not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (purchase_receipt_item_id)
);

create table if not exists public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  competence_month text not null check (competence_month ~ '^\d{4}-\d{2}$'),
  count_type text not null check (count_type in ('OPENING', 'CLOSING')),
  count_date date not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'CLOSED', 'REOPENED', 'CANCELLED')),
  total_value numeric(12,2) not null default 0,
  source_inventory_count_id uuid references public.inventory_counts(id) on delete restrict,
  observation text not null default '',
  created_by uuid,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, competence_month, count_type)
);

create table if not exists public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  inventory_count_id uuid not null references public.inventory_counts(id) on delete restrict,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  unit text not null,
  unit_cost numeric(12,4) not null default 0,
  total_value numeric(12,2) not null default 0,
  observation text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (inventory_count_id, ingredient_id)
);

create table if not exists public.financial_balance_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  competence_month text not null check (competence_month ~ '^\d{4}-\d{2}$'),
  opening_bank_balance numeric(12,2) not null default 0,
  opening_cash_balance numeric(12,2) not null default 0,
  actual_closing_bank_balance numeric(12,2),
  actual_closing_cash_balance numeric(12,2),
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'REOPENED')),
  source_balance_period_id uuid references public.financial_balance_periods(id) on delete restrict,
  observation text not null default '',
  created_by uuid,
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, competence_month)
);

create table if not exists public.financial_account_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  movement_date date not null,
  movement_type text not null check (movement_type in ('TRANSFER', 'RECONCILIATION_ADJUSTMENT')),
  bank_amount numeric(12,2) not null default 0,
  cash_amount numeric(12,2) not null default 0,
  reason text not null,
  observation text not null default '',
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'REVERSED')),
  reversed_at timestamptz,
  reversed_by uuid,
  reversal_reason text not null default '',
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((movement_type = 'TRANSFER' and round(bank_amount + cash_amount, 2) = 0) or movement_type = 'RECONCILIATION_ADJUSTMENT')
);

create table if not exists public.operation_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  previous_value jsonb,
  new_value jsonb,
  observation text not null default '',
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.financial_obligations
  add column if not exists purchase_receipt_id uuid references public.purchase_receipts(id) on delete restrict;
alter table public.purchase_receipts
  add constraint purchase_receipts_financial_obligation_fkey foreign key (financial_obligation_id) references public.financial_obligations(id) on delete restrict;

create index if not exists supplier_ingredients_supplier_idx on public.supplier_ingredients (tenant_id, supplier_id, active);
create index if not exists purchase_orders_status_date_idx on public.purchase_orders (tenant_id, status, order_date desc);
create index if not exists purchase_receipts_order_date_idx on public.purchase_receipts (tenant_id, purchase_order_id, received_at);
create index if not exists inventory_movements_ingredient_date_idx on public.inventory_movements (tenant_id, ingredient_id, movement_date);
create index if not exists inventory_counts_month_idx on public.inventory_counts (tenant_id, competence_month, count_type);
create index if not exists financial_balance_periods_month_idx on public.financial_balance_periods (tenant_id, competence_month);
create index if not exists financial_account_movements_date_idx on public.financial_account_movements (tenant_id, movement_date);
create index if not exists operation_audit_entity_idx on public.operation_audit_events (tenant_id, entity_type, entity_id, created_at desc);

do $$ declare table_name text; begin
  foreach table_name in array array['suppliers','supplier_ingredients','purchase_orders','purchase_order_items','purchase_receipts','purchase_receipt_items','inventory_movements','ingredient_price_history','inventory_counts','inventory_count_items','financial_balance_periods','financial_account_movements','operation_audit_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_access', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_has_tenant_access(tenant_id))', table_name || '_tenant_access', table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['suppliers','supplier_ingredients','purchase_orders','purchase_order_items','purchase_receipts','inventory_counts','inventory_count_items','financial_balance_periods','financial_account_movements'] loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.handle_updated_at()', table_name || '_set_updated_at', table_name);
  end loop;
end $$;
