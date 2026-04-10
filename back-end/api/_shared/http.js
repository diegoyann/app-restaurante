export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
