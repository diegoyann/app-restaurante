import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap } from '../../src/repositories/appRepository.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const tenantSlug = getTenantSlug(req);

  if (!tenantSlug) {
    return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  }

  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug);
    return sendJson(res, 200, await getTenantBootstrap(tenantSlug));
  } catch (error) {
    return sendError(res, error, 400);
  }
}
