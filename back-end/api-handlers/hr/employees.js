import { resolveIdentity, requireTenantAccess, requireTenantPermission } from '../../src/auth/identity.js';
import { deleteEmployeeById, getTenantBootstrap, saveEmployee } from '../../src/modules/hr/index.js';
import { validateEmployeePayload } from '../../src/services/payrollService.js';
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
    await requireTenantPermission(identity, tenantSlug, 'people.hr.view');

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.employees);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const roleWhitelist = req.method === 'PUT' ? ['tenant_admin', 'tenant_staff'] : ['tenant_admin'];
      requireTenantAccess(identity, tenantSlug, roleWhitelist);
      return sendJson(res, req.method === 'POST' ? 201 : 200, await saveEmployee(tenantSlug, validateEmployeePayload(req.body || {})));
    }

    if (req.method === 'DELETE') {
      requireTenantAccess(identity, tenantSlug, ['tenant_admin']);
      await deleteEmployeeById(tenantSlug, req.body?.id);
      return sendJson(res, 200, { success: true });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
