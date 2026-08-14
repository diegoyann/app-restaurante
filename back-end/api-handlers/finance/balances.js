import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import { changeFinancialBalanceStatus, getFinancialBalances, reverseFinancialAccountMovement, saveFinancialAccountMovement, saveFinancialBalancePeriod } from '../../src/modules/supply-chain/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireTenantPermission(identity, tenantSlug, 'finance.transactions.view');
    if (req.method === 'GET') return sendJson(res, 200, await getFinancialBalances(tenantSlug));
    if (req.method === 'POST') return sendMutationJson(req, res, { tenantSlug, identity, statusCode: 201, action: () => req.body?.resource === 'MOVEMENT' ? saveFinancialAccountMovement(tenantSlug, req.body || {}, identity.user.id) : saveFinancialBalancePeriod(tenantSlug, req.body || {}, identity.user.id) });
    if (req.method === 'PUT') return sendMutationJson(req, res, { tenantSlug, identity, statusCode: 200, action: () => req.body?.resource === 'MOVEMENT' ? reverseFinancialAccountMovement(tenantSlug, req.body || {}, identity.user.id) : changeFinancialBalanceStatus(tenantSlug, req.body || {}, identity.user.id) });
    return methodNotAllowed(res, ['GET', 'POST', 'PUT']);
  } catch (error) { return sendError(res, error, 400); }
}
