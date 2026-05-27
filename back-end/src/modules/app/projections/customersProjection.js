import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapCustomer } from '../../shared/mappers.js';

export async function readCustomersProjection(tenant) {
  const customers = ensureOk(
    await supabaseAdmin.from('customers').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }),
    'Falha ao carregar clientes.'
  );

  return {
    customers: customers.map(mapCustomer)
  };
}
