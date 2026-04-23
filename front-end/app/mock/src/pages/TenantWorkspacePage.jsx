import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ChefHat,
  DollarSign,
  Loader2,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  Settings,
  Star,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appApi } from '../services/api.js';
import { supabase } from '../lib/supabase.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return 'Sem data';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data inválida';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function StatCard({ title, value, icon: Icon, colorClass, bgColorClass, iconColorClass }) {
  return (
    <div className="bg-white p-4 xl:p-5 2xl:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full min-h-[110px] xl:min-h-[132px]">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] xl:text-xs 2xl:text-sm font-black text-[#696965] uppercase tracking-tighter truncate mb-1">{title}</p>
        <p className={`text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-black ${colorClass} truncate leading-none`}>{value}</p>
      </div>
      <div className={`p-2.5 xl:p-3 2xl:p-4 rounded-xl shrink-0 ml-2 ${bgColorClass}`}>
        <Icon size={20} className={iconColorClass} />
      </div>
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white p-5 sm:p-7 xl:p-8 rounded-[1.5rem] border border-gray-100 shadow-sm">
      <div className="mb-6">
        <h3 className="text-[11px] sm:text-xs xl:text-sm font-black text-[#5c1f20] uppercase italic font-sans tracking-tight">{title}</h3>
        {description ? <p className="mt-2 text-sm font-bold text-[#696965]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function TenantWorkspacePage({ tenantSlug }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState(() => ({ operacional: true, financeiro: false, pessoas: false, sistema: false }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const response = await appApi.getBootstrap(tenantSlug);
        if (!cancelled) {
          setPayload(response);
        }
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError.message || 'Falha ao carregar o painel do tenant.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tenantSlug]);

  const settings = payload?.settings || {};
  const employees = payload?.employees || [];
  const transactions = payload?.transactions || [];
  const recurringCosts = payload?.recurringCosts || [];
  const products = payload?.products || [];
  const menuItems = payload?.menuItems || [];

  const summary = useMemo(() => {
    const receitaBruta = transactions
      .filter((item) => item.type === 'receita')
      .reduce((acc, item) => acc + Number(item.amount || 0), 0);

    const receitaLiquida = transactions
      .filter((item) => item.type === 'receita')
      .reduce((acc, item) => acc + Number(item.net ?? item.amount ?? 0), 0);

    const despesas = transactions
      .filter((item) => item.type === 'despesa')
      .reduce((acc, item) => acc + Math.abs(Number(item.amount || 0)), 0);

    const totalOrders = transactions.filter((item) => item.type === 'receita').length;
    const ticketMedio = totalOrders > 0 ? receitaBruta / totalOrders : 0;
    const custosFixos = recurringCosts.reduce((acc, item) => acc + Number(item.amount || 0), 0);

    return {
      businessName: settings.businessName || 'Rei das Esfihas',
      receitaBruta,
      receitaLiquida,
      despesas,
      totalOrders,
      ticketMedio,
      custosFixos,
      productsCount: products.length,
      menuItemsCount: menuItems.length,
      employeesCount: employees.length
    };
  }, [employees.length, menuItems.length, products.length, recurringCosts, settings.businessName, transactions]);

  const latestTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8),
    [transactions]
  );

  const menuGroups = [
    {
      key: 'operacional',
      label: 'Operacional',
      icon: Briefcase,
      items: [
        { id: 'menu', label: 'Cardápio Operacional', icon: ChefHat },
        { id: 'reviews', label: 'Gestão de Avaliações', icon: Star },
        { id: 'cmv', label: 'CMV / Ficha Técnica', icon: Wallet }
      ]
    },
    {
      key: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      items: [
        { id: 'financeiro', label: 'Lançamentos', icon: TrendingUp },
        { id: 'closing', label: 'Fechamento', icon: PieChart }
      ]
    },
    {
      key: 'pessoas',
      label: 'Pessoas',
      icon: Users,
      items: [
        { id: 'rh', label: 'RH / Pessoal', icon: Users }
      ]
    },
    {
      key: 'sistema',
      label: 'Sistema',
      icon: Settings,
      items: [
        { id: 'settings', label: 'Configurações', icon: Settings }
      ]
    }
  ];

  const tabLabels = {
    dashboard: 'Dashboard',
    menu: 'Cardápio Operacional',
    reviews: 'Gestão de Avaliações',
    cmv: 'CMV / Ficha Técnica',
    financeiro: 'Lançamentos',
    closing: 'Fechamento',
    rh: 'RH / Pessoal',
    settings: 'Configurações'
  };

  const activeTabLabel = tabLabels[activeTab] || 'Dashboard';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#fdfffd] w-full max-w-[440px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <Loader2 size={28} className="mx-auto animate-spin text-[#5c1f20]" />
          <p className="text-sm font-black text-[#5c1f20] uppercase tracking-widest">Carregando dados do tenant</p>
          <p className="text-xs font-bold text-[#696965]">Sem mock. Backend real, interface preservada.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 md:p-6 font-sans">
        <div className="bg-[#fdfffd] w-full max-w-[520px] rounded-[2rem] p-8 shadow-2xl border border-gray-100 text-center space-y-4 italic">
          <p className="text-sm font-black text-red-700 uppercase tracking-widest">Falha ao carregar o backend</p>
          <p className="text-xs font-bold text-[#696965]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-[#5c1f20] text-[#fdfffd] py-3 rounded-2xl font-black uppercase text-xs hover:bg-[#c5a04a] transition-all shadow-xl"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#fdfffd] text-gray-900 font-sans italic relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-[#4b1718] via-[#5c1f20] to-[#341011] border-r border-[#7a3738] flex flex-col h-screen transition-transform duration-300 shadow-[10px_0_30px_rgba(52,16,17,0.35)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 xl:p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-white/8 ring-1 ring-[#c5a04a]/35 shadow-sm">
              <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-xl bg-[#c5a04a] flex items-center justify-center text-[#4b1718] font-black not-italic">R</div>
            </div>
            <span className="font-black text-lg xl:text-xl 2xl:text-2xl tracking-tighter text-white uppercase not-italic">REI DAS<span className="text-[#c5a04a] italic ml-1">ESFIHAS</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-white/60"><Menu size={20} /></button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === 'dashboard'
              ? 'bg-white/12 text-[#f6d98b] ring-1 ring-[#c5a04a]/35 shadow-lg shadow-black/20 font-black'
              : 'text-white hover:bg-white/8 hover:text-[#f6d98b] font-bold'
              }`}
          >
            <BarChart3 size={16} className="shrink-0" />
            <span className="text-xs tracking-tight uppercase">Dashboard</span>
          </button>

          {menuGroups.map((group) => {
            const isOpen = openGroups[group.key];
            const hasActive = group.items.some((item) => item.id === activeTab);
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                <button
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mt-1 ${hasActive && !isOpen
                    ? 'text-[#f6d98b] font-black bg-white/10 border border-[#c5a04a]/35 shadow-md'
                    : 'text-[#f0d9da] hover:bg-white/8 hover:text-[#f6d98b] font-bold border border-transparent'
                    }`}
                >
                  <GroupIcon size={15} className={`shrink-0 ${hasActive && !isOpen ? 'text-[#f6d98b]' : 'text-[#c5a04a]'}`} />
                  <span className="text-[11px] tracking-[0.18em] uppercase flex-1 text-left">{group.label}</span>
                  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-3 pl-3 border-l-2 border-[#c5a04a]/30 space-y-1 py-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${activeTab === item.id
                            ? 'bg-[#c5a04a] text-[#4b1718] font-black shadow-md shadow-black/20'
                            : 'text-[#f4e9ea] hover:bg-white/10 hover:text-[#f6d98b] font-semibold'
                            }`}
                        >
                          <ItemIcon size={14} className={`shrink-0 ${activeTab === item.id ? 'text-[#4b1718]' : 'text-[#c5a04a]'}`} />
                          <span className="text-[11px] tracking-[0.08em] uppercase">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#7a3738] bg-black/10 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="text-[9px] font-black text-white uppercase tracking-widest hover:text-[#f6d98b] flex items-center justify-center gap-2 w-full transition-colors"
          >
            <LogOut size={12} /> Sair do Reino
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-16 sm:h-20 xl:h-24 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 xl:px-10 2xl:px-12 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#5c1f20] bg-gray-50 rounded-xl"><Menu size={20} /></button>
            <h2 className="text-base sm:text-xl xl:text-2xl 2xl:text-3xl font-black text-[#5c1f20] uppercase italic tracking-tighter truncate">{activeTabLabel}</h2>
          </div>
          <div className="bg-[#fdfffd] border border-[#c5a04a]/20 px-2 py-1 xl:px-3 xl:py-1.5 rounded-lg text-[9px] sm:text-[10px] xl:text-xs font-black text-[#c5a04a] uppercase tracking-widest italic">Painel Administrativo</div>
        </header>

        <div className="p-4 sm:p-8 xl:p-10 2xl:p-12 max-w-[1800px] 2xl:max-w-[2000px] mx-auto space-y-6 sm:space-y-8 xl:space-y-10 font-sans w-full">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 bg-[#5c1f20] text-[#fdfffd] p-3 rounded-2xl border border-white/20 shadow-md">
              <div className="flex items-center gap-3 overflow-hidden text-left flex-1">
                <Bell size={14} className="text-[#c5a04a] shrink-0" />
                <p className="text-[9px] sm:text-xs font-bold uppercase tracking-tight truncate">
                  Backend conectado: dados reais carregados do tenant <span className="text-[#c5a04a] font-black">{tenantSlug}</span>
                </p>
              </div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="dashboard-page space-y-6 xl:space-y-8">
              <div className="dashboard-stats-grid grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 xl:gap-6">
                <StatCard title="Receita Bruta" value={formatCurrency(summary.receitaBruta)} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                <StatCard title="Pedidos" value={summary.totalOrders} icon={Receipt} colorClass="text-[#696965]" bgColorClass="bg-gray-100" iconColorClass="text-[#696965]" />
                <StatCard title="Ticket Médio" value={formatCurrency(summary.ticketMedio)} icon={Wallet} colorClass="text-amber-700" bgColorClass="bg-amber-50" iconColorClass="text-amber-700" />
                <StatCard title="CMV Catálogo" value="0.0%" icon={BarChart3} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                <StatCard title="Markup Médio" value="0.0%" icon={DollarSign} colorClass="text-purple-700" bgColorClass="bg-purple-50" iconColorClass="text-purple-700" />
                <StatCard title="Custos Fixos" value={formatCurrency(summary.custosFixos)} icon={CalendarDays} colorClass="text-[#5c1f20]" bgColorClass="bg-[#5c1f20]/10" iconColorClass="text-[#5c1f20]" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 xl:gap-8">
                <SectionCard title="Receita por Canal" description="Leitura rápida do tenant usando dados reais do backend.">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fcfbf7] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Receita líquida</span>
                      <span className="text-sm font-black text-[#5c1f20]">{formatCurrency(summary.receitaLiquida)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fcfbf7] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Despesas lançadas</span>
                      <span className="text-sm font-black text-[#5c1f20]">{formatCurrency(summary.despesas)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fcfbf7] px-4 py-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Equipe ativa</span>
                      <span className="text-sm font-black text-[#5c1f20]">{summary.employeesCount}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Resumo Operacional" description="Mesma hierarquia visual do painel anterior, agora com backend real.">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fcfbf7] px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Produtos</p>
                        <p className="text-sm font-black text-[#5c1f20]">{summary.productsCount}</p>
                      </div>
                      <Package size={18} className="text-[#c5a04a]" />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fcfbf7] px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#696965]">Itens de cardápio</p>
                        <p className="text-sm font-black text-[#5c1f20]">{summary.menuItemsCount}</p>
                      </div>
                      <ChefHat size={18} className="text-[#c5a04a]" />
                    </div>
                    <div className="rounded-2xl border border-dashed border-[#c5a04a]/40 bg-[#fffaf0] px-4 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#5c1f20]">Sem mock</p>
                      <p className="mt-2 text-sm font-bold text-[#696965]">
                        A interface foi mantida e o tenant já está lendo o backend real. O que falta agora é ir religando os módulos completos sem reacender o travamento do front monolítico.
                      </p>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {activeTab === 'financeiro' && (
            <SectionCard title="Lançamentos" description="Transações reais do tenant.">
              <div className="space-y-3">
                {latestTransactions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#5c1f20]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                    Nenhuma transação cadastrada.
                  </div>
                ) : latestTransactions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8f5ef] px-4 py-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{item.note || item.category || item.platform || 'Movimentação'}</p>
                      <p className="mt-1 text-xs font-semibold text-[#7a6666]">{formatDate(item.date)} • {item.type || 'sem tipo'}</p>
                    </div>
                    <p className={`text-sm font-black ${item.type === 'despesa' ? 'text-red-700' : 'text-emerald-700'}`}>
                      {formatCurrency(item.net ?? item.amount ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'rh' && (
            <SectionCard title="RH / Pessoal" description="Lista real do backend.">
              <div className="space-y-3">
                {employees.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#5c1f20]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                    Nenhum colaborador cadastrado.
                  </div>
                ) : employees.map((employee) => (
                  <div key={employee.id} className="rounded-2xl bg-[#f8f5ef] px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-[#5c1f20]">{employee.name}</p>
                        <p className="mt-1 text-xs font-semibold text-[#7a6666]">{employee.role || 'Sem cargo'} • {employee.employmentType || 'Sem tipo'}</p>
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c5a04a]">{employee.status || 'ativo'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {(activeTab === 'menu' || activeTab === 'reviews' || activeTab === 'cmv' || activeTab === 'closing' || activeTab === 'settings') && (
            <SectionCard title={activeTabLabel} description="Interface preservada. Integração completa desse módulo entra na sequência sem mudar o desenho.">
              <div className="rounded-2xl border border-dashed border-[#5c1f20]/15 px-4 py-8 text-sm font-semibold text-[#7a6666]">
                Navegação e casca visual iguais ao painel original. Esse módulo ainda será religado ao backend real sem mock e sem reintroduzir o travamento antigo.
              </div>
            </SectionCard>
          )}
        </div>
      </main>
    </div>
  );
}
