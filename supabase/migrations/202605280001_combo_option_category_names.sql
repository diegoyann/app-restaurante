alter table public.combo_options
  add column if not exists linked_category_names jsonb not null default '[]'::jsonb;

update public.combo_options
set linked_category_names = jsonb_build_array(linked_category_name)
where linked_category_name <> ''
  and linked_category_names = '[]'::jsonb;
