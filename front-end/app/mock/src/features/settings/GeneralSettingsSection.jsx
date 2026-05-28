import React from 'react';
import { Settings } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect.jsx';

export default function GeneralSettingsSection({
  settings,
  settingsError,
  settingsSuccess,
  onSubmit,
  onOpenChannelModal,
  onOpenFinanceCategoryModal,
  InputComponent
}) {
  return (
    <div className="max-w-5xl 2xl:max-w-6xl mx-auto font-black italic">
      <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-[#2A1E15] uppercase mb-8 flex items-center gap-3 font-sans"><Settings size={22} /> Configurações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button type="button" onClick={onOpenChannelModal} className="bg-[#2A1E15]/5 text-[#2A1E15] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#2A1E15]/10">
            Cadastrar Canais
          </button>
          <button type="button" onClick={onOpenFinanceCategoryModal} className="bg-[#D4A373]/10 text-[#2A1E15] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373]/20">
            Cadastrar Categorias Financeiras
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans italic tracking-tighter">
            {React.createElement(InputComponent, { label: 'Nome da Esfiharia', name: 'businessName', defaultValue: settings.businessName })}
            {React.createElement(InputComponent, { label: 'Aviso Vencimento (Dias)', name: 'alertDaysBefore', type: 'number', defaultValue: settings.alertDaysBefore })}
            {React.createElement(InputComponent, { label: 'Taxa iFood (%)', name: 'ifoodTax', type: 'number', step: '0.1', defaultValue: settings.ifoodTax })}
            {React.createElement(InputComponent, { label: 'Taxa Anota AI (%)', name: 'anotaaiTax', type: 'number', step: '0.1', defaultValue: settings.anotaaiTax })}
            <div className="space-y-1 w-full sm:col-span-2">
              <label className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase ml-1 tracking-wider">Paleta de Cores (Tema)</label>
              <SearchableSelect
                name="colorPalette"
                defaultValue={settings.colorPalette || 'premium'}
                className="searchable-select--semibold"
                options={[
                  { value: 'premium', label: 'Eficiência Premium (Fundo Cinza / Menu Cinza Escuro / Vermelho Fome)' },
                  { value: 'frescor', label: 'Frescor e Rastreabilidade (Fundo Branco Gelo / Menu Verde Oliva / Laranja)' },
                  { value: 'natural', label: 'Natural e Orgânico (Fundo Bege Claro / Menu Verde Terra / Amarelo Queimado)' },
                  { value: 'esfiha', label: 'Clássica Esfiha (Fundo Branco / Menu Vermelho / Dourado)' }
                ]}
              />
            </div>
          </div>
          {settingsError && (
            <p className="text-[10px] text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-wider">
              {settingsError}
            </p>
          )}
          {settingsSuccess && (
            <p className="text-[10px] text-green-700 font-bold bg-green-50 p-3 rounded-xl border border-green-100 uppercase tracking-wider">
              {settingsSuccess}
            </p>
          )}
          <button type="submit" className="w-full bg-[#2A1E15] text-[#FFFFFF] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#D4A373] shadow-xl">Salvar</button>
        </form>
      </div>
    </div>
  );
}
