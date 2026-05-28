import { env } from '../../src/lib/env.js';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

export function sendError(res, error, fallbackStatus = 500) {
  sendJson(res, error.statusCode || fallbackStatus, {
    error: error.message || 'Falha interna no servidor.'
  });
}

export function getTenantSlug(req) {
  const fromQuery = req.query?.tenant;
  const fromHeader = req.headers['x-tenant-slug'];

  return String(fromQuery || fromHeader || '').trim();
}
