-- Strengthen shared-schema multi-tenant integrity.
-- The app keeps one public schema with tenant_id on business tables, but
-- related records must also belong to the same tenant.

create unique index if not exists employees_tenant_id_id_key
on public.employees (tenant_id, id);

create unique index if not exists menu_categories_tenant_id_id_key
on public.menu_categories (tenant_id, id);

create unique index if not exists menu_items_tenant_id_id_key
on public.menu_items (tenant_id, id);

create unique index if not exists combo_groups_tenant_id_id_key
on public.combo_groups (tenant_id, id);

create unique index if not exists reviews_tenant_id_id_key
on public.reviews (tenant_id, id);

create unique index if not exists customers_tenant_id_id_key
on public.customers (tenant_id, id);

create unique index if not exists payment_methods_tenant_id_id_key
on public.payment_methods (tenant_id, id);

create unique index if not exists orders_tenant_id_id_key
on public.orders (tenant_id, id);

create unique index if not exists products_tenant_id_id_key
on public.products (tenant_id, id);

create unique index if not exists delivery_drivers_tenant_id_id_key
on public.delivery_drivers (tenant_id, id);

create unique index if not exists tenant_role_profiles_tenant_id_id_key
on public.tenant_role_profiles (tenant_id, id);

create unique index if not exists external_order_imports_tenant_id_id_key
on public.external_order_imports (tenant_id, id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'employee_discounts_employee_same_tenant_fk') then
    alter table public.employee_discounts
      add constraint employee_discounts_employee_same_tenant_fk
      foreign key (tenant_id, employee_id)
      references public.employees (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'menu_items_category_same_tenant_fk') then
    alter table public.menu_items
      add constraint menu_items_category_same_tenant_fk
      foreign key (tenant_id, category_id)
      references public.menu_categories (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'combo_groups_menu_item_same_tenant_fk') then
    alter table public.combo_groups
      add constraint combo_groups_menu_item_same_tenant_fk
      foreign key (tenant_id, menu_item_id)
      references public.menu_items (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'combo_options_group_same_tenant_fk') then
    alter table public.combo_options
      add constraint combo_options_group_same_tenant_fk
      foreign key (tenant_id, combo_group_id)
      references public.combo_groups (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'review_replies_review_same_tenant_fk') then
    alter table public.review_replies
      add constraint review_replies_review_same_tenant_fk
      foreign key (tenant_id, review_id)
      references public.reviews (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_customer_same_tenant_fk') then
    alter table public.orders
      add constraint orders_customer_same_tenant_fk
      foreign key (tenant_id, customer_id)
      references public.customers (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_payment_method_same_tenant_fk') then
    alter table public.orders
      add constraint orders_payment_method_same_tenant_fk
      foreign key (tenant_id, payment_method_id)
      references public.payment_methods (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_driver_same_tenant_fk') then
    alter table public.orders
      add constraint orders_delivery_driver_same_tenant_fk
      foreign key (tenant_id, delivery_driver_id)
      references public.delivery_drivers (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_items_order_same_tenant_fk') then
    alter table public.order_items
      add constraint order_items_order_same_tenant_fk
      foreign key (tenant_id, order_id)
      references public.orders (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_items_menu_item_same_tenant_fk') then
    alter table public.order_items
      add constraint order_items_menu_item_same_tenant_fk
      foreign key (tenant_id, menu_item_id)
      references public.menu_items (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_items_product_same_tenant_fk') then
    alter table public.order_items
      add constraint order_items_product_same_tenant_fk
      foreign key (tenant_id, product_id)
      references public.products (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tenant_memberships_role_profile_same_tenant_fk') then
    alter table public.tenant_memberships
      add constraint tenant_memberships_role_profile_same_tenant_fk
      foreign key (tenant_id, role_profile_id)
      references public.tenant_role_profiles (tenant_id, id)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'external_order_imports_order_same_tenant_fk') then
    alter table public.external_order_imports
      add constraint external_order_imports_order_same_tenant_fk
      foreign key (tenant_id, order_id)
      references public.orders (tenant_id, id)
      not valid;
  end if;
end $$;

create index if not exists sales_channels_tenant_name_idx
on public.sales_channels (tenant_id, lower(name));

create index if not exists finance_expense_categories_tenant_name_idx
on public.finance_expense_categories (tenant_id, lower(name));

create index if not exists employee_roles_tenant_name_idx
on public.employee_roles (tenant_id, lower(name));

create index if not exists discount_categories_tenant_name_idx
on public.discount_categories (tenant_id, lower(name));

create index if not exists ingredient_units_tenant_label_idx
on public.ingredient_units (tenant_id, lower(label));

create index if not exists ingredients_tenant_name_idx
on public.ingredients (tenant_id, lower(name));

create index if not exists preparations_tenant_name_idx
on public.preparations (tenant_id, lower(name));

create index if not exists products_tenant_name_idx
on public.products (tenant_id, lower(name));

create index if not exists menu_categories_tenant_name_idx
on public.menu_categories (tenant_id, lower(name));
