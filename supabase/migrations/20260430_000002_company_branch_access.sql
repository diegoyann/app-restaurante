create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  business_name text not null default '',
  status public.app_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.tenants
  add column if not exists company_id uuid references public.companies(id) on delete restrict,
  add column if not exists branch_code text not null default '',
  add column if not exists branch_name text not null default '',
  add column if not exists is_headquarters boolean not null default false;

insert into public.companies (slug, name, business_name, status, created_at, updated_at)
select
  t.slug,
  t.business_name,
  t.business_name,
  t.status,
  t.created_at,
  t.updated_at
from public.tenants t
where t.company_id is null
  and not exists (
    select 1
    from public.companies c
    where c.slug = t.slug
  );

update public.tenants t
set
  company_id = c.id,
  branch_code = coalesce(nullif(t.branch_code, ''), t.slug),
  branch_name = coalesce(nullif(t.branch_name, ''), t.name),
  is_headquarters = coalesce(t.is_headquarters, false)
from public.companies c
where t.company_id is null
  and c.slug = t.slug;

alter table public.tenants
  alter column company_id set not null;

create unique index if not exists tenants_company_branch_code_key
  on public.tenants (company_id, branch_code);

alter table public.tenant_memberships
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

update public.tenant_memberships tm
set company_id = t.company_id
from public.tenants t
where tm.company_id is null
  and tm.tenant_id = t.id;

alter table public.tenant_memberships
  drop constraint if exists tenant_memberships_scope_check;

alter table public.tenant_memberships
  add constraint tenant_memberships_scope_check
  check (
    role = 'super_admin'
    or tenant_id is not null
    or company_id is not null
  );

create unique index if not exists tenant_memberships_user_company_role_key
  on public.tenant_memberships (user_id, company_id, role)
  where company_id is not null and tenant_id is null;

create unique index if not exists tenant_memberships_user_tenant_role_key
  on public.tenant_memberships (user_id, tenant_id, role)
  where tenant_id is not null;

alter table public.companies enable row level security;

drop policy if exists "companies by membership" on public.companies;
create policy "companies by membership"
on public.companies
for select
to authenticated
using (
  public.current_user_is_super_admin()
  or exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.company_id = companies.id
  )
  or exists (
    select 1
    from public.tenant_memberships tm
    join public.tenants t on t.id = tm.tenant_id
    where tm.user_id = auth.uid()
      and t.company_id = companies.id
  )
);

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
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
security definer
set search_path = public
as $$
  select
    public.current_user_is_super_admin()
    or exists (
      select 1
      from public.tenant_memberships tm
      where tm.user_id = auth.uid()
        and tm.tenant_id = check_tenant_id
    )
    or exists (
      select 1
      from public.tenant_memberships tm
      join public.tenants t on t.company_id = tm.company_id
      where tm.user_id = auth.uid()
        and tm.role = 'tenant_admin'
        and tm.company_id is not null
        and t.id = check_tenant_id
    );
$$;

drop policy if exists "tenants by membership" on public.tenants;
create policy "tenants by membership"
on public.tenants
for select
to authenticated
using (
  public.current_user_is_super_admin()
  or exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.tenant_id = tenants.id
  )
  or exists (
    select 1
    from public.tenant_memberships tm
    where tm.user_id = auth.uid()
      and tm.role = 'tenant_admin'
      and tm.company_id = tenants.company_id
  )
);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.handle_updated_at();
