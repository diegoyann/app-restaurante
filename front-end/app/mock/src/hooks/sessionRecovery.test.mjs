import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldClearSessionAfterValidationError,
  validateSessionWithRefresh
} from './sessionRecovery.js';

test('preserva sessão validada quando a validação falha temporariamente', () => {
  assert.equal(shouldClearSessionAfterValidationError(new TypeError('Failed to fetch')), false);
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Indisponível'), { status: 500 })), false);
});

test('preserva sessão quando a API informa falta de permissão para um recurso', () => {
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Proibido'), { status: 403 })), false);
});

test('limpa sessão apenas quando a API confirma que a credencial é inválida', () => {
  assert.equal(shouldClearSessionAfterValidationError(Object.assign(new Error('Não autorizado'), { status: 401 })), true);
});

test('renova a credencial e valida novamente antes de encerrar uma sessão com 401', async () => {
  const unauthorized = Object.assign(new Error('Não autorizado'), { status: 401 });
  let validationAttempts = 0;
  let refreshAttempts = 0;

  const payload = await validateSessionWithRefresh({
    validate: async () => {
      validationAttempts += 1;
      if (validationAttempts === 1) throw unauthorized;
      return { user: { id: 'user-1' } };
    },
    refreshSession: async () => {
      refreshAttempts += 1;
      return { data: { session: { access_token: 'renewed' } }, error: null };
    }
  });

  assert.deepEqual(payload, { user: { id: 'user-1' } });
  assert.equal(validationAttempts, 2);
  assert.equal(refreshAttempts, 1);
});

test('encerra o fluxo quando a renovação não recupera uma sessão válida', async () => {
  const unauthorized = Object.assign(new Error('Não autorizado'), { status: 401 });

  await assert.rejects(
    validateSessionWithRefresh({
      validate: async () => { throw unauthorized; },
      refreshSession: async () => ({ data: { session: null }, error: null })
    }),
    unauthorized
  );
});

test('encerra o fluxo quando a validação continua não autorizada após o refresh', async () => {
  const unauthorized = Object.assign(new Error('Não autorizado'), { status: 401 });
  let validationAttempts = 0;

  await assert.rejects(
    validateSessionWithRefresh({
      validate: async () => {
        validationAttempts += 1;
        throw unauthorized;
      },
      refreshSession: async () => ({ data: { session: { access_token: 'renewed' } }, error: null })
    }),
    unauthorized
  );

  assert.equal(validationAttempts, 2);
});

test('não tenta renovar para erros que não são de autenticação', async () => {
  const unavailable = Object.assign(new Error('Indisponível'), { status: 500 });
  let refreshAttempts = 0;

  await assert.rejects(
    validateSessionWithRefresh({
      validate: async () => { throw unavailable; },
      refreshSession: async () => {
        refreshAttempts += 1;
        return { data: null, error: null };
      }
    }),
    unavailable
  );

  assert.equal(refreshAttempts, 0);
});
