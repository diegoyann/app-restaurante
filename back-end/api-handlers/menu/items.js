import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteMenuItemById,
  getTenantBootstrap,
  reorderMenuItems,
  saveMenuItem
} from '../../src/modules/menu/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson,
  sendMutationJson
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
      return sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: req.method === 'POST' ? 201 : 200,
        action: () => saveMenuItem(tenantSlug, req.body || {})
      });
    }

    if (req.method === 'PATCH') {
      return sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: 200,
        action: async () => {
          const bootstrap = await reorderMenuItems(tenantSlug, req.body || {});
          return bootstrap.menuItems;
        }
      });
    }

    if (req.method === 'DELETE') {
      const itemId = req.body?.id;
      if (!itemId) throw new Error('id do item é obrigatório.');
      return sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: 200,
        action: async () => {
          await deleteMenuItemById(tenantSlug, itemId);
          return { id: itemId };
        }
      });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
