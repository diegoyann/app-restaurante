import React from 'react';
import App from '../App.jsx';

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
                    <div className="bg-[#FFFFFF] w-full max-w-[720px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-left space-y-4 italic">
                        <p className="text-sm font-black text-red-700 uppercase tracking-widest">Falha ao montar o dashboard</p>
                        <p className="text-xs font-bold text-[#696965]">{this.state.error.message}</p>
                        <pre className="bg-[#FAF6EF] text-[#2A1E15] text-[11px] p-4 rounded-2xl overflow-auto whitespace-pre-wrap">{window.__tenantDashboardError?.componentStack || 'Sem stack de componente.'}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function TenantApp({ tenantSlug }) {
    return (
        <TenantDashboardBoundary>
            <App tenantSlug={tenantSlug} />
        </TenantDashboardBoundary>
    );
}
