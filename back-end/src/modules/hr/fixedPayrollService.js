import {
  ensureOk,
  getTenantRowBySlug,
  maybeSingle,
  supabaseAdmin,
} from "../shared/db.js";
import { mapPayrollConfig } from "../app/projections/hrProjection.js";
import {
  calculateFixedPayrollStatement,
  PAYROLL_ADJUSTMENT_CATEGORIES,
} from "./fixedPayrollModel.js";
import { assertCompetenceOpen } from "../finance/competenceProtection.js";
import { resolveHistoricalOrCurrent } from "./payrollHistoryModel.js";

const ISO_MONTH = /^\d{4}-\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function mapScheduledDayOff(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    kind: row.kind,
    weekday: row.weekday,
    offDate: row.off_date || "",
    note: row.note || "",
    active: row.active !== false,
    cancelledAt: row.cancelled_at || "",
    cancellationReason: row.cancellation_reason || "",
  };
}

export function mapPayrollAdjustment(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    competenceMonth: row.competence_month,
    adjustmentDate: row.adjustment_date,
    category: row.category,
    categoryLabel: PAYROLL_ADJUSTMENT_CATEGORIES[row.category] || row.category,
    description: row.description,
    amount: Number(row.amount || 0),
    note: row.note || "",
    status: row.status,
    cancelledAt: row.cancelled_at || "",
    cancellationReason: row.cancellation_reason || "",
  };
}

function assertMonth(month) {
  if (!ISO_MONTH.test(String(month || "")))
    throw new Error("Competência inválida. Use AAAA-MM.");
  return month;
}

async function requireFixedEmployee(tenantId, employeeId) {
  const employee = maybeSingle(
    await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", employeeId)
      .eq("employment_type", "fixed")
      .maybeSingle(),
    "Falha ao carregar funcionário fixo.",
  );
  if (!employee)
    throw new Error("Funcionário fixo não encontrado nesta filial.");
  return employee;
}

export async function loadFixedPayrollStatements(
  tenantId,
  months,
  referenceDate,
) {
  const uniqueMonths = [
    ...new Set(months.filter((month) => ISO_MONTH.test(String(month)))),
  ];
  if (!uniqueMonths.length) return [];
  const firstMonth = [...uniqueMonths].sort()[0];
  const lastMonth = [...uniqueMonths].sort().at(-1);
  const [employees, configRow, employeeHistory, configHistory, workLogs, daysOff, adjustments] =
    await Promise.all([
      ensureOk(
        await supabaseAdmin
          .from("employees")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("employment_type", "fixed"),
        "Falha ao carregar funcionários fixos.",
      ),
      maybeSingle(
        await supabaseAdmin
          .from("payroll_configs")
          .select("*")
          .eq("tenant_id", tenantId)
          .maybeSingle(),
        "Falha ao carregar regras da folha.",
      ),
      ensureOk(
        await supabaseAdmin
          .from("employee_payroll_history")
          .select("*")
          .eq("tenant_id", tenantId)
          .lte("effective_month", lastMonth)
          .order("effective_month"),
        "Falha ao carregar histórico salarial.",
      ),
      ensureOk(
        await supabaseAdmin
          .from("payroll_config_history")
          .select("*")
          .eq("tenant_id", tenantId)
          .lte("effective_month", lastMonth)
          .order("effective_month"),
        "Falha ao carregar histórico das regras de RH.",
      ),
      ensureOk(
        await supabaseAdmin
          .from("employee_work_logs")
          .select("*")
          .eq("tenant_id", tenantId)
          .gte("work_date", `${firstMonth}-01`)
          .lte("work_date", `${lastMonth}-31`),
        "Falha ao carregar presenças da folha fixa.",
      ),
      ensureOk(
        await supabaseAdmin
          .from("employee_scheduled_days_off")
          .select("*")
          .eq("tenant_id", tenantId),
        "Falha ao carregar folgas programadas.",
      ),
      ensureOk(
        await supabaseAdmin
          .from("payroll_adjustments")
          .select("*")
          .eq("tenant_id", tenantId)
          .in("competence_month", uniqueMonths),
        "Falha ao carregar ajustes da folha.",
      ),
    ]);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentConfig = mapPayrollConfig(configRow);
  const employeeFromHistory = (row) => row && ({
    id: row.employee_id,
    full_name: row.full_name,
    role: row.role,
    employment_type: row.employment_type,
    status: row.status,
    salary: row.salary,
    admission_date: row.admission_date,
    control_attendance: row.control_attendance,
    attendance_control_from: row.attendance_control_from,
    weekly_day_off: row.weekly_day_off,
    monthly_sunday_off_ordinal: row.monthly_sunday_off_ordinal,
    first_payment_percentage: row.first_payment_percentage,
    final_payment_percentage: row.final_payment_percentage,
  });
  const configFromHistory = (row) => row ? mapPayrollConfig(row) : null;

  return uniqueMonths.flatMap((month) => {
    const config = configFromHistory(resolveHistoricalOrCurrent({
      history: configHistory, month, currentMonth, current: configRow,
    })) || (month >= currentMonth ? currentConfig : null);
    return employees.flatMap((currentEmployee) => {
      const historical = resolveHistoricalOrCurrent({
        history: employeeHistory,
        month,
        currentMonth,
        current: currentEmployee,
        predicate: (row) => row.employee_id === currentEmployee.id,
      });
      const employee = historical?.effective_month ? employeeFromHistory(historical) : historical;
      if (!employee || employee.employment_type !== 'fixed' || employee.status === 'inactive') return [];
      if (employee.admission_date && String(employee.admission_date).slice(0, 7) > month) return [];
      return [calculateFixedPayrollStatement({
        month,
        employee,
        payrollConfig: config || {},
        workLogs: workLogs.filter((log) => log.employee_id === employee.id),
        scheduledDaysOff: daysOff
          .filter((item) => item.employee_id === employee.id)
          .filter((item) => item.kind !== 'DATE' || String(item.off_date || '').slice(0, 7) === month)
          .map(mapScheduledDayOff),
        adjustments: adjustments
          .filter((item) => item.employee_id === employee.id)
          .map(mapPayrollAdjustment),
        referenceDate,
      })];
    });
  });
}

