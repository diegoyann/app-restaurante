import { supabaseAdmin } from "../src/modules/shared/db.js";
import {
  cancelPayrollAdjustment,
  getFixedPayrollData,
  saveEmployee,
  savePayrollAdjustment,
  saveWorkLog,
} from "../src/modules/hr/index.js";
import { synchronizeFixedPayrollMonth } from "../src/modules/finance/obligationsService.js";
import { validateEmployeePayload } from "../src/services/payrollService.js";

const tenantSlug = process.env.ACCEPTANCE_TENANT_SLUG || "bady-bassitt";
const competenceMonth = "2026-07";
const marker = `[TESTE FOLHA FIXA ${Date.now()}]`;
let tenantId = "";
const employeeIds = [];

const assertMoney = (actual, expected, message) => {
  if (Math.abs(Number(actual) - expected) > 0.001)
    throw new Error(`${message}: esperado ${expected}, recebido ${actual}`);
};

async function cleanup() {
  if (!tenantId) return;
  let ids = employeeIds;
  if (!ids.length) {
    const result = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("tenant_id", tenantId)
      .like("full_name", "[TESTE FOLHA FIXA%");
    ids = (result.data || []).map((employee) => employee.id);
  }
  if (!ids.length) return;
  const obligations = await supabaseAdmin
    .from("financial_obligations")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  const obligationIds = (obligations.data || []).map((item) => item.id);
  if (obligationIds.length) {
    await supabaseAdmin
      .from("transactions")
      .delete()
      .in("obligation_id", obligationIds);
    await supabaseAdmin
      .from("financial_payments")
      .delete()
      .in("obligation_id", obligationIds);
    await supabaseAdmin
      .from("financial_obligations")
      .delete()
      .in("id", obligationIds);
  }
  const logs = await supabaseAdmin
    .from("employee_work_logs")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  const logIds = (logs.data || []).map((item) => item.id);
  if (logIds.length)
    await supabaseAdmin
      .from("employee_work_log_rate_types")
      .delete()
      .in("work_log_id", logIds);
  await supabaseAdmin
    .from("employee_work_logs")
    .delete()
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  await supabaseAdmin
    .from("payroll_adjustments")
    .delete()
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  await supabaseAdmin
    .from("employee_scheduled_days_off")
    .delete()
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  await supabaseAdmin
    .from("employee_discounts")
    .delete()
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  await supabaseAdmin
    .from("employee_daily_rate_types")
    .delete()
    .eq("tenant_id", tenantId)
    .in("employee_id", ids);
  await supabaseAdmin
    .from("employees")
    .delete()
    .eq("tenant_id", tenantId)
    .in("id", ids);
}

