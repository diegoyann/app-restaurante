import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteIngredientUnitById,
  getTenantBootstrap,
  saveIngredientUnit
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
      return sendJson(res, 200, bootstrap.ingredientUnits);
    }

    if (req.method === 'POST') {
      const unit = await saveIngredientUnit(tenantSlug, req.body || {});
      return sendJson(res, 201, unit);
    }

    if (req.method === 'PUT') {
      const unit = await saveIngredientUnit(tenantSlug, req.body || {});
      return sendJson(res, 200, unit);
    }

    if (req.method === 'DELETE') {
      const unitId = req.body?.id;
      if (!unitId) throw new Error('id da unidade é obrigatório.');
      await deleteIngredientUnitById(tenantSlug, unitId);
      return sendJson(res, 200, { id: unitId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