export async function getFixedPayrollData(tenantSlug, month) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const competenceMonth = assertMonth(month);
  const [statements, daysOff, adjustments] = await Promise.all([
    loadFixedPayrollStatements(tenant.id, [competenceMonth]),
    ensureOk(
      await supabaseAdmin
        .from("employee_scheduled_days_off")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at"),
      "Falha ao carregar folgas programadas.",
    ),
    ensureOk(
      await supabaseAdmin
        .from("payroll_adjustments")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("competence_month", competenceMonth)
        .order("adjustment_date"),
      "Falha ao carregar ajustes da competência.",
    ),
  ]);
  return {
    competenceMonth,
    statements,
    scheduledDaysOff: daysOff.map(mapScheduledDayOff),
    adjustments: adjustments.map(mapPayrollAdjustment),
  };
}

export async function saveScheduledDayOff(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await requireFixedEmployee(tenant.id, payload.employeeId);
  if (!["WEEKLY", "DATE"].includes(payload.kind))
    throw new Error("Tipo de folga inválido.");
  const weekday = payload.kind === "WEEKLY" ? Number(payload.weekday) : null;
  const offDate =
    payload.kind === "DATE" ? String(payload.offDate || "") : null;
  if (
    payload.kind === "WEEKLY" &&
    (!Number.isInteger(weekday) || weekday < 0 || weekday > 6)
  )
    throw new Error("Dia da semana inválido.");
  if (payload.kind === "DATE" && !ISO_DATE.test(offDate))
    throw new Error("Data da folga inválida.");
  const affectedMonth = payload.kind === "DATE"
    ? offDate.slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  await assertCompetenceOpen(tenant.id, affectedMonth);
  const existing = payload.id
    ? null
    : maybeSingle(
        await (
          payload.kind === "WEEKLY"
            ? supabaseAdmin
                .from("employee_scheduled_days_off")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("employee_id", payload.employeeId)
                .eq("kind", "WEEKLY")
                .eq("weekday", weekday)
                .eq("active", true)
            : supabaseAdmin
                .from("employee_scheduled_days_off")
                .select("id")
                .eq("tenant_id", tenant.id)
                .eq("employee_id", payload.employeeId)
                .eq("kind", "DATE")
                .eq("off_date", offDate)
                .eq("active", true)
        ).maybeSingle(),
        "Falha ao verificar folga existente.",
      );
  const values = {
    id: payload.id || existing?.id || undefined,
    tenant_id: tenant.id,
    employee_id: payload.employeeId,
    kind: payload.kind,
    weekday,
    off_date: offDate,
    note: String(payload.note || "").trim(),
    active: true,
    cancelled_at: null,
    cancellation_reason: "",
  };
  const row = ensureOk(
    await (
      values.id
        ? supabaseAdmin
            .from("employee_scheduled_days_off")
            .update(values)
            .eq("tenant_id", tenant.id)
            .eq("id", values.id)
        : supabaseAdmin.from("employee_scheduled_days_off").insert(values)
    )
      .select("*")
      .single(),
    "Falha ao salvar folga programada.",
  );
  const { synchronizeFixedPayrollMonth } =
    await import("../finance/obligationsService.js");
  await synchronizeFixedPayrollMonth(tenant.id, affectedMonth);
  return mapScheduledDayOff(row);
}

