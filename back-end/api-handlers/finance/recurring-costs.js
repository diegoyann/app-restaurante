import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap, saveRecurringCost } from '../../src/repositories/appRepository.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

function sanitizeRecurringCostUpdate(body) {
  const recurringCostId = body.id;

  if (!recurringCostId) throw new Error('id inválido para custo fixo.');

  if (body.action === 'toggle-payment') {
    return {
      id: recurringCostId,
      desc: body.desc || '',
      amount: body.amount || 0,
      dueDay: body.dueDay || 1,
      lastPaidMonth: String(body.lastPaidMonth || '')
    };
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount < 0) throw new Error('amount precisa ser maior ou igual a zero.');

  return {
    id: recurringCostId,
    desc: body.desc,
    amount,
    dueDay: body.dueDay,
    lastPaidMonth: body.lastPaidMonth || ''
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    const identity = await resolveIdentity(req);
    requireTenantAccess(identity, tenantSlug, ['tenant_admin', 'tenant_staff']);

    if (req.method === 'GET') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      return sendJson(res, 200, bootstrap.recurringCosts);
    }

    if (req.method === 'PUT') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      const existing = bootstrap.recurringCosts.find((cost) => cost.id === req.body?.id);
      if (!existing) throw new Error('Custo fixo não encontrado.');
      const next = sanitizeRecurringCostUpdate({ ...existing, ...(req.body || {}) });
      return sendJson(res, 200, await saveRecurringCost(tenantSlug, next));
    }

    return methodNotAllowed(res, ['GET', 'PUT']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
