import { env } from '../../src/lib/env.js';
import { randomUUID, createHash } from 'node:crypto';
import { getTenantRowBySlug, supabaseAdmin } from '../../src/modules/shared/db.js';
import { persistApplicationError } from '../../src/lib/errorLog.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const IDEMPOTENCY_REPLAY_ATTEMPTS = 25;
const IDEMPOTENCY_REPLAY_DELAY_MS = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashValue(value) {
  return createHash('sha256').update(stableStringify(value ?? {})).digest('hex');
}

function getMutationRoute(req) {
  return String(req.url || '').split('?')[0] || '';
}

function getHeader(req, name) {
  const value = req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || '').trim();
}

function isMutation(req) {
  return MUTATION_METHODS.has(String(req.method || '').toUpperCase());
}

function extractResultId(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (payload.id) return String(payload.id);
  if (payload.order?.id) return String(payload.order.id);
  if (payload.customer?.id) return String(payload.customer.id);
  if (payload.transaction?.id) return String(payload.transaction.id);
  if (payload.recurringCost?.id) return String(payload.recurringCost.id);
  if (payload.paymentMethod?.id) return String(payload.paymentMethod.id);
  if (payload.driver?.id) return String(payload.driver.id);
  if (payload.employee?.id) return String(payload.employee.id);
  return '';
}

function ensureMutationContext(req, { tenantSlug = '', identity = null } = {}) {
  if (!req.__mutationContext) {
    req.__mutationContext = {
      requestId: getHeader(req, 'x-request-id') || randomUUID(),
      mutationId: randomUUID(),
      method: String(req.method || '').toUpperCase(),
      route: getMutationRoute(req),
      tenantSlug,
      userId: identity?.user?.id || null,
      bodyHash: hashValue(req.body || {}),
      startedAt: Date.now(),
      startedLogged: false
    };
  } else {
    req.__mutationContext.tenantSlug = tenantSlug || req.__mutationContext.tenantSlug;
    req.__mutationContext.userId = identity?.user?.id || req.__mutationContext.userId;
  }

  return req.__mutationContext;
}

function logMutation(phase, context, extra = {}) {
  if (!context || !MUTATION_METHODS.has(context.method)) return;

  console.info(JSON.stringify({
    event: 'api_mutation',
    phase,
    requestId: context.requestId,
    mutationId: context.mutationId,
    method: context.method,
    route: context.route,
    tenant: context.tenantSlug || '',
    userId: context.userId || null,
    bodyHash: context.bodyHash,
    durationMs: Date.now() - context.startedAt,
    ...extra
  }));
}

function startMutationLog(req, options = {}) {
  if (!isMutation(req)) return null;
  const context = ensureMutationContext(req, options);
  if (!context.startedLogged) {
    context.startedLogged = true;
    logMutation('start', context);
  }
  return context;
}

function setMutationHeaders(res, context) {
  if (!context) return;
  res.setHeader('X-Request-Id', context.requestId);
  res.setHeader('X-Mutation-Id', context.mutationId);
}

async function claimIdempotency({ req, tenantSlug, identity, context }) {
  if (context.method !== 'POST') return { enabled: false };

  const idempotencyKey = getHeader(req, 'idempotency-key');
  if (!idempotencyKey) return { enabled: false };

  const tenant = await getTenantRowBySlug(tenantSlug);
  const row = {
    tenant_id: tenant.id,
    user_id: identity?.user?.id || null,
    route: context.route,
    method: context.method,
    idempotency_key: idempotencyKey,
    body_hash: context.bodyHash,
    status: 'processing'
  };

  const inserted = await supabaseAdmin
    .from('mutation_idempotency_keys')
    .insert(row)
    .select('*')
    .single();

  if (!inserted.error) {
    return {
      enabled: true,
      owner: true,
      keyId: inserted.data.id,
      tenantId: tenant.id
    };
  }

  if (inserted.error.code !== '23505') {
    throw inserted.error;
  }

  const existing = await supabaseAdmin
    .from('mutation_idempotency_keys')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('route', context.route)
    .eq('method', context.method)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existing.error && existing.status !== 406) {
    throw existing.error;
  }

  if (!existing.data) {
    const error = new Error('Falha ao localizar chave de idempotência.');
    error.statusCode = 409;
    throw error;
  }

  if (existing.data.body_hash !== context.bodyHash) {
    const error = new Error('Idempotency-Key reutilizada com payload diferente.');
    error.statusCode = 409;
    throw error;
  }

  for (let attempt = 0; attempt < IDEMPOTENCY_REPLAY_ATTEMPTS; attempt += 1) {
    const current = attempt === 0
      ? existing
      : await supabaseAdmin
          .from('mutation_idempotency_keys')
          .select('*')
          .eq('id', existing.data.id)
          .maybeSingle();

    if (current.error && current.status !== 406) {
      throw current.error;
    }

    if (current.data?.status === 'completed' && current.data.response_payload) {
      return {
        enabled: true,
        owner: false,
        replay: true,
        statusCode: current.data.status_code || 200,
        payload: current.data.response_payload,
        resultId: current.data.result_id || ''
      };
    }

    await sleep(IDEMPOTENCY_REPLAY_DELAY_MS);
  }

  const error = new Error('Requisição idempotente ainda está em processamento.');
  error.statusCode = 409;
  throw error;
}

