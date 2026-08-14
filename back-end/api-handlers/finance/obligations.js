import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import { addFinancialPayment, getFinancialObligations, resolveRecurringCostDuplicate, updateFinancialObligation } from '../../src/modules/finance/obligationsService.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'finance.transactions.view');
    if (req.method === 'GET') return sendJson(res, 200, await getFinancialObligations(tenantSlug));
    if (req.method === 'PUT') return await sendMutationJson(req, res, { tenantSlug, identity, statusCode: 200, action: () => updateFinancialObligation(tenantSlug, req.body || {}) });
    if (req.method === 'POST') return await sendMutationJson(req, res, { tenantSlug, identity, statusCode: 201, action: () => addFinancialPayment(tenantSlug, req.body || {}) });
    if (req.method === 'PATCH') return await sendMutationJson(req, res, { tenantSlug, identity, statusCode: 200, action: () => resolveRecurringCostDuplicate(tenantSlug, req.body || {}) });
    return methodNotAllowed(res, ['GET', 'PUT', 'POST', 'PATCH']);
  } catch (error) { return sendError(res, error, 400); }
}
