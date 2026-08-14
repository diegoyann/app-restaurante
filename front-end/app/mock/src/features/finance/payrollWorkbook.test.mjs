import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import { buildPayrollWorkbook } from "./payrollWorkbook.js";

const rowsOf = (result) =>
  XLSX.utils.sheet_to_json(result.workbook.Sheets[result.sheetName], {
    header: 1,
    raw: true,
  });

test("Excel da folha extra espelha diárias, taxas e saldo individual", () => {
  const result = buildPayrollWorkbook({
    kind: "EXTRA",
    periodStart: "2026-08-10",
    periodEnd: "2026-08-16",
    items: [
      {
        description: "Douglas",
        totalAmount: 116,
        paidAmount: 16,
        openAmount: 100,
        status: "PARTIAL",
        payrollDetail: {
          employeeName: "Douglas",
          periodStart: "2026-08-10",
          periodEnd: "2026-08-16",
          daysWorked: 1,
          dailyRateCount: 1,
          totalDailyRates: 70,
          totalDeliveryFees: 46,
          workDays: [
            {
              date: "2026-08-11",
              rateTypes: [{ typeName: "Cozinha", amountSnapshot: 70 }],
            },
          ],
        },
      },
    ],
  });
  const rows = rowsOf(result);
  assert.equal(result.filename, "folha-extra-2026-08-10_2026-08-16.xlsx");
  assert.deepEqual(rows[2].slice(0, 4), [
    "Funcionário",
    "Período",
    "Dias trabalhados",
    "Datas trabalhadas",
  ]);
  assert.equal(rows[3][0], "Douglas");
  assert.equal(rows[3][6], 70);
  assert.equal(rows[3][7], 46);
  assert.equal(rows[3][8], 116);
  assert.equal(rows[3][9], 16);
  assert.equal(rows[3][10], 100);
  assert.equal(rows[3][11], "Parcial");
});

test("Excel do pagamento final respeita percentual individual e demonstra o líquido", () => {
  const statement = {
    employeeName: "Carol",
    month: "2026-08",
    salary: 1800,
    salaryPercentage: 60,
    advanceAmount: 720,
    baseSalaryPayment: 1080,
    absenceCount: 1,
    absences: [{ date: "2026-08-13", amount: 58.06 }],
    absenceAmount: 58.06,
    adjustments: [
      { category: "EXTRA_ADVANCE", amount: 100 },
      { category: "STORE_PURCHASE", amount: 30 },
    ],
    totalDiscounts: 188.06,
    finalSalaryPayment: 891.94,
  };
  const result = buildPayrollWorkbook({
    kind: "FIXED",
    installment: "SALARY",
    title: "PAGAMENTO FINAL",
    dueDate: "2026-09-07",
    items: [
      {
        employeeId: "carol",
        competenceMonth: "2026-08",
        totalAmount: 891.94,
        paidAmount: 0,
        openAmount: 891.94,
        dueDate: "2026-09-07",
        status: "EXPECTED",
        payrollDetail: { ...statement, installment: "SALARY" },
      },
    ],
  });
  const rows = rowsOf(result);
  assert.equal(
    result.filename,
    "folha-fixa-pagamento-final-2026-08.xlsx",
  );
  assert.equal(rows[3][0], "Carol");
  assert.equal(rows[3][2], "Pagamento final");
  assert.equal(rows[3][3], 1800);
  assert.equal(rows[3][4], 60);
  assert.equal(rows[3][5], 1080);
  assert.equal(rows[3][6], 1);
  assert.equal(rows[3][8], 58.06);
  assert.equal(rows[3][9], 130);
  assert.equal(rows[3][10], 188.06);
  assert.equal(rows[3][11], 891.94);
  assert.equal(rows[3][12], "07/09/2026");
  assert.equal(rows[3][13], 0);
  assert.equal(rows[3][14], 891.94);
  assert.equal(rows[3][15], "Previsto");
});

test("Excel do primeiro pagamento mantém percentuais 40% e 50% por funcionário", () => {
  const result = buildPayrollWorkbook({
    kind: "FIXED",
    installment: "ADVANCE",
    title: "PRIMEIRO PAGAMENTO",
    dueDate: "2026-08-20",
    items: [
      {
        description: "Carol",
        competenceMonth: "2026-08",
        dueDate: "2026-08-20",
        totalAmount: 720,
        paidAmount: 0,
        openAmount: 720,
        status: "EXPECTED",
        payrollDetail: {
          employeeName: "Carol",
          salary: 1800,
          advancePercentage: 40,
          advanceAmount: 720,
          installment: "ADVANCE",
        },
      },
      {
        description: "Fabio",
        competenceMonth: "2026-08",
        dueDate: "2026-08-20",
        totalAmount: 1000,
        paidAmount: 0,
        openAmount: 1000,
        status: "EXPECTED",
        payrollDetail: {
          employeeName: "Fabio",
          salary: 2000,
          advancePercentage: 50,
          advanceAmount: 1000,
          installment: "ADVANCE",
        },
      },
    ],
  });
  const rows = rowsOf(result);
  assert.equal(rows[3][4], 40);
  assert.equal(rows[3][5], 720);
  assert.equal(rows[4][4], 50);
  assert.equal(rows[4][5], 1000);
});
