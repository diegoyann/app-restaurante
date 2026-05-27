import { ensureOk, supabaseAdmin } from '../../shared/db.js';
import { mapOrder } from '../../shared/mappers.js';

export async function readOrdersProjection(tenant) {
  const orders = ensureOk(
    await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers!orders_customer_id_fkey ( * ),
        payment_methods!orders_payment_method_id_fkey ( * ),
        delivery_drivers!orders_delivery_driver_id_fkey ( * ),
        order_items!order_items_order_id_fkey ( * )
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false }),
    'Falha ao carregar pedidos.'
  );

  return {
    orders: orders.map(mapOrder)
  };
}
