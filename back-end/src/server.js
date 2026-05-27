import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');

  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(resolve(projectRoot, '.env'));

const { default: handler } = await import('../api/index.js');

function normalizeRoute(pathname) {
  if (pathname === '/health') {
    return 'health';
  }

  if (pathname === '/api' || pathname === '/api/') {
    return '';
  }

  if (pathname.startsWith('/api/')) {
    return pathname.slice('/api/'.length);
  }

  return '';
}

async function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  const contentType = String(req.headers['content-type'] || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return rawBody ? JSON.parse(rawBody) : undefined;
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return rawBody;
}

function createQuery(url, route) {
  const query = {};

  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }

  if (route && !query.route) {
    query.route = route;
  }

  return query;
}

function decorateResponse(req, res) {
  res.req = req;
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    res.end(JSON.stringify(payload));
    return res;
  };

  return res;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const route = normalizeRoute(url.pathname);

  req.query = createQuery(url, route);

  try {
    req.body = await readBody(req);
  } catch {
    decorateResponse(req, res).status(400).json({
      error: 'Body JSON inválido.'
    });
    return;
  }

  decorateResponse(req, res);

  try {
    await handler(req, res);

    if (!res.writableEnded) {
      res.status(204).end();
    }
  } catch (error) {
    if (!res.writableEnded) {
      res.status(500).json({
        error: error.message || 'Falha interna no servidor.'
      });
    }
  }
});

const port = Number(process.env.PORT || 3000);

server.listen(port, () => {
  console.log(`API local em http://localhost:${port}`);
});
