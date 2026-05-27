import { resolveIdentity, requireRole } from '../../src/auth/identity.js';
import { deleteTenantRoleProfile, saveTenantRoleProfile } from '../../src/modules/admin/index.js';
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
    requireRole(identity, ['super_admin']);

    if (req.method === 'POST' || req.method === 'PUT') {
      return sendJson(res, req.method === 'POST' ? 201 : 200, await saveTenantRoleProfile({ tenantSlug, payload: req.body || {} }));
    }

    if (req.method === 'DELETE') {
      return sendJson(res, 200, await deleteTenantRoleProfile({ tenantSlug, profileId: req.body?.id }));
    }

    return methodNotAllowed(res, ['POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
