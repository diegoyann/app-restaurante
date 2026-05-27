import { resolveIdentity, requireRole } from '../../src/auth/identity.js';
import { deleteTenantBySlug, getAdminTenantSnapshot, upsertTenant } from '../../src/modules/admin/index.js';
import {
  badRequest,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  try {
    const identity = await resolveIdentity(req);
    requireRole(identity, ['super_admin']);

    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      const slug = slugify(req.body?.slug || req.body?.branchCode || name);
      if (!name) return badRequest(res, 'Nome do tenant é obrigatório.');
      if (!slug) return badRequest(res, 'ID/código da filial é obrigatório.');
      const tenant = await upsertTenant({
        tenantSlug: slug,
        name,
        businessName: req.body?.businessName || name,
        companyId: req.body?.companyId || '',
        companySlug: req.body?.companySlug || '',
        companyName: req.body?.companyName || '',
        branchCode: req.body?.branchCode || slug,
        branchName: req.body?.branchName || name,
        isHeadquarters: req.body?.isHeadquarters,
        importMenuFromHeadquarters: Boolean(req.body?.importMenuFromHeadquarters),
        importCmvFromHeadquarters: Boolean(req.body?.importCmvFromHeadquarters)
      });
      return sendJson(res, 201, tenant);
    }

    const tenantSlug = String(req.query?.tenant || req.body?.tenantSlug || '').trim();
    if (!tenantSlug) return badRequest(res, 'Informe o tenant com ?tenant=slug ou tenantSlug no body.');

    if (req.method === 'PUT') {
      const name = String(req.body?.name || '').trim();
      const businessName = String(req.body?.businessName || name).trim();
      if (!name) return badRequest(res, 'Nome do tenant é obrigatório.');
      await upsertTenant({
        tenantSlug,
        name,
        businessName,
        companyId: req.body?.companyId || '',
        companySlug: req.body?.companySlug || '',
        companyName: req.body?.companyName || '',
        branchCode: req.body?.branchCode || '',
        branchName: req.body?.branchName || '',
        isHeadquarters: req.body?.isHeadquarters
      });
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
