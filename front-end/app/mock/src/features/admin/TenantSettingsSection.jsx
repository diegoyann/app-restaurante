import { Shield } from 'lucide-react';
import { SectionCard } from './AdminLayout.jsx';

const fields = [
  { key: 'ifoodTax', label: 'Taxa iFood (%)' },
  { key: 'anotaaiTax', label: 'Taxa Anota AI (%)' },
  { key: 'alertDaysBefore', label: 'Alerta de vencimento (dias)' },
  { key: 'businessName', label: 'Nome exibido no app', full: true }
];

export default function TenantSettingsSection({ settingsForm, onChange, onSubmit }) {
  return (
    <SectionCard
      eyebrow="Configuração"
      title="Parâmetros operacionais"
      description="Só ficam aqui dados necessários para renderização e operação. Senha não é configuração de UI."
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        {fields.map((field) => (
          <div key={field.key} className={`space-y-2 ${field.full ? 'sm:col-span-2' : ''}`}>
            <label htmlFor={`tenant-settings-${field.key}`} className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">{field.label}</label>
            <input
              id={`tenant-settings-${field.key}`}
              name={field.key}
              value={settingsForm[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]"
            />
          </div>
        ))}
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D4A373] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15] transition hover:bg-[#C58F5E] sm:col-span-2">
          <Shield size={16} />
          Salvar configurações
        </button>
      </form>
    </SectionCard>
  );
}
