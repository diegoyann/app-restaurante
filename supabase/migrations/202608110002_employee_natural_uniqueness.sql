create unique index if not exists employees_tenant_natural_unique
on public.employees (tenant_id, lower(trim(full_name)), lower(trim(role)), employment_type);
