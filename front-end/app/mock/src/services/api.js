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

    throw new Error(errorMessage);
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

export const adminApi = {
  getBootstrap(tenantSlug) {
    const path = tenantSlug
      ? `/admin/bootstrap?tenant=${encodeURIComponent(tenantSlug)}`
      : '/admin/bootstrap';

    return apiRequest(path);
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
  }
};