try {
  const tenantResult = await supabaseAdmin
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();
  if (tenantResult.error || !tenantResult.data)
    throw (
      tenantResult.error || new Error("Tenant de aceitação não encontrado.")
    );
  tenantId = tenantResult.data.id;

  const controlled = await saveEmployee(
    tenantSlug,
    validateEmployeePayload({
      name: `${marker} CONTROLADO`,
      role: "Teste",
      employmentType: "fixed",
      status: "active",
      salary: 1800,
      admissionDate: "2026-07-01",
      controlAttendance: true,
      attendanceControlFrom: "2026-07-01",
      weeklyDayOff: 1,
      monthlySundayOffOrdinal: 2,
      firstPaymentPercentage: 40,
      finalPaymentPercentage: 60,
    }),
  );
  employeeIds.push(controlled.id);
  const flexible = await saveEmployee(
    tenantSlug,
    validateEmployeePayload({
      name: `${marker} FLEXÍVEL`,
      role: "Gerente",
      employmentType: "fixed",
      status: "active",
      salary: 2000,
      admissionDate: "2026-07-01",
      controlAttendance: true,
      firstPaymentPercentage: 50,
      finalPaymentPercentage: 50,
    }),
  );
  employeeIds.push(flexible.id);

  const expectedDates = Array.from(
    { length: 31 },
    (_, index) => `2026-07-${String(index + 1).padStart(2, "0")}`,
  ).filter(
    (date) =>
      new Date(`${date}T12:00:00`).getDay() !== 1 &&
      date !== "2026-07-12" &&
      date !== "2026-07-14",
  );
  const logResult = await supabaseAdmin.from("employee_work_logs").insert(
    expectedDates.map((workDate) => ({
      tenant_id: tenantId,
      employee_id: controlled.id,
      work_date: workDate,
      worked: true,
      daily_rate: 0,
      delivery_fee: 0,
      meal_cost: 15,
      note: "Presença de aceitação",
    })),
  );
  if (logResult.error) throw logResult.error;

  const advance = await savePayrollAdjustment(tenantSlug, {
    employeeId: controlled.id,
    competenceMonth,
    adjustmentDate: "2026-07-15",
    category: "EXTRA_ADVANCE",
    description: "Adiantamento extra de teste",
    amount: 100,
    note: "Aceitação",
  });
  await savePayrollAdjustment(tenantSlug, {
    employeeId: controlled.id,
    competenceMonth,
    adjustmentDate: "2026-07-16",
    category: "STORE_PURCHASE",
    description: "Compra na loja de teste",
    amount: 30,
    note: "Aceitação",
  });
  await synchronizeFixedPayrollMonth(tenantId, competenceMonth);

  let payroll = await getFixedPayrollData(tenantSlug, competenceMonth);
  let controlledStatement = payroll.statements.find(
    (item) => String(item.employeeId) === String(controlled.id),
  );
  const flexibleStatement = payroll.statements.find(
    (item) => String(item.employeeId) === String(flexible.id),
  );
  if (
    controlledStatement.absenceCount !== 1 ||
    controlledStatement.absences[0]?.date !== "2026-07-14"
  )
    throw new Error(
      "A única ausência esperada não foi identificada em 14/07/2026.",
    );
  assertMoney(
    controlledStatement.absenceAmount,
    58.06,
    "Valor da falta incorreto",
  );
  assertMoney(
    controlledStatement.advanceAmount,
    720,
    "Adiantamento de 40% incorreto",
  );
  assertMoney(
    controlledStatement.baseSalaryPayment,
    1080,
    "Base de 60% incorreta",
  );
  assertMoney(
    controlledStatement.totalDiscounts,
    188.06,
    "Total de descontos incorreto",
  );
  assertMoney(
    controlledStatement.finalSalaryPayment,
    891.94,
    "Líquido final incorreto",
  );
  if (flexibleStatement.absenceCount !== 0)
    throw new Error("Funcionário flexível recebeu falta automática.");
  assertMoney(
    flexibleStatement.finalSalaryPayment,
    1000,
    "Pagamento final individual de 50% incorreto",
  );
  assertMoney(
    flexibleStatement.advanceAmount,
    1000,
    "Primeiro pagamento individual de 50% incorreto",
  );

  const obligationsResult = await supabaseAdmin
    .from("financial_obligations")
    .select("source_id,forecast_amount,final_amount,economic_category")
    .eq("tenant_id", tenantId)
    .eq("employee_id", controlled.id)
    .eq("competence_month", competenceMonth);
  if (obligationsResult.error) throw obligationsResult.error;
  if (obligationsResult.data.length !== 2)
    throw new Error(
      "A folha fixa não preservou exatamente duas obrigações individuais.",
    );
  const advanceObligation = obligationsResult.data.find((item) =>
    item.source_id.endsWith(":ADVANCE"),
  );
  const salaryObligation = obligationsResult.data.find((item) =>
    item.source_id.endsWith(":SALARY"),
  );
  assertMoney(
    advanceObligation?.final_amount,
    720,
    "Obrigação de 40% foi alterada",
  );
  assertMoney(
    salaryObligation?.final_amount,
    891.94,
    "Obrigação de 60% não recebeu descontos",
  );
  if (
    obligationsResult.data.some(
      (item) => item.economic_category !== "FOLHA_FIXA",
    )
  )
    throw new Error("Ajuste gerou categoria financeira duplicada.");

  const storePurchase = payroll.adjustments.find(
    (item) => item.category === "STORE_PURCHASE" && item.status === "ACTIVE",
  );
  await cancelPayrollAdjustment(tenantSlug, {
    id: storePurchase.id,
    reason: "Cancelamento de aceitação",
  });
  payroll = await getFixedPayrollData(tenantSlug, competenceMonth);
  controlledStatement = payroll.statements.find(
    (item) => String(item.employeeId) === String(controlled.id),
  );
  assertMoney(
    controlledStatement.finalSalaryPayment,
    921.94,
    "Cancelamento não recalculou a folha",
  );
  const cancelled = payroll.adjustments.find(
    (item) => item.id === storePurchase.id,
  );
  if (cancelled?.status !== "CANCELLED" || !cancelled.cancellationReason)
    throw new Error("Cancelamento não preservou o histórico auditável.");

  await saveWorkLog(tenantSlug, {
    employeeId: controlled.id,
    workDate: "2026-07-14",
    worked: true,
  });
  payroll = await getFixedPayrollData(tenantSlug, competenceMonth);
  controlledStatement = payroll.statements.find(
    (item) => String(item.employeeId) === String(controlled.id),
  );
  if (controlledStatement.absenceCount !== 0)
    throw new Error("A presença retroativa não removeu a falta.");
  assertMoney(
    controlledStatement.finalSalaryPayment,
    980,
    "Presença retroativa não recalculou os 60%",
  );

  const activeAdvance = payroll.adjustments.find(
    (item) => item.id === advance.id,
  );
  if (!activeAdvance || activeAdvance.status !== "ACTIVE")
    throw new Error("O ajuste ativo se perdeu durante o recálculo.");

  console.log(
    "PASS: folha fixa remota validada com folga semanal, domingo mensal, gerência flexível 50/50, falta de R$ 58,06, descontos no pagamento final, auditoria e obrigações individuais.",
  );
} finally {
  await cleanup();
}
