import React, { useState } from 'react';
import { Archive, CalendarClock, FolderCog, Save } from 'lucide-react';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
const today = () => new Date().toISOString().slice(0, 10);

export default function RecurringCostsPage({
  costs = [],
  categories = [],
  onCreate,
  onUpdate,
  onArchive,
  onOpenCostCategories,
  onOpenFinanceCategories,
  isSaving
}) {
  const [message, setMessage] = useState({});
  const [newRecurrence, setNewRecurrence] = useState('MONTHLY');

  const submit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setMessage({});
    try {
      await onCreate({
        description: String(form.get('description') || '').trim(),
        amount: Number(form.get('amount')),
        dueDay: newRecurrence === 'SPECIAL' ? Number(String(form.get('startDate')).slice(-2)) : Number(form.get('dueDay')),
        recurrence: String(form.get('recurrence') || 'MONTHLY'),
        weekday: form.get('weekday') === '' ? null : Number(form.get('weekday')),
        startDate: String(form.get('startDate')),
        economicCategory: String(form.get('economicCategory') || 'CUSTO_FIXO'),
        forecastType: String(form.get('forecastType') || 'FIXED'),
        note: String(form.get('note') || '').trim()
      });
      formElement.reset();
      setMessage({ success: 'Cadastro recorrente criado. As obrigações mensais serão geradas em Contas a Pagar.' });
    } catch (error) {
      setMessage({ error: error.message || 'Não foi possível criar o cadastro recorrente.' });
    }
  };

  const updateRule = async (cost) => {
    const amount = document.getElementById(`recurring-amount-${cost.id}`)?.value;
    const recurrence = document.getElementById(`recurring-frequency-${cost.id}`)?.value;
    const scheduleValue = document.getElementById(`recurring-schedule-${cost.id}`)?.value;
    setMessage({});
    try {
      await onUpdate(cost, { amount: Number(amount), recurrence, dueDay: recurrence === 'MONTHLY' ? Number(scheduleValue) : cost.dueDay, weekday: recurrence === 'WEEKLY' ? Number(scheduleValue) : null });
      setMessage({ success: `${cost.desc} atualizado para esta competência e próximas. Obrigações pagas foram preservadas.` });
    } catch (error) {
      setMessage({ error: error.message || 'Não foi possível atualizar o cadastro.' });
    }
  };

  const archive = async (cost) => {
    setMessage({});
    try {
      await onArchive(cost);
      setMessage({ success: `${cost.desc} arquivado. O histórico financeiro foi preservado.` });
    } catch (error) {
      setMessage({ error: error.message || 'Não foi possível arquivar o cadastro.' });
    }
  };

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#8A5A2B]"><FolderCog size={18}/><span className="text-[10px] font-black uppercase tracking-[0.18em]">Cadastros mestres</span></div>
          <h3 className="mt-2 text-2xl font-black uppercase text-[#2A1E15]">Custos recorrentes</h3>
          <p className="mt-2 max-w-3xl text-sm font-bold text-[#6F6258]">Aqui se define a regra mensal ou semanal. Exceções de apenas uma competência são ajustadas na própria conta; pagamento e baixa continuam nas obrigações.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onOpenCostCategories} className="rounded-xl border border-[#D4A373] px-3 py-2 text-[10px] font-black uppercase text-[#8A5A2B]">Categorias de custos</button>
          <button type="button" onClick={onOpenFinanceCategories} className="rounded-xl border border-stone-300 px-3 py-2 text-[10px] font-black uppercase text-[#2A1E15]">Categorias financeiras</button>
        </div>
      </div>
    </section>

    {message.error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700">{message.error}</p>}
    {message.success && <p role="status" className="rounded-2xl border border-green-100 bg-green-50 p-4 text-xs font-bold text-green-800">{message.success}</p>}

    <section className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm">
      <h4 className="text-sm font-black uppercase text-[#2A1E15]">Novo cadastro recorrente</h4>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2"><span className="text-[10px] font-black uppercase">Descrição</span><select required name="description" className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="">Selecione</option>{categories.map((item) => <option key={item.id || item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label><span className="text-[10px] font-black uppercase">Valor previsto</span><input required name="amount" type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <label><span className="text-[10px] font-black uppercase">Frequência</span><select name="recurrence" value={newRecurrence} onChange={(event) => setNewRecurrence(event.target.value)} className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="MONTHLY">Mensal — dia fixo</option><option value="WEEKLY">Semanal — dia da semana</option><option value="SPECIAL">Especial — uma data</option></select></label>
        {newRecurrence === 'MONTHLY' ? <label><span className="text-[10px] font-black uppercase">Dia de vencimento</span><input required name="dueDay" type="number" min="1" max="31" className="mt-1 w-full rounded-xl border p-3 font-bold"/></label> : newRecurrence === 'WEEKLY' ? <label><span className="text-[10px] font-black uppercase">Dia da semana</span><select required name="weekday" defaultValue="1" className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option><option value="0">Domingo</option></select></label> : null}
        <label><span className="text-[10px] font-black uppercase">Competência inicial</span><input required name="startDate" type="date" defaultValue={today()} className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <label><span className="text-[10px] font-black uppercase">Categoria econômica</span><select name="economicCategory" defaultValue="CUSTO_FIXO" className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="CUSTO_FIXO">Custo fixo</option><option value="MARKETING">Marketing / vendas</option><option value="IMPOSTO">Imposto</option><option value="FINANCEIRO">Despesa financeira</option><option value="OUTROS">Outros</option></select></label>
        <label><span className="text-[10px] font-black uppercase">Previsão</span><select name="forecastType" defaultValue="FIXED" className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="FIXED">Valor fixo</option><option value="ESTIMATED">Valor estimado</option></select></label>
        <label><span className="text-[10px] font-black uppercase">Observação</span><input name="note" className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <button disabled={isSaving} className="rounded-xl bg-[#2A1E15] p-3 text-xs font-black uppercase text-white disabled:opacity-50 xl:col-span-4">{isSaving ? 'Salvando...' : 'Criar recorrência'}</button>
      </form>
    </section>

    <section className="rounded-[2rem] border border-stone-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between"><div><h4 className="text-sm font-black uppercase text-[#2A1E15]">Cadastros ativos</h4><p className="mt-1 text-xs font-bold text-[#6F6258]">Alterar o valor não reescreve pagamentos já realizados.</p></div><span className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-black">{costs.length}</span></div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{costs.map((cost) => <article key={cost.id} className="rounded-2xl border border-stone-200 p-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-[#FFF8EC] px-2 py-1 text-[9px] font-black uppercase text-[#8A5A2B]">{cost.recurrence === 'WEEKLY' ? 'Semanal' : `Dia ${cost.dueDay}`}</span><h5 className="font-black uppercase text-[#2A1E15]">{cost.desc}</h5></div><p className="mt-2 text-xs font-bold text-[#6F6258]">Atual: {money(cost.amount)} por ocorrência · {cost.forecastType === 'ESTIMATED' ? 'estimado' : 'fixo'}</p></div><CalendarClock className="shrink-0 text-[#8A5A2B]" size={20}/></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3"><label><span className="text-[10px] font-black uppercase text-[#6F6258]">Valor por ocorrência</span><input id={`recurring-amount-${cost.id}`} defaultValue={cost.amount} type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-xl border p-3 font-bold"/></label><label><span className="text-[10px] font-black uppercase text-[#6F6258]">Frequência</span><select id={`recurring-frequency-${cost.id}`} defaultValue={cost.recurrence || 'MONTHLY'} className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="MONTHLY">Mensal</option><option value="WEEKLY">Semanal</option><option value="SPECIAL">Especial</option></select></label><label><span className="text-[10px] font-black uppercase text-[#6F6258]">Dia (mês ou semana)</span><input id={`recurring-schedule-${cost.id}`} defaultValue={cost.recurrence === 'WEEKLY' ? cost.weekday : cost.dueDay} type="number" min="0" max="31" className="mt-1 w-full rounded-xl border p-3 font-bold"/></label></div><div className="mt-3 flex flex-wrap justify-end gap-2"><button type="button" disabled={isSaving} onClick={() => updateRule(cost)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-green-50 px-4 text-[10px] font-black uppercase text-green-800 disabled:opacity-50"><Save size={15}/>Salvar futuras</button><button type="button" disabled={isSaving} onClick={() => archive(cost)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-50 px-4 text-[10px] font-black uppercase text-red-700 disabled:opacity-50"><Archive size={15}/>Arquivar</button></div>
      </article>)}{costs.length === 0 && <p className="py-10 text-center text-sm font-bold text-[#6F6258] lg:col-span-2">Nenhum cadastro recorrente ativo.</p>}</div>
    </section>
  </div>;
}
