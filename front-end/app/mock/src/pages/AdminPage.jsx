import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Building2,
  CircleDollarSign,
  Loader2,
  LogOut,
  Plus,
  Save,
  Shield,
  Trash2,
  UserCog,
  Users
} from 'lucide-react';
import { adminApi, hrApi, settingsApi } from '../services/api.js';
import { useAuthSession } from '../hooks/useAuthSession.js';
import { supabase } from '../lib/supabase.js';

const emptyTenantForm = { name: '', slug: '' };
const emptyUserForm = { id: '', name: '', email: '', password: '', role: 'tenant_admin' };
const emptyEmployeeForm = {
  id: '',
  name: '',
  role: '',
  employmentType: 'fixed',
  salary: '0',
  baseAmount: '0',
  status: 'active',
  notes: ''
};

function normalizeSettingsForm(settings) {
  return {
    businessName: settings?.businessName || '',
    ifoodTax: String(settings?.ifoodTax ?? 0),
    anotaaiTax: String(settings?.anotaaiTax ?? 0),
    alertDaysBefore: String(settings?.alertDaysBefore ?? 0),
    appPassword: settings?.appPassword || '',
    passwordReminder: settings?.passwordReminder || ''
  };
}

function normalizeEmployeeForm(employee) {
  if (!employee) return emptyEmployeeForm;

  return {
    id: employee.id || '',
    name: employee.name || '',
    role: employee.role || '',
    employmentType: employee.employmentType || 'fixed',
    salary: String(employee.salary ?? 0),
    baseAmount: String(employee.baseAmount ?? 0),
    status: employee.status || 'active',
    notes: employee.notes || ''
  };
}

function normalizeUserForm(user) {
  if (!user) return emptyUserForm;

  return {
    id: user.id || '',
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'tenant_admin'
  };
}

