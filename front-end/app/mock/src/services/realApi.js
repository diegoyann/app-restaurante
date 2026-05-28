import { supabase } from '../lib/supabase.js';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage = typeof payload === 'object' && payload?.error
      ? payload.error
      : 'Falha na comunicação com a API.';

    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  return parseResponse(response);
}

export async function publicApiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  return parseResponse(response);
}

export function withTenant(path, tenantSlug) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}tenant=${encodeURIComponent(tenantSlug)}`;
}

export const authApi = {
  getSession(options) {
    return apiRequest('/auth/session', options);
  }
};

export const appApi = {
  getBootstrap(tenantSlug) {
    return apiRequest(withTenant('/app/bootstrap', tenantSlug));
  }
};

export const settingsApi = {
  updateGeneral(tenantSlug, payload) {
    return apiRequest(withTenant('/settings/general', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateAiBehavior(tenantSlug, payload) {
    return apiRequest(withTenant('/settings/ai-behavior', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }
};

export const financeApi = {
  createTransaction(tenantSlug, payload) {
    return apiRequest(withTenant('/finance/transactions', tenantSlug), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateTransaction(tenantSlug, payload) {
    return apiRequest(withTenant('/finance/transactions', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteTransaction(tenantSlug, id) {
    return apiRequest(withTenant('/finance/transactions', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  createRecurringCost(tenantSlug, payload) {
    return apiRequest(withTenant('/finance/recurring-costs', tenantSlug), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateRecurringCost(tenantSlug, payload) {
    return apiRequest(withTenant('/finance/recurring-costs', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  updateRecurringCostAmount(tenantSlug, id, amount) {
    return apiRequest(withTenant('/finance/recurring-costs', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify({
        id,
        amount
      })
    });
  },
  toggleRecurringCostPayment(tenantSlug, id, lastPaidMonth) {
    return apiRequest(withTenant('/finance/recurring-costs', tenantSlug), {
      method: 'PUT',
      body: JSON.stringify({
        id,
        action: 'toggle-payment',
        lastPaidMonth
      })
    });
  },
  deleteRecurringCost(tenantSlug, id) {
    return apiRequest(withTenant('/finance/recurring-costs', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  closePeriod(tenantSlug, payload) {
    return apiRequest(withTenant('/finance/closings', tenantSlug), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

export const customersApi = {
  saveCustomer(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/customers', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteCustomer(tenantSlug, id) {
    return apiRequest(withTenant('/customers', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const paymentMethodsApi = {
  savePaymentMethod(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/finance/payment-methods', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deletePaymentMethod(tenantSlug, id) {
    return apiRequest(withTenant('/finance/payment-methods', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const ordersApi = {
  listOrders(tenantSlug) {
    return apiRequest(withTenant('/orders', tenantSlug));
  },
  saveOrder(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/orders', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteOrder(tenantSlug, id) {
    return apiRequest(withTenant('/orders', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const deliveryApi = {
  saveDriver(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/delivery/drivers', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteDriver(tenantSlug, id) {
    return apiRequest(withTenant('/delivery/drivers', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const integrationsApi = {
  importIfoodOrders(tenantSlug, orders) {
    return apiRequest(withTenant('/integrations/ifood/orders', tenantSlug), {
      method: 'POST',
      body: JSON.stringify({ orders })
    });
  }
};

export const publicMenuApi = {
  getMenu(tenantSlug) {
    return publicApiRequest(withTenant('/public/menu', tenantSlug));
  },
  getCustomerByPhone(tenantSlug, phone) {
    const path = withTenant(`/public/customers?phone=${encodeURIComponent(phone)}`, tenantSlug);
    return publicApiRequest(path);
  },
  createOrder(tenantSlug, payload) {
    return publicApiRequest(withTenant('/public/orders', tenantSlug), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

export const hrApi = {
  saveEmployee(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/hr/employees', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteEmployee(tenantSlug, id) {
    return apiRequest(withTenant('/hr/employees', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const menuApi = {
  saveCategory(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/menu/categories', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteCategory(tenantSlug, id) {
    return apiRequest(withTenant('/menu/categories', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  reorderCategories(tenantSlug, items) {
    return apiRequest(withTenant('/menu/categories', tenantSlug), {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  },
  saveItem(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/menu/items', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteItem(tenantSlug, id) {
    return apiRequest(withTenant('/menu/items', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  reorderItems(tenantSlug, items) {
    return apiRequest(withTenant('/menu/items', tenantSlug), {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  }
};

export const catalogApi = {
  saveUnit(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/catalog/units', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteUnit(tenantSlug, id) {
    return apiRequest(withTenant('/catalog/units', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  saveIngredient(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/catalog/ingredients', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteIngredient(tenantSlug, id) {
    return apiRequest(withTenant('/catalog/ingredients', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  savePreparation(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/catalog/preparations', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deletePreparation(tenantSlug, id) {
    return apiRequest(withTenant('/catalog/preparations', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  saveProduct(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/catalog/products', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteProduct(tenantSlug, id) {
    return apiRequest(withTenant('/catalog/products', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const adminApi = {
  getBootstrap(tenantSlug) {
    const path = tenantSlug
      ? `/admin/bootstrap?tenant=${encodeURIComponent(tenantSlug)}`
      : '/admin/bootstrap';

    return apiRequest(path);
  },
  createCompany(payload) {
    return apiRequest('/admin/companies', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateCompany(companyId, payload) {
    return apiRequest(`/admin/companies?company=${encodeURIComponent(companyId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteCompany(companyId) {
    return apiRequest(`/admin/companies?company=${encodeURIComponent(companyId)}`, {
      method: 'DELETE'
    });
  },
  createTenant(payload) {
    return apiRequest('/admin/tenants', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  updateTenant(tenantSlug, payload) {
    return apiRequest(`/admin/tenants?tenant=${encodeURIComponent(tenantSlug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  deleteTenant(tenantSlug) {
    return apiRequest(`/admin/tenants?tenant=${encodeURIComponent(tenantSlug)}`, {
      method: 'DELETE'
    });
  },
  saveTenantUser(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/admin/users', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteTenantUser(tenantSlug, id) {
    return apiRequest(withTenant('/admin/users', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },
  saveRoleProfile(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/admin/role-profiles', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteRoleProfile(tenantSlug, id) {
    return apiRequest(withTenant('/admin/role-profiles', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};

export const roleProfilesApi = {
  saveRoleProfile(tenantSlug, payload) {
    const method = payload.id ? 'PUT' : 'POST';

    return apiRequest(withTenant('/tenant/role-profiles', tenantSlug), {
      method,
      body: JSON.stringify(payload)
    });
  },
  deleteRoleProfile(tenantSlug, id) {
    return apiRequest(withTenant('/tenant/role-profiles', tenantSlug), {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};
