import { Plus, Save } from 'lucide-react';
import { AdminModal, SectionCard } from './AdminLayout.jsx';

export default function TenantEmployeesSection({
  employees,
  employeeForm,
  isFormOpen,
  onOpenCreate,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onReset
}) {
  return (
    <>
      <SectionCard
        eyebrow="Operação"
        title="Equipe do tenant"
        description="Equipe operacional da filial ativa. Cadastro e edição ficam em modal para não competir com usuários e escopo."
        actions={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]"
          >
            <Plus size={16} />
            Novo funcionário
          </button>
        }
      >
        <div className="space-y-3">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{employee.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[#7a6666]">{employee.role}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4A373]">
                    {employee.employmentType === 'fixed' ? `Fixo • R$ ${Number(employee.salary || 0).toFixed(2)}` : `Por fora • R$ ${Number(employee.baseAmount || 0).toFixed(2)}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onEdit(employee)} className="rounded-xl border border-[#2A1E15]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#2A1E15]">
                    Editar
                  </button>
                  <button type="button" onClick={() => onDelete(employee.id)} className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {isFormOpen && (
        <AdminModal
          title={employeeForm.id ? 'Editar funcionário' : 'Novo funcionário'}
          description="Dados de equipe pertencem à operação da filial ativa, não ao cadastro de tenant."
          onClose={onCloseForm}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <label htmlFor="tenant-employee-name" className="sr-only">Nome do funcionário</label>
            <input id="tenant-employee-name" name="name" value={employeeForm.name} onChange={(event) => onChange('name', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]" placeholder="Nome" />
            <label htmlFor="tenant-employee-role" className="sr-only">Cargo do funcionário</label>
            <input id="tenant-employee-role" name="role" value={employeeForm.role} onChange={(event) => onChange('role', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]" placeholder="Cargo" />
            <label htmlFor="tenant-employee-type" className="sr-only">Tipo de contratação</label>
            <select id="tenant-employee-type" name="employmentType" value={employeeForm.employmentType} onChange={(event) => onChange('employmentType', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-bold outline-none focus:border-[#D4A373]">
              <option value="fixed">Fixo</option>
              <option value="external">Por fora</option>
            </select>
            {employeeForm.employmentType === 'fixed' ? (
              <>
                <label htmlFor="tenant-employee-salary" className="sr-only">Salário</label>
                <input id="tenant-employee-salary" name="salary" inputMode="decimal" value={employeeForm.salary} onChange={(event) => onChange('salary', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]" placeholder="Salário" />
              </>
            ) : (
              <>
                <label htmlFor="tenant-employee-base-amount" className="sr-only">Valor base</label>
                <input id="tenant-employee-base-amount" name="baseAmount" inputMode="decimal" value={employeeForm.baseAmount} onChange={(event) => onChange('baseAmount', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]" placeholder="Valor base" />
              </>
            )}
            <label htmlFor="tenant-employee-notes" className="sr-only">Observações</label>
            <input id="tenant-employee-notes" name="notes" value={employeeForm.notes} onChange={(event) => onChange('notes', event.target.value)} className="w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]" placeholder="Observações" />
            <div className="flex gap-3">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                <Save size={16} />
                Salvar
              </button>
              {employeeForm.id && (
                <button type="button" onClick={onReset} className="rounded-2xl border border-[#2A1E15]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15]">
                  Limpar
                </button>
              )}
            </div>
          </form>
        </AdminModal>
      )}
    </>
  );
}
