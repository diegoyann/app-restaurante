import { resolveIdentity, requireAnyTenantPermission } from '../../src/auth/identity.js';
import { changeInventoryCountStatus, saveInventoryCount } from '../../src/modules/supply-chain/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    await requireAnyTenantPermission(identity, tenantSlug, ['cmv.view', 'finance.transactions.view']);
    if (req.method === 'POST') return sendMutationJson(req, res, { tenantSlug, identity, statusCode: 201, action: () => saveInventoryCount(tenantSlug, req.body || {}, identity.user.id) });
    if (req.method === 'PUT') return sendMutationJson(req, res, { tenantSlug, identity, statusCode: 200, action: () => changeInventoryCountStatus(tenantSlug, req.body || {}, identity.user.id) });
    return methodNotAllowed(res, ['POST', 'PUT']);
  } catch (error) { return sendError(res, error, 400); }
}
