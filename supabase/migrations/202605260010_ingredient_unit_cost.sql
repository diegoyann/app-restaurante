alter table public.ingredients
  add column if not exists unit_cost numeric(12,4) not null default 0;

update public.ingredients
set unit_cost = case
  when unit_cost > 0 then unit_cost
  when package_quantity > 0 then package_cost / package_quantity
  else 0
end;

create index if not exists ingredients_tenant_unit_cost_idx
on public.ingredients (tenant_id, unit_cost);
