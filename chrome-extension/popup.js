const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:3000/api',
  supabaseUrl: '',
  supabaseAnonKey: ''
};

const STORAGE_KEYS = {
  config: 'rde_config',
  auth: 'rde_auth',
  tenantSlug: 'rde_tenant_slug'
};

const BEVERAGE_MATCHER = /bebida|refrigerante|refri|suco|agua|água|cerveja|drink|lata|garrafa/i;

const state = {
  config: { ...DEFAULT_CONFIG },
  auth: null,
  session: null,
  tenantSlug: '',
  bootstrap: null,
  selectedCustomer: null,
  cart: []
};

const $ = (id) => document.getElementById(id);

const views = {
  config: $('configView'),
  login: $('loginView'),
  tenant: $('tenantView'),
  order: $('orderView')
};

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function getStorage(keys) {
  return chrome.storage.local.get(keys);
}

function setStorage(values) {
  return chrome.storage.local.set(values);
}

function removeStorage(keys) {
  return chrome.storage.local.remove(keys);
}

function showMessage(text, type = '') {
  const element = $('message');
  element.textContent = text;
  element.className = `message ${type}`.trim();
  element.classList.toggle('hidden', !text);
}

function showView(name) {
  Object.entries(views).forEach(([viewName, element]) => {
    element.classList.toggle('hidden', viewName !== name);
  });
  $('logoutButton').classList.toggle('hidden', !state.auth);
}

function setBusy(isBusy) {
  document.querySelectorAll('button').forEach((button) => {
    button.disabled = isBusy;
  });
}

async function apiRequest(path, options = {}) {
  const token = await getValidAccessToken();
  const response = await fetch(`${state.config.apiBaseUrl}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  return parseResponse(response);
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && payload.error
      ? payload.error
      : 'Falha na comunicação com a API.';
    throw new Error(message);
  }

  return payload;
}

async function getValidAccessToken() {
  if (!state.auth?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const expiresAt = Number(state.auth.expires_at || 0);
  const shouldRefresh = expiresAt && Date.now() > expiresAt - 60000;

  if (!shouldRefresh) {
    return state.auth.access_token;
  }

  if (!state.auth.refresh_token) {
    throw new Error('Sessão sem refresh token. Faça login novamente.');
  }

  const refreshed = await supabaseTokenRequest('refresh_token', {
    refresh_token: state.auth.refresh_token
  });
  await persistAuth(refreshed);
  return state.auth.access_token;
}

async function supabaseTokenRequest(grantType, payload) {
  const response = await fetch(`${state.config.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: state.config.supabaseAnonKey
    },
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
}

async function persistAuth(payload) {
  state.auth = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token || state.auth?.refresh_token || '',
    expires_at: Date.now() + Number(payload.expires_in || 3600) * 1000,
    user: payload.user || state.auth?.user || null
  };
  await setStorage({ [STORAGE_KEYS.auth]: state.auth });
}

async function loadConfig() {
  const stored = await getStorage([STORAGE_KEYS.config, STORAGE_KEYS.auth, STORAGE_KEYS.tenantSlug]);
  state.config = {
    ...DEFAULT_CONFIG,
    ...(stored[STORAGE_KEYS.config] || {})
  };
  state.auth = stored[STORAGE_KEYS.auth] || null;
  state.tenantSlug = stored[STORAGE_KEYS.tenantSlug] || '';

  $('apiBaseUrl').value = state.config.apiBaseUrl;
  $('supabaseUrl').value = state.config.supabaseUrl;
  $('supabaseAnonKey').value = state.config.supabaseAnonKey;
}

function hasValidConfig() {
  return Boolean(state.config.apiBaseUrl && state.config.supabaseUrl && state.config.supabaseAnonKey);
}

async function bootstrapApp() {
  await loadConfig();

  if (!hasValidConfig()) {
    showView('config');
    return;
  }

  if (!state.auth) {
    showView('login');
    return;
  }

  try {
    await loadSession();
    if (state.tenantSlug) {
      await loadTenantBase(state.tenantSlug);
      showView('order');
      return;
    }
    renderTenantOptions();
    showView('tenant');
  } catch (error) {
    await logout(false);
    showMessage(error.message || 'Sessão inválida. Faça login novamente.', 'error');
    showView('login');
  }
}

async function loadSession() {
  state.session = await apiRequest('/auth/session');
}

function accessibleTenants() {
  const memberships = Array.isArray(state.session?.memberships) ? state.session.memberships : [];
  return memberships
    .map((membership) => membership.tenant)
    .filter((tenant) => tenant?.slug);
}

