import React, { useMemo, useState } from "react";
import { CalendarCheck, ExternalLink, Save, Wallet } from "lucide-react";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
const isMotoboy = (employee) =>
  /moto|entrega/i.test(String(employee.role || ""));
const isExtra = (employee) => employee.employmentType === "external";
const formatDate = (date) =>
  date ? new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR") : "—";
const selectionKey = (date, employeeId) => `${date}:${employeeId}`;
const sundayOrdinal = (date) =>
  new Date(`${date}T12:00:00`).getDay() === 0
    ? Math.ceil(Number(date.slice(-2)) / 7)
    : null;
const isScheduledDayOff = (employee, date) => {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return (
    (employee.weeklyDayOff !== "" &&
      employee.weeklyDayOff != null &&
      Number(employee.weeklyDayOff) === weekday) ||
    (employee.monthlySundayOffOrdinal !== "" &&
      employee.monthlySundayOffOrdinal != null &&
      Number(employee.monthlySundayOffOrdinal) === sundayOrdinal(date)) ||
    (employee.scheduledDaysOff || []).some(
      (item) =>
        item.active !== false &&
        ((item.kind === "WEEKLY" && Number(item.weekday) === weekday) ||
          (item.kind === "DATE" && item.offDate === date)),
    )
  );
};

function suggestedTypeIds(employee, date) {
  const weekend = [0, 6].includes(new Date(`${date}T12:00:00`).getDay());
  const applicable = (employee.dailyRateTypes || []).filter(
    (type) =>
      type.active !== false &&
      (weekend
        ? type.appliesWeekends !== false
        : type.appliesWeekdays !== false),
  );
  return applicable.length === 1 ? [String(applicable[0].id)] : [];
}

