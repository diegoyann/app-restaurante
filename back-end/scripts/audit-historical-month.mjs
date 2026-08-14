import { getTenantBootstrap } from "../src/modules/hr/index.js";
import { getFinancialObligations } from "../src/modules/finance/obligationsService.js";
import { getSupplyChainData } from "../src/modules/supply-chain/index.js";
import { supabaseAdmin } from "../src/modules/shared/db.js";
import {
  buildMonthlyPayrollEntries,
  calculateMonthlyDre,
} from "../../front-end/app/mock/src/features/finance/dreModel.js";

const tenantSlug = process.env.AUDIT_TENANT_SLUG || "bady-bassitt";
const month = process.env.AUDIT_MONTH || "2026-07";
const monthStart = `${month}-01`;
const monthEnd = new Date(
  Number(month.slice(0, 4)),
  Number(month.slice(5, 7)),
  0,
  12,
)
  .toISOString()
  .slice(0, 10);

const tenantResult = await supabaseAdmin
  .from("tenants")
  .select("id,slug,name")
  .eq("slug", tenantSlug)
  .single();
if (tenantResult.error) throw tenantResult.error;
const tenant = tenantResult.data;

const [bootstrap, obligationPayload, supply, closingResult, rawObligationsResult] =
  await Promise.all([
    getTenantBootstrap(tenantSlug),
    getFinancialObligations(tenantSlug),
    getSupplyChainData(tenantSlug),
    supabaseAdmin
      .from("financial_closings")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("period_type", "monthly")
      .eq("period_start", monthStart)
      .eq("period_end", monthEnd)
      .maybeSingle(),
    supabaseAdmin
      .from("financial_obligations")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("competence_month", month)
      .order("created_at"),
  ]);

if (closingResult.error && closingResult.status !== 406)
  throw closingResult.error;
if (rawObligationsResult.error) throw rawObligationsResult.error;

const payrollEntries = buildMonthlyPayrollEntries({
  month,
  employees: bootstrap.employees || [],
  employeeWorkLogs: bootstrap.employeeWorkLogs || [],
});
const dre = calculateMonthlyDre({
  month,
  transactions: bootstrap.transactions || [],
  recurringCosts: bootstrap.recurringCosts || [],
  payrollEntries,
  obligations: obligationPayload.obligations || [],
  inventoryCmvSummaries: supply.monthlyInventorySummaries || [],
});

const rawObligations = rawObligationsResult.data || [];
const obligationsByCategory = rawObligations.reduce((groups, row) => {
  const key = row.economic_category || "SEM_CATEGORIA";
  groups[key] = Math.round(
    ((groups[key] || 0) +
      Number(row.final_amount ?? row.forecast_amount ?? 0)) *
      100,
  ) / 100;
  return groups;
}, {});

const report = {
  tenant,
  month,
  current: {
    revenueGross: dre.revenueGross,
    revenueNet: dre.revenueNet,
    cmv: dre.costOfSales,
    cmvStatus: dre.cmvStatus,
    payrollAndAdministrative: dre.administrativeExpenses,
    selling: dre.sellingExpenses,
    financial: dre.financialExpenses,
    taxes: dre.incomeTaxes,
    netIncome: dre.netIncome,
    details: dre.details,
    sourceCounts: dre.sourceCounts,
  },
  currentPayrollEntries: payrollEntries,
  obligationsByCategory,
  rawObligations: rawObligations.map((row) => ({
    id: row.id,
    description: row.description,
    category: row.economic_category,
    sourceType: row.source_type,
    sourceId: row.source_id,
    forecastAmount: Number(row.forecast_amount || 0),
    finalAmount: row.final_amount == null ? null : Number(row.final_amount),
    paidAmount: Number(row.paid_amount || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })),
  closing: closingResult.data
    ? {
        id: closingResult.data.id,
        status: closingResult.data.status,
        grossRevenue: Number(closingResult.data.gross_revenue || 0),
        netRevenue: Number(closingResult.data.net_revenue || 0),
        fixedCosts: Number(closingResult.data.fixed_costs || 0),
        payrollCosts: Number(closingResult.data.payroll_costs || 0),
        totalExpenses: Number(closingResult.data.total_expenses || 0),
        balance: Number(closingResult.data.balance || 0),
        closedAt: closingResult.data.closed_at,
        updatedAt: closingResult.data.updated_at,
        snapshot: closingResult.data.snapshot,
      }
    : null,
};

console.log(JSON.stringify(report, null, 2));
