import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapMenuCategory, mapMenuItem } from '../../shared/mappers.js';

export function assembleMenuItemRows(
  menuItems,
  comboGroups,
  comboOptions,
  menuCategories = []
) {
  const categoryById = new Map(menuCategories.map((category) => [category.id, category]));
  const optionsByGroupId = new Map();

  comboOptions.forEach((option) => {
    const current = optionsByGroupId.get(option.combo_group_id) || [];
    current.push(option);
    optionsByGroupId.set(option.combo_group_id, current);
  });

  const groupsByMenuItemId = new Map();
  comboGroups.forEach((group) => {
    const current = groupsByMenuItemId.get(group.menu_item_id) || [];
    current.push({
      ...group,
      combo_options: optionsByGroupId.get(group.id) || []
    });
    groupsByMenuItemId.set(group.menu_item_id, current);
  });

  return menuItems.map((item) => {
    const category = categoryById.get(item.category_id);

    return {
      ...item,
      menu_categories: item.menu_categories || (category ? { name: category.name } : null),
      combo_groups: groupsByMenuItemId.get(item.id) || []
    };
  });
}

export async function readMenuProjection(tenant) {
  const [categoryResult, itemResult, groupResult, optionResult] = await Promise.all([
    supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('category_id', { ascending: true, nullsFirst: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('combo_groups')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('combo_options')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
  ]);
  const menuCategories = ensureOk(categoryResult, 'Falha ao carregar categorias de menu.');
  const menuItems = ensureOk(itemResult, 'Falha ao carregar itens do menu.');
  const comboGroups = ensureOk(groupResult, 'Falha ao carregar grupos de combo.');
  const comboOptions = ensureOk(optionResult, 'Falha ao carregar opções de combo.');
  const assembledMenuItems = assembleMenuItemRows(
    menuItems,
    comboGroups,
    comboOptions,
    menuCategories
  );

  return {
    menuCategories: menuCategories.map(mapMenuCategory),
    menuItems: assembledMenuItems.map(mapMenuItem)
  };
}
