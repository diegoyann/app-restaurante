import * as XLSX from "xlsx";

const statusLabels = {
  EXPECTED: "Previsto",
  DUE_SOON: "Vencendo",
  OVERDUE: "Vencido",
  PARTIAL: "Parcial",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};
const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
const dateBr = (value) =>
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const monthBr = (value) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", {
        month: "2-digit",
        year: "numeric",
      }).format(new Date(`${value}-01T12:00:00`))
    : "—";

function statusFromTotals(total, paid) {
  if (total > 0 && paid >= total) return "Pago";
  if (paid > 0) return "Parcial";
  return "Previsto";
}

export function buildPayrollWorkbook(group) {
  const isExtra = group.kind === "EXTRA";
  const headers = isExtra
    ? [
        "Funcionário",
        "Período",
        "Dias trabalhados",
        "Datas trabalhadas",
        "Tipos de diária",
        "Quantidade de diárias",
        "Valor das diárias",
        "Taxas de entrega",
        "Total previsto",
        "Pago",
        "Aberto",
        "Status",
      ]
    : [
        "Funcionário",
        "Competência",
        "Parcela",
        "Salário",
        "Percentual da parcela",
        "Valor base",
        "Quantidade de faltas",
        "Datas das faltas",
        "Valor das faltas",
        "Outros descontos",
        "Total de descontos",
        "Valor líquido",
        "Vencimento",
        "Pago",
        "Aberto",
        "Status",
      ];
  let dataRows;

  if (isExtra) {
    dataRows = group.items.map((item) => {
      const detail = item.payrollDetail || {};
      const workDays = detail.workDays || [];
      return [
        detail.employeeName || item.description,
        `${dateBr(detail.periodStart)} a ${dateBr(detail.periodEnd)}`,
        detail.daysWorked || 0,
        workDays.map((day) => dateBr(day.date)).join(", "),
        workDays
          .flatMap((day) => day.rateTypes || [])
          .map((type) => `${type.typeName} (${money(type.amountSnapshot)})`)
          .join(", "),
        detail.dailyRateCount || 0,
        Number(detail.totalDailyRates || 0),
        Number(detail.totalDeliveryFees || 0),
        Number(item.totalAmount || 0),
        Number(item.paidAmount || 0),
        Number(item.openAmount || 0),
        statusLabels[item.status] || item.status,
      ];
    });
  } else {
    dataRows = group.items.map((item) => {
      const statement = item.payrollDetail || {};
      const isAdvance =
        statement.installment === "ADVANCE" || group.installment === "ADVANCE";
      const percentage = isAdvance
        ? statement.advancePercentage || 40
        : statement.salaryPercentage || 60;
      const baseValue = isAdvance
        ? statement.advanceAmount ?? item.totalAmount
        : statement.baseSalaryPayment ?? item.forecastAmount;
      const absenceAmount = isAdvance ? 0 : Number(statement.absenceAmount || 0);
      const otherDiscounts = isAdvance
        ? 0
        : Number(
            statement.otherDiscountAmount ??
              (statement.adjustments || []).reduce(
                (sum, adjustment) => sum + Number(adjustment.amount || 0),
                0,
              ),
          );
      const totalDiscounts = isAdvance
        ? 0
        : Number(statement.totalDiscounts || 0);
      return [
        statement.employeeName || item.description,
        monthBr(statement.month || item.competenceMonth),
        isAdvance ? "Primeiro pagamento" : "Pagamento final",
        Number(statement.salary || 0),
        Number(percentage),
        Number(baseValue || 0),
        isAdvance ? 0 : Number(statement.absenceCount || 0),
        isAdvance ? "" : (statement.absences || [])
          .map((absence) => dateBr(absence.date))
          .join(", "),
        absenceAmount,
        otherDiscounts,
        totalDiscounts,
        Number(item.totalAmount || 0),
        dateBr(item.dueDate),
        Number(item.paidAmount || 0),
        Number(item.openAmount || 0),
        statusLabels[item.status] ||
          statusFromTotals(item.totalAmount, item.paidAmount),
      ];
    });
  }

  const title = isExtra
    ? `FOLHA EXTRA — ${dateBr(group.periodStart)} a ${dateBr(group.periodEnd)}`
    : `${group.title || "FOLHA FIXA"} — ${dateBr(group.dueDate)}`;
  const sheet = XLSX.utils.aoa_to_sheet([[title], [], headers, ...dataRows]);
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
  ];
  sheet["!cols"] = headers.map((header) => ({
    wch: Math.max(14, Math.min(header.length + 4, 28)),
  }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 2, c: 0 },
      e: { r: 2 + dataRows.length, c: headers.length - 1 },
    }),
  };
  const currencyColumns = isExtra
    ? [6, 7, 8, 9, 10]
    : [3, 5, 8, 9, 10, 11, 13, 14];
  for (let row = 3; row < 3 + dataRows.length; row += 1) {
    for (const column of currencyColumns) {
      const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
      if (cell) cell.z = "R$ #,##0.00";
    }
  }

  const workbook = XLSX.utils.book_new();
  const sheetName = isExtra
    ? "Folha Extra"
    : group.installment === "ADVANCE"
      ? "Primeiro Pagamento"
      : "Pagamento Final";
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  const suffix = isExtra
    ? `${group.periodStart}_${group.periodEnd}`
    : `${group.installment === "ADVANCE" ? "primeiro-pagamento" : "pagamento-final"}-${group.items[0]?.competenceMonth}`;
  return {
    workbook,
    sheetName,
    filename: `${isExtra ? "folha-extra" : "folha-fixa"}-${suffix}.xlsx`,
  };
}

export function downloadPayrollWorkbook(group) {
  const { workbook, filename } = buildPayrollWorkbook(group);
  XLSX.writeFile(workbook, filename);
}
