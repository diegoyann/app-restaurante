import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { deleteSalesChannelById, getTenantBootstrap, saveSalesChannel } from '../../src/modules/finance/index.js';
import { badRequest, getTenantSlug, handleOptions, methodNotAllowed, sendError, sendJson, sendMutationJson } from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');
  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);
    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.salesChannels);
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      return sendMutationJson(req, res, { tenantSlug, identity, statusCode: req.method === 'POST' ? 201 : 200, action: () => saveSalesChannel(tenantSlug, req.body || {}) });
    }
    if (req.method === 'DELETE') {
      const id = req.body?.id;
      if (!id) throw new Error('id do canal é obrigatório.');
      return sendMutationJson(req, res, { tenantSlug, identity, action: async () => { await deleteSalesChannelById(tenantSlug, id); return { id }; } });
    }
    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
