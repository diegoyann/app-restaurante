import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import {
  mapIngredient,
  mapPreparation,
  mapProduct
} from '../../shared/mappers.js';
import { createFixedIngredientUnits } from '../../shared/ingredientUnits.js';

export async function readCatalogProjection(tenant) {
  const [ingredients, preparations, products] = await Promise.all([
    ensureOk(await supabaseAdmin.from('ingredients').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar insumos.'),
    ensureOk(await supabaseAdmin.from('preparations').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar preparações.'),
    ensureOk(await supabaseAdmin.from('products').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }), 'Falha ao carregar produtos.')
  ]);

  return {
    ingredients: ingredients.map(mapIngredient),
    ingredientUnits: createFixedIngredientUnits(),
    preparations: preparations.map(mapPreparation),
    products: products.map(mapProduct)
  };
}
