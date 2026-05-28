alter table public.menu_categories
  add column if not exists sort_order integer not null default 0;

alter table public.menu_items
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select
    id,
    row_number() over (partition by tenant_id order by created_at, id) - 1 as next_sort_order
  from public.menu_categories
)
update public.menu_categories target
set sort_order = ordered.next_sort_order
from ordered
where target.id = ordered.id
  and target.sort_order = 0;

with ordered as (
  select
    id,
    row_number() over (partition by tenant_id, category_id order by created_at, id) - 1 as next_sort_order
  from public.menu_items
)
update public.menu_items target
set sort_order = ordered.next_sort_order
from ordered
where target.id = ordered.id
  and target.sort_order = 0;
