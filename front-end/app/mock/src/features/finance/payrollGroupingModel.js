const money = (value) => Math.round((Number(value) || 0) * 100) / 100;

const dateBrToIso = (value) => {
  const [day, month, year] = String(value || "").split("/");
  return day && month && year ? `${year}-${month}-${day}` : "";
};

export function inferLegacyExtraDetail(item) {
  if (item.payrollDetail?.periodStart) return item.payrollDetail;
  const match = String(item.description || "").match(
    /^(.*?)\s+[—-]\s+(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})$/,
  );
  if (!match) return item.payrollDetail || null;
  return {
    employeeName: match[1].trim(),
    periodStart: dateBrToIso(match[2]),
    periodEnd: dateBrToIso(match[3]),
    daysWorked: 0,
    dailyRateCount: 0,
    workDays: [],
    totalDailyRates: Number(item.totalAmount ?? item.forecastAmount ?? 0),
    totalDeliveryFees: 0,
    legacy: true,
  };
}

export function aggregatePayrollStatus(items = []) {
  const active = items.filter((item) => item.status !== "CANCELLED");
  const total = active.reduce(
    (sum, item) => sum + Number(item.totalAmount ?? item.forecastAmount ?? 0),
    0,
  );
  const paid = active.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0,
  );
  if (active.length && paid >= total) return "PAID";
  if (paid > 0) return "PARTIAL";
  if (active.some((item) => item.status === "OVERDUE")) return "OVERDUE";
  if (active.some((item) => item.status === "DUE_SOON")) return "DUE_SOON";
  return active.length ? "EXPECTED" : "CANCELLED";
}

export function summarizePayrollItems(items = []) {
  const active = items.filter((item) => item.status !== "CANCELLED");
  const forecast = money(
    active.reduce(
      (sum, item) => sum + Number(item.totalAmount ?? item.forecastAmount ?? 0),
      0,
    ),
  );
  const paid = money(
    active.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0),
  );
  return {
    forecast,
    paid,
    open: money(Math.max(forecast - paid, 0)),
    status: aggregatePayrollStatus(items),
  };
}

export function groupPayrollObligations(obligations = []) {
  const groups = [];
  const fixed = obligations.filter(
    (item) => item.economicCategory === "FOLHA_FIXA",
  );
  const fixedByInstallmentAndDueDate = fixed.reduce((map, item) => {
    const installment =
      item.payrollDetail?.installment ||
      (String(item.sourceId || "").endsWith(":ADVANCE")
        ? "ADVANCE"
        : "SALARY");
    const key = `${installment}:${item.dueDate || item.competenceMonth}`;
    (map[key] ||= { installment, dueDate: item.dueDate || "", items: [] }).items.push(item);
    return map;
  }, {});
  Object.entries(fixedByInstallmentAndDueDate).forEach(([key, entry]) => {
    groups.push({
      id: `fixed:${key}`,
      kind: "FIXED",
      installment: entry.installment,
      title:
        entry.installment === "ADVANCE"
          ? "PRIMEIRO PAGAMENTO"
          : "PAGAMENTO FINAL",
      dueDate: entry.dueDate,
      competenceMonth: entry.items[0]?.competenceMonth || "",
      periodStart: entry.items[0]?.competenceMonth
        ? `${entry.items[0].competenceMonth}-01`
        : "",
      periodEnd: "",
      items: entry.items,
      ...summarizePayrollItems(entry.items),
    });
  });
  const extras = obligations
    .filter((item) => item.economicCategory === "FOLHA_EXTRA")
    .map((item) => ({
      ...item,
      payrollDetail: inferLegacyExtraDetail(item),
    }));
  const byPeriod = extras.reduce((map, item) => {
    const start = item.payrollDetail?.periodStart || item.competenceMonth;
    const end = item.payrollDetail?.periodEnd || "";
    const key = `${start}:${end}`;
    (map[key] ||= []).push(item);
    return map;
  }, {});
  Object.entries(byPeriod).forEach(([key, items]) => {
    const [periodStart, periodEnd] = key.split(":");
    groups.push({
      id: `extra:${key}`,
      kind: "EXTRA",
      title: "FOLHA EXTRA",
      periodStart,
      periodEnd,
      items,
      ...summarizePayrollItems(items),
    });
  });
  return groups.sort((left, right) =>
    String(left.dueDate || left.periodStart).localeCompare(
      String(right.dueDate || right.periodStart),
    ),
  );
}

export function payrollGroupMatchesFilter(group, filter) {
  if (filter === "ALL") return true;
  if (filter === "OPEN") return !["PAID", "CANCELLED"].includes(group.status);
  return group.status === filter;
}
