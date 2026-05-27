export function StatCard({ icon, label, value, accent = 'text-[#2A1E15]' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8c7a7a]">{label}</p>
        <div className="rounded-2xl bg-[#2A1E15]/5 p-3 text-[#2A1E15]">
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-3xl font-black tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

export function SectionCard({ title, eyebrow, description, children, actions }) {
  return (
    <section className="min-w-0 rounded-[2rem] border border-[#2A1E15]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4A373]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#2A1E15]">{title}</h2>
          {description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#7a6666]">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function AdminModal({ title, description, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A281B]/60 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-[1.5rem] border border-[#2A1E15]/10 bg-white p-5 shadow-2xl ${wide ? 'max-w-6xl' : 'max-w-2xl'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2A1E15]/10 pb-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[#2A1E15]">{title}</h3>
            {description && <p className="mt-2 text-sm font-semibold leading-6 text-[#7a6666]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#2A1E15]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15] transition hover:bg-[#2A1E15]/5"
          >
            Fechar
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}
