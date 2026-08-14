import React, { useMemo, useState } from 'react';
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards
} from 'lucide-react';
import { calculateExecutiveDashboard, } from './executiveDashboardModel.js';
import { getAdjacentMonth } from './dreModel.js';
import { filterObligationsByMonth, summarizeObligations } from './financialViewModel.js';

const money = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(Number(value) || 0);

const monthLabel = (month) => {
  const [year, monthNumber] = String(month || '').split('-').map(Number);
  if (!year || !monthNumber) return 'Competência não informada';
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNumber - 1, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const signedMoney = (value) => `${value >= 0 ? '+' : '-'}${money(Math.abs(value))}`;
const decimal = (value) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(value) || 0);
const signedPercent = (value, suffix = '%') => `${value >= 0 ? '+' : ''}${decimal(value)}${suffix}`;

function Comparison({ value, type = 'percent' }) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className="text-[10px] font-bold text-stone-400">Sem base anterior</span>;
  }
  const positive = value >= 0;
  const text = type === 'money'
    ? `${signedMoney(value)} vs mês anterior`
    : type === 'points'
      ? `${signedPercent(value, ' p.p.')} vs mês anterior`
      : `${signedPercent(value)} vs mês anterior`;
  return <span className={`block text-[10px] font-black ${positive ? 'text-green-700' : 'text-red-700'}`}>{text}</span>;
}

