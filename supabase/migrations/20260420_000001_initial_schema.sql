create extension if not exists "pgcrypto";

create type public.app_status as enum ('active', 'inactive');
create type public.membership_role as enum ('super_admin', 'tenant_admin', 'tenant_staff');
create type public.employment_type as enum ('fixed', 'external');
create type public.review_source as enum ('google', 'ifood');
create type public.review_sentiment as enum ('negative', 'neutral', 'positive');
create type public.review_status as enum ('pending', 'resolved');
create type public.menu_item_type as enum ('single', 'combo');

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  status public.app_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  business_name text not null,
  status public.app_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  role public.membership_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, tenant_id, role)
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  ifood_tax numeric(10,2) not null default 0,
  anotaai_tax numeric(10,2) not null default 0,
  app_password_hint text not null default '',
  business_name text not null default '',
  alert_days_before integer not null default 3,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_ai_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  positive_tone text not null default 'friendly',
  crisis_strategy text not null default 'whatsapp',
  additional_instructions text not null default '',
  auto_publish_positive boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payroll_configs (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  salary_percentage numeric(10,2) not null default 60,
  salary_business_day_ordinal integer not null default 5,
  advance_percentage numeric(10,2) not null default 40,
  advance_fixed_day integer not null default 20,
  advance_business_day_policy text not null default 'next',
  holiday_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finance_expense_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recurring_costs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null default 0,
  due_day integer not null,
  last_paid_month text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discount_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  marital_status text not null default '',
  role text not null default '',
  notes text not null default '',
  employment_type public.employment_type not null default 'fixed',
  status public.app_status not null default 'active',
  salary numeric(12,2) not null default 0,
  admission_date date,
  payment_mode text not null default 'weekly',
  base_amount numeric(12,2) not null default 0,
  weekday text not null default '1',
  specific_date date,
  start_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_discounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  category text not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  transaction_date date not null,
  platform text not null,
  payment text not null default '',
  amount numeric(12,2) not null,
  tax numeric(10,2) not null default 0,
  net_amount numeric(12,2) not null,
  type text not null,
  category text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ingredient_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  unit text not null,
  package_quantity numeric(12,3) not null default 0,
  package_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.preparations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  yield_quantity numeric(12,3) not null default 1,
  yield_unit text not null,
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  sale_price numeric(12,2) not null default 0,
  yield_quantity numeric(12,3) not null default 1,
  target_cmv_percent numeric(10,2) not null default 30,
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  item_type public.menu_item_type not null default 'single',
  name text not null,
  description text not null default '',
  status text not null default 'active',
  sale_price numeric(12,2) not null default 0,
  base_price numeric(12,2) not null default 0,
  photo_preview text not null default '',
  linked_component_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.combo_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  min_select integer not null default 1,
  max_select integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.combo_options (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  combo_group_id uuid not null references public.combo_groups(id) on delete cascade,
  name text not null,
  photo_preview text not null default '',
  extra_price numeric(12,2) not null default 0,
  max_qty integer not null default 1,
  is_available boolean not null default true,
  linked_category_name text not null default '',
  linked_category_names jsonb not null default '[]'::jsonb,
  linked_component_ref text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source public.review_source not null,
  source_review_id text not null default '',
  company_key text not null default '',
  company_label text not null default '',
  unit_label text not null default '',
  channel_label text not null default '',
  reviewer_name text not null,
  reviewer_initials text not null default '',
  reviewer_location text not null default '',
  rating integer not null default 5,
  sentiment public.review_sentiment not null default 'neutral',
  status public.review_status not null default 'pending',
  resolution_type text,
  created_at_label text not null default '',
  published_reply text not null default '',
  tags jsonb not null default '[]'::jsonb,
  comment text not null default '',
  ai_suggestion text not null default '',
  integration_status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  body text not null,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.tenant_ai_settings enable row level security;
alter table public.payroll_configs enable row level security;
alter table public.sales_channels enable row level security;
alter table public.finance_expense_categories enable row level security;
alter table public.recurring_costs enable row level security;
alter table public.employee_roles enable row level security;
alter table public.discount_categories enable row level security;
alter table public.employees enable row level security;
alter table public.employee_discounts enable row level security;
alter table public.transactions enable row level security;
alter table public.ingredient_units enable row level security;
alter table public.ingredients enable row level security;
alter table public.preparations enable row level security;
alter table public.products enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.combo_groups enable row level security;
alter table public.combo_options enable row level security;
alter table public.reviews enable row level security;
alter table public.review_replies enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.role = 'super_admin'
  );
$$;

create or replace function public.current_user_has_tenant_access(check_tenant_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.current_user_is_super_admin()
    or exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = auth.uid()
        and tm.tenant_id = check_tenant_id
    );
$$;

create policy "profiles self or super admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_is_super_admin());

create policy "memberships self or super admin"
on public.tenant_memberships
for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_super_admin());

create policy "tenants by membership"
on public.tenants
for select
to authenticated
using (
  public.current_user_is_super_admin()
  or exists (
    select 1 from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = tenants.id
  )
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'tenant_settings',
    'tenant_ai_settings',
    'payroll_configs',
    'sales_channels',
    'finance_expense_categories',
    'recurring_costs',
    'employee_roles',
    'discount_categories',
    'employees',
    'employee_discounts',
    'transactions',
    'ingredient_units',
    'ingredients',
    'preparations',
    'products',
    'menu_categories',
    'menu_items',
    'combo_groups',
    'combo_options',
    'reviews',
    'review_replies',
    'audit_logs'
  ]
  loop
    execute format('create policy "%1$s tenant access" on public.%1$s for all to authenticated using (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id)) with check (public.current_user_is_super_admin() or public.current_user_has_tenant_access(tenant_id));', tbl);
  end loop;
end $$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger tenants_set_updated_at before update on public.tenants for each row execute function public.handle_updated_at();
create trigger tenant_settings_set_updated_at before update on public.tenant_settings for each row execute function public.handle_updated_at();
create trigger tenant_ai_settings_set_updated_at before update on public.tenant_ai_settings for each row execute function public.handle_updated_at();
create trigger payroll_configs_set_updated_at before update on public.payroll_configs for each row execute function public.handle_updated_at();
create trigger recurring_costs_set_updated_at before update on public.recurring_costs for each row execute function public.handle_updated_at();
create trigger employees_set_updated_at before update on public.employees for each row execute function public.handle_updated_at();
create trigger employee_discounts_set_updated_at before update on public.employee_discounts for each row execute function public.handle_updated_at();
create trigger ingredients_set_updated_at before update on public.ingredients for each row execute function public.handle_updated_at();
create trigger preparations_set_updated_at before update on public.preparations for each row execute function public.handle_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.handle_updated_at();
create trigger menu_categories_set_updated_at before update on public.menu_categories for each row execute function public.handle_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items for each row execute function public.handle_updated_at();
create trigger combo_groups_set_updated_at before update on public.combo_groups for each row execute function public.handle_updated_at();
create trigger combo_options_set_updated_at before update on public.combo_options for each row execute function public.handle_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.handle_updated_at();
create trigger review_replies_set_updated_at before update on public.review_replies for each row execute function public.handle_updated_at();
