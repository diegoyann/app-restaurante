const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const TENANT = process.env.TENANT_SLUG || '';
const TOKEN = process.env.AUTH_TOKEN || '';
const PRODUCT_ID = process.env.PRODUCT_ID || '';
const CUSTOMER_ID = process.env.CUSTOMER_ID || '';
const PAYMENT_METHOD_ID = process.env.PAYMENT_METHOD_ID || '';
const SHOULD_RUN = process.argv.includes('--run');

function uniqueSuffix() {
  return new Date().toISOString().replace(/\D/g, '').slice(0, 14);
}

function requireRunConfig() {
  if (!SHOULD_RUN) {
    console.log('Dry-run. Use --run with TENANT_SLUG and AUTH_TOKEN to execute duplicate POST checks.');
    process.exit(0);
  }

  if (!TENANT || !TOKEN) {
    console.error('TENANT_SLUG and AUTH_TOKEN are required.');
    process.exit(1);
  }
}

function withTenant(path) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenant=${encodeURIComponent(TENANT)}`;
}

function extractId(payload) {
  return payload?.id
    || payload?.order?.id
    || payload?.customer?.id
    || payload?.paymentMethod?.id
    || payload?.driver?.id
    || payload?.transaction?.id
    || '';
}

async function postTwice({ name, path, body, auth = true }) {
  const idempotencyKey = crypto.randomUUID();
  const headers = {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    'X-Request-Id': crypto.randomUUID(),
    ...(auth ? { Authorization: `Bearer ${TOKEN}` } : {})
  };

  const url = `${API_BASE_URL}${path}`;
  const requests = [1, 2].map(() => fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  }).then(async (response) => ({
    status: response.status,
    payload: await response.json()
  })));

  const [first, second] = await Promise.all(requests);
  const firstId = extractId(first.payload);
  const secondId = extractId(second.payload);
  const passed = first.status < 300
    && second.status < 300
    && firstId
    && firstId === secondId;

  return {
    name,
    passed,
    firstStatus: first.status,
    secondStatus: second.status,
    firstId,
    secondId
  };
}

requireRunConfig();

const suffix = uniqueSuffix();
const checks = [
  {
    name: 'employees',
    path: withTenant('/hr/employees'),
    body: {
      name: `Teste Idempotente ${suffix}`,
      role: 'Atendente',
      employmentType: 'fixed',
      status: 'active',
      salary: 100,
      paymentMode: 'weekly'
    }
  },
  {
    name: 'menu/categories',
    path: withTenant('/menu/categories'),
    body: { name: `Categoria ${suffix}` }
  },
  {
    name: 'catalog/ingredients',
    path: withTenant('/catalog/ingredients'),
    body: {
      name: `INSUMO ${suffix}`,
      unit: 'KG',
      packageQuantity: 1,
      packageCost: 10,
      unitCost: 10
    }
  },
  {
    name: 'customers',
    path: withTenant('/customers'),
    body: {
      name: `Cliente ${suffix}`,
      phone: `119${suffix.slice(-8)}`,
      status: 'active'
    }
  },
  {
    name: 'finance/payment-methods',
    path: withTenant('/finance/payment-methods'),
    body: {
      name: `Pagamento ${suffix}`,
      kind: 'other',
      status: 'active'
    }
  },
  {
    name: 'delivery/drivers',
    path: withTenant('/delivery/drivers'),
    body: {
      name: `Motoboy ${suffix}`,
      phone: `118${suffix.slice(-8)}`,
      vehicle: 'moto',
      dailyRate: 0,
      perDeliveryRate: 5,
      status: 'active'
    }
  }
];

if (PRODUCT_ID) {
  checks.push({
    name: 'menu/items',
    path: withTenant('/menu/items'),
    body: {
      itemType: 'regular',
      name: `Item ${suffix}`,
      category: `Categoria ${suffix}`,
      description: 'Item criado pelo teste de idempotência.',
      status: 'active',
      salePrice: 10,
      linkedComponents: [{ type: 'product', id: PRODUCT_ID }]
    }
  });
} else {
  console.warn('Skipping menu/items: set PRODUCT_ID to include it.');
}

if (CUSTOMER_ID && PAYMENT_METHOD_ID) {
  checks.push({
    name: 'orders',
    path: withTenant('/orders'),
    body: {
      customerId: CUSTOMER_ID,
      paymentMethodId: PAYMENT_METHOD_ID,
      orderNumber: `TEST-${suffix}`,
      channel: 'manual',
      orderType: 'delivery',
      status: 'placed',
      deliveryFee: 0,
      discount: 0,
      total: 10,
      paidAmount: 10,
      items: [{
        name: `Item pedido ${suffix}`,
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10
      }]
    }
  });
} else {
  console.warn('Skipping orders: set CUSTOMER_ID and PAYMENT_METHOD_ID to include it.');
}

if (PAYMENT_METHOD_ID) {
  checks.push({
    name: 'public/orders',
    path: withTenant('/public/orders'),
    auth: false,
    body: {
      customer: {
        name: `Cliente Publico ${suffix}`,
        phone: `117${suffix.slice(-8)}`,
        addressLine: 'Rua Teste',
        addressNumber: '1',
        district: 'Centro',
        city: 'Sao Paulo',
        state: 'SP'
      },
      paymentMethodId: PAYMENT_METHOD_ID,
      orderType: 'delivery',
      deliveryFee: 0,
      paidAmount: 10,
      items: [{
        name: `Item publico ${suffix}`,
        quantity: 1,
        unitPrice: 10,
        totalPrice: 10
      }]
    }
  });
} else {
  console.warn('Skipping public/orders: set PAYMENT_METHOD_ID to include it.');
}

const results = [];
for (const check of checks) {
  results.push(await postTwice(check));
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.passed)) {
  process.exit(1);
}
