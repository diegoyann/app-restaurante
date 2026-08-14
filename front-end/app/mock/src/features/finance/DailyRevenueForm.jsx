import React, { useMemo, useState } from 'react';

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);

export default function DailyRevenueForm({ channels = [], onSave, onSwitchExpense, busy }) {
  const activeChannels = channels.filter((channel) => channel.active !== false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const totals = useMemo(() => activeChannels.reduce((result, channel) => {
    result.cash += Number(values[channel.id]?.cash || 0);
    result.online += Number(values[channel.id]?.online || 0);
    return result;
  }, { cash: 0, online: 0 }), [activeChannels, values]);
  const change = (id, key, value) => setValues((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  const submit = async (event) => {
    event.preventDefault(); setError('');
    try {
      await onSave({ date, note, entries: activeChannels.map((channel) => ({ channelId: channel.id, cash: Number(values[channel.id]?.cash || 0), online: Number(values[channel.id]?.online || 0) })) });
      setValues({}); setNote('');
    } catch (submitError) { setError(submitError.message || 'Não foi possível salvar a entrada diária.'); }
  };
  return <form onSubmit={submit} className="space-y-5 not-italic">
    <div className="flex flex-wrap items-end gap-3"><label><span className="text-[9px] font-black uppercase tracking-widest text-[#6F6258]">Data da venda</span><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block h-11 rounded-xl border px-3 font-bold"/></label><button type="button" onClick={onSwitchExpense} className="h-11 rounded-xl bg-red-50 px-4 text-[10px] font-black uppercase text-red-700">Lançar saída avulsa</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
    <div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[620px] text-left"><thead className="bg-stone-50 text-[9px] font-black uppercase text-[#6F6258]"><tr><th className="p-3">Canal</th><th className="p-3">Dinheiro</th><th className="p-3">Online / cartão</th><th className="p-3">Taxa / recebimento</th></tr></thead><tbody>{activeChannels.map((channel) => <tr key={channel.id} className="border-t"><td className="p-3 font-black text-[#2A1E15]">{channel.name}</td><td className="p-3"><input aria-label={`Dinheiro ${channel.name}`} type="number" min="0" step="0.01" value={values[channel.id]?.cash || ''} onChange={(e) => change(channel.id, 'cash', e.target.value)} className="w-full rounded-xl border p-3 font-bold"/></td><td className="p-3"><input aria-label={`Online ${channel.name}`} type="number" min="0" step="0.01" value={values[channel.id]?.online || ''} onChange={(e) => change(channel.id, 'online', e.target.value)} className="w-full rounded-xl border p-3 font-bold"/></td><td className="p-3 text-xs font-bold text-[#6F6258]">{Number(channel.feePercent || 0).toLocaleString('pt-BR')}% · {channel.settlementType === 'SCHEDULED' ? 'recebível' : 'banco imediato'}</td></tr>)}</tbody></table></div>
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-stone-50 p-3"><p className="text-[9px] font-black uppercase text-[#6F6258]">Dinheiro</p><strong>{money(totals.cash)}</strong></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-[9px] font-black uppercase text-[#6F6258]">Online</p><strong>{money(totals.online)}</strong></div><div className="rounded-xl bg-[#FFF8EC] p-3"><p className="text-[9px] font-black uppercase text-[#8A5A2B]">Total bruto</p><strong>{money(totals.cash + totals.online)}</strong></div></div>
    <div className="flex flex-col gap-3 sm:flex-row"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observação do fechamento diário" className="h-11 flex-1 rounded-xl border px-3 font-bold"/><button disabled={busy || totals.cash + totals.online <= 0} className="h-11 rounded-xl bg-[#2A1E15] px-6 text-[10px] font-black uppercase text-white disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar entrada diária'}</button></div>
  </form>;
}
