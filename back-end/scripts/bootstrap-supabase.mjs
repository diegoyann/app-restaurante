import { createClient } from '@supabase/supabase-js';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável ausente: ${name}`);
  return value;
};

const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SECRET_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false }
});

const tenants = [
  { slug: 'reidasesfihas', name: 'Rei das Esfihas', business_name: 'Rei das Esfihas' },
  { slug: 'demo', name: 'Demo Restaurante', business_name: 'Demo Restaurante' },
  { slug: 'esfiharia-express', name: 'Esfiharia Express', business_name: 'Esfiharia Express' }
];

const users = [
  { email: 'admin@gestaofood.com.br', password: 'TroqueEssaSenhaAgora123!', full_name: 'Administrador Global', role: 'super_admin', tenantSlug: null },
  { email: 'rei@reidasesfihas.com', password: 'TroqueEssaSenhaAgora123!', full_name: 'Rei das Esfihas', role: 'tenant_admin', tenantSlug: 'reidasesfihas' },
  { email: 'demo@gestaofood.com.br', password: 'TroqueEssaSenhaAgora123!', full_name: 'Demo Restaurante', role: 'tenant_admin', tenantSlug: 'demo' },
  { email: 'admin@express.com', password: 'TroqueEssaSenhaAgora123!', full_name: 'Esfiharia Express', role: 'tenant_admin', tenantSlug: 'esfiharia-express' }
];

async function ensureTenant(tenant) {
  const { data, error } = await supabase
    .from('tenants')
    .upsert(tenant, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function findUserIdByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email === email)?.id || null;
}

async function ensureUser(user, tenantMap) {
  const created = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.full_name }
  });

  const userId = created.data.user?.id || await findUserIdByEmail(user.email);

  if (!userId) {
    throw created.error || new Error(`Falha ao preparar usuário ${user.email}`);
  }

  const tenantId = user.tenantSlug ? tenantMap.get(user.tenantSlug)?.id : null;
  const { error: membershipError } = await supabase.from('tenant_memberships').upsert({
    user_id: userId,
    tenant_id: tenantId,
    role: user.role
  });

  if (membershipError) throw membershipError;
}

async function main() {
  const tenantMap = new Map();

  for (const tenant of tenants) {
    const saved = await ensureTenant(tenant);
    tenantMap.set(saved.slug, saved);
  }

  for (const user of users) {
    await ensureUser(user, tenantMap);
  }

  console.log('Seed inicial criada. Troque as senhas temporárias antes de publicar.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
