import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const ids = [
  'logoutButton',
  'message',
  'configView',
  'configForm',
  'apiBaseUrl',
  'supabaseUrl',
  'supabaseAnonKey',
  'loginView',
  'loginForm',
  'email',
  'password',
  'editConfigFromLogin',
  'tenantView',
  'tenantForm',
  'tenantSelect',
  'editConfigFromTenant',
  'orderView',
  'tenantName',
  'changeTenantButton',
  'orderForm',
  'customerSearch',
  'customerOptions',
  'customerName',
  'customerPhone',
  'addressLine',
  'addressNumber',
  'district',
  'city',
  'state',
  'addressComplement',
  'menuItemSelect',
  'quantity',
  'itemNotes',
  'addItemButton',
  'cartList',
  'paymentMethodId',
  'deliveryFee',
  'orderNotes',
  'orderTotal'
];

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    if (force) this.values.add(name);
    else this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(id = '', tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.dataset = {};
    this.children = [];
    this.listeners = {};
    this.classList = new FakeClassList();
    this.disabled = false;
  }

  appendChild(child) {
    this.children.push(child);
    if ((this.tagName === 'SELECT' || this.tagName === 'DATALIST') && !this.value && child.value) {
      this.value = child.value;
    }
    return child;
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  dispatchEvent(type, extra = {}) {
    const event = {
      preventDefault() {},
      target: this,
      ...extra
    };
    for (const handler of this.listeners[type] || []) {
      handler(event);
    }
  }

  reset() {
    for (const child of Object.values(elements)) {
      if (child !== this && ['INPUT', 'SELECT', 'TEXTAREA'].includes(child.tagName)) child.value = '';
    }
  }
}

const tagById = {
  tenantSelect: 'select',
  menuItemSelect: 'select',
  paymentMethodId: 'select',
  customerOptions: 'datalist',
  orderNotes: 'textarea'
};
const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement(id, tagById[id] || 'input')]));

elements.configView.classList.toggle('hidden', true);
elements.loginView.classList.toggle('hidden', true);
elements.tenantView.classList.toggle('hidden', true);
elements.orderView.classList.toggle('hidden', true);
elements.quantity.value = '1';
elements.deliveryFee.value = '0';
elements.state.value = 'SP';

const storage = {
  rde_config: {
    apiBaseUrl: 'https://rei-das-esfihas-backend.vercel.app/api',
    supabaseUrl: 'https://stzefrbxpflzmzvwffue.supabase.co',
    supabaseAnonKey: 'sb_publishable_test'
  },
  rde_auth: {
    access_token: 'fake-access-token',
    refresh_token: 'fake-refresh-token',
    expires_at: Date.now() + 3600000
  },
  rde_tenant_slug: 'demo'
};

const calls = [];
const sessionPayload = {
  user: { id: 'user-1', email: 'user@example.com', role: 'tenant_staff' },
  memberships: [
    {
      id: 'membership-1',
      role: 'tenant_staff',
      tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo', businessName: 'Loja Demo', status: 'active' }
    }
  ],
  currentTenant: { id: 'tenant-1', slug: 'demo', name: 'Demo', businessName: 'Loja Demo', status: 'active' }
};
const bootstrapPayload = {
  tenant: { id: 'tenant-1', slug: 'demo', name: 'Demo', businessName: 'Loja Demo' },
  customers: [],
  menuItems: [
    {
      id: 'menu-1',
      name: 'Esfiha de Carne',
      category: 'Esfihas',
      status: 'active',
      salePrice: 7.5,
      basePrice: 7.5
    }
  ],
  paymentMethods: [
    { id: 'pay-1', name: 'Pix', kind: 'pix', status: 'active' }
  ],
  orders: []
};
const createdCustomer = { id: 'customer-1', name: 'Cliente Teste', phone: '11999999999' };
const createdOrder = { id: 'order-1', orderNumber: 'EXT-123456' };

function makeResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? 'application/json' : '';
      }
    },
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    }
  };
}

const context = vm.createContext({
  console,
  Intl,
  Date,
  Number,
  String,
  Boolean,
  Array,
  Object,
  RegExp,
  Error,
  setTimeout,
  clearTimeout,
  chrome: {
    storage: {
      local: {
        async get(keys) {
          return Object.fromEntries(keys.map((key) => [key, storage[key]]));
        },
        async set(values) {
          Object.assign(storage, values);
        },
        async remove(keys) {
          for (const key of keys) delete storage[key];
        }
      }
    }
  },
  document: {
    getElementById(id) {
      if (!elements[id]) elements[id] = new FakeElement(id);
      return elements[id];
    },
    querySelectorAll(selector) {
      if (selector === 'button') {
        return Object.values(elements).filter((element) => element.id.toLowerCase().includes('button') || element.tagName === 'BUTTON');
      }
      return [];
    },
    createElement(tagName) {
      return new FakeElement('', tagName);
    }
  },
  fetch: async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/session')) return makeResponse(sessionPayload);
    if (url.includes('/app/bootstrap?tenant=demo')) return makeResponse(bootstrapPayload);
    if (url.includes('/customers?tenant=demo')) return makeResponse(createdCustomer, true, 201);
    if (url.includes('/orders?tenant=demo')) return makeResponse(createdOrder, true, 201);
    return makeResponse({ error: `URL inesperada: ${url}` }, false, 404);
  }
});

const popupCode = readFileSync(resolve('chrome-extension/popup.js'), 'utf8');
vm.runInContext(popupCode, context, { filename: 'popup.js' });

await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));

if (elements.orderView.classList.contains('hidden')) {
  throw new Error('A tela de pedido não foi exibida depois do bootstrap.');
}

if (elements.tenantName.textContent !== 'Loja Demo') {
  throw new Error(`Nome do tenant inesperado: ${elements.tenantName.textContent}`);
}

if (elements.menuItemSelect.children.length !== 1) {
  throw new Error('Itens de menu do bootstrap novo não foram renderizados.');
}

if (elements.paymentMethodId.children.length !== 1 || elements.paymentMethodId.children[0].value !== 'pay-1') {
  throw new Error('Formas de pagamento do bootstrap novo não foram renderizadas.');
}

elements.addItemButton.dispatchEvent('click');
if (elements.cartList.children.length !== 1) {
  throw new Error('Item não foi adicionado ao carrinho.');
}

elements.customerName.value = 'Cliente Teste';
elements.customerPhone.value = '11999999999';
elements.addressLine.value = 'Rua A';
elements.addressNumber.value = '123';
elements.district.value = 'Centro';
elements.city.value = 'São Paulo';
elements.state.value = 'SP';
elements.paymentMethodId.value = 'pay-1';
elements.deliveryFee.value = '3.5';
elements.orderNotes.value = 'Teste automatizado';
elements.orderForm.dispatchEvent('submit');

await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));

const orderCall = calls.find((call) => call.url.includes('/orders?tenant=demo'));
if (!orderCall) throw new Error('Pedido não foi enviado para /orders?tenant=demo.');

const orderPayload = JSON.parse(orderCall.options.body);
if (orderPayload.customerId !== 'customer-1') throw new Error('Payload de pedido sem customerId salvo.');
if (orderPayload.paymentMethodId !== 'pay-1') throw new Error('Payload de pedido sem paymentMethodId.');
if (orderPayload.items?.[0]?.menuItemId !== 'menu-1') throw new Error('Payload de item incompatível com /orders.');
if (orderPayload.status !== 'placed') throw new Error('Status inicial do pedido deveria ser placed.');
if (orderPayload.total !== 11) throw new Error(`Total inesperado: ${orderPayload.total}`);

console.log(JSON.stringify({
  ok: true,
  renderedTenant: elements.tenantName.textContent,
  orderPayload
}, null, 2));
