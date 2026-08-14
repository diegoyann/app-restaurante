import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApplicationErrorLog, sanitizeErrorText } from '../../lib/errorLog.js';

test('sanitiza segredos de mensagens e stack traces antes da persistência', () => {
  const input = 'Authorization: Bearer eyJheader.payload.signature token=abc password=segredo sb_secret_abc';
  const sanitized = sanitizeErrorText(input);

  assert.doesNotMatch(sanitized, /eyJheader|segredo|sb_secret_abc/);
  assert.match(sanitized, /\[REDACTED\]/);
});

test('cria log de erro sem incluir corpo da requisição', () => {
  const record = buildApplicationErrorLog(new Error('Falha de teste'), {
    req: { method: 'POST', url: '/api/orders?tenant=demo', headers: { 'x-request-id': 'req-1' } },
    context: { tenantSlug: 'demo', userId: 'user-1', mutationId: 'mutation-1', bodyHash: 'hash' }
  });

  assert.equal(record.request_id, 'req-1');
  assert.equal(record.route, '/api/orders');
  assert.equal(record.tenant_slug, 'demo');
  assert.deepEqual(record.metadata, { mutationId: 'mutation-1', bodyHash: 'hash' });
  assert.equal('body' in record, false);
});
