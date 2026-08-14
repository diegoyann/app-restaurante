import React, { useMemo, useState } from 'react';
import { Banknote, Calculator, Landmark, Scale, Wallet } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const dateBr = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const monthLabel = (month) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`));
const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

function Metric({ label, value, icon, tone = 'text-[#2A1E15]' }) {
  return <div className="min-w-0 rounded-2xl border border-[#E7D8C4] bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-[#6F6258]">{React.createElement(icon, { size: 16 })}<p className="text-[10px] font-black uppercase tracking-wide">{label}</p></div><p className={`mt-3 whitespace-nowrap text-[clamp(1rem,2vw,1.5rem)] font-black tabular-nums ${tone}`}>{money(value)}</p></div>;
}

export default function CashFlowPage({ month, onMonthChange, reconciliations = [], onSaveReconciliation }) {
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const monthRows = useMemo(() => reconciliations.filter((row) => String(row.date).slice(0, 7) === month).sort((a, b) => a.date.localeCompare(b.date)), [reconciliations, month]);

  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const grossRevenue = Number(form.get('grossRevenue'));
    const cashRevenue = Number(form.get('cashRevenue'));
    if (grossRevenue < 0 || cashRevenue < 0 || cashRevenue > grossRevenue) {
      setFormError('A receita em dinheiro não pode ser negativa nem superar a receita total.');
      return;
    }
    setIsSaving(true); setFormError(''); setFormSuccess('');
    try {
      await onSaveReconciliation({
        date: form.get('date'), grossRevenue, cashRevenue,
        openingCashBalance: Number(form.get('openingCashBalance')) || 0,
        countedClosingCash: form.get('countedClosingCash'), observation: form.get('observation')
      });
      formElement.reset();
      setFormSuccess('Conferência salva com sucesso.');
    } catch (error) { setFormError(error.message || 'Não foi possível salvar a conferência.'); }
    finally { setIsSaving(false); }
  };

  const totalDifference = monthRows.filter((row) => row.cashDifference != null).reduce((total, row) => total + Number(row.cashDifference || 0), 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  const defaultDate = todayIso.slice(0, 7) === month ? todayIso : `${month}-01`;

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="flex flex-col gap-5 rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[#8A5A2B]"><Calculator size={20}/><span className="text-[10px] font-black uppercase tracking-[0.18em]">Realizado e conferência física</span></div><h3 className="mt-2 text-2xl font-black uppercase text-[#2A1E15]">Fluxo de Caixa</h3><p className="mt-2 max-w-3xl text-sm font-bold text-[#6F6258]">Conta a pagar é previsão. Aqui entram apenas pagamentos realizados e a conferência diária do dinheiro físico.</p></div><label className="w-full lg:w-60"><span className="mb-2 block text-[10px] font-black uppercase text-[#6F6258]">Competência</span><input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} className="w-full rounded-xl border border-[#D4A373]/45 bg-[#FFF8EC] px-4 py-3 font-black"/></label></section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="Receita conferida" value={sum(monthRows, 'grossRevenue')} icon={Banknote} tone="text-green-800"/><Metric label="Receita em dinheiro" value={sum(monthRows, 'cashRevenue')} icon={Wallet}/><Metric label="Saídas banco" value={sum(monthRows, 'bankOutflow')} icon={Landmark} tone="text-red-700"/><Metric label="Saídas dinheiro" value={sum(monthRows, 'cashOutflow')} icon={Wallet} tone="text-amber-800"/><Metric label="Diferença física" value={totalDifference} icon={Scale} tone={totalDifference === 0 ? 'text-green-800' : 'text-red-700'}/></section>

    <section className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
      <div className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm"><h4 className="text-sm font-black uppercase text-[#2A1E15]">Conferência diária</h4><p className="mt-2 text-xs font-bold text-[#6F6258]">Dinheiro é parte da receita total, nunca uma receita adicional. As saídas são trazidas dos pagamentos registrados.</p><form key={month} onSubmit={submit} className="mt-5 grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase">Data</span><input required name="date" type="date" defaultValue={defaultDate} className="mt-1 w-full rounded-xl border p-3"/></label><label><span className="text-[10px] font-black uppercase">Receita total</span><input required name="grossRevenue" min="0" step="0.01" type="number" className="mt-1 w-full rounded-xl border p-3"/></label><label><span className="text-[10px] font-black uppercase">Em dinheiro</span><input required name="cashRevenue" min="0" step="0.01" type="number" className="mt-1 w-full rounded-xl border p-3"/></label><label><span className="text-[10px] font-black uppercase">Saldo inicial físico</span><input required name="openingCashBalance" min="0" step="0.01" type="number" className="mt-1 w-full rounded-xl border p-3"/></label><label><span className="text-[10px] font-black uppercase">Dinheiro contado</span><input name="countedClosingCash" min="0" step="0.01" type="number" className="mt-1 w-full rounded-xl border p-3"/></label><label><span className="text-[10px] font-black uppercase">Observação</span><input name="observation" className="mt-1 w-full rounded-xl border p-3"/></label><button disabled={isSaving} className="col-span-2 rounded-xl bg-[#2A1E15] p-3 text-xs font-black uppercase text-white disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar conferência'}</button></form>{formError && <p role="alert" className="mt-3 text-xs font-bold text-red-700">{formError}</p>}{formSuccess && <p role="status" className="mt-3 text-xs font-bold text-green-800">{formSuccess}</p>}</div>
      <div className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm"><h4 className="text-sm font-black uppercase text-[#2A1E15]">Conferências — {monthLabel(month)}</h4>{monthRows.length === 0 ? <p className="py-12 text-center text-sm font-bold text-[#6F6258]">Nenhuma conferência neste mês.</p> : <div className="mt-4 overflow-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead className="bg-[#FFF8EC] text-[9px] uppercase text-[#6F6258]"><tr><th className="p-3">Data</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Dinheiro</th><th className="p-3 text-right">Não dinheiro</th><th className="p-3 text-right">Saída banco</th><th className="p-3 text-right">Saída caixa</th><th className="p-3 text-right">Esperado</th><th className="p-3 text-right">Contado</th><th className="p-3 text-right">Diferença</th></tr></thead><tbody>{monthRows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-bold">{dateBr(row.date)}</td>{['grossRevenue','cashRevenue','nonCashRevenue','bankOutflow','cashOutflow','expectedClosingCash','countedClosingCash'].map((key) => <td key={key} className="p-3 text-right tabular-nums">{row[key] == null ? '—' : money(row[key])}</td>)}<td className={`p-3 text-right font-black ${Number(row.cashDifference || 0) === 0 ? 'text-green-800' : 'text-red-700'}`}>{row.cashDifference == null ? '—' : money(row.cashDifference)}</td></tr>)}</tbody></table></div>}</div>
    </section>

  </div>;
}