async function completeIdempotency(claim, { statusCode, payload, resultId }) {
  if (!claim?.enabled || !claim.owner) return;

  const update = await supabaseAdmin
    .from('mutation_idempotency_keys')
    .update({
      status: 'completed',
      status_code: statusCode,
      response_payload: payload,
      result_id: resultId || '',
      completed_at: new Date().toISOString()
    })
    .eq('id', claim.keyId);

  if (update.error) throw update.error;
}

async function releaseIdempotency(claim) {
  if (!claim?.enabled || !claim.owner) return;
  await supabaseAdmin
    .from('mutation_idempotency_keys')
    .delete()
    .eq('id', claim.keyId);
}

function isLocalViteOrigin(origin) {
  try {
    const url = new URL(origin);
    const port = Number(url.port);

    return ['localhost', '127.0.0.1'].includes(url.hostname)
      && port >= 5173
      && port <= 5199;
  } catch {
    return false;
  }
}

function isChromeExtensionOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === 'chrome-extension:';
  } catch {
    return false;
  }
}

export function setCors(res) {
  const allowedOrigins = env.corsAllowedOrigins;
  const origin = res.req?.headers?.origin;
  const resolvedOrigin = allowedOrigins.length === 0
    ? origin || '*'
    : allowedOrigins.includes(origin) || isLocalViteOrigin(origin) || isChromeExtensionOrigin(origin)
      ? origin
      : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Origin', resolvedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key, X-Request-Id');
  res.setHeader('Vary', 'Origin');
}

export function handleOptions(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

export function sendJson(res, statusCode, payload) {
  setCors(res);
  const context = res.req?.__mutationContext || startMutationLog(res.req);
  if (context && !context.finishedLogged && statusCode < 400) {
    context.finishedLogged = true;
    logMutation('finish', context, {
      status: statusCode,
      resultId: extractResultId(payload),
      idempotency: 'none'
    });
  }
  setMutationHeaders(res, context);
  res.status(statusCode).json(payload);
}

export function methodNotAllowed(res, allowedMethods) {
  sendJson(res, 405, {
    error: `Método não permitido. Use: ${allowedMethods.join(', ')}.`
  });
}

export function badRequest(res, error) {
  sendJson(res, 400, {
    error
  });
}

export async function sendError(res, error, fallbackStatus = 500) {
  const context = res.req?.__mutationContext || startMutationLog(res.req);
  if (context && !context.errorLogged) {
    context.errorLogged = true;
    logMutation('error', context, {
      status: error.statusCode || fallbackStatus,
      error: error.message || 'Falha interna no servidor.'
    });
  }

  await persistApplicationError(error, { req: res.req, context });

  sendJson(res, error.statusCode || fallbackStatus, {
    error: error.message || 'Falha interna no servidor.'
  });
}

export function getTenantSlug(req) {
  const fromQuery = req.query?.tenant;
  const fromHeader = req.headers['x-tenant-slug'];

  return String(fromQuery || fromHeader || '').trim();
}

export async function sendMutationJson(req, res, {
  tenantSlug = '',
  identity = null,
  statusCode = 200,
  action
}) {
  const context = startMutationLog(req, { tenantSlug, identity });
  const claim = await claimIdempotency({ req, tenantSlug, identity, context });

  if (claim.replay) {
    logMutation('finish', context, {
      status: claim.statusCode,
      resultId: claim.resultId,
      idempotency: 'replay'
    });
    context.finishedLogged = true;
    return sendJson(res, claim.statusCode, claim.payload);
  }

  try {
    const payload = await action();
    const resultId = extractResultId(payload);

    await completeIdempotency(claim, {
      statusCode,
      payload,
      resultId
    });

    logMutation('finish', context, {
      status: statusCode,
      resultId,
      idempotency: claim.enabled ? 'stored' : 'none'
    });
    context.finishedLogged = true;

    return sendJson(res, statusCode, payload);
  } catch (error) {
    await releaseIdempotency(claim);
    logMutation('error', context, {
      status: error.statusCode || 500,
      error: error.message || 'Falha interna no servidor.'
    });
    throw error;
  }
}
