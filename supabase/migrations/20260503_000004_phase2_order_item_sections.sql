alter table public.order_items
  add column if not exists item_category text not null default '',
  add column if not exists item_section text not null default 'food';

alter table public.order_items
  drop constraint if exists order_items_item_section_check;

alter table public.order_items
  add constraint order_items_item_section_check check (item_section in ('food', 'beverage', 'other'));
