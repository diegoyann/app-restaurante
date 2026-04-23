import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import App from '../App.jsx';
import { authApi } from '../services/api.js';
import { supabase } from '../lib/supabase.js';

class TenantDashboardBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        window.__tenantDashboardError = {
            message: error?.message || 'Erro desconhecido ao renderizar dashboard.',
            stack: error?.stack || '',
            componentStack: info?.componentStack || ''
        };
        console.error('Tenant dashboard render failure', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
                    <div className="bg-[#fdfffd] w-full max-w-[720px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-left space-y-4 italic">
                        <p className="text-sm font-black text-red-700 uppercase tracking-widest">Falha ao montar o dashboard</p>
                        <p className="text-xs font-bold text-[#696965]">{this.state.error.message}</p>
                        <pre className="bg-[#f8f5ef] text-[#5c1f20] text-[11px] p-4 rounded-2xl overflow-auto whitespace-pre-wrap">{window.__tenantDashboardError?.componentStack || 'Sem stack de componente.'}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function TenantApp() {
    const { tenant } = useParams();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadSession() {
            try {
                const { data } = await supabase.auth.getSession();

                if (!data.session) {
                    if (!cancelled) {
                        setSession(null);
                    }
                    return;
                }

                const payload = await authApi.getSession();

                if (!cancelled) {
                    setSession(payload);
                }
            } catch (_error) {
                if (!cancelled) {
                    setSession(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSession();

        return () => {
            cancelled = true;
        };
    }, []);

    const fallbackTenantSlug = session?.currentTenant?.slug || session?.memberships?.find((membership) => membership.tenant)?.tenant?.slug || '';
    const tenantSlug = tenant || fallbackTenantSlug;

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef] text-[#5c1f20] font-black uppercase tracking-[0.18em]">Carregando sessão...</div>;
    }

    if (!tenantSlug) {
        return <Navigate to="/login" replace />;
    }

    if (!session?.user || (session.user.role !== 'super_admin' && tenant && !session.memberships?.some((membership) => membership.tenant?.slug === tenant))) {
        return <Navigate to="/login" replace />;
    }

    return (
        <TenantDashboardBoundary>
            <App tenantSlug={tenantSlug} />
        </TenantDashboardBoundary>
    );
}
