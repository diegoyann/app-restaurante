import React, { useState } from 'react';
import { Check, Edit, Plus, Trash2, X } from 'lucide-react';

const blank = { name: '', feePercent: 0, settlementType: 'IMMEDIATE', settlementFrequency: 'NONE', settlementWeekday: 3, settlementDelayDays: 3, notes: '', active: true };

export default function SalesChannelsModal({ open, channels = [], onClose, onSave, onDelete, busy }) {
  const [draft, setDraft] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');
  if (!open) return null;

  const edit = (channel) => { setEditingId(channel.id); setDraft({ ...blank, ...channel }); setError(''); };
  const reset = () => { setEditingId(null); setDraft(blank); setConfirmDeleteId(null); setError(''); };
  const close = () => { reset(); onClose(); };
  const submit = async (event) => {
    event.preventDefault();
    try { await onSave({ ...draft, id: editingId || undefined }); reset(); }
    catch (saveError) { setError(saveError.message || 'Não foi possível salvar o canal.'); }
  };
  const remove = async (id) => {
    try { await onDelete(id); reset(); }
    catch (deleteError) { setError(deleteError.message || 'Não foi possível excluir o canal.'); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="channel-modal-title">
    <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between"><div><h3 id="channel-modal-title" className="text-xl font-black uppercase text-[#2A1E15]">Canais de venda</h3><p className="mt-1 text-xs font-bold text-[#6F6258]">Taxas e regras de repasse alimentam os cálculos financeiros.</p></div><button type="button" onClick={close} className="rounded-full p-2 hover:bg-stone-100"><X size={20}/></button></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
        <label><span className="text-[10px] font-black uppercase">Nome</span><input required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <label><span className="text-[10px] font-black uppercase">Taxa (%)</span><input type="number" min="0" max="100" step="0.01" value={draft.feePercent} onChange={(e) => setDraft((d) => ({ ...d, feePercent: e.target.value }))} className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <label><span className="text-[10px] font-black uppercase">Recebimento</span><select value={draft.settlementType} onChange={(e) => setDraft((d) => ({ ...d, settlementType: e.target.value, settlementFrequency: e.target.value === 'SCHEDULED' ? 'WEEKLY' : 'NONE' }))} className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="IMMEDIATE">Imediato</option><option value="SCHEDULED">Repasse programado</option></select></label>
        {draft.settlementType === 'SCHEDULED' && <label><span className="text-[10px] font-black uppercase">Dia do repasse</span><select value={draft.settlementWeekday} onChange={(e) => setDraft((d) => ({ ...d, settlementWeekday: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border bg-white p-3 font-bold"><option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option></select></label>}
        <label className="md:col-span-2"><span className="text-[10px] font-black uppercase">Observações</span><input value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} className="mt-1 w-full rounded-xl border p-3 font-bold"/></label>
        <div className="flex gap-2 md:col-span-2"><button disabled={busy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2A1E15] p-3 text-xs font-black uppercase text-white disabled:opacity-50">{editingId ? <Check size={16}/> : <Plus size={16}/>} {editingId ? 'Salvar canal' : 'Adicionar canal'}</button>{editingId && <button type="button" onClick={reset} className="rounded-xl bg-stone-100 px-5 text-xs font-black uppercase">Cancelar</button>}</div>
      </form>
      <div className="mt-6 space-y-2">{channels.map((channel) => <article key={channel.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-[#2A1E15]">{channel.name}</p><p className="mt-1 text-xs font-bold text-[#6F6258]">Taxa {Number(channel.feePercent || 0).toLocaleString('pt-BR')}% · {channel.settlementType === 'SCHEDULED' ? 'Repasse programado' : 'Recebimento imediato'}</p></div><div className="flex gap-2"><button type="button" onClick={() => edit(channel)} className="rounded-xl bg-blue-50 p-3 text-blue-700" aria-label={`Editar ${channel.name}`}><Edit size={16}/></button>{confirmDeleteId === channel.id ? <><button type="button" disabled={busy} onClick={() => remove(channel.id)} className="rounded-xl bg-red-700 px-3 text-[10px] font-black uppercase text-white">Confirmar exclusão</button><button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-xl bg-stone-100 px-3 text-[10px] font-black uppercase">Cancelar</button></> : <button type="button" onClick={() => setConfirmDeleteId(channel.id)} className="rounded-xl bg-red-50 p-3 text-red-700" aria-label={`Excluir ${channel.name}`}><Trash2 size={16}/></button>}</div></article>)}</div>
    </div>
  </div>;
}
