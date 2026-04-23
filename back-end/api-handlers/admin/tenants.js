import { resolveIdentity, requireRole } from '../../src/auth/identity.js';
import { deleteTenantBySlug, getAdminTenantSnapshot, upsertTenant } from '../../src/repositories/appRepository.js';
import {
  badRequest,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const identity = await resolveIdentity(req);
    requireRole(identity, ['super_admin']);

    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      const slug = String(req.body?.slug || name).trim();
      if (!name) return badRequest(res, 'Nome do tenant é obrigatório.');
      const tenant = await upsertTenant({ tenantSlug: slug, name, businessName: name });
      return sendJson(res, 201, tenant);
    }

    const tenantSlug = String(req.query?.tenant || req.body?.tenantSlug || '').trim();
    if (!tenantSlug) return badRequest(res, 'Informe o tenant com ?tenant=slug ou tenantSlug no body.');

    if (req.method === 'PUT') {
      const name = String(req.body?.name || '').trim();
      const businessName = String(req.body?.businessName || name).trim();
      if (!name) return badRequest(res, 'Nome do tenant é obrigatório.');
      await upsertTenant({ tenantSlug, name, businessName });
      return sendJson(res, 200, await getAdminTenantSnapshot(tenantSlug));
    }

    if (req.method === 'DELETE') {
      const removed = await deleteTenantBySlug(tenantSlug);
      return sendJson(res, 200, removed);
    }

    return methodNotAllowed(res, ['POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
