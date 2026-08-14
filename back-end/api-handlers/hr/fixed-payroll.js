import { resolveIdentity, requireTenantAccess, requireTenantPermission } from '../../src/auth/identity.js';
import {
  cancelPayrollAdjustment,
  cancelScheduledDayOff,
  getFixedPayrollData,
  savePayrollAdjustment,
  saveScheduledDayOff
} from '../../src/modules/hr/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'people.hr.view');
    if (req.method === 'GET') return sendJson(res, 200, await getFixedPayrollData(tenantSlug, req.query?.month));
    requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);
    const payload = req.body || {};
    if (req.method === 'POST') {
      return await sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: 201,
        action: () => payload.resource === 'DAY_OFF'
          ? saveScheduledDayOff(tenantSlug, payload)
          : payload.resource === 'ADJUSTMENT'
            ? savePayrollAdjustment(tenantSlug, payload)
            : Promise.reject(new Error('Recurso de folha inválido.'))
      });
    }
    if (req.method === 'DELETE') {
      return await sendMutationJson(req, res, {
        tenantSlug,
        identity,
        statusCode: 200,
        action: () => payload.resource === 'DAY_OFF'
          ? cancelScheduledDayOff(tenantSlug, payload)
          : payload.resource === 'ADJUSTMENT'
            ? cancelPayrollAdjustment(tenantSlug, payload)
            : Promise.reject(new Error('Recurso de folha inválido.'))
      });
    }
    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
