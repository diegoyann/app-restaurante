import { resolveIdentity, requireTenantAccess } from '../../src/auth/identity.js';
import { getTenantBootstrap, saveRecurringCost, saveTransaction } from '../../src/repositories/appRepository.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson
} from '../_shared/http.js';

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function buildTransactionPayload(body, bootstrap) {
  const type = body.type;
  const amount = roundCurrency(body.amount);

  if (!['receita', 'despesa', 'custo_fixo'].includes(type)) throw new Error('type inválido.');
  if (amount <= 0) throw new Error('amount precisa ser maior que zero.');

  if (type === 'custo_fixo') {
    const desc = String(body.reference || '').trim();
    const dueDay = Number(body.dueDay);
    if (!desc) throw new Error('reference é obrigatório para custo fixo.');
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) throw new Error('dueDay precisa estar entre 1 e 31.');
    return { kind: 'recurring_cost', value: { desc, amount, dueDay, lastPaidMonth: '' } };
  }

  const reference = String(body.reference || '').trim();
  const payment = String(body.payment || '').trim();
  const date = String(body.date || '').trim();
  if (!reference) throw new Error('reference é obrigatório.');
  if (!date) throw new Error('date é obrigatório.');

  const platform = type === 'receita' ? reference : 'despesa';
  const tax = type === 'receita'
    ? platform === 'ifood'
      ? Number(bootstrap.settings.ifoodTax || 0)
      : platform === 'anotaai'
        ? Number(bootstrap.settings.anotaaiTax || 0)
        : 0
    : 0;

  return {
    kind: 'transaction',
    value: {
      date,
      platform,
      payment,
      amount,
      tax,
      net: type === 'receita' ? roundCurrency(amount * (1 - (tax / 100))) : -amount,
      type,
      category: reference,
      note: String(body.note || '').trim()
    }
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
      return sendJson(res, 200, bootstrap.transactions);
    }

    if (req.method === 'POST') {
      const bootstrap = await getTenantBootstrap(tenantSlug);
      const payload = buildTransactionPayload(req.body || {}, bootstrap);

      if (payload.kind === 'recurring_cost') {
        const recurringCost = await saveRecurringCost(tenantSlug, payload.value);
        return sendJson(res, 201, { type: 'custo_fixo', recurringCost });
      }

      const transaction = await saveTransaction(tenantSlug, payload.value);
      return sendJson(res, 201, { type: transaction.type, transaction });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error, 400);
  }
}
