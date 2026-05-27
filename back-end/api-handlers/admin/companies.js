import { resolveIdentity, requireRole } from '../../src/auth/identity.js';
import { deleteCompanyById, upsertCompany, upsertTenant } from '../../src/modules/admin/index.js';
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

    if (req.method === 'POST' || req.method === 'PUT') {
      const id = String(req.body?.id || req.query?.company || '').trim();
      const name = String(req.body?.name || '').trim();
      const slug = String(req.body?.slug || name).trim();

      if (!name) return badRequest(res, 'Nome da empresa é obrigatório.');

      const company = await upsertCompany({
        id,
        name,
        slug,
        businessName: req.body?.businessName || name,
        legalName: req.body?.legalName || req.body?.businessName || name,
        cnpj: req.body?.cnpj || '',
        address: req.body?.address || ''
      });

      if (req.method === 'PUT') {
        return sendJson(res, 200, company);
      }

      const branchName = String(req.body?.branchName || name).trim();
      const branchCode = String(req.body?.branchCode || branchName).trim();
      const branchSlug = slugify(branchCode || branchName);
      if (!branchSlug) return badRequest(res, 'ID/código da filial matriz é obrigatório.');

      const tenant = await upsertTenant({
        tenantSlug: branchSlug,
        name: branchName,
        businessName: company.businessName || company.name,
        companyId: company.id,
        branchCode,
        branchName,
        isHeadquarters: true
      });

      return sendJson(res, 201, {
        company,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          businessName: tenant.business_name,
          companyId: tenant.company_id,
          branchCode: tenant.branch_code || tenant.slug,
          branchName: tenant.branch_name || tenant.name,
          isHeadquarters: Boolean(tenant.is_headquarters),
          company
        }
      });
    }

    if (req.method === 'DELETE') {
      const companyId = String(req.query?.company || req.body?.id || '').trim();
      if (!companyId) return badRequest(res, 'Informe a empresa com ?company=id ou id no body.');

      const removed = await deleteCompanyById(companyId);
      return sendJson(res, 200, removed);
    }

    return methodNotAllowed(res, ['POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
