import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import {
  deleteRecurringCostById,
  getTenantBootstrap,
  saveRecurringCost
} from '../../src/modules/finance/index.js';
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
    lastPaidMonth: body.lastPaidMonth || '',
    category: body.category || 'CUSTO_FIXO',
    forecastType: body.forecastType || 'FIXED',
    recurrence: body.recurrence || 'MONTHLY',
    weekday: body.weekday,
    effectiveFrom: body.effectiveFrom,
    active: body.active !== false
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

    if (req.method === 'POST') {
      const body = req.body || {};
      const desc = String(body.desc || body.reference || '').trim();
      const amount = Number(body.amount);
      const dueDay = Number(body.dueDay);
      const recurrence = ['MONTHLY', 'WEEKLY', 'SPECIAL'].includes(body.recurrence) ? body.recurrence : 'MONTHLY';
      const weekday = body.weekday == null || body.weekday === '' ? null : Number(body.weekday);

      if (!desc) throw new Error('Descrição do custo fixo é obrigatória.');
      if (Number.isNaN(amount) || amount <= 0) throw new Error('amount precisa ser maior que zero.');
      if (recurrence === 'MONTHLY' && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) throw new Error('dueDay precisa estar entre 1 e 31.');
      if (recurrence === 'WEEKLY' && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)) throw new Error('weekday precisa estar entre 0 e 6.');

      const recurringCost = await saveRecurringCost(tenantSlug, {
        desc,
        amount,
        dueDay,
        lastPaidMonth: String(body.lastPaidMonth || ''),
        category: body.category || 'CUSTO_FIXO',
        forecastType: body.forecastType || 'FIXED',
        recurrence,
        weekday,
        effectiveFrom: body.effectiveFrom
      });
      return sendJson(res, 201, recurringCost);
    }

    if (req.method === 'PUT') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      const existing = bootstrap.recurringCosts.find((cost) => cost.id === req.body?.id);
      if (!existing) throw new Error('Custo fixo não encontrado.');
      const next = sanitizeRecurringCostUpdate({ ...existing, ...(req.body || {}) });
      return sendJson(res, 200, await saveRecurringCost(tenantSlug, next));
    }

    if (req.method === 'DELETE') {
      const recurringCostId = req.body?.id;
      if (!recurringCostId) throw new Error('id do custo fixo é obrigatório.');
      await deleteRecurringCostById(tenantSlug, recurringCostId);
      return sendJson(res, 200, { id: recurringCostId });
    }

    return methodNotAllowed(res, ['GET', 'POST', 'PUT', 'DELETE']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
