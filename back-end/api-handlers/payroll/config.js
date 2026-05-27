import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap, savePayrollConfig } from '../../src/modules/hr/index.js';
import { sanitizePayrollSettings } from '../../src/services/payrollService.js';
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
    requireTenantAccess(identity, tenantSlug, ['tenant_admin']);

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.payrollConfig);
    }

    if (req.method === 'PUT') {
      return sendJson(res, 200, await savePayrollConfig(tenantSlug, sanitizePayrollSettings(req.body || {})));
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