function renderTenantOptions() {
  const tenants = accessibleTenants();
  const select = $('tenantSelect');
  select.innerHTML = '';

  tenants.forEach((tenant) => {
    const option = document.createElement('option');
    option.value = tenant.slug;
    option.textContent = tenant.businessName || tenant.name || tenant.slug;
    select.appendChild(option);
  });

  if (state.session?.currentTenant?.slug && !state.tenantSlug) {
    select.value = state.session.currentTenant.slug;
  }
}

async function loadTenantBase(tenantSlug) {
  state.bootstrap = await apiRequest(`/app/bootstrap?tenant=${encodeURIComponent(tenantSlug)}`);
  state.tenantSlug = tenantSlug;
  await setStorage({ [STORAGE_KEYS.tenantSlug]: tenantSlug });
  state.cart = [];
  state.selectedCustomer = null;
  renderOrderView();
}

function renderOrderView() {
  const bootstrap = state.bootstrap;
  $('tenantName').textContent = bootstrap.tenant?.businessName || bootstrap.tenant?.name || state.tenantSlug;
  renderCustomers();
  renderMenuItems();
  renderPaymentMethods();
  renderCart();
}

function renderCustomers() {
  const datalist = $('customerOptions');
  datalist.innerHTML = '';
  customers().slice(0, 120).forEach((customer) => {
    const option = document.createElement('option');
    option.value = `${customer.name || ''} - ${customer.phone || ''}`.trim();
    option.dataset.id = customer.id;
    datalist.appendChild(option);
  });
}

function renderMenuItems() {
  const select = $('menuItemSelect');
  select.innerHTML = '';
  menuItems().forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} - ${money(item.salePrice || item.basePrice)}`;
    select.appendChild(option);
  });
}

function renderPaymentMethods() {
  const select = $('paymentMethodId');
  select.innerHTML = '<option value="">Não informado</option>';
  paymentMethods().forEach((method) => {
    const option = document.createElement('option');
    option.value = method.id;
    option.textContent = method.name;
    select.appendChild(option);
  });
}

function renderCart() {
  const list = $('cartList');
  list.innerHTML = '';

  state.cart.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'cart-item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.notes || item.category || '')}</small>
        <span>${money(item.totalPrice)}</span>
      </div>
      <button type="button" data-remove-item="${escapeHtml(item.id)}">Remover</button>
    `;
    list.appendChild(row);
  });

  $('orderTotal').textContent = money(cartSubtotal() + Number($('deliveryFee').value || 0));
}

function customers() {
  return Array.isArray(state.bootstrap?.customers) ? state.bootstrap.customers : [];
}

function menuItems() {
  const items = Array.isArray(state.bootstrap?.menuItems) ? state.bootstrap.menuItems : [];
  return items.filter((item) => item.status === 'active' || item.status === 'seasonal');
}

function paymentMethods() {
  const methods = Array.isArray(state.bootstrap?.paymentMethods) ? state.bootstrap.paymentMethods : [];
  return methods.filter((method) => method.status === 'active');
}

