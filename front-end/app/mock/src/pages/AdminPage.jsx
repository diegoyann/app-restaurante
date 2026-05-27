import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CircleDollarSign,
  Loader2,
  LogOut,
  ShieldCheck,
  Users
} from 'lucide-react';
import { adminApi } from '../services/api.js';
import { supabase } from '../lib/supabase.js';
import { isMockDataSource } from '../config/dataSource.js';
import { signOutMock } from '../services/mockAuth.js';
import { AdminModal, StatCard } from '../features/admin/AdminLayout.jsx';
import {
  emptyIdentityForm,
  emptyTenantForm,
  emptyUserForm,
  NEW_COMPANY_VALUE,
  normalizeUserForm
} from '../features/admin/adminModel.js';
import TenantIdentitySection from '../features/admin/TenantIdentitySection.jsx';
import TenantUsersSection from '../features/admin/TenantUsersSection.jsx';
import RolePermissionsManager from '../features/permissions/RolePermissionsManager.jsx';

export default function AdminPage() {
  const navigate = useNavigate();
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [bootstrap, setBootstrap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [identityForm, setIdentityForm] = useState(emptyIdentityForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [tenantCreateMode, setTenantCreateMode] = useState('');
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  const selectedTenant = bootstrap?.selectedTenant || null;
  const summary = selectedTenant?.summary || {};
  const roleProfiles = selectedTenant?.roleProfiles || [];
  const tenantOptions = useMemo(() => bootstrap?.availableTenants || [], [bootstrap]);
  const companyOptions = useMemo(() => {
    if (bootstrap?.availableCompanies?.length) {
      return [...bootstrap.availableCompanies].sort((a, b) => a.name.localeCompare(b.name));
    }

    const companiesById = new Map();

    tenantOptions.forEach((tenant) => {
      if (!tenant.company?.id) return;
      companiesById.set(tenant.company.id, tenant.company);
    });

    return [...companiesById.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [bootstrap?.availableCompanies, tenantOptions]);

  const loadBootstrap = React.useCallback(async (tenantSlug) => {
    setLoading(true);
    setError('');

    try {
      const payload = await adminApi.getBootstrap(tenantSlug);
      setBootstrap(payload);
      setSelectedTenantSlug(payload.selectedTenantSlug || '');
      setSuccess('');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao carregar o painel administrativo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBootstrap('');
  }, [loadBootstrap]);

  useEffect(() => {
    if (!selectedTenant) return;
    const tenant = selectedTenant.tenant || {};

    setIdentityForm({
      name: tenant.name || '',
      businessName: tenant.businessName || tenant.name || '',
      companyId: tenant.company?.id || tenant.companyId || '',
      companyName: tenant.company?.name || tenant.businessName || tenant.name || '',
      companySlug: tenant.company?.slug || '',
      companyLegalName: tenant.company?.legalName || tenant.company?.businessName || '',
      companyCnpj: tenant.company?.cnpj || '',
      companyAddress: tenant.company?.address || '',
      branchName: tenant.branchName || tenant.name || '',
      branchCode: tenant.branchCode || tenant.slug || '',
      isHeadquarters: Boolean(tenant.isHeadquarters)
    });
    setSelectedCompanyId(tenant.company?.id || tenant.companyId || '');
    setCompanySearch(tenant.company?.name || '');
    setBranchSearch(tenant.branchName || tenant.name || '');
    setUserForm(emptyUserForm);
  }, [selectedTenant]);

  const handleSelectTenant = (eventOrSlug) => {
    const nextTenantSlug = typeof eventOrSlug === 'string' ? eventOrSlug : eventOrSlug.target.value;
    loadBootstrap(nextTenantSlug);
  };

  const handleSelectCompany = (companyId) => {
    setSelectedCompanyId(companyId);
    const company = companyOptions.find((item) => item.id === companyId);
    setCompanySearch(company?.name || '');
    const nextTenant = tenantOptions.find((tenant) => tenant.company?.id === companyId);
    if (nextTenant?.slug && nextTenant.slug !== selectedTenantSlug) {
      setBranchSearch(nextTenant.branchName || nextTenant.name || '');
      loadBootstrap(nextTenant.slug);
      return;
    }

    if (!nextTenant) {
      setSelectedTenantSlug('');
      setBranchSearch('');
      setBootstrap((prev) => ({ ...prev, selectedTenantSlug: '', selectedTenant: null }));
      setIdentityForm({
        ...emptyIdentityForm,
        companyId: company?.id || '',
        companyName: company?.name || '',
        companySlug: company?.slug || '',
        companyLegalName: company?.legalName || company?.businessName || '',
        companyCnpj: company?.cnpj || '',
        companyAddress: company?.address || ''
      });
      setUserForm(emptyUserForm);
    }
  };

  const handleCompanySearchChange = (value) => {
    setCompanySearch(value);
    const selectedCompany = companyOptions.find((item) => item.id === selectedCompanyId);
    if (!selectedCompany || value === selectedCompany.name) return;

    setSelectedCompanyId('');
    setSelectedTenantSlug('');
    setBranchSearch('');
    setBootstrap((prev) => ({ ...prev, selectedTenantSlug: '', selectedTenant: null }));
    setIdentityForm(emptyIdentityForm);
    setUserForm(emptyUserForm);
  };

  const openCreateCompany = () => {
    setTenantForm({ ...emptyTenantForm, companyId: NEW_COMPANY_VALUE, isHeadquarters: true });
    setTenantCreateMode('company');
  };

  const openCreateBranch = (companyId) => {
    if (!companyId) return;
    setTenantForm({ ...emptyTenantForm, companyId, isHeadquarters: false });
    setTenantCreateMode('branch');
  };

  const updateTenantForm = (field, value) => {
    setTenantForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'companyId' && value !== NEW_COMPANY_VALUE) {
        next.companyName = '';
        next.companySlug = '';
      }

      return next;
    });
  };

  const updateIdentityForm = (field, value) => {
    setIdentityForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'companyId') {
        const company = companyOptions.find((item) => item.id === value);
        if (company) {
          next.companyName = company.name || '';
          next.companySlug = company.slug || '';
          next.companyLegalName = company.legalName || company.businessName || '';
          next.companyCnpj = company.cnpj || '';
          next.companyAddress = company.address || '';
        }
      }

      return next;
    });
  };

  const updateUserForm = (field, value) => {
    setUserForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'role' && value !== 'tenant_admin') {
        next.accessScope = 'branch';
      }
      return next;
    });
  };

  const handleCreateTenant = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const created = await adminApi.createTenant({
        ...tenantForm,
        companyId: tenantForm.companyId === NEW_COMPANY_VALUE ? '' : tenantForm.companyId,
        name: tenantForm.branchName,
        slug: tenantForm.branchCode || tenantForm.branchName,
        branchName: tenantForm.branchName,
        branchCode: tenantForm.branchCode || tenantForm.branchName,
        isHeadquarters: false,
        importMenuFromHeadquarters: false,
        importCmvFromHeadquarters: false
      });
      setTenantForm(emptyTenantForm);
      setTenantCreateMode('');
      await loadBootstrap(created.slug);
      setBranchSearch(created.branchName || created.name || '');
      setSuccess(tenantForm.companyId === NEW_COMPANY_VALUE ? `Empresa ${tenantForm.companyName || created.name} criada.` : `Filial ${created.name} criada.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao criar filial.');
    }
  };

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const company = await adminApi.createCompany({
        name: tenantForm.companyName,
        businessName: tenantForm.companyLegalName || tenantForm.companyName,
        legalName: tenantForm.companyLegalName,
        cnpj: tenantForm.companyCnpj,
        address: tenantForm.companyAddress,
        branchName: tenantForm.branchName || tenantForm.companyName,
        branchCode: tenantForm.branchCode || tenantForm.branchName || tenantForm.companyName
      });
      const createdCompany = company.company || company;
      const createdTenant = company.tenant || null;

      setBootstrap((prev) => ({
        ...prev,
        availableCompanies: [...(prev?.availableCompanies || []), createdCompany],
        availableTenants: createdTenant
          ? [...(prev?.availableTenants || []), createdTenant]
          : prev?.availableTenants || []
      }));
      setSelectedCompanyId(createdCompany.id);
      setIdentityForm({
        ...emptyIdentityForm,
        companyId: createdCompany.id,
        companyName: createdCompany.name,
        companySlug: createdCompany.slug,
        companyLegalName: createdCompany.legalName || createdCompany.businessName || '',
        companyCnpj: createdCompany.cnpj || '',
        companyAddress: createdCompany.address || '',
        branchName: createdTenant?.branchName || createdTenant?.name || tenantForm.branchName || tenantForm.companyName,
        branchCode: createdTenant?.branchCode || tenantForm.branchCode || tenantForm.branchName || tenantForm.companyName,
        isHeadquarters: true
      });
      setCompanySearch(createdCompany.name);
      setTenantForm(emptyTenantForm);
      setTenantCreateMode('');
      if (createdTenant?.slug) {
        await loadBootstrap(createdTenant.slug);
        setBranchSearch(createdTenant.branchName || createdTenant.name || '');
      } else {
        setSelectedTenantSlug('');
      }
      setSuccess(`Empresa ${createdCompany.name} criada com filial matriz.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao criar empresa.');
    }
  };

  const handleSaveCompany = async (event) => {
    event.preventDefault();
    if (!selectedCompanyId) return;

    setError('');
    setSuccess('');

    try {
      const company = await adminApi.updateCompany(selectedCompanyId, {
        name: identityForm.companyName,
        businessName: identityForm.companyLegalName || identityForm.companyName,
        legalName: identityForm.companyLegalName,
        cnpj: identityForm.companyCnpj,
        address: identityForm.companyAddress
      });

      setBootstrap((prev) => ({
        ...prev,
        availableCompanies: (prev?.availableCompanies || []).map((item) =>
          item.id === company.id ? company : item
        ),
        availableTenants: (prev?.availableTenants || []).map((tenant) =>
          tenant.company?.id === company.id
            ? {
                ...tenant,
                company
              }
            : tenant
        ),
        selectedTenant: prev?.selectedTenant
          ? {
              ...prev.selectedTenant,
              tenant: {
                ...prev.selectedTenant.tenant,
                company
              }
            }
          : null
      }));
      setIdentityForm((prev) => ({
        ...prev,
        companyId: company.id,
        companyName: company.name,
        companySlug: company.slug,
        companyLegalName: company.legalName || company.businessName || '',
        companyCnpj: company.cnpj || '',
        companyAddress: company.address || ''
      }));
      setCompanySearch(company.name);
      setSuccess('Empresa salva.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar empresa.');
    }
  };

  const handleSaveIdentity = async (event) => {
    event.preventDefault();
    if (!selectedTenantSlug) return;

    setError('');
    setSuccess('');

    try {
      const snapshot = await adminApi.updateTenant(selectedTenantSlug, identityForm);
      setBootstrap((prev) => ({
        ...prev,
        availableTenants: (prev?.availableTenants || []).map((tenant) =>
          tenant.company?.id === identityForm.companyId
            ? {
                ...tenant,
                company: {
                  ...(tenant.company || {}),
                  name: identityForm.companyName,
                  slug: identityForm.companySlug
                },
                ...(tenant.slug === selectedTenantSlug
                  ? {
                      name: snapshot.tenant.name,
                      branchName: snapshot.tenant.branchName,
                      branchCode: snapshot.tenant.branchCode,
                      isHeadquarters: snapshot.tenant.isHeadquarters
                    }
                  : {})
              }
            : tenant
        ),
        selectedTenant: snapshot
      }));
      setTenantCreateMode('');
      setSuccess('Identidade do tenant atualizada.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar identidade do tenant.');
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenantSlug) return;
    if (!window.confirm('Excluir essa filial remove também os usuários vinculados a ela. Continuar?')) return;

    setError('');
    setSuccess('');

    try {
      const removed = await adminApi.deleteTenant(selectedTenantSlug);
      setTenantCreateMode('');
      await loadBootstrap('');
      setSuccess(`Filial ${removed.name} excluída.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir filial.');
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompanyId) return;
    const company = companyOptions.find((item) => item.id === selectedCompanyId);
    const branches = tenantOptions.filter((tenant) => tenant.company?.id === selectedCompanyId);

    if (!window.confirm(`Excluir a empresa ${company?.name || ''} remove ${branches.length} filial(is) e seus usuários. Continuar?`)) return;

    setError('');
    setSuccess('');

    try {
      await adminApi.deleteCompany(selectedCompanyId);
      setSelectedCompanyId('');
      setTenantCreateMode('');
      await loadBootstrap('');
      setSuccess(`Empresa ${company?.name || ''} excluída.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir empresa.');
    }
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    if (!selectedTenantSlug) return;

    setError('');
    setSuccess('');

    try {
      const snapshot = await adminApi.saveTenantUser(selectedTenantSlug, userForm);
      setBootstrap((prev) => ({ ...prev, selectedTenant: snapshot }));
      setUserForm(emptyUserForm);
      setUserFormOpen(false);
      setSuccess('Usuário do tenant salvo.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar usuário.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!selectedTenantSlug) return;
    if (!window.confirm('Excluir esse usuário do tenant?')) return;

    setError('');
    setSuccess('');

    try {
      const snapshot = await adminApi.deleteTenantUser(selectedTenantSlug, id);
      setBootstrap((prev) => ({ ...prev, selectedTenant: snapshot }));
      if (userForm.id === id) setUserForm(emptyUserForm);
      setSuccess('Usuário removido do tenant.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir usuário.');
    }
  };

  const handleSaveRoleProfile = async (profile) => {
    if (!selectedTenantSlug) return null;
    setPermissionsSaving(true);
    setError('');
    setSuccess('');

    try {
      const snapshot = await adminApi.saveRoleProfile(selectedTenantSlug, profile);
      setBootstrap((prev) => ({ ...prev, selectedTenant: snapshot }));
      setSuccess('Perfil de permissões salvo.');
      return snapshot.roleProfiles?.find((item) => item.name === profile.name) || null;
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar perfil de permissões.');
      return null;
    } finally {
      setPermissionsSaving(false);
    }
  };

  const handleDeleteRoleProfile = async (profileId) => {
    if (!selectedTenantSlug) return;
    setPermissionsSaving(true);
    setError('');
    setSuccess('');

    try {
      const snapshot = await adminApi.deleteRoleProfile(selectedTenantSlug, profileId);
      setBootstrap((prev) => ({ ...prev, selectedTenant: snapshot }));
      setSuccess('Perfil de permissões excluído.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir perfil de permissões.');
    } finally {
      setPermissionsSaving(false);
    }
  };

  const logout = () => {
    if (isMockDataSource()) {
      signOutMock().finally(() => navigate('/login'));
      return;
    }

    supabase.auth.signOut().finally(() => navigate('/login'));
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#241818]">
      <header className="border-b border-[#2A1E15]/10 bg-[#3A281B] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4A373]">Super Admin</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">Painel global de tenants</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/60">
              Selecione a empresa, a filial e o escopo de acesso. Multi-tenant sem essa separação vira vazamento de dado com interface bonita.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#D4A373] transition hover:border-[#D4A373]/30 hover:bg-white/10"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-[#2A1E15]/10 bg-white px-6 py-10 text-sm font-black uppercase tracking-[0.16em] text-[#2A1E15]">
            <Loader2 size={18} className="animate-spin" />
            Carregando snapshot administrativo
          </div>
        )}

        {!loading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<Building2 size={18} />} label="Empresas" value={companyOptions.length} />
              <StatCard icon={<Building2 size={18} />} label="Tenants" value={tenantOptions.length} />
              <StatCard icon={<Users size={18} />} label="Usuários" value={summary.users || 0} accent="text-[#D4A373]" />
              <StatCard icon={<CircleDollarSign size={18} />} label="Custos fixos" value={summary.recurringCosts || 0} accent="text-[#D4A373]" />
            </div>

            <TenantIdentitySection
              tenantOptions={tenantOptions}
              companyOptions={companyOptions}
              selectedTenant={selectedTenant}
              selectedTenantSlug={selectedTenantSlug}
              selectedCompanyId={selectedCompanyId}
              companySearch={companySearch}
              branchSearch={branchSearch}
              tenantForm={tenantForm}
              identityForm={identityForm}
              createMode={tenantCreateMode}
              onSelectCompany={handleSelectCompany}
              onCompanySearchChange={handleCompanySearchChange}
              onBranchSearchChange={setBranchSearch}
              onSelectTenant={handleSelectTenant}
              onTenantFormChange={updateTenantForm}
              onIdentityFormChange={updateIdentityForm}
              onCreateCompany={handleCreateCompany}
              onCreateTenant={handleCreateTenant}
              onSaveCompany={handleSaveCompany}
              onSaveIdentity={handleSaveIdentity}
              onDeleteTenant={handleDeleteTenant}
              onDeleteCompany={handleDeleteCompany}
              onOpenCreateCompany={openCreateCompany}
              onOpenCreateBranch={openCreateBranch}
              onOpenEditBranch={() => setTenantCreateMode('branchEdit')}
              onCloseCreate={() => {
                setTenantCreateMode('');
                setTenantForm(emptyTenantForm);
              }}
            />

            {selectedTenantSlug && (
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15] transition hover:bg-[#2A1E15]/5"
                >
                  <ShieldCheck size={16} />
                  Perfis e permissões
                </button>
                <TenantUsersSection
                  users={selectedTenant?.users || []}
                  selectedTenant={selectedTenant}
                  roleProfiles={roleProfiles}
                  userForm={userForm}
                  isPanelOpen={usersModalOpen}
                  isFormOpen={userFormOpen}
                  onOpenPanel={() => setUsersModalOpen(true)}
                  onClosePanel={() => {
                    setUsersModalOpen(false);
                    setUserFormOpen(false);
                    setUserForm(emptyUserForm);
                  }}
                  onOpenCreate={() => {
                    setUserForm({
                      ...emptyUserForm,
                      roleProfileId: roleProfiles.find((profile) => profile.key === 'admin')?.id || roleProfiles[0]?.id || ''
                    });
                    setUserFormOpen(true);
                  }}
                  onCloseForm={() => {
                    setUserFormOpen(false);
                    setUserForm(emptyUserForm);
                  }}
                  onChange={updateUserForm}
                  onSubmit={handleSaveUser}
                  onEdit={(user) => {
                    setUserForm(normalizeUserForm(user));
                    setUserFormOpen(true);
                  }}
                  onDelete={handleDeleteUser}
                  onReset={() => setUserForm(emptyUserForm)}
                />
              </div>
            )}

            {permissionsModalOpen && selectedTenantSlug && (
              <AdminModal
                title="Perfis e permissões"
                description="Edite o que cada perfil pode ver dentro desse tenant."
                onClose={() => setPermissionsModalOpen(false)}
                wide
              >
                <RolePermissionsManager
                  roleProfiles={roleProfiles}
                  saving={permissionsSaving}
                  onSaveProfile={handleSaveRoleProfile}
                  onDeleteProfile={handleDeleteRoleProfile}
                />
              </AdminModal>
            )}

            {(error || success) && (
              <div className={`rounded-3xl border px-5 py-4 text-sm font-black uppercase tracking-[0.14em] ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                {error || success}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
