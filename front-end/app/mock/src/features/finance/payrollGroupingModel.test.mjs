import assert from "node:assert/strict";
import test from "node:test";
import { groupPayrollObligations } from "./payrollGroupingModel.js";

test("agrupa extras por período sem fundir as obrigações individuais", () => {
  const obligations = [
    {
      id: "maria",
      economicCategory: "FOLHA_EXTRA",
      competenceMonth: "2026-08",
      totalAmount: 210,
      paidAmount: 0,
      status: "EXPECTED",
      payrollDetail: { periodStart: "2026-08-10", periodEnd: "2026-08-16" },
    },
    {
      id: "william",
      economicCategory: "FOLHA_EXTRA",
      competenceMonth: "2026-08",
      totalAmount: 116,
      paidAmount: 16,
      status: "PARTIAL",
      payrollDetail: { periodStart: "2026-08-10", periodEnd: "2026-08-16" },
    },
  ];
  const [group] = groupPayrollObligations(obligations);
  assert.equal(group.kind, "EXTRA");
  assert.equal(group.items.length, 2);
  assert.equal(group.forecast, 326);
  assert.equal(group.paid, 16);
  assert.equal(group.open, 310);
  assert.equal(group.status, "PARTIAL");
});

test("separa primeiro pagamento e pagamento final preservando cada obrigação", () => {
  const obligations = [
    {
      id: "advance",
      economicCategory: "FOLHA_FIXA",
      competenceMonth: "2026-08",
      totalAmount: 720,
      paidAmount: 720,
      status: "PAID",
      dueDate: "2026-08-20",
      sourceId: "carol:ADVANCE",
    },
    {
      id: "salary",
      economicCategory: "FOLHA_FIXA",
      competenceMonth: "2026-08",
      totalAmount: 891.94,
      paidAmount: 0,
      status: "EXPECTED",
      dueDate: "2026-09-07",
      sourceId: "carol:SALARY",
    },
  ];
  const groups = groupPayrollObligations(obligations);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].title, "PRIMEIRO PAGAMENTO");
  assert.equal(groups[0].forecast, 720);
  assert.equal(groups[0].status, "PAID");
  assert.equal(groups[1].title, "PAGAMENTO FINAL");
  assert.equal(groups[1].forecast, 891.94);
  assert.equal(groups[1].status, "EXPECTED");
});

test("mistura percentuais individuais somente dentro do mesmo vencimento", () => {
  const groups = groupPayrollObligations([
    {
      id: "carol",
      economicCategory: "FOLHA_FIXA",
      competenceMonth: "2026-08",
      dueDate: "2026-08-20",
      sourceId: "carol:ADVANCE",
      totalAmount: 720,
      paidAmount: 0,
      status: "EXPECTED",
      payrollDetail: { installment: "ADVANCE", advancePercentage: 40 },
    },
    {
      id: "fabio",
      economicCategory: "FOLHA_FIXA",
      competenceMonth: "2026-08",
      dueDate: "2026-08-20",
      sourceId: "fabio:ADVANCE",
      totalAmount: 1000,
      paidAmount: 0,
      status: "EXPECTED",
      payrollDetail: { installment: "ADVANCE", advancePercentage: 50 },
    },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, "PRIMEIRO PAGAMENTO");
  assert.equal(groups[0].forecast, 1720);
  assert.deepEqual(
    groups[0].items.map((item) => item.payrollDetail.advancePercentage),
    [40, 50],
  );
});

test("recupera o período semanal de uma obrigação extra importada do histórico", () => {
  const groups = groupPayrollObligations([
    {
      id: "legacy-extra",
      description: "Douglas — 10/08/2026 a 16/08/2026",
      economicCategory: "FOLHA_EXTRA",
      competenceMonth: "2026-08",
      totalAmount: 70,
      paidAmount: 0,
      status: "EXPECTED",
    },
  ]);
  assert.equal(groups[0].periodStart, "2026-08-10");
  assert.equal(groups[0].periodEnd, "2026-08-16");
  assert.equal(groups[0].items[0].payrollDetail.employeeName, "Douglas");
});
