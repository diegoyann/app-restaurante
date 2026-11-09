import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExtraPayrollDetail,
  groupPayrollObligations,
} from "./payrollGroupingModel.js";

test("separa extras de cozinha e motoboy por período e vencimento sem fundir obrigações", () => {
  const obligations = [
    {
      id: "maria",
      economicCategory: "FOLHA_EXTRA",
      competenceMonth: "2026-08",
      totalAmount: 210,
      paidAmount: 0,
      status: "EXPECTED",
      dueDate: "2026-08-17",
      payrollDetail: {
        role: "Cozinha",
        periodStart: "2026-08-10",
        periodEnd: "2026-08-16",
      },
    },
    {
      id: "william",
      economicCategory: "FOLHA_EXTRA",
      competenceMonth: "2026-08",
      totalAmount: 116,
      paidAmount: 16,
      status: "PARTIAL",
      dueDate: "2026-08-20",
      payrollDetail: {
        role: "Motoboy",
        periodStart: "2026-08-10",
        periodEnd: "2026-08-16",
      },
    },
  ];
  const groups = groupPayrollObligations(obligations);
  const kitchen = groups.find((group) => group.extraType === "KITCHEN");
  const delivery = groups.find((group) => group.extraType === "DELIVERY");

  assert.equal(kitchen.title, "FOLHA EXTRA — COZINHA");
  assert.equal(kitchen.dueDate, "2026-08-17");
  assert.deepEqual(kitchen.items.map((item) => item.id), ["maria"]);
  assert.deepEqual(
    [kitchen.forecast, kitchen.paid, kitchen.open, kitchen.status],
    [210, 0, 210, "EXPECTED"],
  );
  assert.equal(delivery.title, "FOLHA EXTRA — MOTOBOY");
  assert.equal(delivery.dueDate, "2026-08-20");
  assert.deepEqual(delivery.items.map((item) => item.id), ["william"]);
  assert.deepEqual(
    [delivery.forecast, delivery.paid, delivery.open, delivery.status],
    [116, 16, 100, "PARTIAL"],
  );
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

test("mantém extra histórico sem cargo fora dos grupos para não contaminar totais", () => {
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
  assert.deepEqual(groups, []);
});

test("deriva detalhes específicos sem incluir refeição no total do motoboy", () => {
  const item = {
    id: "douglas",
    description: "Douglas",
    totalAmount: 116,
    paidAmount: 16,
    openAmount: 100,
    status: "PARTIAL",
    payrollDetail: {
      employeeName: "Douglas",
      daysWorked: 1,
      dailyRateCount: 2,
      totalDailyRates: 70,
      totalDeliveryFees: 46,
      totalMeals: 15,
      workDays: [
        {
          rateTypes: [
            { typeName: "Cozinha", amountSnapshot: 50 },
            { typeName: "Apoio", amountSnapshot: 20 },
          ],
        },
      ],
    },
  };

  const kitchen = buildExtraPayrollDetail(item, "KITCHEN");
  const delivery = buildExtraPayrollDetail(item, "DELIVERY");
  assert.deepEqual(kitchen.rateTypes, ["Cozinha", "Apoio"]);
  assert.equal(kitchen.dailyRateCount, 2);
  assert.equal(delivery.totalDailyRates, 70);
  assert.equal(delivery.totalDeliveryFees, 46);
  assert.equal(delivery.totalAmount, 116);
  assert.equal("totalMeals" in delivery, false);
  assert.equal(delivery.item, item);
});
