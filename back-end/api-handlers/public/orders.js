import {
  getCustomerByPhone,
  saveCustomer,
  saveOrder
} from '../../src/modules/public/index.js';
import {
  badRequest,
  getTenantSlug,
  handleOptions,
  methodNotAllowed,
  sendError,
  sendJson,
  sendMutationJson
} from '../_shared/http.js';

function buildOrderNumber() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const suffix = String(now.getTime()).slice(-5);
  return `WEB-${day}${month}-${suffix}`;
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const tenantSlug = getTenantSlug(req);
  if (!tenantSlug) return badRequest(res, 'Informe o tenant na query ?tenant=slug.');

  try {
    if (req.method !== 'POST') {
      return methodNotAllowed(res, ['POST']);
    }

    return sendMutationJson(req, res, {
      tenantSlug,
      statusCode: 201,
      action: async () => {
        const body = req.body || {};
        const customerPayload = body.customer || {};
        const items = Array.isArray(body.items) ? body.items : [];
        const phone = String(customerPayload.phone || '').replace(/\D/g, '');

        if (items.length === 0) throw new Error('Pedido precisa ter pelo menos um item.');
        if (phone.length < 10 || phone.length > 11) throw new Error('Telefone com DDD é obrigatório.');

        const existingCustomer = customerPayload.id
          ? null
          : await getCustomerByPhone(tenantSlug, phone);

        const customer = await saveCustomer(tenantSlug, {
          id: customerPayload.id || existingCustomer?.id,
          name: customerPayload.name,
          phone,
          email: customerPayload.email || '',
          addressLine: customerPayload.addressLine,
          addressNumber: customerPayload.addressNumber,
          addressComplement: customerPayload.addressComplement || '',
          district: customerPayload.district,
          city: customerPayload.city,
          state: customerPayload.state,
          postalCode: customerPayload.postalCode || '',
          notes: customerPayload.notes || ''
        });

        const order = await saveOrder(tenantSlug, {
          customerId: customer.id,
          paymentMethodId: body.paymentMethodId || null,
          orderNumber: buildOrderNumber(),
          channel: 'proprio',
          orderType: body.orderType || 'delivery',
          status: 'placed',
          deliveryFee: Number(body.deliveryFee) || 0,
          discount: 0,
          paidAmount: Number(body.paidAmount) || 0,
          changeAmount: Number(body.changeAmount) || 0,
          notes: body.notes || '',
          items
        });

        return {
          customer,
          order
        };
      }
    });
  } catch (error) {
    return sendError(res, error, 400);
  }
}
