import { resolveIdentity, requireAnyTenantPermission } from '../../src/auth/identity.js';
import { getSupplyChainData } from '../../src/modules/supply-chain/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireAnyTenantPermission(identity, tenantSlug, ['cmv.view', 'finance.transactions.view']);
    if (req.method === 'GET') return sendJson(res, 200, await getSupplyChainData(tenantSlug));
    return methodNotAllowed(res, ['GET']);
  } catch (error) { return sendError(res, error, 400); }
}
