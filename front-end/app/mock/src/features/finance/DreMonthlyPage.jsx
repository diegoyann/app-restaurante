import React, { useMemo } from 'react';
import { AlertTriangle, FileText, TrendingDown, TrendingUp } from 'lucide-react';
import { calculateMonthlyDre } from './dreModel.js';

const money = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value || 0);

const monthLabel = (month) => {
  const [year, monthNumber] = String(month || '').split('-').map(Number);
  if (!year || !monthNumber) return 'Mês selecionado';
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNumber - 1, 1));
};

function DreLine({ label, value, emphasis = false, deduction = false, detail, cmvPercentage = null }) {
  const tone = value < 0 ? 'text-red-700' : emphasis ? 'text-[#2A1E15]' : 'text-[#4A3A2A]';
  const cmvTone = Number(cmvPercentage) > 35 ? 'text-red-700' : 'text-green-700';
  return (
    <div className={`py-3 ${emphasis ? 'border-y border-[#D4A373]/35 bg-[#FFF8EC] px-4 rounded-xl' : ''}`}>
      <div className="flex items-baseline justify-between gap-4">
        <span className={`text-xs ${emphasis ? 'font-black uppercase tracking-wide' : 'font-bold'}`}>
          {deduction ? '(-) ' : ''}{label}
          {cmvPercentage !== null && <><span className="mx-1.5 text-[#B9A18A]">|</span><span className={cmvTone}>{Number(cmvPercentage).toFixed(2)}%</span></>}
        </span>
        <span className={`text-sm font-black tabular-nums ${tone}`}>{money(value)}</span>
      </div>
      {detail && Object.keys(detail).length > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-[#D4A373]/30 space-y-1">
          {Object.entries(detail).map(([category, amount]) => {
            return (
              <div key={category} className="flex justify-between gap-3 text-[10px] font-bold text-[#6F6258]">
                <span>{category}</span>
                <span>{money(amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DreMonthlyPage({ month, onMonthChange, transactions, recurringCosts, payrollEntries, obligations = [], inventoryCmvSummaries = [] }) {
  const dre = useMemo(() => calculateMonthlyDre({
    month,
    transactions,
    recurringCosts,
    payrollEntries,
    obligations,
    inventoryCmvSummaries
  }), [month, transactions, recurringCosts, payrollEntries, obligations, inventoryCmvSummaries]);

  const hasData = dre.sourceCounts.revenues + dre.sourceCounts.expenses + dre.sourceCounts.fixedCosts + dre.sourceCounts.payroll > 0;

  return (
    <div className="max-w-6xl 2xl:max-w-7xl mx-auto space-y-6">
      <section className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 text-[#8A5A2B] mb-2"><FileText size={22} /><span className="text-[10px] font-black tracking-[0.2em] uppercase">Demonstrativo mensal</span></div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#2A1E15] uppercase tracking-tighter">DRE Gerencial</h3>
          <p className="text-xs font-bold text-[#6F6258] mt-2 max-w-2xl">Resultado do período por função: receita, deduções, custos, despesas e lucro. Não substitui a escrituração contábil.</p>
        </div>
        <label className="min-w-52">
          <span className="block text-[10px] font-black text-[#6F6258] uppercase tracking-widest mb-2">Competência</span>
          <input
            type="date"
            value={`${month}-01`}
            onChange={(event) => {
              if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) onMonthChange(event.target.value.slice(0, 7));
            }}
            onClick={(event) => event.currentTarget.showPicker?.()}
            aria-label="Selecione uma data para definir a competência mensal da DRE"
            className="w-full px-4 py-3 bg-[#FFF8EC] border border-[#D4A373]/40 rounded-xl font-black text-[#2A1E15] outline-none focus:ring-2 focus:ring-[#D4A373]"
          />
          <span className="block mt-2 text-[10px] font-bold text-[#6F6258]">Digite ou escolha uma data no calendário. A DRE considera o mês selecionado.</span>
        </label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-green-50 border border-green-100 p-5"><p className="text-[10px] font-black text-green-800 uppercase tracking-widest">Margem bruta</p><p className="text-2xl font-black text-green-800 mt-2">{dre.margins.gross.toFixed(1)}%</p></div>
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5"><p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Margem operacional</p><p className="text-2xl font-black text-amber-800 mt-2">{dre.margins.operating.toFixed(1)}%</p></div>
        <div className={`rounded-2xl border p-5 ${dre.netIncome >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}><p className="text-[10px] font-black uppercase tracking-widest">Margem líquida</p><p className="text-2xl font-black mt-2">{dre.margins.net.toFixed(1)}%</p></div>
      </section>
      <section className={`rounded-2xl border p-4 text-xs font-bold ${dre.cmvStatus === 'CLOSED' ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {dre.cmvStatus === 'CLOSED'
          ? `CMV fechado pelo inventário: estoque inicial ${money(dre.inventoryCmv.openingValue)} + compras recebidas ${money(dre.inventoryCmv.purchasesReceived)} − estoque final ${money(dre.inventoryCmv.closingValue)}.`
          : `CMV provisório: ${money(dre.cmv.grossInputCost)} de insumos − ${money(dre.cmv.mealDeduction)} de Refeição Funcionários = ${money(dre.cmv.inputCost)}, sobre faturamento oficial de ${money(dre.cmv.officialRevenue)}.`}
      </section>

      <section className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6"><div><h4 className="text-lg font-black text-[#2A1E15] uppercase">DRE — {monthLabel(month)}</h4><p className="text-[10px] font-bold text-[#6F6258] uppercase tracking-widest mt-1">Valores em reais</p></div>{dre.netIncome >= 0 ? <TrendingUp className="text-green-700" /> : <TrendingDown className="text-red-700" />}</div>
        {!hasData ? <div className="py-12 text-center text-xs font-bold text-[#6F6258]">Não há lançamentos contabilizados neste mês.</div> : <div className="space-y-1">
          <DreLine label="Receita bruta de vendas e serviços" value={dre.revenueGross} emphasis />
          <DreLine label="Deduções da receita (taxas de canal)" value={dre.revenueDeductions} deduction />
          <DreLine label="Receita líquida" value={dre.revenueNet} emphasis />
          <DreLine label="CMV / Insumos" value={dre.costOfSales} deduction detail={dre.details.cmvCalculation} cmvPercentage={dre.cmv.percentage} />
          <DreLine label="Lucro bruto" value={dre.grossProfit} emphasis />
          <DreLine label="Despesas com vendas" value={dre.sellingExpenses} deduction detail={dre.details.selling} />
          <DreLine label="Despesas gerais e administrativas" value={dre.administrativeExpenses} deduction detail={dre.details.administrative} />
          <DreLine label="Resultado operacional" value={dre.operatingResult} emphasis />
          <DreLine label="Despesas financeiras" value={dre.financialExpenses} deduction detail={dre.details.financial} />
          <DreLine label="Resultado antes do IRPJ e CSLL" value={dre.profitBeforeIncomeTax} emphasis />
          <DreLine label="IRPJ e CSLL" value={dre.incomeTaxes} deduction detail={dre.details.incomeTax} />
          <DreLine label="Resultado líquido do mês" value={dre.netIncome} emphasis />
        </div>}
      </section>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex gap-3 text-xs text-amber-950"><AlertTriangle size={18} className="shrink-0 mt-0.5" /><div><strong>Regra de cálculo:</strong> taxas de iFood/Anota AI reduzem a receita; insumos e fornecedores entram como custo; marketing/frete/comissão como despesa de venda; custos fixos pagos e folha registrada entram como despesa administrativa. Retiradas de sócios ficam fora da DRE. Revise a categoria de cada lançamento antes de usar este demonstrativo para fins contábeis.</div></aside>
    </div>
  );
}
