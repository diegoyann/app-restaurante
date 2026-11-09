import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import {
  mapIngredient,
  mapPreparation,
  mapProduct
} from '../../shared/mappers.js';
import { createFixedIngredientUnits } from '../../shared/ingredientUnits.js';

export async function readCatalogProjection(tenant) {
  const [ingredientsResult, preparationsResult, productsResult] = await Promise.all([
    supabaseAdmin.from('ingredients').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }),
    supabaseAdmin.from('preparations').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }),
    supabaseAdmin.from('products').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true })
  ]);
  const ingredients = ensureOk(ingredientsResult, 'Falha ao carregar insumos.');
  const preparations = ensureOk(preparationsResult, 'Falha ao carregar preparações.');
  const products = ensureOk(productsResult, 'Falha ao carregar produtos.');

  return {
    ingredients: ingredients.map(mapIngredient),
    ingredientUnits: createFixedIngredientUnits(),
    preparations: preparations.map(mapPreparation),
    products: products.map(mapProduct)
  };
}