function MetricCard({ title, subtitle, value, comparison, comparisonType, icon, tone = 'neutral', priority = false, unavailable = false, children }) {
  const tones = {
    neutral: 'bg-stone-50 text-[#2A1E15]',
    positive: 'bg-green-50 text-green-800',
    negative: 'bg-red-50 text-red-800',
    accent: 'bg-[#FFF8EC] text-[#8A5A2B]'
  };
  return (
    <article className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${priority ? 'border-[#D4A373]/60 bg-white' : 'border-stone-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-[#6F6258]">{title}</p>
          {subtitle && <p className="mt-1 truncate text-[10px] font-bold text-[#8A7A6D]">{subtitle}</p>}
        </div>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>{React.createElement(icon, { size: 18 })}</span>
      </div>
      <p className={`mt-4 whitespace-nowrap text-[clamp(1.05rem,2.2vw,1.875rem)] font-black tabular-nums ${tone === 'negative' ? 'text-red-700' : tone === 'positive' ? 'text-green-800' : 'text-[#2A1E15]'}`}>
        {unavailable ? 'Dados insuficientes' : value}
      </p>
      <div className="mt-2 min-h-4 space-y-1">
        {children}
        {!unavailable && comparison !== undefined && <Comparison value={comparison} type={comparisonType} />}
      </div>
    </article>
  );
}

function MovementChart({ dashboard }) {
  const rows = [
    { label: 'Entradas', value: dashboard.dre.revenueGross, color: 'bg-green-600' },
    { label: 'Saídas', value: dashboard.totalOutflows, color: 'bg-[#D4A373]' },
    { label: 'Resultado', value: dashboard.dre.operatingResult, color: dashboard.dre.operatingResult >= 0 ? 'bg-[#2A1E15]' : 'bg-red-600' }
  ];
  const maximum = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return (
    <section className="rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-[10px] font-black uppercase text-[#8A5A2B]">Relação financeira</p>
        <h3 className="mt-2 text-balance text-lg font-black uppercase text-[#2A1E15]">Entradas x Saídas x Resultado</h3>
      </div>
      {dashboard.hasData ? (
        <div className="mt-7 space-y-5" role="img" aria-label={`Entradas ${money(rows[0].value)}, saídas ${money(rows[1].value)} e resultado ${money(rows[2].value)}`}>
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black">
                <span className="text-[#6F6258]">{row.label}</span>
                <span className={`tabular-nums ${row.value < 0 ? 'text-red-700' : 'text-[#2A1E15]'}`}>{money(row.value)}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-stone-100">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${Math.max((Math.abs(row.value) / maximum) * 100, row.value !== 0 ? 2 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : <p className="mt-8 text-sm font-bold text-[#6F6258]">Dados insuficientes para montar o gráfico desta competência.</p>}
    </section>
  );
}

function ExecutiveSummary({ dashboard }) {
  const marginComparison = dashboard.comparison.marginPoints;
  return (
    <section className="rounded-[2rem] border border-[#D4A373]/35 bg-[#FFF8EC] p-5 sm:p-7">
      <p className="text-[10px] font-black uppercase text-[#8A5A2B]">Painel do gestor</p>
      <h3 className="mt-2 text-balance text-lg font-black uppercase text-[#2A1E15]">Resumo Executivo — {monthLabel(dashboard.month)}</h3>
      {dashboard.hasData ? <>
        <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 text-xs">
          <div><dt className="font-bold text-[#6F6258]">Receita Bruta</dt><dd className="mt-1 font-black tabular-nums text-[#2A1E15]">{money(dashboard.dre.revenueGross)}</dd></div>
          <div><dt className="font-bold text-[#6F6258]">Saídas</dt><dd className="mt-1 font-black tabular-nums text-[#2A1E15]">{money(dashboard.totalOutflows)}</dd></div>
          <div><dt className="font-bold text-[#6F6258]">Resultado Operacional</dt><dd className={`mt-1 font-black tabular-nums ${dashboard.dre.operatingResult >= 0 ? 'text-green-800' : 'text-red-700'}`}>{money(dashboard.dre.operatingResult)}</dd></div>
          <div><dt className="font-bold text-[#6F6258]">Margem Líquida</dt><dd className="mt-1 font-black tabular-nums text-[#2A1E15]">{dashboard.netMargin === null ? 'Não disponível' : `${decimal(dashboard.netMargin)}%`}</dd></div>
          <div><dt className="font-bold text-[#6F6258]">Custo com Pessoal</dt><dd className="mt-1 font-black tabular-nums text-[#2A1E15]">{dashboard.personnelPercent === null ? 'Não disponível' : `${decimal(dashboard.personnelPercent)}% da receita`}</dd></div>
          <div><dt className="font-bold text-[#6F6258]">{dashboard.closedCmv.status === 'CLOSED' ? 'CMV Fechado' : 'CMV Provisório'}</dt><dd className="mt-1 font-black tabular-nums text-[#2A1E15]">{dashboard.closedCmv.percentage === null ? 'Sem dados anteriores' : `${decimal(dashboard.closedCmv.percentage)}% — ${monthLabel(dashboard.closedCmv.month)}`}</dd></div>
        </dl>
        <div className="mt-6 space-y-3 border-t border-[#D4A373]/30 pt-5">
          {dashboard.insights.largestCost && <div><p className="text-[9px] font-black uppercase text-[#8A7A6D]">Maior grupo de custo</p><p className="mt-1 text-sm font-black text-[#2A1E15]">{dashboard.insights.largestCost.label} — {money(dashboard.insights.largestCost.value)}</p></div>}
          {dashboard.insights.largestIncrease && <div><p className="text-[9px] font-black uppercase text-[#8A7A6D]">Maior aumento vs mês anterior</p><p className="mt-1 text-sm font-black text-[#2A1E15]">{dashboard.insights.largestIncrease.label} {signedPercent(dashboard.insights.largestIncrease.increasePercent)}</p></div>}
          {marginComparison !== null && <div><p className="text-[9px] font-black uppercase text-[#8A7A6D]">Margem</p><p className={`mt-1 text-sm font-black ${marginComparison >= 0 ? 'text-green-800' : 'text-red-700'}`}>{signedPercent(marginComparison, ' p.p.')} vs mês anterior</p></div>}
        </div>
      </> : <p className="mt-8 text-sm font-bold text-[#6F6258]">Não existem lançamentos suficientes para gerar o resumo desta competência.</p>}
    </section>
  );
}

function ExpenseComposition({ dashboard }) {
  const [expandedId, setExpandedId] = useState(null);
  const total = dashboard.composition.reduce((sum, group) => sum + group.value, 0);
  return (
    <section className="rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className="text-[10px] font-black uppercase text-[#8A5A2B]">Visão macro</p>
        <h3 className="mt-2 text-balance text-lg font-black uppercase text-[#2A1E15]">Composição das Saídas</h3>
        <p className="mt-2 text-pretty text-xs font-bold text-[#6F6258]">Abra um grupo para consultar sua composição sem misturar categorias e subcategorias.</p>
      </div>
      {dashboard.composition.length > 0 ? <div className="mt-6 space-y-3">
        {dashboard.composition.map((group) => {
          const isExpanded = expandedId === group.id;
          const percentage = total > 0 ? (group.value / total) * 100 : 0;
          return (
            <div key={group.id} className="overflow-hidden rounded-2xl border border-stone-200">
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : group.id)} aria-expanded={isExpanded} className="w-full p-4 text-left hover:bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-black text-[#2A1E15]">{group.label}</span>
                      <span className="shrink-0 text-xs font-black tabular-nums text-[#2A1E15]">{money(group.value)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#D4A373]" style={{ width: `${percentage}%` }} /></div>
                      <span className="w-12 text-right text-[10px] font-black tabular-nums text-[#6F6258]">{decimal(percentage)}%</span>
                    </div>
                  </div>
                  <ChevronDown className={`shrink-0 text-[#6F6258] ${isExpanded ? 'rotate-180' : ''}`} size={18} />
                </div>
              </button>
              {isExpanded && <div className="border-t border-stone-100 bg-[#FFF8EC] px-4 py-3">
                {group.details.length > 0 ? <div className="space-y-2">{group.details.map((detail) => <div key={detail.label} className="flex items-center justify-between gap-4 text-xs"><span className="text-pretty font-bold text-[#6F6258]">{detail.label}</span><span className="shrink-0 font-black tabular-nums text-[#2A1E15]">{money(detail.value)}</span></div>)}</div> : <p className="text-xs font-bold text-[#6F6258]">Não há subcategorias adicionais registradas.</p>}
              </div>}
            </div>
          );
        })}
      </div> : <p className="mt-8 text-sm font-bold text-[#6F6258]">Não existem saídas classificadas nesta competência.</p>}
    </section>
  );
}

export default function ExecutiveDashboardPage({ month, onMonthChange, transactions, recurringCosts, employees, employeeWorkLogs, obligations = [], inventoryCmvSummaries = [] }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dashboard = useMemo(() => calculateExecutiveDashboard({
    month,
    transactions,
    recurringCosts,
    employees,
    employeeWorkLogs,
    obligations,
    inventoryCmvSummaries
  }), [month, transactions, recurringCosts, employees, employeeWorkLogs, obligations, inventoryCmvSummaries]);
  const resultTone = dashboard.dre.operatingResult >= 0 ? 'positive' : 'negative';
  const monthObligations = filterObligationsByMonth(obligations, month);
  const personnelObligations = monthObligations.filter((item) => ['FOLHA_FIXA', 'FOLHA_EXTRA', 'REFEICAO'].includes(item.economicCategory));
  const personnelPaid = personnelObligations.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const personnelOpen = personnelObligations.reduce((sum, item) => sum + Number(item.openAmount || 0), 0);
  const obligationSummary = summarizeObligations(monthObligations);

  return (
    <div className="dashboard-page space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-5 rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[#8A5A2B]">Visão executiva da loja</p>
          <h3 className="mt-2 text-balance text-2xl font-black uppercase text-[#2A1E15] sm:text-3xl">Saúde financeira</h3>
          <p className="mt-2 text-pretty text-sm font-bold text-[#6F6258]">Indicadores econômicos derivados da mesma apuração mensal utilizada pela DRE.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[#D4A373]/35 bg-[#FFF8EC] p-2">
          <button type="button" onClick={() => onMonthChange(getAdjacentMonth(month, -1))} aria-label="Competência anterior" className="flex size-10 items-center justify-center rounded-xl bg-white text-[#2A1E15] shadow-sm"><ChevronLeft size={19} /></button>
          <label className="min-w-44 text-center">
            <span className="sr-only">Competência do Dashboard</span>
            <input type="month" max={currentMonth} value={month} onChange={(event) => { if (/^\d{4}-\d{2}$/.test(event.target.value)) onMonthChange(event.target.value); }} className="w-full bg-transparent px-2 py-2 text-center text-sm font-black text-[#2A1E15] outline-none" />
          </label>
          <button type="button" onClick={() => onMonthChange(getAdjacentMonth(month, 1))} disabled={month >= currentMonth} aria-label="Próxima competência" className="flex size-10 items-center justify-center rounded-xl bg-white text-[#2A1E15] shadow-sm disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={19} /></button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 sm:gap-4">
        <MetricCard title="Receita Bruta" subtitle={monthLabel(month)} value={money(dashboard.dre.revenueGross)} comparison={dashboard.comparison.revenuePercent} icon={TrendingUp} tone="positive" unavailable={!dashboard.hasData} />
        <MetricCard title={dashboard.closedCmv.status === 'CLOSED' ? 'CMV Fechado' : 'CMV Provisório'} subtitle={monthLabel(dashboard.closedCmv.month)} value={dashboard.closedCmv.percentage === null ? 'Sem fechamento anterior' : `${decimal(dashboard.closedCmv.percentage)}%`} icon={Receipt} tone="accent"><span className="text-[10px] font-bold text-[#6F6258]">Competência anterior ao painel</span></MetricCard>
        <MetricCard title="Resultado Operacional" value={money(dashboard.dre.operatingResult)} comparison={dashboard.comparison.operatingAmount} comparisonType="money" icon={dashboard.dre.operatingResult >= 0 ? TrendingUp : TrendingDown} tone={resultTone} priority unavailable={!dashboard.hasData} />
        <MetricCard title="Margem Líquida" value={dashboard.netMargin === null ? 'Não disponível' : `${decimal(dashboard.netMargin)}%`} comparison={dashboard.comparison.marginPoints} comparisonType="points" icon={CircleDollarSign} unavailable={!dashboard.hasData} />
        <MetricCard title="Saídas Totais" value={money(dashboard.totalOutflows)} comparison={dashboard.comparison.outflowsPercent} icon={WalletCards} unavailable={!dashboard.hasData} />
        <MetricCard title="Custo com Pessoal" value={money(dashboard.personnelCost)} comparison={dashboard.comparison.personnelPoints} comparisonType="points" icon={Users} tone="accent" unavailable={!dashboard.hasData}><span className="block text-[10px] font-black text-[#6F6258]">{dashboard.personnelPercent === null ? 'Não disponível' : `${decimal(dashboard.personnelPercent)}% da receita`}</span>{personnelObligations.length > 0 && <span className="block text-[10px] font-bold text-[#6F6258]">Pago {money(personnelPaid)} · A pagar {money(personnelOpen)}</span>}</MetricCard>
      </section>

      <section className="grid grid-cols-1 gap-3 rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm sm:grid-cols-3 sm:p-6">
        <div><p className="text-[10px] font-black uppercase text-[#6F6258]">Contas a pagar · competência</p><p className="mt-2 text-xl font-black tabular-nums text-[#2A1E15]">{money(obligationSummary.open)}</p></div>
        <div><p className="text-[10px] font-black uppercase text-[#6F6258]">Próximos 7 dias · competência</p><p className="mt-2 text-xl font-black tabular-nums text-amber-800">{money(obligationSummary.next7)}</p></div>
        <div><p className="text-[10px] font-black uppercase text-[#6F6258]">Vencidas · competência</p><p className="mt-2 text-xl font-black tabular-nums text-red-700">{money(obligationSummary.overdue)}</p></div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <MovementChart dashboard={dashboard} />
        <ExecutiveSummary dashboard={dashboard} />
      </div>

      <ExpenseComposition dashboard={dashboard} />

      <aside className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs font-bold text-[#6F6258]">
        <Banknote className="shrink-0 text-[#8A5A2B]" size={18} />
        <p className="text-pretty">A competência segue o mês econômico do lançamento. Custos do RH entram no mês trabalhado, mesmo quando o pagamento ocorre no mês seguinte. Indicadores sem fonte confiável permanecem ocultos.</p>
      </aside>
    </div>
  );
}
