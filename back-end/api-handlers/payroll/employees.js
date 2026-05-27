import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap } from '../../src/modules/hr/index.js';
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
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);
    const bootstrap = await getTenantBootstrap(tenantSlug);
    return sendJson(res, 200, bootstrap.employees);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
