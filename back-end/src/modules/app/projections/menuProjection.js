import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapMenuCategory, mapMenuItem } from '../../shared/mappers.js';

export async function readMenuProjection(tenant) {
  const [menuCategories, menuItems] = await Promise.all([
    ensureOk(
      await supabaseAdmin
        .from('menu_categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      'Falha ao carregar categorias de menu.'
    ),
    ensureOk(
      await supabaseAdmin
        .from('menu_items')
        .select(`
          *,
          menu_categories!menu_items_category_id_fkey ( name ),
          combo_groups!combo_groups_menu_item_id_fkey (
            *,
            combo_options!combo_options_combo_group_id_fkey ( * )
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('category_id', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      'Falha ao carregar itens do menu.'
    )
  ]);

  return {
    menuCategories: menuCategories.map(mapMenuCategory),
    menuItems: menuItems.map(mapMenuItem)
  };
}
