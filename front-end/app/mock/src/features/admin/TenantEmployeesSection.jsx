import { Plus, Save } from 'lucide-react';
import { AdminModal, SectionCard } from './AdminLayout.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';

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
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2A1E15] px-3.5 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-[#2A1E15]/10"
          >
            <Plus size={14} /> Novo funcionário
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <div key={employee.id} className="relative flex flex-col justify-between rounded-[1.5rem] border border-[#2A1E15]/10 bg-white p-5">
              <div className="mb-4">
                <span className="inline-block rounded-full bg-[#2A1E15]/5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#2A1E15]">
                  {employee.employmentType === 'fixed' ? 'Fixo' : 'Por fora'}
                </span>
                <h4 className="mt-1.5 text-sm font-bold text-[#2A1E15]">{employee.name}</h4>
                <p className="text-xs font-semibold text-[#6F6258]">{employee.role}</p>
                {employee.notes && (
                  <p className="mt-2 rounded-lg bg-stone-50 p-2 text-[10px] font-medium text-[#6F6258] italic">
                    "{employee.notes}"
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-[#2A1E15]/5 pt-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#2A1E15]">
                  {employee.employmentType === 'fixed' ? (
                    <>R$ {parseFloat(employee.salary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês</>
                  ) : (
                    <>R$ {parseFloat(employee.baseAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} base</>
                  )}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => onEdit(employee)} className="rounded-lg border border-[#2A1E15]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#2A1E15]">
                    Editar
                  </button>
                  <button type="button" onClick={() => onDelete(employee.id)} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-100">
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
            <SearchableSelect
              id="tenant-employee-type"
              name="employmentType"
              value={employeeForm.employmentType}
              onChange={(value) => onChange('employmentType', value)}
              className="searchable-select--admin"
              options={[
                { value: 'fixed', label: 'Fixo' },
                { value: 'external', label: 'Por fora' }
              ]}
            />
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
