import { useMemo, useState } from 'react';
import { Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { PERMISSION_CATEGORIES, PERMISSIONS, normalizePermissionMap } from './permissionCatalog.js';

const inputClass = 'w-full rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-4 py-3 text-sm font-semibold outline-none focus:border-[#D4A373]';

export default function RolePermissionsManager({
  roleProfiles = [],
  onSaveProfile,
  onDeleteProfile,
  saving = false
}) {
  const [profileSearch, setProfileSearch] = useState('');
  const [draftProfile, setDraftProfile] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(roleProfiles[0]?.id || '');
  const normalizedSearch = profileSearch.trim().toLowerCase();
  const filteredProfiles = useMemo(
    () =>
      roleProfiles.filter((profile) => {
        if (!normalizedSearch) return true;
        return [profile.name, profile.key, profile.baseRole]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));
      }),
    [normalizedSearch, roleProfiles]
  );
  const selectedProfile = draftProfile || roleProfiles.find((profile) => profile.id === selectedProfileId) || roleProfiles[0] || null;
  const permissionMap = normalizePermissionMap(selectedProfile?.permissions, selectedProfile?.baseRole);

  const selectProfile = (profile) => {
    setDraftProfile(null);
    setSelectedProfileId(profile.id);
  };

  const createProfile = () => {
    setSelectedProfileId('');
    setDraftProfile({
      id: '',
      name: '',
      key: '',
      isSystem: false,
      baseRole: 'tenant_staff',
      permissions: normalizePermissionMap({}, 'tenant_staff')
    });
  };

  const updateDraft = (field, value) => {
    const source = draftProfile || selectedProfile;
    if (!source) return;
    setDraftProfile({
      ...source,
      [field]: value,
      permissions: normalizePermissionMap(source.permissions, field === 'baseRole' ? value : source.baseRole)
    });
  };

  const togglePermission = (permissionKey) => {
    const source = draftProfile || selectedProfile;
    if (!source) return;
    setDraftProfile({
      ...source,
      permissions: {
        ...permissionMap,
        [permissionKey]: !permissionMap[permissionKey]
      }
    });
  };

  const saveProfile = async () => {
    const source = draftProfile || selectedProfile;
    if (!source) return;
    const saved = await onSaveProfile({
      ...source,
      name: String(source.name || '').trim(),
      permissions: permissionMap
    });
    setDraftProfile(null);
    if (saved?.id) setSelectedProfileId(saved.id);
  };

  const deleteProfile = async () => {
    if (!selectedProfile?.id || selectedProfile.isSystem) return;
    if (!window.confirm(`Excluir o perfil ${selectedProfile.name}? Usuários vinculados precisam ser realocados antes.`)) return;
    await onDeleteProfile(selectedProfile.id);
    setSelectedProfileId(roleProfiles.find((profile) => profile.id !== selectedProfile.id)?.id || '');
    setDraftProfile(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="flex items-center gap-2 rounded-2xl border border-[#2A1E15]/10 bg-[#fffdf9] px-3 py-2">
          <Search size={16} className="text-[#8a7474]" />
          <input
            value={profileSearch}
            onChange={(event) => setProfileSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
            placeholder="Filtrar perfis"
          />
        </div>
        <button
          type="button"
          onClick={createProfile}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d]"
        >
          <Plus size={16} />
          Novo perfil
        </button>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {filteredProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => selectProfile(profile)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                profile.id === selectedProfile?.id && !draftProfile
                  ? 'border-[#D4A373] bg-[#D4A373]/10'
                  : 'border-[#2A1E15]/10 bg-white hover:bg-[#2A1E15]/5'
              }`}
            >
              <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#2A1E15]">{profile.name}</span>
              <span className="mt-1 block text-[11px] font-bold text-[#7a6666]">
                {profile.isSystem ? 'Perfil padrão' : 'Perfil customizado'}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {selectedProfile ? (
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <div>
              <label htmlFor="role-profile-name" className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Nome do perfil</label>
              <input
                id="role-profile-name"
                value={selectedProfile.name}
                onChange={(event) => updateDraft('name', event.target.value)}
                className={inputClass}
                placeholder="Gerente, Caixa, Financeiro"
              />
            </div>
            <div>
              <label htmlFor="role-profile-base" className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8a7474]">Base</label>
              <select
                id="role-profile-base"
                value={selectedProfile.baseRole || 'tenant_staff'}
                disabled={selectedProfile.isSystem}
                onChange={(event) => updateDraft('baseRole', event.target.value)}
                className={`${inputClass} disabled:cursor-not-allowed disabled:bg-[#efe7db] disabled:text-[#8a7474]`}
              >
                <option value="tenant_admin">Admin</option>
                <option value="tenant_staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {PERMISSION_CATEGORIES.map((category) => {
              const permissions = PERMISSIONS.filter((permission) => permission.category === category.id);
              return (
                <div key={category.id} className="rounded-3xl border border-[#2A1E15]/10 bg-[#fffdf9] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a7474]">{category.label}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {permissions.map((permission) => (
                      <label key={permission.key} className="flex items-start gap-3 rounded-2xl border border-[#2A1E15]/10 bg-white px-4 py-3">
                        <input
                          type="checkbox"
                          checked={Boolean(permissionMap[permission.key])}
                          onChange={() => togglePermission(permission.key)}
                          className="mt-1 h-4 w-4 accent-[#2A1E15]"
                        />
                        <span>
                          <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#2A1E15]">{permission.label}</span>
                          <span className="mt-1 block text-[11px] font-semibold text-[#7a6666]">{permission.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={saving || !String(selectedProfile.name || '').trim()}
              onClick={saveProfile}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#2A1E15] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#7c2c2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              Salvar perfil
            </button>
            <button
              type="button"
              disabled={saving || !selectedProfile.id || selectedProfile.isSystem}
              onClick={deleteProfile}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Excluir perfil
            </button>
          </div>
        </section>
      ) : (
        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-[#2A1E15]/15 bg-[#fffdf9] text-center">
          <div>
            <ShieldCheck size={28} className="mx-auto text-[#D4A373]" />
            <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-[#2A1E15]">Nenhum perfil selecionado</p>
          </div>
        </div>
      )}
    </div>
  );
}
