import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  deleteTenantRoleProfile,
  getEffectivePermissionsForIdentity,
  getTenantBootstrap,
  saveTenantRoleProfile
} from '../../src/modules/tenant/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

async function tenantPayload(identity, tenantSlug) {
  return {
    ...await getTenantBootstrap(tenantSlug),
    currentUserPermissions: await getEffectivePermissionsForIdentity(identity, tenantSlug)
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'system.permissions.manage');

    if (req.method === 'POST' || req.method === 'PUT') {
      await saveTenantRoleProfile({ tenantSlug, payload: req.body || {} });
      return sendJson(res, req.method === 'POST' ? 201 : 200, await tenantPayload(identity, tenantSlug));
    }

    if (req.method === 'DELETE') {
      await deleteTenantRoleProfile({ tenantSlug, profileId: req.body?.id });
      return sendJson(res, 200, await tenantPayload(identity, tenantSlug));
    }

    return methodNotAllowed(res, ['POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
