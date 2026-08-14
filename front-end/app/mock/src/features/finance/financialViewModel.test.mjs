import test from 'node:test';
import assert from 'node:assert/strict';
import {
  describeTransactionType,
  filterObligationsByMonth,
  filterTransactionsByMonth,
  isValidMonth,
  summarizeObligations
} from './financialViewModel.js';

test('filtros financeiros isolam estritamente a competência selecionada', () => {
  const transactions = [
    { id: 'jul', date: '2026-07-31' },
    { id: 'aug', date: '2026-08-01' },
    { id: 'sep', date: '2026-09-01' }
  ];
  const obligations = [
    { id: 'aug', competenceMonth: '2026-08' },
    { id: 'sep', competenceMonth: '2026-09' }
  ];

  assert.equal(isValidMonth('2026-08'), true);
  assert.equal(isValidMonth('2026-13'), false);
  assert.deepEqual(filterTransactionsByMonth(transactions, '2026-08').map((item) => item.id), ['aug']);
  assert.deepEqual(filterObligationsByMonth(obligations, '2026-08').map((item) => item.id), ['aug']);
});

test('resumo de contas a pagar não inclui competências ausentes do recorte recebido', () => {
  const august = [{ status: 'EXPECTED', dueDate: '2026-08-20', openAmount: 100, paidAmount: 0 }];
  const summary = summarizeObligations(august, { today: '2026-08-12' });

  assert.deepEqual(summary, { open: 100, overdue: 0, next7: 0, next30: 100, paid: 0 });
});

test('conferência é apresentada como controle sem sinal de despesa', () => {
  assert.deepEqual(describeTransactionType({ type: 'controle' }), {
    label: 'Controle / Conferência', sign: '', tone: 'control'
  });
});

