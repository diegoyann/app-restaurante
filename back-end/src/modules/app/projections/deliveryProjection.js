import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapDeliveryDriver } from '../../shared/mappers.js';

export async function readDeliveryProjection(tenant) {
  const deliveryDrivers = ensureOk(
    await supabaseAdmin.from('delivery_drivers').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: true }),
    'Falha ao carregar motoboys.'
  );

  return {
    deliveryDrivers: deliveryDrivers.map(mapDeliveryDriver)
  };
}
