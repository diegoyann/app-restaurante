import { resolveIdentity, requireTenantPermission } from '../../src/auth/identity.js';
import { importIfoodOrders } from '../../src/modules/integrations/index.js';
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
    await requireTenantPermission(identity, tenantSlug, 'integrations.ifood.manage');

    if (req.method !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    const result = await importIfoodOrders(tenantSlug, req.body || {});
    return sendJson(res, 200, result);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
