import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import { saveDailyRevenue } from '../../src/modules/finance/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'finance.transactions.view');
    if (req.method !== 'POST' && req.method !== 'PUT') return methodNotAllowed(res, ['POST', 'PUT']);
    return sendMutationJson(req, res, { tenantSlug, identity, statusCode: req.method === 'POST' ? 201 : 200, action: () => saveDailyRevenue(tenantSlug, req.body || {}) });
  } catch (error) {
    return sendError(res, error, 400);
  }
}
