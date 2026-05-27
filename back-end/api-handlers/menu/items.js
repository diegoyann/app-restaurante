import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteMenuItemById,
  getTenantBootstrap,
  saveMenuItem
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
      return sendJson(res, 200, bootstrap.menuItems);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const item = await saveMenuItem(tenantSlug, req.body || {});
      return sendJson(res, req.method === 'POST' ? 201 : 200, item);
    }

    if (req.method === 'DELETE') {
      const itemId = req.body?.id;
      if (!itemId) throw new Error('id do item é obrigatório.');
      await deleteMenuItemById(tenantSlug, itemId);
      return sendJson(res, 200, { id: itemId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
