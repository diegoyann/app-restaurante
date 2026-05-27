alter table public.companies
  add column if not exists legal_name text not null default '',
  add column if not exists cnpj text not null default '',
  add column if not exists address_line text not null default '';

update public.companies
set legal_name = business_name
where legal_name = '';
