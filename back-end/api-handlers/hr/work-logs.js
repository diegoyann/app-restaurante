import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import { getWorkforceData, saveWorkLog } from '../../src/modules/hr/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'people.hr.view');
    if (req.method === 'GET') return sendJson(res, 200, await getWorkforceData(tenantSlug));
    if (req.method === 'POST' || req.method === 'PUT') {
      return await sendMutationJson(req, res, { tenantSlug, identity, statusCode: req.method === 'POST' ? 201 : 200, action: () => saveWorkLog(tenantSlug, req.body || {}) });
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT']);
  } catch (error) { return sendError(res, error, 400); }
}