export async function cancelScheduledDayOff(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const reason = String(payload.reason || "").trim();
  if (!reason) throw new Error("Informe o motivo do cancelamento da folga.");
  const current = maybeSingle(
    await supabaseAdmin
      .from("employee_scheduled_days_off")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("id", payload.id)
      .maybeSingle(),
    "Falha ao carregar folga programada.",
  );
  if (!current) throw new Error("Folga programada não encontrada.");
  const affectedMonth = current.kind === "DATE"
    ? String(current.off_date).slice(0, 7)
    : new Date().toISOString().slice(0, 7);
  await assertCompetenceOpen(tenant.id, affectedMonth);
  const row = ensureOk(
    await supabaseAdmin
      .from("employee_scheduled_days_off")
      .update({
        active: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", payload.id)
      .select("*")
      .single(),
    "Falha ao cancelar folga programada.",
  );
  const { synchronizeFixedPayrollMonth } =
    await import("../finance/obligationsService.js");
  await synchronizeFixedPayrollMonth(tenant.id, affectedMonth);
  return mapScheduledDayOff(row);
}

export async function savePayrollAdjustment(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  await requireFixedEmployee(tenant.id, payload.employeeId);
  const competenceMonth = assertMonth(payload.competenceMonth);
  await assertCompetenceOpen(tenant.id, competenceMonth);
  if (!ISO_DATE.test(String(payload.adjustmentDate || "")))
    throw new Error("Data do ajuste inválida.");
  if (String(payload.adjustmentDate).slice(0, 7) !== competenceMonth)
    throw new Error("A data do ajuste deve pertencer à competência informada.");
  const category = String(payload.category || "").trim();
  if (!category) throw new Error("Categoria do ajuste é obrigatória.");
  const description = String(payload.description || "").trim();
  const amount = Math.round((Number(payload.amount) || 0) * 100) / 100;
  if (!description) throw new Error("Descrição do ajuste é obrigatória.");
  if (amount <= 0) throw new Error("Valor do ajuste deve ser maior que zero.");
  const row = ensureOk(
    await supabaseAdmin
      .from("payroll_adjustments")
      .upsert({
        id: payload.id || undefined,
        tenant_id: tenant.id,
        employee_id: payload.employeeId,
        competence_month: competenceMonth,
        adjustment_date: payload.adjustmentDate,
        category,
        description,
        amount,
        note: String(payload.note || "").trim(),
        status: "ACTIVE",
        cancelled_at: null,
        cancellation_reason: "",
      })
      .select("*")
      .single(),
    "Falha ao salvar ajuste da folha.",
  );
  const { synchronizeFixedPayrollMonth } =
    await import("../finance/obligationsService.js");
  await synchronizeFixedPayrollMonth(tenant.id, competenceMonth);
  return mapPayrollAdjustment(row);
}

export async function cancelPayrollAdjustment(tenantSlug, payload) {
  const tenant = await getTenantRowBySlug(tenantSlug);
  const reason = String(payload.reason || "").trim();
  if (!reason) throw new Error("Informe o motivo do cancelamento do ajuste.");
  const current = maybeSingle(
    await supabaseAdmin
      .from("payroll_adjustments")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("id", payload.id)
      .maybeSingle(),
    "Falha ao carregar ajuste da folha.",
  );
  if (!current) throw new Error("Ajuste da folha não encontrado.");
  await assertCompetenceOpen(tenant.id, current.competence_month);
  const row = ensureOk(
    await supabaseAdmin
      .from("payroll_adjustments")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", payload.id)
      .select("*")
      .single(),
    "Falha ao cancelar ajuste da folha.",
  );
  const { synchronizeFixedPayrollMonth } =
    await import("../finance/obligationsService.js");
  await synchronizeFixedPayrollMonth(tenant.id, current.competence_month);
  return mapPayrollAdjustment(row);
}
