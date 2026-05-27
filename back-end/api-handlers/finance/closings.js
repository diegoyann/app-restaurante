import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import {
  getTenantBootstrap,
  saveFinancialClosing
} from '../../src/modules/finance/index.js';
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
    await requireTenantPermission(identity, tenantSlug, 'finance.closing.view');

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.financialClosings);
    }

    if (req.method === 'POST') {
      const closing = await saveFinancialClosing(tenantSlug, req.body || {});
      return sendJson(res, 201, closing);
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
