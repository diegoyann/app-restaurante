import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldClearSessionAfterValidationError } from './sessionRecovery.js';

test('preserva sessão validada quando a validação falha temporariamente', () => {
  assert.equal(shouldClearSessionAfterValidationError(new TypeError('Failed to fetch')), false);
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Indisponível'), { status: 500 })), false);
});

test('limpa sessão apenas quando a API confirma que a credencial é inválida', () => {
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Não autorizado'), { status: 401 })), true);
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Proibido'), { status: 403 })), true);
});
