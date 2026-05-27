import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteMenuCategoryById,
  getTenantBootstrap,
  saveMenuCategory
} from '../../src/modules/menu/index.js';
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
    await requireTenantPermission(identity, tenantSlug, 'menu.view');

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.menuCategories);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const category = await saveMenuCategory(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, category);
    }

    if (req.method === 'DELETE') {
      const categoryId = req.body?.id;
      if (!categoryId) throw new Error('id da categoria é obrigatório.');
      await deleteMenuCategoryById(tenantSlug, categoryId);
      return sendJson(res, 200, { id: categoryId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
