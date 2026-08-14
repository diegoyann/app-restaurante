import assert from "node:assert/strict";
import test from "node:test";
import { validateEmployeePayload } from "../../services/payrollService.js";

const fixedEmployee = {
  name: "Carol",
  role: "Cozinha",
  employmentType: "fixed",
  salary: 1800,
  controlAttendance: true,
  attendanceControlFrom: "2026-08-01",
  weeklyDayOff: 1,
  monthlySundayOffOrdinal: 2,
  firstPaymentPercentage: 40,
  finalPaymentPercentage: 60,
};

test("funcionário fixo controlado exige escala semanal e domingo mensal", () => {
  assert.throws(
    () => validateEmployeePayload({ ...fixedEmployee, weeklyDayOff: "" }),
    /folga semanal/i,
  );
  assert.throws(
    () =>
      validateEmployeePayload({
        ...fixedEmployee,
        monthlySundayOffOrdinal: "",
      }),
    /domingo do mês/i,
  );
});

test("regra de pagamento individual precisa totalizar 100%", () => {
  assert.throws(
    () =>
      validateEmployeePayload({
        ...fixedEmployee,
        firstPaymentPercentage: 40,
        finalPaymentPercentage: 50,
      }),
    /totalizar 100%/i,
  );
  const valid = validateEmployeePayload({
    ...fixedEmployee,
    firstPaymentPercentage: 50,
    finalPaymentPercentage: 50,
  });
  assert.equal(valid.firstPaymentPercentage, 50);
  assert.equal(valid.finalPaymentPercentage, 50);
});

test("cargo Gerente é normalizado como jornada flexível", () => {
  const manager = validateEmployeePayload({
    ...fixedEmployee,
    name: "Fabio Correa",
    role: "Gerente",
    salary: 2000,
    controlAttendance: true,
    firstPaymentPercentage: 50,
    finalPaymentPercentage: 50,
  });
  assert.equal(manager.controlAttendance, false);
  assert.equal(manager.weeklyDayOff, null);
  assert.equal(manager.monthlySundayOffOrdinal, null);
});
