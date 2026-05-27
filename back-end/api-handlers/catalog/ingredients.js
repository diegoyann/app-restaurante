import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteIngredientById,
  getTenantBootstrap,
  saveIngredient
} from '../../src/modules/catalog/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'cmv.view');

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.ingredients);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const ingredient = await saveIngredient(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, ingredient);
    }

    if (req.method === 'DELETE') {
      const ingredientId = req.body?.id;
      if (!ingredientId) throw new Error('id do insumo é obrigatório.');
      await deleteIngredientById(tenantSlug, ingredientId);
      return sendJson(res, 200, { id: ingredientId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