function cartSubtotal() {
  return state.cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function classifySection(category = '', name = '') {
  return BEVERAGE_MATCHER.test(`${category} ${name}`) ? 'beverage' : 'food';
}

function selectCustomerFromSearch() {
  const search = $('customerSearch').value.toLowerCase().trim();
  if (!search) {
    state.selectedCustomer = null;
    return;
  }

  const customer = customers().find((item) => {
    const label = `${item.name || ''} - ${item.phone || ''}`.toLowerCase();
    return label === search || item.phone?.toLowerCase() === search || item.name?.toLowerCase() === search;
  });

  if (!customer) return;

  state.selectedCustomer = customer;
  $('customerName').value = customer.name || '';
  $('customerPhone').value = customer.phone || '';
  $('addressLine').value = customer.addressLine || '';
  $('addressNumber').value = customer.addressNumber || '';
  $('district').value = customer.district || '';
  $('city').value = customer.city || '';
  $('state').value = customer.state || 'SP';
  $('addressComplement').value = customer.addressComplement || '';
}

function buildCustomerPayload() {
  return {
    id: state.selectedCustomer?.id || undefined,
    name: $('customerName').value.trim(),
    phone: $('customerPhone').value.trim(),
    addressLine: $('addressLine').value.trim(),
    addressNumber: $('addressNumber').value.trim(),
    district: $('district').value.trim(),
    city: $('city').value.trim(),
    state: $('state').value.trim().toUpperCase() || 'SP',
    addressComplement: $('addressComplement').value.trim()
  };
}

async function saveCustomer(payload) {
  const method = payload.id ? 'PUT' : 'POST';
  return apiRequest(`/customers?tenant=${encodeURIComponent(state.tenantSlug)}`, {
    method,
    body: JSON.stringify(payload)
  });
}

async function saveOrder(customer) {
  const subtotal = cartSubtotal();
  const deliveryFee = Number($('deliveryFee').value || 0);
  return apiRequest(`/orders?tenant=${encodeURIComponent(state.tenantSlug)}`, {
    method: 'POST',
    body: JSON.stringify({
      customerId: customer.id,
      paymentMethodId: $('paymentMethodId').value || null,
      orderNumber: `EXT-${Date.now().toString().slice(-6)}`,
      channel: 'proprio',
      orderType: 'delivery',
      status: 'placed',
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      items: state.cart.map(({ id, ...item }) => item),
      notes: $('orderNotes').value.trim()
    })
  });
}

function resetOrderForm() {
  $('orderForm').reset();
  $('state').value = 'SP';
  $('deliveryFee').value = '0';
  state.cart = [];
  state.selectedCustomer = null;
  renderCart();
}

async function logout(clearMessage = true) {
  state.auth = null;
  state.session = null;
  state.bootstrap = null;
  state.tenantSlug = '';
  state.cart = [];
  await removeStorage([STORAGE_KEYS.auth, STORAGE_KEYS.tenantSlug]);
  if (clearMessage) showMessage('');
}

function bindEvents() {
  $('configForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    state.config = {
      apiBaseUrl: normalizeBaseUrl($('apiBaseUrl').value),
      supabaseUrl: normalizeBaseUrl($('supabaseUrl').value),
      supabaseAnonKey: $('supabaseAnonKey').value.trim()
    };
    await setStorage({ [STORAGE_KEYS.config]: state.config });
    showMessage('Configuração salva.', 'success');
    showView(state.auth ? 'tenant' : 'login');
  });

  $('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    setBusy(true);
    try {
      const auth = await supabaseTokenRequest('password', {
        email: $('email').value.trim(),
        password: $('password').value
      });
      await persistAuth(auth);
      await loadSession();
      renderTenantOptions();
      showView('tenant');
    } catch (error) {
      showMessage(error.message || 'E-mail ou senha inválidos.', 'error');
    } finally {
      setBusy(false);
    }
  });

  $('tenantForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');
    setBusy(true);
    try {
      await loadTenantBase($('tenantSelect').value);
      showView('order');
    } catch (error) {
      showMessage(error.message || 'Falha ao carregar a loja.', 'error');
    } finally {
      setBusy(false);
    }
  });

  $('addItemButton').addEventListener('click', () => {
    const menuItem = menuItems().find((item) => String(item.id) === String($('menuItemSelect').value));
    const quantity = Number($('quantity').value || 1);
    if (!menuItem || quantity <= 0) return;

    const unitPrice = Number(menuItem.salePrice || menuItem.basePrice || 0);
    state.cart.push({
      id: `${menuItem.id}-${Date.now()}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      category: menuItem.category || '',
      section: classifySection(menuItem.category, menuItem.name),
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      notes: $('itemNotes').value.trim()
    });
    $('quantity').value = '1';
    $('itemNotes').value = '';
    renderCart();
  });

  $('cartList').addEventListener('click', (event) => {
    const removeId = event.target?.dataset?.removeItem;
    if (!removeId) return;
    state.cart = state.cart.filter((item) => item.id !== removeId);
    renderCart();
  });

  $('deliveryFee').addEventListener('input', renderCart);
  $('customerSearch').addEventListener('change', selectCustomerFromSearch);
  $('customerSearch').addEventListener('blur', selectCustomerFromSearch);

  $('orderForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    if (state.cart.length === 0) {
      showMessage('Pedido sem item é só conversa. Adicione pelo menos um item.', 'error');
      return;
    }

    const customerPayload = buildCustomerPayload();
    if (!customerPayload.name || !customerPayload.phone) {
      showMessage('Nome e telefone do cliente são obrigatórios.', 'error');
      return;
    }

    setBusy(true);
    try {
      const customer = await saveCustomer(customerPayload);
      const order = await saveOrder(customer);
      showMessage(`Pedido ${order.orderNumber || ''} enviado.`, 'success');
      resetOrderForm();
      await loadTenantBase(state.tenantSlug);
    } catch (error) {
      showMessage(error.message || 'Falha ao enviar pedido.', 'error');
    } finally {
      setBusy(false);
    }
  });

  $('logoutButton').addEventListener('click', async () => {
    await logout();
    showView('login');
  });

  $('changeTenantButton').addEventListener('click', () => {
    renderTenantOptions();
    showView('tenant');
  });

  $('editConfigFromLogin').addEventListener('click', () => showView('config'));
  $('editConfigFromTenant').addEventListener('click', () => showView('config'));
}

bindEvents();
bootstrapApp();
