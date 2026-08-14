import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Download,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import {
  filterObligationsByMonth,
  summarizeObligations,
} from "./financialViewModel.js";
import {
  groupPayrollObligations,
  payrollGroupMatchesFilter,
} from "./payrollGroupingModel.js";
import { downloadPayrollWorkbook } from "./payrollWorkbook.js";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
const dateBr = (value) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const monthBr = (value) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        month: "2-digit",
        year: "numeric",
      }).format(new Date(`${value}-01T12:00:00`))
    : "—";
const statusLabels = {
  EXPECTED: "Previsto",
  DUE_SOON: "Vencendo",
  OVERDUE: "Vencido",
  PARTIAL: "Parcial",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};
const statusClasses = {
  EXPECTED: "bg-stone-100 text-stone-700",
  DUE_SOON: "bg-amber-100 text-amber-800",
  OVERDUE: "bg-red-100 text-red-800",
  PARTIAL: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-stone-200 text-stone-500",
};
const localToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

function Summary({ label, value, icon, tone = "text-[#2A1E15]" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[#6F6258]">
        {React.createElement(icon, { size: 16 })}
        <p className="text-[10px] font-black uppercase">{label}</p>
      </div>
      <p
        className={`mt-3 whitespace-nowrap text-[clamp(1rem,2vw,1.5rem)] font-black tabular-nums ${tone}`}
      >
        {money(value)}
      </p>
    </div>
  );
}

export default function AccountsPayablePage({
  month,
  onMonthChange,
  obligations = [],
  fixedPayrollStatements = [],
  isPayrollDetailLoading = false,
  duplicateCandidates = [],
  onPay,
  onUpdate,
  onResolveDuplicate,
  isSaving,
}) {
  const [filter, setFilter] = useState("OPEN");
  const [managing, setManaging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const today = localToday();
  const detailedObligations = useMemo(
    () =>
      obligations.map((item) => {
        if (
          item.economicCategory !== "FOLHA_FIXA" ||
          item.competenceMonth !== month ||
          (item.payrollDetail?.salary != null &&
            item.payrollDetail?.installment)
        )
          return item;
        const statement = fixedPayrollStatements.find(
          (candidate) =>
            String(candidate.employeeId) === String(item.employeeId) ||
            String(item.description || "")
              .toLocaleLowerCase("pt-BR")
              .startsWith(
                String(candidate.employeeName || "").toLocaleLowerCase("pt-BR"),
              ),
        );
        if (!statement) return item;
        const installment =
          String(item.sourceId || "").endsWith(":ADVANCE") ||
          /adiantamento/i.test(item.description || "")
            ? "ADVANCE"
            : "SALARY";
        return {
          ...item,
          payrollDetail: { ...statement, installment },
        };
      }),
    [obligations, fixedPayrollStatements, month],
  );
  const monthObligations = useMemo(
    () => filterObligationsByMonth(detailedObligations, month),
    [detailedObligations, month],
  );
  const summary = useMemo(
    () => summarizeObligations(monthObligations, { today }),
    [monthObligations, today],
  );
  const payrollGroups = useMemo(
    () => groupPayrollObligations(monthObligations),
    [monthObligations],
  );
  const payrollIds = useMemo(
    () =>
      new Set(
        payrollGroups.flatMap((group) => group.items.map((item) => item.id)),
      ),
    [payrollGroups],
  );
  const visiblePayrollGroups = useMemo(
    () =>
      payrollGroups.filter((group) => payrollGroupMatchesFilter(group, filter)),
    [payrollGroups, filter],
  );
  const filtered = useMemo(
    () =>
      monthObligations
        .filter((item) => !payrollIds.has(item.id))
        .filter((item) => {
          if (filter === "ALL") return true;
          if (filter === "OPEN")
            return !["PAID", "CANCELLED"].includes(item.status);
          return item.status === filter;
        }),
    [monthObligations, payrollIds, filter],
  );

  const submitPayment = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPaymentError("");
    try {
      await onPay({
        obligationId: selected.id,
        amount: Number(form.get("amount")),
        paymentDate: form.get("paymentDate"),
        financialOrigin: form.get("financialOrigin"),
        paymentMethod: form.get("paymentMethod"),
        observation: form.get("observation"),
      });
      setSelected(null);
    } catch (error) {
      setPaymentError(
        error.message || "Não foi possível registrar o pagamento.",
      );
    }
  };

  const submitUpdate = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onUpdate({
      id: editing.id,
      finalAmount: form.get("finalAmount"),
      dueDate: form.get("dueDate"),
      note: form.get("note"),
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[#8A5A2B]">
            Financeiro previsto
          </p>
          <h3 className="mt-2 text-balance text-2xl font-black uppercase text-[#2A1E15]">
            Contas a Pagar
          </h3>
          <p className="mt-2 text-pretty text-sm font-bold text-[#6F6258]">
            Os totais e a lista abaixo consideram somente a competência
            selecionada. O Fluxo de Caixa recebe valores quando um pagamento é
            registrado.
          </p>
        </div>
        <label className="min-w-48">
          <span className="mb-1 block text-[10px] font-black uppercase text-[#6F6258]">
            Competência
          </span>
          <input
            type="month"
            value={month}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value))
                onMonthChange(event.target.value);
            }}
            className="w-full rounded-xl border border-[#D4A373]/40 bg-[#FFF8EC] px-4 py-3 text-sm font-black text-[#2A1E15]"
            aria-label="Competência das contas a pagar"
          />
        </label>
      </section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Summary label="Total em aberto" value={summary.open} icon={Wallet} />
        <Summary
          label="Vencidas"
          value={summary.overdue}
          icon={AlertTriangle}
          tone="text-red-700"
        />
        <Summary
          label="Próximos 7 dias"
          value={summary.next7}
          icon={CalendarClock}
          tone="text-amber-800"
        />
        <Summary
          label="Próximos 30 dias"
          value={summary.next30}
          icon={CalendarClock}
        />
        <Summary
          label="Pagas"
          value={summary.paid}
          icon={CheckCircle}
          tone="text-green-800"
        />
      </section>
      {duplicateCandidates.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-black text-amber-900">
            Possíveis duplicatas aguardando revisão
          </p>
          <p className="mt-1 text-xs font-bold text-amber-800">
            Mesclar preserva pagamentos já feitos e remove somente previsões
            futuras repetidas.
          </p>
          {duplicateCandidates.map((item) => (
            <div
              key={item.id}
              className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-200 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-xs font-bold text-amber-900">
                {item.leftName} × {item.rightName} — {item.reason}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    onResolveDuplicate({ id: item.id, action: "KEEP_SEPARATE" })
                  }
                  className="rounded-lg bg-stone-200 px-3 py-2 text-[10px] font-black uppercase text-[#2A1E15] disabled:opacity-50"
                >
                  Manter separados
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    onResolveDuplicate({ id: item.id, action: "MERGE" })
                  }
                  className="rounded-lg bg-amber-700 px-3 py-2 text-[10px] font-black uppercase text-white disabled:opacity-50"
                >
                  Mesclar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      <section className="rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:p-6">
        {isPayrollDetailLoading && (
          <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-black uppercase text-blue-800">
            Carregando cálculo detalhado da folha fixa…
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {[
            "OPEN",
            "OVERDUE",
            "DUE_SOON",
            "PARTIAL",
            "PAID",
            "CANCELLED",
            "ALL",
          ].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase ${filter === value ? "bg-[#2A1E15] text-white" : "bg-stone-100 text-[#6F6258]"}`}
            >
              {value === "OPEN"
                ? "Em aberto"
                : value === "ALL"
                  ? "Todas"
                  : statusLabels[value]}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {visiblePayrollGroups.map((group) => (
            <article
              key={group.id}
              className="overflow-hidden rounded-2xl border border-[#D4A373]/40 bg-[#FFF8EC]"
            >
              <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroup((current) =>
                      current === group.id ? "" : group.id,
                    )
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform ${expandedGroup === group.id ? "rotate-180" : ""}`}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#2A1E15]">
                        {group.title}
                        {group.kind === "EXTRA"
                          ? ` — ${dateBr(group.periodStart)} a ${dateBr(group.periodEnd)}`
                          : ` — ${dateBr(group.dueDate)}`}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusClasses[group.status]}`}
                      >
                        {statusLabels[group.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#6F6258]">
                      {group.items.length} obrigação(ões) individual(is)
                      {group.kind === "FIXED"
                        ? ` · Competência ${monthBr(group.competenceMonth)}`
                        : ""}
                    </p>
                  </div>
                </button>
                <div className="grid grid-cols-3 gap-4 text-right text-xs tabular-nums">
                  <div>
                    <p className="text-[#6F6258]">Previsto</p>
                    <strong>{money(group.forecast)}</strong>
                  </div>
                  <div>
                    <p className="text-[#6F6258]">Pago</p>
                    <strong className="text-green-800">
                      {money(group.paid)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[#6F6258]">Aberto</p>
                    <strong className="text-red-700">
                      {money(group.open)}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={group.kind === "FIXED" && isPayrollDetailLoading}
                  onClick={() => downloadPayrollWorkbook(group)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-4 py-3 text-[10px] font-black uppercase text-white"
                >
                  <Download size={15} />
                  {group.kind === "FIXED" && isPayrollDetailLoading
                    ? "Carregando cálculo..."
                    : "Exportar Excel"}
                </button>
              </div>
              {expandedGroup === group.id && (
                <div className="space-y-3 border-t border-[#D4A373]/30 bg-white p-4">
                  {group.items.map((item) => {
                    const detail = item.payrollDetail || {};
                    const isAdvance =
                      detail.installment === "ADVANCE" ||
                      group.installment === "ADVANCE";
                    const installmentPercentage = isAdvance
                      ? detail.advancePercentage || 40
                      : detail.salaryPercentage || 60;
                    const installmentBase = isAdvance
                      ? detail.advanceAmount ?? item.totalAmount
                      : detail.baseSalaryPayment ?? item.forecastAmount;
                    const installmentDiscounts = isAdvance
                      ? 0
                      : detail.totalDiscounts || 0;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-stone-200 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="font-black text-[#2A1E15]">
                              {detail.employeeName || item.description}
                            </p>
                            <p className="mt-1 text-xs font-bold text-[#6F6258]">
                              {group.kind === "EXTRA"
                                ? `${detail.daysWorked || 0} dia(s) · ${detail.dailyRateCount || 0} diária(s) · Tipos: ${
                                    (detail.workDays || [])
                                      .flatMap((day) => day.rateTypes || [])
                                      .map((type) => type.typeName)
                                      .filter(
                                        (value, index, all) =>
                                          all.indexOf(value) === index,
                                      )
                                      .join(", ") || "Histórico legado"
                                  } · Taxas ${money(detail.totalDeliveryFees)}`
                                : `${installmentPercentage}% desta parcela`}
                            </p>
                          </div>
                          {group.kind === "EXTRA" ? (
                            <div className="grid grid-cols-3 gap-4 text-right text-xs">
                              <div>
                                <p className="text-[#6F6258]">Previsto</p>
                                <strong>{money(item.totalAmount)}</strong>
                              </div>
                              <div>
                                <p className="text-[#6F6258]">Pago</p>
                                <strong className="text-green-800">
                                  {money(item.paidAmount)}
                                </strong>
                              </div>
                              <div>
                                <p className="text-[#6F6258]">Aberto</p>
                                <strong className="text-red-700">
                                  {money(item.openAmount)}
                                </strong>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 text-right text-xs sm:grid-cols-4">
                              <div>
                                <p className="text-[#6F6258]">Percentual</p>
                                <strong>{installmentPercentage}%</strong>
                              </div>
                              <div>
                                <p className="text-[#6F6258]">Base</p>
                                <strong>{money(installmentBase)}</strong>
                              </div>
                              <div>
                                <p className="text-[#6F6258]">Descontos</p>
                                <strong className="text-red-700">
                                  {money(installmentDiscounts)}
                                </strong>
                              </div>
                              <div>
                                <p className="text-[#6F6258]">Líquido</p>
                                <strong className="text-green-800">
                                  {money(item.totalAmount)}
                                </strong>
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setManaging(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-[10px] font-black uppercase text-[#2A1E15]"
                          >
                            <SlidersHorizontal size={15} />
                            Gerenciar/Pagar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-stone-200 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-[#2A1E15]">
                      {item.description}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusClasses[item.status]}`}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-[#6F6258]">
                    Competência {monthBr(item.competenceMonth)} · Vence{" "}
                    {dateBr(item.dueDate)} ·{" "}
                    {item.economicCategory.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-xs tabular-nums">
                  <div>
                    <p className="text-[#6F6258]">Previsto</p>
                    <strong>{money(item.forecastAmount)}</strong>
                  </div>
                  <div>
                    <p className="text-[#6F6258]">Pago</p>
                    <strong className="text-green-800">
                      {money(item.paidAmount)}
                    </strong>
                  </div>
                  <div>
                    <p className="text-[#6F6258]">Aberto</p>
                    <strong className="text-red-700">
                      {money(item.openAmount)}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManaging(item)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-4 py-3 text-[10px] font-black uppercase text-[#2A1E15]"
                >
                  <SlidersHorizontal size={15} />
                  Gerenciar
                </button>
              </div>
            </article>
          ))}
          {filtered.length === 0 && visiblePayrollGroups.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-bold text-[#6F6258]">
                Nenhuma obrigação em {monthBr(month)} nesta visão.
              </p>
              {filter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className="mt-3 rounded-xl bg-stone-100 px-4 py-2 text-xs font-black"
                >
                  Ver todos os status desta competência
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      {managing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1E15]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manage-obligation-title"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <h3
              id="manage-obligation-title"
              className="text-lg font-black text-[#2A1E15]"
            >
              Gerenciar obrigação
            </h3>
            <p className="mt-1 text-sm font-bold text-[#6F6258]">
              {managing.description}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 p-4 text-xs">
              <div>
                <p className="text-[#6F6258]">Competência</p>
                <strong>{monthBr(managing.competenceMonth)}</strong>
              </div>
              <div>
                <p className="text-[#6F6258]">Vencimento</p>
                <strong>{dateBr(managing.dueDate)}</strong>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 rounded-2xl bg-stone-50 p-4 text-center text-xs">
              <div>
                <p className="text-[#6F6258]">Previsto</p>
                <strong>{money(managing.forecastAmount)}</strong>
              </div>
              <div>
                <p className="text-[#6F6258]">Pago</p>
                <strong className="text-green-800">
                  {money(managing.paidAmount)}
                </strong>
              </div>
              <div>
                <p className="text-[#6F6258]">Aberto</p>
                <strong className="text-red-700">
                  {money(managing.openAmount)}
                </strong>
              </div>
            </div>
            {managing.economicCategory === "FOLHA_FIXA" &&
              managing.payrollDetail?.installment === "SALARY" && (
                <section className="mt-4 space-y-3 rounded-2xl border border-[#D4A373]/40 bg-[#FFF8EC] p-4 text-xs">
                  <h4 className="font-black uppercase text-[#2A1E15]">
                    Composição do pagamento final
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-[#6F6258]">Salário</p>
                      <strong>{money(managing.payrollDetail.salary)}</strong>
                    </div>
                    <div>
                      <p className="text-[#6F6258]">
                        Base {managing.payrollDetail.salaryPercentage || 60}%
                      </p>
                      <strong>
                        {money(managing.payrollDetail.baseSalaryPayment)}
                      </strong>
                    </div>
                    <div>
                      <p className="text-[#6F6258]">Descontos</p>
                      <strong className="text-red-700">
                        {money(managing.payrollDetail.totalDiscounts)}
                      </strong>
                    </div>
                    <div>
                      <p className="text-[#6F6258]">Líquido</p>
                      <strong className="text-green-800">
                        {money(managing.payrollDetail.finalSalaryPayment)}
                      </strong>
                    </div>
                  </div>
                  {(managing.payrollDetail.absences || []).length > 0 && (
                    <div className="rounded-xl bg-red-50 p-3">
                      <strong>Faltas</strong>
                      {managing.payrollDetail.absences.map((absence) => (
                        <p key={absence.date}>
                          {dateBr(absence.date)} — {money(absence.amount)}
                        </p>
                      ))}
                    </div>
                  )}
                  {(managing.payrollDetail.adjustments || []).length > 0 && (
                    <div className="rounded-xl bg-amber-50 p-3">
                      <strong>Ajustes e descontos</strong>
                      {managing.payrollDetail.adjustments.map((adjustment) => (
                        <p key={adjustment.id}>
                          {adjustment.categoryLabel} — {money(adjustment.amount)}
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              )}
            {managing.payments?.length > 0 && (
              <section className="mt-4">
                <h4 className="text-[10px] font-black uppercase text-[#6F6258]">
                  Histórico de pagamentos
                </h4>
                <div className="mt-2 space-y-2">
                  {[...managing.payments]
                    .sort((a, b) =>
                      String(b.paymentDate).localeCompare(
                        String(a.paymentDate),
                      ),
                    )
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3 text-xs"
                      >
                        <div>
                          <strong className="text-[#2A1E15]">
                            {dateBr(payment.paymentDate)}
                          </strong>
                          <p className="text-[#6F6258]">
                            {payment.paymentMethod} ·{" "}
                            {payment.financialOrigin === "CASH"
                              ? "Dinheiro físico"
                              : "Conta/Banco"}
                            {payment.observation
                              ? ` · ${payment.observation}`
                              : ""}
                          </p>
                        </div>
                        <strong className="text-green-800">
                          {money(payment.amount)}
                        </strong>
                      </div>
                    ))}
                </div>
              </section>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(managing);
                  setManaging(null);
                }}
                className="rounded-xl bg-stone-100 p-3 text-xs font-black uppercase text-[#2A1E15]"
              >
                Ajustar só esta competência
              </button>
              <button
                type="button"
                disabled={managing.openAmount <= 0}
                onClick={() => {
                  setPaymentError("");
                  setSelected(managing);
                  setManaging(null);
                }}
                className="rounded-xl bg-green-700 p-3 text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Registrar pagamento
              </button>
            </div>
            <button
              type="button"
              onClick={() => setManaging(null)}
              className="mt-3 w-full rounded-xl border border-stone-200 p-3 text-xs font-black uppercase text-[#6F6258]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1E15]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-title"
        >
          <form
            onSubmit={submitPayment}
            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="text-[#8A5A2B]" />
              <div>
                <h3
                  id="payment-title"
                  className="text-balance text-lg font-black text-[#2A1E15]"
                >
                  Registrar pagamento
                </h3>
                <p className="text-sm font-bold text-[#6F6258]">
                  {selected.description} · saldo {money(selected.openAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#FFF8EC] p-4 text-xs">
              <div>
                <p className="text-[#6F6258]">Competência da obrigação</p>
                <strong>{monthBr(selected.competenceMonth)}</strong>
              </div>
              <div>
                <p className="text-[#6F6258]">Data de vencimento</p>
                <strong>{dateBr(selected.dueDate)}</strong>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-[#6F6258]">
              Informe abaixo o dia em que o dinheiro realmente saiu. A data de
              registro no sistema não altera a competência da obrigação.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-bold">Valor pago</span>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  max={selected.openAmount}
                  step="0.01"
                  defaultValue={selected.openAmount}
                  required
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label>
                <span className="text-xs font-black uppercase text-[#2A1E15]">
                  Data do pagamento
                </span>
                <input
                  aria-label="Data do pagamento"
                  name="paymentDate"
                  type="date"
                  defaultValue={today}
                  required
                  className="mt-1 w-full rounded-xl border border-[#8A5A2B]/50 bg-[#FFF8EC] p-3 font-bold"
                />
              </label>
              <label>
                <span className="text-xs font-bold">De onde saiu?</span>
                <select
                  name="financialOrigin"
                  defaultValue={selected.suggestedFinancialOrigin || "BANK"}
                  className="mt-1 w-full rounded-xl border bg-white p-3"
                >
                  <option value="BANK">Conta/Banco</option>
                  <option value="CASH">Dinheiro físico</option>
                </select>
              </label>
              <label>
                <span className="text-xs font-bold">Forma</span>
                <select
                  name="paymentMethod"
                  defaultValue={selected.suggestedPaymentMethod || "PIX"}
                  className="mt-1 w-full rounded-xl border bg-white p-3"
                >
                  <option value="PIX">Pix</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="CARD">Cartão</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="OTHER">Outro</option>
                </select>
              </label>
              <label className="col-span-2">
                <span className="text-xs font-bold">Observação</span>
                <input
                  name="observation"
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
            </div>
            {paymentError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800"
              >
                {paymentError}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentError("");
                  setSelected(null);
                }}
                className="flex-1 rounded-xl bg-stone-100 p-3 text-xs font-black"
              >
                Cancelar
              </button>
              <button
                disabled={isSaving}
                className="flex-1 rounded-xl bg-green-700 p-3 text-xs font-black text-white disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Confirmar pagamento"}
              </button>
            </div>
          </form>
        </div>
      )}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A1E15]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-obligation-title"
        >
          <form
            onSubmit={submitUpdate}
            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-xl"
          >
            <h3
              id="edit-obligation-title"
              className="text-lg font-black text-[#2A1E15]"
            >
              Ajustar obrigação
            </h3>
            <p className="mt-1 text-sm font-bold text-[#6F6258]">
              {editing.description}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-bold">Valor final</span>
                <input
                  name="finalAmount"
                  type="number"
                  min={editing.paidAmount || 0}
                  step="0.01"
                  defaultValue={editing.finalAmount ?? editing.forecastAmount}
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label>
                <span className="text-xs font-bold">Vencimento</span>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={editing.dueDate}
                  required
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label className="col-span-2">
                <span className="text-xs font-bold">Observação</span>
                <input
                  name="note"
                  defaultValue={editing.note}
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl bg-stone-100 p-3 text-xs font-black"
              >
                Cancelar
              </button>
              <button
                disabled={isSaving}
                className="flex-1 rounded-xl bg-[#2A1E15] p-3 text-xs font-black text-white disabled:opacity-50"
              >
                Salvar ajuste
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
