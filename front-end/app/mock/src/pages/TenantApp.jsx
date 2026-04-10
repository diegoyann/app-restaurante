import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import App from '../App.jsx';

/**
 * Wrapper multi-tenant: extrai o slug do tenant da URL ou do sessionStorage.
 * Ao fazer login pela rota /app (sem slug), o slug fica salvo na sessão.
 */
export default function TenantApp() {
    const { tenant } = useParams();
    const tenantSlug = tenant || sessionStorage.getItem('tenantSlug') || '';

    if (!tenantSlug) {
        return <Navigate to="/login" replace />;
    }

    return <App tenantSlug={tenantSlug} />;
}
