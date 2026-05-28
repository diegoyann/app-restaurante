import { useMemo, useState } from 'react';
import { Pencil, Plus, Save, Search, Trash2, Users } from 'lucide-react';
import { AdminModal } from './AdminLayout.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';

const inputClass = 'w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]';
const selectClass = 'w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-bold outline-none focus:border-[#D4A373]';

export default function TenantUsersSection({
  users,
  selectedTenant,
  roleProfiles = [],
  userForm,
  isPanelOpen,
  isFormOpen,
  onOpenPanel,
  onClosePanel,
  onOpenCreate,
  onCloseForm,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onReset
}) {
  const [userSearch, setUserSearch] = useState('');
  const companyName = selectedTenant?.tenant?.company?.name || 'Empresa atual';
  const branchName = selectedTenant?.tenant?.branchName || selectedTenant?.tenant?.name || 'Filial atual';
  const selectedRoleProfile = roleProfiles.find((profile) => profile.id === userForm.roleProfileId)
    || roleProfiles.find((profile) => profile.baseRole === userForm.role)
    || roleProfiles[0]
    || null;
  const canChooseCompanyScope = selectedRoleProfile?.baseRole === 'tenant_admin';
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        if (!normalizedUserSearch) return true;
        return [user.name, user.email, user.role, user.roleProfileName, user.accessScope]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedUserSearch));
      }),
    [normalizedUserSearch, users]
  );

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenPanel}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15] transition hover:bg-[#2A1E15]/5"
        >
          <Users size={16} />
          Usuários e escopo
        </button>
      </div>

      {isPanelOpen && (
        <AdminModal
          title="Usuários e escopo"
          description="Gerencie usuários somente no contexto da filial ativa."
          onClose={onClosePanel}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-3 py-2">
                <Search size={16} className="text-[#8a7474]" />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                  placeholder="Filtrar por nome, e-mail, papel ou escopo"
                />
              </div>
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]"
              >
                <Plus size={16} />
                Novo usuário
              </button>
            </div>

            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{user.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#7a6666]">{user.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#D4A373]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b7926]">
                          {user.roleProfileName || (user.role === 'tenant_admin' ? 'Admin' : 'Staff')}
                        </span>
                        <span className="rounded-full bg-[#2A1E15]/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#2A1E15]">
                          {user.accessScope === 'company' ? `Empresa: ${companyName}` : `Filial: ${branchName}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onEdit(user)} className="inline-flex items-center gap-2 rounded-xl border border-[#2A1E15]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#2A1E15]">
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button type="button" onClick={() => onDelete(user.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700">
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-5 text-sm font-bold text-[#8a7474]">
                  Nenhum usuário encontrado.
                </p>
              )}
            </div>

            {isFormOpen && (
              <form className="space-y-3 rounded-3xl border border-[#2A1E15]/10 bg-white p-4" onSubmit={onSubmit}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a7474]">
                  {userForm.id ? 'Editar usuário' : 'Novo usuário'}
                </p>
                <label htmlFor="tenant-user-name" className="sr-only">Nome do usuário</label>
                <input id="tenant-user-name" name="name" value={userForm.name} onChange={(event) => onChange('name', event.target.value)} className={inputClass} placeholder="Nome" />
                <label htmlFor="tenant-user-email" className="sr-only">E-mail do usuário</label>
                <input id="tenant-user-email" name="email" type="email" value={userForm.email} onChange={(event) => onChange('email', event.target.value)} className={inputClass} placeholder="E-mail" />
                <label htmlFor="tenant-user-password" className="sr-only">{userForm.id ? 'Nova senha opcional' : 'Senha do usuário'}</label>
                <input id="tenant-user-password" name="password" type="password" value={userForm.password} onChange={(event) => onChange('password', event.target.value)} className={inputClass} placeholder={userForm.id ? 'Nova senha opcional' : 'Senha'} />
                <label htmlFor="tenant-user-role-profile" className="sr-only">Perfil do usuário</label>
                <SearchableSelect
                  id="tenant-user-role-profile"
                  name="roleProfileId"
                  value={selectedRoleProfile?.id || ''}
                  onChange={(value) => {
                    const profile = roleProfiles.find((item) => item.id === value);
                    onChange('roleProfileId', value);
                    onChange('role', profile?.baseRole || 'tenant_staff');
                  }}
                  className="searchable-select--admin"
                  options={roleProfiles.map((profile) => ({
                    value: profile.id,
                    label: profile.name
                  }))}
                />
                <label htmlFor="tenant-user-access-scope" className="sr-only">Escopo de acesso</label>
                <SearchableSelect
                  id="tenant-user-access-scope"
                  name="accessScope"
                  value={userForm.accessScope}
                  disabled={!canChooseCompanyScope}
                  onChange={(value) => onChange('accessScope', value)}
                  className="searchable-select--admin"
                  options={[
                    { value: 'branch', label: `Somente filial: ${branchName}` },
                    { value: 'company', label: `Empresa inteira: ${companyName}` }
                  ]}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white">
                    <Save size={16} />
                    Salvar
                  </button>
                  <button type="button" onClick={onCloseForm} className="rounded-2xl border border-[#2A1E15]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15]">
                    Cancelar
                  </button>
                  {userForm.id && (
                    <button type="button" onClick={onReset} className="rounded-2xl border border-[#2A1E15]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#2A1E15]">
                      Limpar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </AdminModal>
      )}
    </>
  );
}
