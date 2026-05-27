create table if not exists public.tenant_role_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  name text not null,
  is_system boolean not null default false,
  base_role public.membership_role not null default 'tenant_staff',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, key),
  check (base_role in ('tenant_admin', 'tenant_staff'))
);

create table if not exists public.tenant_role_permissions (
  tenant_role_profile_id uuid not null references public.tenant_role_profiles(id) on delete cascade,
  permission_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_role_profile_id, permission_key)
);

alter table public.tenant_memberships
  add column if not exists role_profile_id uuid references public.tenant_role_profiles(id) on delete set null;

insert into public.tenant_role_profiles (tenant_id, key, name, is_system, base_role)
select t.id, 'admin', 'Admin', true, 'tenant_admin'
from public.tenants t
on conflict (tenant_id, key) do nothing;

insert into public.tenant_role_profiles (tenant_id, key, name, is_system, base_role)
select t.id, 'staff', 'Staff', true, 'tenant_staff'
from public.tenants t
on conflict (tenant_id, key) do nothing;

update public.tenant_memberships tm
set role_profile_id = trp.id
from public.tenant_role_profiles trp
where tm.role_profile_id is null
  and tm.tenant_id = trp.tenant_id
  and (
    (tm.role = 'tenant_admin' and trp.key = 'admin')
    or (tm.role = 'tenant_staff' and trp.key = 'staff')
  );

update public.tenant_memberships tm
set role_profile_id = trp.id
from public.tenants t
join public.tenant_role_profiles trp on trp.tenant_id = t.id
where tm.role_profile_id is null
  and tm.tenant_id is null
  and tm.company_id = t.company_id
  and (
    (tm.role = 'tenant_admin' and trp.key = 'admin')
    or (tm.role = 'tenant_staff' and trp.key = 'staff')
  );

alter table public.tenant_role_profiles enable row level security;
alter table public.tenant_role_permissions enable row level security;

drop policy if exists "role profiles by tenant access" on public.tenant_role_profiles;
create policy "role profiles by tenant access"
on public.tenant_role_profiles
for select
to authenticated
using (
  public.current_user_is_super_admin()
  or public.current_user_has_tenant_access(tenant_id)
);

drop policy if exists "role permissions by tenant access" on public.tenant_role_permissions;
create policy "role permissions by tenant access"
on public.tenant_role_permissions
for select
to authenticated
using (
  public.current_user_is_super_admin()
  or exists (
    select 1
    from public.tenant_role_profiles trp
    where trp.id = tenant_role_permissions.tenant_role_profile_id
      and public.current_user_has_tenant_access(trp.tenant_id)
  )
);

drop trigger if exists tenant_role_profiles_set_updated_at on public.tenant_role_profiles;
create trigger tenant_role_profiles_set_updated_at
before update on public.tenant_role_profiles
for each row execute function public.handle_updated_at();

drop trigger if exists tenant_role_permissions_set_updated_at on public.tenant_role_permissions;
create trigger tenant_role_permissions_set_updated_at
before update on public.tenant_role_permissions
for each row execute function public.handle_updated_at();