export default function WorkforceControlPanel({
  employees,
  payrollConfig,
  workLogs,
  weeklyClosings,
  onSaveLog,
  onOpenAccountsPayable,
  isSaving,
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deliveryFees, setDeliveryFees] = useState({});
  const [selectedTypes, setSelectedTypes] = useState({});
  const [selectionErrors, setSelectionErrors] = useState({});
  const [historyEmployeeId, setHistoryEmployeeId] = useState("");
  const [historyMonth, setHistoryMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [historyWeek, setHistoryWeek] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyRole, setHistoryRole] = useState("");
  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status !== "inactive"),
    [employees],
  );
  const logsByEmployee = useMemo(
    () =>
      new Map(
        workLogs
          .filter((log) => log.workDate === date)
          .map((log) => [String(log.employeeId), log]),
      ),
    [workLogs, date],
  );
  const month = date.slice(0, 7);
  const monthLogs = workLogs.filter(
    (log) => log.workDate.slice(0, 7) === month && log.worked,
  );
  const mealTotal = monthLogs.reduce(
    (sum, log) => sum + Number(log.mealCost || 0),
    0,
  );
  const extraTotal = monthLogs.reduce(
    (sum, log) =>
      sum + Number(log.dailyRate || 0) + Number(log.deliveryFee || 0),
    0,
  );
  const pendingTotal = weeklyClosings
    .filter((closing) => closing.status !== "paid")
    .reduce(
      (sum, closing) =>
        sum +
        Math.max(
          Number(closing.totalPayment || 0) - Number(closing.paidAmount || 0),
          0,
        ),
      0,
    );
  const visibleClosings = useMemo(
    () =>
      weeklyClosings.filter((closing) => {
        const employee = employees.find(
          (item) => String(item.id) === String(closing.employeeId),
        );
        if (
          historyEmployeeId &&
          String(closing.employeeId) !== historyEmployeeId
        )
          return false;
        if (
          historyMonth &&
          !String(closing.periodStart || "").startsWith(historyMonth) &&
          !String(closing.periodEnd || "").startsWith(historyMonth)
        )
          return false;
        if (historyWeek && closing.periodStart !== historyWeek) return false;
        if (historyStatus && closing.status !== historyStatus) return false;
        if (historyRole && String(employee?.role || "") !== historyRole)
          return false;
        return true;
      }),
    [
      weeklyClosings,
      employees,
      historyEmployeeId,
      historyMonth,
      historyWeek,
      historyStatus,
      historyRole,
    ],
  );
  const visibleClosingTotals = visibleClosings.reduce(
    (totals, closing) => ({
      daily: totals.daily + Number(closing.totalDailyRates || 0),
      delivery: totals.delivery + Number(closing.totalDeliveryFees || 0),
      paid: totals.paid + Number(closing.paidAmount || 0),
      due:
        totals.due +
        Math.max(
          Number(closing.totalPayment || 0) - Number(closing.paidAmount || 0),
          0,
        ),
    }),
    { daily: 0, delivery: 0, paid: 0, due: 0 },
  );
  const roleOptions = [
    ...new Set(employees.map((employee) => employee.role).filter(Boolean)),
  ];

  const selectedIdsFor = (employee, log) => {
    const key = selectionKey(date, employee.id);
    if (Object.prototype.hasOwnProperty.call(selectedTypes, key))
      return selectedTypes[key];
    return (log?.rateTypes || [])
      .map((type) => String(type.dailyRateTypeId))
      .filter(Boolean);
  };

  const save = async (employee, worked, dailyRateTypeIds) => {
    const previous = logsByEmployee.get(String(employee.id));
    await onSaveLog({
      id: previous?.id,
      employeeId: employee.id,
      workDate: date,
      worked,
      dailyRateTypeIds: isExtra(employee) ? dailyRateTypeIds : undefined,
      deliveryFee: Number(
        deliveryFees[employee.id] ?? previous?.deliveryFee ?? 0,
      ),
      note: previous?.note ?? "",
    });
  };

  const toggleWorked = async (employee, checked) => {
    const log = logsByEmployee.get(String(employee.id));
    if (!isExtra(employee)) return save(employee, checked);
    const key = selectionKey(date, employee.id);
    if (!checked) {
      setSelectedTypes((current) => ({ ...current, [key]: [] }));
      setSelectionErrors((current) => ({ ...current, [key]: "" }));
      return save(employee, false, []);
    }
    const existing = selectedIdsFor(employee, log);
    const ids = existing.length ? existing : suggestedTypeIds(employee, date);
    if (!ids.length) {
      setSelectionErrors((current) => ({
        ...current,
        [key]: "Escolha abaixo ao menos um Tipo de Diária.",
      }));
      return;
    }
    setSelectedTypes((current) => ({ ...current, [key]: ids }));
    setSelectionErrors((current) => ({ ...current, [key]: "" }));
    return save(employee, true, ids);
  };

  const toggleType = async (employee, typeId, checked) => {
    const log = logsByEmployee.get(String(employee.id));
    const key = selectionKey(date, employee.id);
    const current = selectedIdsFor(employee, log);
    const next = checked
      ? [...new Set([...current, String(typeId)])]
      : current.filter((id) => id !== String(typeId));
    setSelectedTypes((state) => ({ ...state, [key]: next }));
    setSelectionErrors((state) => ({
      ...state,
      [key]: next.length
        ? ""
        : "Escolha ao menos um Tipo de Diária para marcar que trabalhou.",
    }));
    return save(employee, next.length > 0, next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-stone-100 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#6F6258]">
            Extras no mês
          </p>
          <p className="mt-2 text-2xl font-black text-[#2A1E15]">
            {money(extraTotal)}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">
            Refeições no mês
          </p>
          <p className="mt-2 text-2xl font-black text-amber-900">
            {money(mealTotal)}
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-800">
            Próximos pagamentos
          </p>
          <p className="mt-2 text-2xl font-black text-blue-900">
            {money(pendingTotal)}
          </p>
        </div>
      </div>

      <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black uppercase text-[#2A1E15] flex items-center gap-2">
              <CalendarCheck size={19} /> Conferência diária
            </h3>
            <p className="mt-1 text-xs font-bold text-[#6F6258]">
              Uma refeição por pessoa/dia; funcionários extras podem acumular
              mais de um Tipo de Diária.
            </p>
          </div>
          <label className="text-[10px] font-black uppercase tracking-widest text-[#6F6258]">
            Data
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 block rounded-xl border border-[#D4A373]/40 bg-[#FFF8EC] px-3 py-2 font-black text-[#2A1E15]"
            />
          </label>
        </div>
        <div className="space-y-3">
          {activeEmployees.map((employee) => {
            const log = logsByEmployee.get(String(employee.id));
            const motoboy = isMotoboy(employee);
            const extra = isExtra(employee);
            const key = selectionKey(date, employee.id);
            const selectedIds = selectedIdsFor(employee, log);
            const configuredTypes = (employee.dailyRateTypes || []).filter(
              (type) => type.active !== false,
            );
            const selectedTotal = configuredTypes
              .filter((type) => selectedIds.includes(String(type.id)))
              .reduce((sum, type) => {
                const historical = (log?.rateTypes || []).find(
                  (snapshot) =>
                    String(snapshot.dailyRateTypeId) === String(type.id),
                );
                return (
                  sum + Number(historical?.amountSnapshot ?? type.amount ?? 0)
                );
              }, 0);
            const dailyRate =
              log?.worked &&
              !Object.prototype.hasOwnProperty.call(selectedTypes, key)
                ? Number(log.dailyRate || 0)
                : selectedTotal;
            const suggestions = suggestedTypeIds(employee, date);
            const flexibleSchedule =
              employee.controlAttendance !== true ||
              String(employee.role || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .startsWith("geren");
            const fixedStatus = extra
              ? ""
              : log?.worked
                ? "Presença registrada"
                : flexibleSchedule
                  ? "Jornada flexível · sem falta automática"
                  : isScheduledDayOff(employee, date)
                    ? "Folga programada · não gera falta"
                    : date < new Date().toISOString().slice(0, 10)
                      ? "Falta calculada · sem presença"
                      : "Aguardando presença";
            return (
              <div
                key={employee.id}
                className="rounded-2xl border border-stone-200 p-4 space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-4 items-center">
                  <label className="flex items-center gap-3 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={Boolean(log?.worked)}
                      onChange={(event) =>
                        toggleWorked(employee, event.target.checked)
                      }
                      disabled={isSaving}
                      className="h-5 w-5 accent-[#8A5A2B]"
                    />
                    <span>
                      <strong className="block text-sm uppercase text-[#2A1E15]">
                        {employee.name}
                      </strong>
                      <small className="font-bold uppercase text-[#6F6258]">
                        {extra
                          ? motoboy
                            ? "Extra · Motoboy"
                            : "Extra · Cozinha"
                          : `Fixo · ${employee.role}`}
                      </small>
                    </span>
                  </label>
                  <div className="text-xs font-black text-[#4A3A2A]">
                    Diária: {money(dailyRate)}{" "}
                    <span className="mx-1 text-[#B9A18A]">|</span> Refeição:{" "}
                    {money(
                      log?.worked
                        ? log.mealCost
                        : payrollConfig.mealCostPerWorkday,
                    )}
                  </div>
                  {motoboy ? (
                    <div className="flex items-end gap-2">
                      <label className="text-[10px] font-black uppercase text-[#6F6258]">
                        Taxas de entrega
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            deliveryFees[employee.id] ?? log?.deliveryFee ?? ""
                          }
                          onChange={(event) =>
                            setDeliveryFees((prev) => ({
                              ...prev,
                              [employee.id]: event.target.value,
                            }))
                          }
                          className="mt-1 block w-28 rounded-lg border border-stone-300 px-2 py-2 font-black"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => save(employee, true, selectedIds)}
                        disabled={isSaving || (extra && !selectedIds.length)}
                        className="rounded-lg bg-[#2A1E15] p-2 text-white disabled:opacity-40"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-[10px] font-black uppercase ${fixedStatus.startsWith("Falta") ? "text-red-700" : fixedStatus.startsWith("Folga") ? "text-green-700" : "text-[#6F6258]"}`}
                    >
                      {fixedStatus}
                    </span>
                  )}
                </div>
                {extra && (
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#6F6258]">
                      Tipos de Diária
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {configuredTypes.map((type) => (
                        <label
                          key={type.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${selectedIds.includes(String(type.id)) ? "border-[#8A5A2B] bg-[#FFF1D6] text-[#2A1E15]" : "border-stone-200 bg-white text-[#6F6258]"}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(String(type.id))}
                            onChange={(event) =>
                              toggleType(
                                employee,
                                type.id,
                                event.target.checked,
                              )
                            }
                            disabled={isSaving}
                            className="h-4 w-4 accent-[#8A5A2B]"
                          />
                          {type.name} · {money(type.amount)}
                          {!log?.worked &&
                          suggestions.includes(String(type.id)) ? (
                            <em className="text-[9px] uppercase text-green-700">
                              Sugerido
                            </em>
                          ) : null}
                        </label>
                      ))}
                    </div>
                    {!configuredTypes.length && (
                      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-black text-red-800">
                        Funcionário sem Tipo de Diária. Edite o cadastro antes
                        de lançar a presença.
                      </p>
                    )}
                    {selectionErrors[key] && (
                      <p className="mt-2 text-xs font-black text-red-700">
                        {selectionErrors[key]}
                      </p>
                    )}
                    {(log?.rateTypes || []).length > 0 && (
                      <p className="mt-2 text-[10px] font-bold text-[#6F6258]">
                        Valor histórico preservado:{" "}
                        {(log.rateTypes || [])
                          .map(
                            (type) =>
                              `${type.typeName} ${money(type.amountSnapshot)}`,
                          )
                          .join(" + ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={19} className="text-[#8A5A2B]" />
          <h3 className="text-lg font-black uppercase text-[#2A1E15]">
            Fechamentos e histórico
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
          <label className="text-[10px] font-black uppercase text-[#6F6258]">
            Funcionário
            <select
              value={historyEmployeeId}
              onChange={(event) => setHistoryEmployeeId(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-bold"
            >
              <option value="">Todos</option>
              {employees.filter(isExtra).map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-black uppercase text-[#6F6258]">
            Mês / ano
            <input
              type="month"
              value={historyMonth}
              onChange={(event) => setHistoryMonth(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-2 text-xs font-bold"
            />
          </label>
          <label className="text-[10px] font-black uppercase text-[#6F6258]">
            Semana (início)
            <input
              type="date"
              value={historyWeek}
              onChange={(event) => setHistoryWeek(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-2 text-xs font-bold"
            />
          </label>
          <label className="text-[10px] font-black uppercase text-[#6F6258]">
            Status
            <select
              value={historyStatus}
              onChange={(event) => setHistoryStatus(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-bold"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="partial">Parcial</option>
              <option value="paid">Pago</option>
            </select>
          </label>
          <label className="text-[10px] font-black uppercase text-[#6F6258]">
            Função
            <select
              value={historyRole}
              onChange={(event) => setHistoryRole(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs font-bold"
            >
              <option value="">Todas</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="rounded-xl bg-stone-100 p-3">
            <b className="block text-[10px] uppercase text-[#6F6258]">
              Diárias
            </b>
            {money(visibleClosingTotals.daily)}
          </div>
          <div className="rounded-xl bg-stone-100 p-3">
            <b className="block text-[10px] uppercase text-[#6F6258]">
              Entregas
            </b>
            {money(visibleClosingTotals.delivery)}
          </div>
          <div className="rounded-xl bg-green-50 p-3">
            <b className="block text-[10px] uppercase text-green-800">
              Recebido
            </b>
            {money(visibleClosingTotals.paid)}
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <b className="block text-[10px] uppercase text-amber-800">
              Em aberto
            </b>
            {money(visibleClosingTotals.due)}
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-[#6F6258]">
              <tr>
                <th className="p-2">Funcionário</th>
                <th className="p-2">Semana</th>
                <th className="p-2 text-right">Diárias</th>
                <th className="p-2 text-right">Entregas</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2">Previsto</th>
                <th className="p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibleClosings.map((closing) => {
                const employee = employees.find(
                  (item) => String(item.id) === String(closing.employeeId),
                );
                return (
                  <tr key={closing.id} className="border-t border-stone-100">
                    <td className="p-2 font-black uppercase">
                      {employee?.name || "Funcionário removido"}
                    </td>
                    <td className="p-2">
                      {formatDate(closing.periodStart)} a{" "}
                      {formatDate(closing.periodEnd)}
                    </td>
                    <td className="p-2 text-right">
                      {money(closing.totalDailyRates)}
                    </td>
                    <td className="p-2 text-right">
                      {money(closing.totalDeliveryFees)}
                    </td>
                    <td className="p-2 text-right font-black">
                      {money(closing.totalPayment)}
                    </td>
                    <td className="p-2">
                      {formatDate(closing.expectedPaymentDate)}
                    </td>
                    <td className="p-2 font-black uppercase">
                      {closing.status === "paid"
                        ? "Pago"
                        : closing.status === "partial"
                          ? "Parcial"
                          : "Pendente"}
                    </td>
                    <td className="p-2">
                      {closing.status !== "paid" && (
                        <button
                          type="button"
                          onClick={onOpenAccountsPayable}
                          className="rounded-lg bg-[#2A1E15] px-3 py-2 text-[10px] font-black uppercase text-white"
                        >
                          <ExternalLink size={13} className="mr-1 inline" />{" "}
                          Pagar em contas
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visibleClosings.length === 0 && (
            <p className="py-8 text-center text-xs font-bold text-[#6F6258]">
              Nenhum fechamento encontrado para os filtros selecionados.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
