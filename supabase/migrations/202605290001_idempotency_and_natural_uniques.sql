create table if not exists public.mutation_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  route text not null,
  method text not null,
  idempotency_key text not null,
  body_hash text not null,
  status text not null default 'processing',
  status_code integer,
  response_payload jsonb,
  result_id text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint mutation_idempotency_keys_status_check check (status in ('processing', 'completed'))
);

create unique index if not exists mutation_idempotency_keys_scope_key
on public.mutation_idempotency_keys (tenant_id, route, method, idempotency_key);

create index if not exists mutation_idempotency_keys_created_at_idx
on public.mutation_idempotency_keys (created_at);

alter table public.mutation_idempotency_keys enable row level security;

do $$
begin
  if exists (
    select 1
    from public.menu_categories
    group by tenant_id, lower(trim(name))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em menu_categories por tenant/name. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.payment_methods
    group by tenant_id, lower(trim(name))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em payment_methods por tenant/name. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.ingredient_units
    group by tenant_id, lower(trim(label))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em ingredient_units por tenant/label. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.ingredients
    group by tenant_id, lower(trim(name)), lower(trim(unit))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em ingredients por tenant/name/unit. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.preparations
    group by tenant_id, lower(trim(name))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em preparations por tenant/name. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.products
    group by tenant_id, lower(trim(name))
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em products por tenant/name. Limpe antes de aplicar o índice único.';
  end if;

  if exists (
    select 1
    from public.customers
    where trim(phone) <> ''
    group by tenant_id, trim(phone)
    having count(*) > 1
  ) then
    raise exception 'Duplicatas existentes em customers por tenant/phone. Limpe antes de aplicar o índice único.';
  end if;
end $$;

create unique index if not exists menu_categories_tenant_name_unique
on public.menu_categories (tenant_id, lower(trim(name)));

create unique index if not exists payment_methods_tenant_name_unique
on public.payment_methods (tenant_id, lower(trim(name)));

create unique index if not exists ingredient_units_tenant_label_unique
on public.ingredient_units (tenant_id, lower(trim(label)));

create unique index if not exists ingredients_tenant_name_unit_unique
on public.ingredients (tenant_id, lower(trim(name)), lower(trim(unit)));

create unique index if not exists preparations_tenant_name_unique
on public.preparations (tenant_id, lower(trim(name)));

create unique index if not exists products_tenant_name_unique
on public.products (tenant_id, lower(trim(name)));

create unique index if not exists customers_tenant_phone_unique
on public.customers (tenant_id, trim(phone))
where trim(phone) <> '';