function StatCard({ icon, label, value, accent = 'text-[#5c1f20]' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8c7a7a]">{label}</p>
        <div className="rounded-2xl bg-[#5c1f20]/5 p-3 text-[#5c1f20]">
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-3xl font-black tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

function SectionCard({ title, eyebrow, description, children, actions }) {
  return (
    <section className="rounded-[2rem] border border-[#5c1f20]/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a04a]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#5c1f20]">{title}</h2>
          {description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#7a6666]">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { loading: sessionLoading, session } = useAuthSession();
  const isAuthorized = session?.user?.role === 'super_admin';
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [bootstrap, setBootstrap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [identityForm, setIdentityForm] = useState({ name: '', businessName: '' });
  const [settingsForm, setSettingsForm] = useState(normalizeSettingsForm(null));
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);

  const selectedTenant = bootstrap?.selectedTenant || null;
  const summary = selectedTenant?.summary || {};
  const tenantOptions = useMemo(() => bootstrap?.availableTenants || [], [bootstrap]);

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
    if (!isAuthorized) return;
    loadBootstrap(selectedTenantSlug);
  }, [isAuthorized, selectedTenantSlug, loadBootstrap]);

  useEffect(() => {
    if (!selectedTenant) return;
    const tenantSettings = selectedTenant.data?.settings || null;

    setIdentityForm({
      name: selectedTenant.tenant.name || '',
      businessName: tenantSettings?.businessName || selectedTenant.tenant.name || ''
    });
    setSettingsForm(normalizeSettingsForm(tenantSettings));
    setUserForm(emptyUserForm);
    setEmployeeForm(emptyEmployeeForm);
  }, [selectedTenant]);

  const handleSelectTenant = (event) => {
    const nextTenantSlug = event.target.value;
    setSelectedTenantSlug(nextTenantSlug);
  };

  const handleCreateTenant = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      const created = await adminApi.createTenant(tenantForm);
      setTenantForm(emptyTenantForm);
      await loadBootstrap(created.slug);
      setSuccess(`Tenant ${created.name} criado.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao criar tenant.');
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
          tenant.slug === selectedTenantSlug ? { ...tenant, name: snapshot.tenant.name } : tenant
        ),
        selectedTenant: snapshot
      }));
      setSuccess('Identidade do tenant atualizada.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar identidade do tenant.');
    }
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (!selectedTenantSlug) return;

    setError('');
    setSuccess('');

    try {
      const nextSettings = await settingsApi.updateGeneral(selectedTenantSlug, {
        ...settingsForm,
        ifoodTax: Number(settingsForm.ifoodTax),
        anotaaiTax: Number(settingsForm.anotaaiTax),
        alertDaysBefore: Number(settingsForm.alertDaysBefore)
      });

      setBootstrap((prev) => ({
        ...prev,
        selectedTenant: prev?.selectedTenant
          ? {
              ...prev.selectedTenant,
              data: {
                ...prev.selectedTenant.data,
                settings: nextSettings
              }
            }
          : prev?.selectedTenant
      }));
      setSuccess('Configurações do tenant atualizadas.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar configurações.');
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenantSlug) return;
    if (!window.confirm('Excluir esse tenant remove também os usuários vinculados. Continuar?')) return;

    setError('');
    setSuccess('');

    try {
      const removed = await adminApi.deleteTenant(selectedTenantSlug);
      await loadBootstrap('');
      setSuccess(`Tenant ${removed.name} excluído.`);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir tenant.');
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

  const handleSaveEmployee = async (event) => {
    event.preventDefault();
    if (!selectedTenantSlug) return;

    setError('');
    setSuccess('');

    try {
      const saved = await hrApi.saveEmployee(selectedTenantSlug, {
        ...employeeForm,
        salary: Number(employeeForm.salary),
        baseAmount: Number(employeeForm.baseAmount)
      });
      const employees = selectedTenant.data.employees || [];
      const nextEmployees = employeeForm.id
        ? employees.map((employee) => (employee.id === saved.id ? saved : employee))
        : [...employees, saved];

      setBootstrap((prev) => ({
        ...prev,
        selectedTenant: prev?.selectedTenant
          ? {
              ...prev.selectedTenant,
              summary: {
                ...prev.selectedTenant.summary,
                employees: nextEmployees.length
              },
              data: {
                ...prev.selectedTenant.data,
                employees: nextEmployees
              }
            }
          : prev?.selectedTenant
      }));
      setEmployeeForm(emptyEmployeeForm);
      setSuccess('Funcionário salvo.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao salvar funcionário.');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!selectedTenantSlug) return;
    if (!window.confirm('Excluir esse funcionário do tenant?')) return;

    setError('');
    setSuccess('');

    try {
      await hrApi.deleteEmployee(selectedTenantSlug, id);
      const nextEmployees = (selectedTenant.data.employees || []).filter((employee) => employee.id !== id);
      setBootstrap((prev) => ({
        ...prev,
        selectedTenant: prev?.selectedTenant
          ? {
              ...prev.selectedTenant,
              summary: {
                ...prev.selectedTenant.summary,
                employees: nextEmployees.length
              },
              data: {
                ...prev.selectedTenant.data,
                employees: nextEmployees
              }
            }
          : prev?.selectedTenant
      }));
      if (employeeForm.id === id) setEmployeeForm(emptyEmployeeForm);
      setSuccess('Funcionário removido.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao excluir funcionário.');
    }
  };

  const logout = () => {
    supabase.auth.signOut().finally(() => navigate('/login'));
  };

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef] text-[#5c1f20] font-black uppercase tracking-[0.18em]">Carregando sessão...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#241818]">
      <header className="border-b border-[#5c1f20]/10 bg-[#1a0b0b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5a04a]">Super Admin</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">Painel global de tenants</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-white/60">
              Seleciona o tenant, mexe nos dados e valida o impacto. Sem fantasia de multi-tenant maduro: isso aqui é administração operacional central.
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#c5a04a] transition hover:border-[#c5a04a]/30 hover:bg-white/10"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center gap-3 rounded-[2rem] border border-[#5c1f20]/10 bg-white px-6 py-10 text-sm font-black uppercase tracking-[0.16em] text-[#5c1f20]">
            <Loader2 size={18} className="animate-spin" />
            Carregando snapshot administrativo
          </div>
        )}

        {!loading && (
          <>
            <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-6">
                <SectionCard
                  eyebrow="Tenant"
                  title="Seleção e criação"
                  description="O tenant define o contexto inteiro. Se escolher o tenant errado e editar, o erro é seu."
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Tenant ativo</label>
                      <select
                        value={selectedTenantSlug}
                        onChange={handleSelectTenant}
                        className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-bold outline-none focus:border-[#c5a04a]"
                      >
                        {tenantOptions.map((tenant) => (
                          <option key={tenant.slug} value={tenant.slug}>
                            {tenant.name} ({tenant.slug})
                          </option>
                        ))}
                      </select>
                    </div>

                    <form className="space-y-3" onSubmit={handleCreateTenant}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Novo tenant</label>
                        <input
                          value={tenantForm.name}
                          onChange={(event) => setTenantForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]"
                          placeholder="Nome do restaurante"
                        />
                      </div>
                      <input
                        value={tenantForm.slug}
                        onChange={(event) => setTenantForm((prev) => ({ ...prev, slug: event.target.value }))}
                        className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]"
                        placeholder="slug-opcional"
                      />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5c1f20] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f8f5ef] transition hover:bg-[#7c2c2d]"
                      >
                        <Plus size={16} />
                        Criar tenant
                      </button>
                    </form>
                  </div>
                </SectionCard>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <StatCard icon={<Building2 size={18} />} label="Tenants" value={tenantOptions.length} />
                  <StatCard icon={<Users size={18} />} label="Usuários" value={summary.users || 0} accent="text-[#c5a04a]" />
                  <StatCard icon={<UserCog size={18} />} label="Equipe" value={summary.employees || 0} />
                  <StatCard icon={<CircleDollarSign size={18} />} label="Custos fixos" value={summary.recurringCosts || 0} accent="text-[#c5a04a]" />
                </div>
              </div>

              <div className="space-y-6">
                <SectionCard
                  eyebrow="Tenant ativo"
                  title={selectedTenant?.tenant.name || 'Nenhum tenant carregado'}
                  description="Aqui você altera o tenant inteiro. Faça com critério ou vai quebrar consistência operacional de forma centralizada."
                  actions={
                    selectedTenantSlug ? (
                      <button
                        type="button"
                        onClick={handleDeleteTenant}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                        Excluir tenant
                      </button>
                    ) : null
                  }
                >
                  <div className="grid gap-6 lg:grid-cols-2">
                    <form className="space-y-4" onSubmit={handleSaveIdentity}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Nome visível do tenant</label>
                        <input
                          value={identityForm.name}
                          onChange={(event) => setIdentityForm((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Nome operacional do negócio</label>
                        <input
                          value={identityForm.businessName}
                          onChange={(event) => setIdentityForm((prev) => ({ ...prev, businessName: event.target.value }))}
                          className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]"
                        />
                      </div>
                      <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#5c1f20] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]">
                        <Save size={16} />
                        Salvar identidade
                      </button>
                    </form>

                    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSaveSettings}>
                      {[
                        { key: 'ifoodTax', label: 'Taxa iFood (%)' },
                        { key: 'anotaaiTax', label: 'Taxa Anota AI (%)' },
                        { key: 'alertDaysBefore', label: 'Alerta de vencimento (dias)' },
                        { key: 'appPassword', label: 'Senha do tenant' },
                        { key: 'passwordReminder', label: 'Lembrete de senha', full: true },
                        { key: 'businessName', label: 'Nome exibido no app', full: true }
                      ].map((field) => (
                        <div key={field.key} className={`space-y-2 ${field.full ? 'sm:col-span-2' : ''}`}>
                          <label className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">{field.label}</label>
                          <input
                            value={settingsForm[field.key]}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, [field.key]: event.target.value }))}
                            className="w-full rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]"
                          />
                        </div>
                      ))}
                      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#c5a04a] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#5c1f20] transition hover:bg-[#d4b35e] sm:col-span-2">
                        <Shield size={16} />
                        Salvar configurações
                      </button>
                    </form>
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="grid gap-6 2xl:grid-cols-2">
              <SectionCard
                eyebrow="Acesso"
                title="Usuários do tenant"
                description="CRUD de acesso básico. Não tem permissão granular ainda, então não finja que tem."
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    {(selectedTenant?.users || []).map((user) => (
                      <div key={user.id} className="rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{user.name}</p>
                            <p className="mt-1 text-xs font-semibold text-[#7a6666]">{user.email}</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#c5a04a]">{user.role === 'tenant_admin' ? 'Admin do tenant' : 'Staff do tenant'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setUserForm(normalizeUserForm(user))} className="rounded-xl border border-[#5c1f20]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5c1f20]">
                              Editar
                            </button>
                            <button type="button" onClick={() => handleDeleteUser(user.id)} className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form className="space-y-3 rounded-3xl border border-[#5c1f20]/10 bg-[#fdf9f3] p-4" onSubmit={handleSaveUser}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1f20]">{userForm.id ? 'Editar usuário' : 'Novo usuário'}</p>
                    <input value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Nome" />
                    <input value={userForm.email} onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="E-mail" />
                    <input value={userForm.password} onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder={userForm.id ? 'Nova senha opcional' : 'Senha'} />
                    <select value={userForm.role} onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#c5a04a]">
                      <option value="tenant_admin">Admin do tenant</option>
                      <option value="tenant_staff">Staff do tenant</option>
                    </select>
                    <div className="flex gap-3">
                      <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5c1f20] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                        <Save size={16} />
                        Salvar
                      </button>
                      {userForm.id && (
                        <button type="button" onClick={() => setUserForm(emptyUserForm)} className="rounded-2xl border border-[#5c1f20]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#5c1f20]">
                          Limpar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Operação"
                title="Equipe do tenant"
                description="Aqui você consegue incluir, editar e excluir funcionários do tenant selecionado."
              >
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-3">
                    {(selectedTenant?.data.employees || []).map((employee) => (
                      <div key={employee.id} className="rounded-2xl border border-[#5c1f20]/10 bg-[#fffdf9] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{employee.name}</p>
                            <p className="mt-1 text-xs font-semibold text-[#7a6666]">{employee.role}</p>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#c5a04a]">
                              {employee.employmentType === 'fixed' ? `Fixo • R$ ${Number(employee.salary || 0).toFixed(2)}` : `Por fora • R$ ${Number(employee.baseAmount || 0).toFixed(2)}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEmployeeForm(normalizeEmployeeForm(employee))} className="rounded-xl border border-[#5c1f20]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#5c1f20]">
                              Editar
                            </button>
                            <button type="button" onClick={() => handleDeleteEmployee(employee.id)} className="rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form className="space-y-3 rounded-3xl border border-[#5c1f20]/10 bg-[#fdf9f3] p-4" onSubmit={handleSaveEmployee}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1f20]">{employeeForm.id ? 'Editar funcionário' : 'Novo funcionário'}</p>
                    <input value={employeeForm.name} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Nome" />
                    <input value={employeeForm.role} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Cargo" />
                    <select value={employeeForm.employmentType} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employmentType: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-[#c5a04a]">
                      <option value="fixed">Fixo</option>
                      <option value="external">Por fora</option>
                    </select>
                    {employeeForm.employmentType === 'fixed' ? (
                      <input value={employeeForm.salary} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, salary: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Salário" />
                    ) : (
                      <input value={employeeForm.baseAmount} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, baseAmount: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Valor base" />
                    )}
                    <input value={employeeForm.notes} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, notes: event.target.value }))} className="w-full rounded-2xl border border-[#5c1f20]/10 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#c5a04a]" placeholder="Observações" />
                    <div className="flex gap-3">
                      <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#5c1f20] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                        <Save size={16} />
                        Salvar
                      </button>
                      {employeeForm.id && (
                        <button type="button" onClick={() => setEmployeeForm(emptyEmployeeForm)} className="rounded-2xl border border-[#5c1f20]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#5c1f20]">
                          Limpar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              eyebrow="Snapshot"
              title="Dados operacionais do tenant"
              description="Não cobre tudo, mas já expõe o suficiente para administração central sem mexer no App monolítico."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-[#5c1f20]/10 bg-[#fffdf9] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a7474]">Canais de venda</p>
                  <div className="mt-4 space-y-2">
                    {(selectedTenant?.data.salesChannels || []).map((channel) => (
                      <div key={channel.id} className="rounded-2xl bg-[#5c1f20]/5 px-4 py-3 text-sm font-black uppercase tracking-tight text-[#5c1f20]">
                        {channel.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#5c1f20]/10 bg-[#fffdf9] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a7474]">Custos recorrentes</p>
                  <div className="mt-4 space-y-2">
                    {(selectedTenant?.data.recurringCosts || []).map((cost) => (
                      <div key={cost.id} className="rounded-2xl bg-[#c5a04a]/10 px-4 py-3">
                        <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{cost.desc}</p>
                        <p className="mt-1 text-xs font-semibold text-[#7a6666]">R$ {Number(cost.amount || 0).toFixed(2)} • vence dia {cost.dueDay}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#5c1f20]/10 bg-[#fffdf9] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a7474]">Últimas transações</p>
                  <div className="mt-4 space-y-2">
                    {(selectedTenant?.data.transactions || []).slice(0, 4).map((transaction) => (
                      <div key={transaction.id} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{transaction.category}</p>
                        <p className="mt-1 text-xs font-semibold text-[#7a6666]">{transaction.date} • R$ {Number(transaction.amount || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

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
