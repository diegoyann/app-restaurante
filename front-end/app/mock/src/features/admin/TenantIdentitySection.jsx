import { useState } from 'react';
import { Building2, GitBranchPlus, Pencil, Plus, Save, Search, Trash2 } from 'lucide-react';
import { AdminModal, SectionCard } from './AdminLayout.jsx';

function Field({ id, label, children }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]';

export default function TenantIdentitySection({
  tenantOptions,
  companyOptions,
  selectedTenant,
  selectedTenantSlug,
  selectedCompanyId,
  companySearch = '',
  branchSearch = '',
  tenantForm,
  identityForm,
  createMode,
  onSelectCompany,
  onCompanySearchChange = () => {},
  onBranchSearchChange = () => {},
  onSelectTenant,
  onTenantFormChange,
  onIdentityFormChange,
  onCreateCompany,
  onCreateTenant,
  onSaveCompany,
  onSaveIdentity,
  onDeleteTenant,
  onDeleteCompany,
  onOpenCreateCompany,
  onOpenCreateBranch,
  onOpenEditBranch,
  onCloseCreate
}) {
  const [companyPickerOpen, setCompanyPickerOpen] = useState(false);
  const [branchPickerOpen, setBranchPickerOpen] = useState(false);
  const selectedCompany = companyOptions.find((company) => company.id === selectedCompanyId) || null;
  const companyBranches = tenantOptions.filter((tenant) => tenant.company?.id === selectedCompanyId);
  const normalizedCompanySearch = companySearch.trim().toLowerCase();
  const filteredCompanies = companyOptions
    .filter((company) => {
      if (!normalizedCompanySearch) return true;
      return [company.name, company.businessName, company.legalName, company.cnpj, company.slug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedCompanySearch));
    })
    .slice(0, 8);
  const normalizedBranchSearch = branchSearch.trim().toLowerCase();
  const filteredBranches = companyBranches
    .filter((branch) => {
      if (!normalizedBranchSearch) return true;
      return [branch.branchName, branch.name, branch.slug, branch.branchCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedBranchSearch));
    })
    .slice(0, 8);
  const activeBranchName = selectedTenant?.tenant.branchName || selectedTenant?.tenant.name || 'Nenhuma filial selecionada';
  const canCreateBranch = Boolean(selectedCompanyId);
  const isCompanyModal = createMode === 'company';
  const isEditingBranch = createMode === 'branchEdit';

  return (
    <>
      <SectionCard
        eyebrow="Administração"
        title="Empresa selecionada"
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenCreateCompany}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]"
            >
              <Building2 size={16} />
              Nova empresa
            </button>
            <button
              type="button"
              disabled={!canCreateBranch}
              onClick={() => onOpenCreateBranch(selectedCompanyId)}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15] transition hover:bg-[#2A1E15]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GitBranchPlus size={16} />
              Nova filial
            </button>
            <button
              type="button"
              disabled={!selectedCompanyId}
              onClick={onDeleteCompany}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Excluir empresa
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-2">
            <Field id="company-filter" label="Buscar empresa">
              <div className="relative" onFocus={() => setCompanyPickerOpen(true)} onBlur={() => setTimeout(() => setCompanyPickerOpen(false), 120)}>
                <div className="flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-3 py-2">
                  <Search size={16} className="text-[#8a7474]" />
                  <input
                    id="company-filter"
                    name="companyFilter"
                    value={companySearch}
                    onChange={(event) => onCompanySearchChange(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    placeholder="Digite nome, razão social ou CNPJ"
                  />
                </div>
                {companyPickerOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-[#2A1E15]/10 bg-white p-2 shadow-xl">
                    {filteredCompanies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => onSelectCompany(company.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          company.id === selectedCompanyId
                            ? 'border-[#D4A373] bg-[#D4A373]/10'
                            : 'border-[#2A1E15]/10 bg-white hover:bg-[#2A1E15]/5'
                        }`}
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15]">{company.name}</span>
                        <span className="mt-1 block text-[11px] font-bold text-[#7a6666]">
                          {company.cnpj || company.slug}
                        </span>
                      </button>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <p className="px-2 py-3 text-xs font-bold text-[#8a7474]">Nenhuma empresa encontrada.</p>
                    )}
                  </div>
                )}
              </div>
            </Field>

            <Field id="branch-filter" label="Filial ativa">
              <div className="relative" onFocus={() => setBranchPickerOpen(true)} onBlur={() => setTimeout(() => setBranchPickerOpen(false), 120)}>
                <div className="flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-3 py-2">
                  <Search size={16} className="text-[#8a7474]" />
                  <input
                    id="branch-filter"
                    name="branchFilter"
                    value={branchSearch}
                    onChange={(event) => onBranchSearchChange(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                    placeholder={activeBranchName}
                  />
                </div>
                {branchPickerOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-2 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-[#2A1E15]/10 bg-white p-2 shadow-xl">
                    {filteredBranches.map((branch) => (
                      <button
                        key={branch.slug}
                        type="button"
                        onClick={() => onSelectTenant(branch.slug)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          branch.slug === selectedTenantSlug
                            ? 'border-[#D4A373] bg-[#D4A373]/10'
                            : 'border-[#2A1E15]/10 bg-white hover:bg-[#2A1E15]/5'
                        }`}
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15]">
                          {branch.branchName || branch.name}
                        </span>
                        <span className="mt-1 block text-[11px] font-bold text-[#7a6666]">{branch.slug}</span>
                      </button>
                    ))}
                    {filteredBranches.length === 0 && (
                      <p className="px-2 py-3 text-xs font-bold text-[#8a7474]">Nenhuma filial encontrada.</p>
                    )}
                  </div>
                )}
              </div>
            </Field>
          </div>

          <form className="space-y-4" onSubmit={onSaveCompany}>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field id="company-name" label="Nome da empresa">
                <input
                  id="company-name"
                  name="companyName"
                  value={identityForm.companyName}
                  onChange={(event) => onIdentityFormChange('companyName', event.target.value)}
                  className={inputClass}
                  placeholder="Nome da empresa"
                />
              </Field>
              <Field id="company-legal-name" label="Razão social">
                <input
                  id="company-legal-name"
                  name="companyLegalName"
                  value={identityForm.companyLegalName}
                  onChange={(event) => onIdentityFormChange('companyLegalName', event.target.value)}
                  className={inputClass}
                  placeholder="Razão social"
                />
              </Field>
              <Field id="company-cnpj" label="CNPJ">
                <input
                  id="company-cnpj"
                  name="companyCnpj"
                  value={identityForm.companyCnpj}
                  onChange={(event) => onIdentityFormChange('companyCnpj', event.target.value)}
                  className={inputClass}
                  placeholder="00.000.000/0000-00"
                />
              </Field>
            </div>
            <Field id="company-address" label="Endereço">
              <input
                id="company-address"
                name="companyAddress"
                value={identityForm.companyAddress}
                onChange={(event) => onIdentityFormChange('companyAddress', event.target.value)}
                className={inputClass}
                placeholder="Rua, número, bairro, cidade"
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]">
                <Save size={16} />
                Salvar empresa
              </button>
              <button
                type="button"
                disabled={!selectedTenantSlug}
                onClick={onOpenEditBranch}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15] transition hover:bg-[#2A1E15]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Pencil size={16} />
                Editar filial ativa
              </button>
            </div>
          </form>
        </div>
      </SectionCard>

      {createMode && (
        <AdminModal
          title={isCompanyModal ? 'Cadastrar empresa' : isEditingBranch ? 'Editar filial' : 'Cadastrar filial'}
          onClose={onCloseCreate}
        >
          <form className="space-y-4" onSubmit={isCompanyModal ? onCreateCompany : isEditingBranch ? onSaveIdentity : onCreateTenant}>
            {isCompanyModal && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="tenant-create-company-name" label="Nome fantasia">
                    <input id="tenant-create-company-name" name="companyName" value={tenantForm.companyName} onChange={(event) => onTenantFormChange('companyName', event.target.value)} className={inputClass} placeholder="Nome da empresa" />
                  </Field>
                  <Field id="tenant-create-company-legal-name" label="Razão social">
                    <input id="tenant-create-company-legal-name" name="companyLegalName" value={tenantForm.companyLegalName} onChange={(event) => onTenantFormChange('companyLegalName', event.target.value)} className={inputClass} placeholder="Razão social" />
                  </Field>
                  <Field id="tenant-create-company-cnpj" label="CNPJ">
                    <input id="tenant-create-company-cnpj" name="companyCnpj" value={tenantForm.companyCnpj} onChange={(event) => onTenantFormChange('companyCnpj', event.target.value)} className={inputClass} placeholder="00.000.000/0000-00" />
                  </Field>
                </div>
                <Field id="tenant-create-company-address" label="Endereço">
                  <input id="tenant-create-company-address" name="companyAddress" value={tenantForm.companyAddress} onChange={(event) => onTenantFormChange('companyAddress', event.target.value)} className={inputClass} placeholder="Rua, número, bairro, cidade" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="tenant-create-company-branch-name" label="Nome da filial matriz">
                    <input id="tenant-create-company-branch-name" name="branchName" value={tenantForm.branchName} onChange={(event) => onTenantFormChange('branchName', event.target.value)} className={inputClass} placeholder={tenantForm.companyName || 'Matriz'} />
                  </Field>
                  <Field id="tenant-create-company-branch-code" label="ID/código da filial">
                    <input id="tenant-create-company-branch-code" name="branchCode" value={tenantForm.branchCode} onChange={(event) => onTenantFormChange('branchCode', event.target.value)} className={inputClass} placeholder="matriz-01" />
                  </Field>
                </div>
              </>
            )}

            {!isCompanyModal && (
              <>
                {createMode === 'branch' && (
                  <div className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Empresa da filial</p>
                    <p className="mt-1 text-sm font-black uppercase tracking-tight text-[#2A1E15]">
                      {companyOptions.find((company) => company.id === tenantForm.companyId)?.name || selectedCompany?.name || 'Empresa selecionada'}
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="tenant-branch-name" label="Nome da filial">
                    <input
                      id="tenant-branch-name"
                      name="branchName"
                      value={isEditingBranch ? identityForm.branchName : tenantForm.branchName}
                      onChange={(event) => {
                        if (isEditingBranch) {
                          onIdentityFormChange('branchName', event.target.value);
                          onIdentityFormChange('name', event.target.value);
                        } else {
                          onTenantFormChange('branchName', event.target.value);
                          onTenantFormChange('name', event.target.value);
                        }
                      }}
                      className={inputClass}
                      placeholder="Unidade Centro"
                    />
                  </Field>
                  <Field id="tenant-branch-code" label="ID/código da filial">
                    <input
                      id="tenant-branch-code"
                      name="branchCode"
                      value={isEditingBranch ? identityForm.branchCode : tenantForm.branchCode}
                      onChange={(event) => (isEditingBranch ? onIdentityFormChange('branchCode', event.target.value) : onTenantFormChange('branchCode', event.target.value))}
                      className={inputClass}
                      placeholder="centro-01"
                    />
                  </Field>
                </div>

                {isEditingBranch && (
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15]">
                    <input
                      type="checkbox"
                      checked={Boolean(identityForm.isHeadquarters)}
                      onChange={(event) => onIdentityFormChange('isHeadquarters', event.target.checked)}
                      className="h-4 w-4 accent-[#2A1E15]"
                    />
                    Filial matriz
                  </label>
                )}

                {createMode === 'branch' && (
                  <div className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15]">
                      Filial nova entra sem pedidos, cardápio, CMV, clientes ou financeiro.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]">
                <Plus size={16} />
                {isCompanyModal ? 'Salvar empresa' : 'Salvar filial'}
              </button>
              {isEditingBranch && selectedTenantSlug && (
                <button
                  type="button"
                  onClick={onDeleteTenant}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} />
                  Excluir filial
                </button>
              )}
            </div>
          </form>
        </AdminModal>
      )}
    </>
  );
}
