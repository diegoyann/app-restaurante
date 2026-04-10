import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard,
    Receipt,
    TrendingUp,
    DollarSign,
    Plus,
    Trash2,
    PieChart,
    LogOut,
    User,
    Lock,
    AlertCircle,
    BarChart3,
    Crown,
    ShoppingBag,
    Users,
    Briefcase,
    Settings,
    CreditCard,
    Wallet,
    Save,
    CheckCircle,
    Bell,
    X,
    Calendar,
    Edit,
    List,
    Circle,
    Check,
    Menu
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

// --- CONFIGURAÇÃO ---
const LOGO_URL = "https://media.discordapp.net/attachments/1116226671356432525/1491817940389990491/Logo_Sem_Fundo_Sem_nome.png?ex=69d91339&is=69d7c1b9&hm=880b1a54c2502532f72efd5b8648ae5152be22c38d01e69cc70b1b290c76f7de&=&format=webp&quality=lossless&width=1008&height=1008";

// --- COMPONENTES UI ---
const Logo = ({ className = "w-10 h-10" }) => {
    const [error, setError] = useState(false);
    if (error) return <div className={`${className} bg-[#5c1f20] rounded-xl flex items-center justify-center shadow-lg`}><Crown className="text-[#c5a04a]" size={20} /></div>;
    return <img src={LOGO_URL} alt="Logo" className={`${className} object-contain rounded-xl drop-shadow-md`} onError={() => setError(true)} />;
};

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass, iconColorClass }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all h-full">
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-[#696965] uppercase tracking-tighter truncate mb-1">{title}</p>
            <p className={`text-xl sm:text-2xl font-black ${colorClass} truncate leading-none`}>{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ml-2 ${bgColorClass}`}>
            <Icon size={18} className={iconColorClass} />
        </div>
    </div>
);

const CustomInput = ({ label, icon: Icon, ...props }) => (
    <div className="space-y-1 w-full">
        <label className="text-[10px] font-black text-[#696965] uppercase ml-1 tracking-wider">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696965]" size={16} />}
            <input {...props} className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-[#fdfffd] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#c5a04a] outline-none transition-all text-sm font-medium`} />
        </div>
    </div>
);

// --- MODAL DE CATEGORIAS (EDIÇÃO EM LINHA) ---
const CategoryModal = ({ isOpen, onClose, categories, setCategories }) => {
    const [newCatName, setNewCatName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    if (!isOpen) return null;

    const handleAddNew = () => {
        if (!newCatName.trim()) return;
        setCategories(prev => [...prev, { id: Date.now(), name: newCatName.trim() }]);
        setNewCatName('');
    };

    const handleSaveEdit = (id) => {
        if (!editingValue.trim()) return;
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editingValue.trim() } : c));
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-6 font-sans italic">
                    <h3 className="text-xl font-black text-[#5c1f20] uppercase tracking-tighter flex items-center gap-2">
                        <List size={20} /> Categorias
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nova categoria..."
                        className="flex-1 p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-[#c5a04a] text-sm font-bold"
                    />
                    <button onClick={handleAddNew} className="bg-[#5c1f20] text-white px-4 rounded-xl hover:bg-[#c5a04a] transition-all flex items-center justify-center">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group border border-transparent hover:border-[#c5a04a]/30">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="flex-1 p-1 bg-white border border-[#c5a04a] rounded-md outline-none text-xs font-bold uppercase"
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(cat.id)} className="p-1 text-green-600"><Check size={16} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-400"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-bold text-[#696965] uppercase text-xs truncate mr-2">{cat.name}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => { setEditingId(cat.id); setEditingValue(cat.name); }} className="text-blue-600 hover:scale-110 transition-transform"><Edit size={14} /></button>
                                        <button onClick={() => setCategories(prev => prev.filter(c => c.id !== cat.id))} className="text-red-600 hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- APLICAÇÃO PRINCIPAL ---
export default function App() {
    const [session, setSession] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [dismissedAlerts, setDismissedAlerts] = useState([]);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);

    const currentMonthYear = new Date().toISOString().slice(0, 7);

    // Configurações
    const [settings, setSettings] = useState({
        ifoodTax: 23,
        anotaaiTax: 5,
        appPassword: 'admin',
        passwordReminder: 'A senha padrão é "admin".',
        businessName: 'Rei das Esfihas',
        alertDaysBefore: 3
    });

    // Categorias
    const [costCategories, setCostCategories] = useState([
        { id: 1, name: "Aluguel" }, { id: 2, name: "Energia Elétrica" },
        { id: 3, name: "Água" }, { id: 4, name: "Internet" }, { id: 5, name: "Contador" }
    ]);

    // RH
    const [employees, setEmployees] = useState([
        { id: 1, name: 'João da Massa', role: 'Esfiharia', salary: 2200 },
        { id: 2, name: 'Maria do Balcão', role: 'Atendimento', salary: 1800 }
    ]);

    // Custos Fixos
    const [recurringCosts, setRecurringCosts] = useState([
        { id: 1, desc: 'Aluguel', amount: 3000, dueDay: 10, lastPaidMonth: "" },
        { id: 2, desc: 'Energia Elétrica', amount: 850, dueDay: 15, lastPaidMonth: "" }
    ]);

    // Vendas
    const [transactions, setTransactions] = useState([
        { id: 1, date: '2024-04-09', platform: 'ifood', payment: 'online', amount: 1200.00, tax: 23, net: 924.00, type: 'receita' },
        { id: 2, date: '2024-04-09', platform: 'anotaai', payment: 'pix', amount: 650.00, tax: 5, net: 617.50, type: 'receita' },
    ]);

    // Lógica de Alertas
    const activeAlerts = useMemo(() => {
        const today = new Date();
        const currentDay = today.getDate();
        return recurringCosts.filter(cost => {
            if (cost.lastPaidMonth === currentMonthYear) return false;
            const daysUntil = cost.dueDay - currentDay;
            const isDueSoon = daysUntil >= 0 && daysUntil <= settings.alertDaysBefore;
            const isExactlyToday = daysUntil === 0;
            const alreadyDismissed = dismissedAlerts.includes(`${cost.id}-${today.getMonth()}`);
            return isExactlyToday || (isDueSoon && !alreadyDismissed);
        });
    }, [recurringCosts, settings.alertDaysBefore, dismissedAlerts, currentMonthYear]);

    // Analytics
    const stats = useMemo(() => {
        const bruto = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.amount || 0), 0);
        const liquido = transactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (t.net || 0), 0);
        const folhaSalarial = employees.reduce((acc, emp) => acc + emp.salary, 0);
        const outrosCustosFixos = recurringCosts.reduce((acc, cost) => acc + cost.amount, 0);
        const custosFixosTotal = folhaSalarial + outrosCustosFixos;

        const ifoodMoney = transactions.filter(t => t.platform === 'ifood').reduce((a, b) => a + b.amount, 0);
        const anotaMoney = transactions.filter(t => t.platform === 'anotaai').reduce((a, b) => a + b.amount, 0);

        return {
            bruto, liquido, custosFixosTotal, folhaSalarial,
            cmvFake: bruto > 0 ? ((bruto - liquido) / bruto) * 100 : 0,
            totalOrders: transactions.length,
            financialData: [
                { name: 'iFood', value: ifoodMoney, color: '#5c1f20' },
                { name: 'Anota AI', value: anotaMoney, color: '#c5a04a' },
                { name: 'Total', value: bruto, color: '#696965' }
            ],
            orderCountData: [
                { name: 'iFood', value: transactions.filter(t => t.platform === 'ifood').length, color: '#5c1f20' },
                { name: 'Anota AI', value: transactions.filter(t => t.platform === 'anotaai').length, color: '#c5a04a' },
                { name: 'Total', value: transactions.length, color: '#696965' }
            ]
        };
    }, [transactions, employees, recurringCosts]);

    // Handlers
    const handleAddTransaction = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const amount = parseFloat(fd.get('amount')) || 0;
        if (amount <= 0) return;
        const platform = fd.get('platform');
        const tax = platform === 'ifood' ? settings.ifoodTax : settings.anotaaiTax;
        setTransactions(prev => [{
            id: Date.now(),
            date: fd.get('date'),
            platform,
            payment: fd.get('payment'),
            amount,
            tax,
            net: amount * (1 - (tax / 100)),
            type: 'receita'
        }, ...prev]);
        e.target.reset();
    };

    const handleAddEmployee = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setEmployees(prev => [...prev, {
            id: Date.now(),
            name: fd.get('name'),
            role: fd.get('role'),
            salary: parseFloat(fd.get('salary')) || 0
        }]);
        e.target.reset();
    };

    const handleAddRecurringCost = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setRecurringCosts(prev => [...prev, {
            id: Date.now(),
            desc: fd.get('desc'),
            amount: parseFloat(fd.get('amount')) || 0,
            dueDay: parseInt(fd.get('dueDay')) || 1,
            lastPaidMonth: ""
        }]);
        e.target.reset();
    };

    const handleUpdateCost = (id, newAmount) => {
        setRecurringCosts(prev => prev.map(c => c.id === id ? { ...c, amount: parseFloat(newAmount) || 0 } : c));
    };

    const togglePaymentStatus = (id) => {
        setRecurringCosts(prev => prev.map(c => c.id === id ? { ...c, lastPaidMonth: c.lastPaidMonth === currentMonthYear ? "" : currentMonthYear } : c));
    };

    const handleUpdateSettings = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        setSettings(prev => ({
            ...prev,
            ifoodTax: parseFloat(fd.get('ifoodTax')) || 0,
            anotaaiTax: parseFloat(fd.get('anotaaiTax')) || 0,
            appPassword: fd.get('appPassword') || prev.appPassword,
            passwordReminder: fd.get('passwordReminder') || prev.passwordReminder,
            businessName: fd.get('businessName') || prev.businessName,
            alertDaysBefore: parseInt(fd.get('alertDaysBefore')) || 0
        }));
        setActiveTab('dashboard');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (e.target.password.value === settings.appPassword) setSession(true);
        else setLoginError(`Acesso Negado. Dica: ${settings.passwordReminder}`);
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
                <div className="bg-[#fdfffd] w-full max-w-[400px] rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-gray-100 italic">
                    <div className="flex flex-col items-center mb-8 text-center font-black">
                        <Logo className="w-20 h-20 mb-4" />
                        <h1 className="text-2xl font-black text-[#5c1f20] tracking-tight uppercase tracking-tighter">{settings.businessName}</h1>
                        <p className="text-[#696965] text-[10px] font-bold uppercase tracking-widest mt-1">Gestão Real</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <CustomInput label="Acesso Real" defaultValue="rei@reidasesfihas.com" readOnly icon={User} />
                        <div className="space-y-2">
                            <CustomInput label="Chave do Portão" name="password" type="password" placeholder="••••••••" icon={Lock} required />
                            {loginError && <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100">{loginError}</p>}
                        </div>
                        <button className="w-full bg-[#5c1f20] text-[#fdfffd] py-4 rounded-2xl font-black uppercase text-xs hover:bg-[#c5a04a] transition-all shadow-xl">Assumir o Trono</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#fdfffd] text-gray-900 font-sans italic relative">
            <CategoryModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={costCategories} setCategories={setCostCategories} />

            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

            <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col h-screen transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Logo className="w-8 h-8" />
                        <span className="font-black text-lg tracking-tighter text-[#5c1f20] uppercase not-italic">REI DAS<span className="text-[#c5a04a] italic ml-1">ESFIHAS</span></span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400"><X size={20} /></button>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'dashboard', label: 'Painel Real', icon: LayoutDashboard },
                        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
                        { id: 'rh', label: 'RH / Pessoal', icon: Users },
                        { id: 'costs', label: 'Custos Fixos', icon: Receipt },
                        { id: 'closing', label: 'Fechamento', icon: PieChart },
                        { id: 'settings', label: 'Configurações', icon: Settings },
                    ].map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === item.id ? 'bg-[#5c1f20] text-[#c5a04a] shadow-lg shadow-[#5c1f20]/20 font-black' : 'text-[#696965] hover:bg-[#c5a04a]/10 hover:text-[#5c1f20] font-bold'}`}>
                            <item.icon size={16} /> <span className="text-xs tracking-tight uppercase">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-gray-50">
                    <button onClick={() => setSession(null)} className="text-[9px] font-black text-[#5c1f20] uppercase tracking-widest hover:text-red-600 flex items-center justify-center gap-2 w-full transition-colors"><LogOut size={12} /> Sair</button>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-[#5c1f20] bg-gray-50 rounded-xl"><Menu size={20} /></button>
                        <h2 className="text-md sm:text-xl font-black text-[#5c1f20] uppercase italic tracking-tighter truncate">{activeTab}</h2>
                    </div>
                    <div className="bg-[#fdfffd] border border-[#c5a04a]/20 px-2 py-1 rounded-lg text-[8px] sm:text-[10px] font-black text-[#c5a04a] uppercase tracking-widest italic">GESTÃO REAL</div>
                </header>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-sans">
                    {/* Notificações */}
                    <div className="space-y-2">
                        {activeAlerts.map(alert => (
                            <div key={alert.id} className="flex items-center justify-between bg-[#5c1f20] text-[#fdfffd] p-3 rounded-2xl border border-white/20 shadow-md">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Bell size={14} className="text-[#c5a04a] shrink-0 animate-pulse" />
                                    <p className="text-[9px] sm:text-xs font-bold uppercase tracking-tight truncate">
                                        VENCIMENTO: <span className="text-[#c5a04a] font-black">{alert.desc}</span> (DIA {alert.dueDay})
                                    </p>
                                </div>
                                <button onClick={() => setDismissedAlerts(prev => [...prev, `${alert.id}-${new Date().getMonth()}`])} className="p-1 shrink-0"><X size={12} /></button>
                            </div>
                        ))}
                    </div>

                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                                <StatCard title="Bruto Real" value={`R$ ${stats.bruto.toLocaleString()}`} icon={TrendingUp} colorClass="text-green-700" bgColorClass="bg-green-50" iconColorClass="text-green-700" />
                                <StatCard title="Margem Canais" value={`${stats.cmvFake.toFixed(1)}%`} icon={BarChart3} colorClass="text-blue-700" bgColorClass="bg-blue-50" iconColorClass="text-blue-700" />
                                <StatCard title="Pedidos UN" value={stats.totalOrders} icon={ShoppingBag} colorClass="text-[#696965]" bgColorClass="bg-gray-100" iconColorClass="text-[#696965]" />
                                <StatCard title="Custos Fixos" value={`R$ ${stats.custosFixosTotal.toLocaleString()}`} icon={Receipt} colorClass="text-[#5c1f20]" bgColorClass="bg-[#5c1f20]/10" iconColorClass="text-[#5c1f20]" />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] border border-gray-100 shadow-sm h-[300px] sm:h-[400px]">
                                    <h3 className="text-[10px] sm:text-xs font-black text-[#5c1f20] uppercase italic mb-4 font-sans tracking-tight">Composição Financeira (R$)</h3>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart data={stats.financialData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fontSize: 10, fill: '#696965' }} />
                                            <YAxis hide />
                                            <Tooltip />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                                {stats.financialData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                <LabelList dataKey="value" position="top" formatter={(v) => `R$ ${v.toLocaleString()}`} style={{ fontSize: 9, fontWeight: 'black', fill: '#5c1f20' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] border border-gray-100 shadow-sm h-[300px] sm:h-[400px]">
                                    <h3 className="text-[10px] sm:text-xs font-black text-[#5c1f20] uppercase italic mb-4 font-sans tracking-tight">Quantidade de Pedidos (UN)</h3>
                                    <ResponsiveContainer width="100%" height="90%">
                                        <BarChart data={stats.orderCountData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontWeight: 'bold', fontSize: 10, fill: '#696965' }} />
                                            <YAxis hide />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                                {stats.orderCountData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                <LabelList dataKey="value" position="top" style={{ fontSize: 9, fontWeight: 'black', fill: '#5c1f20' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'costs' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm italic font-sans">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-[#5c1f20] uppercase flex items-center gap-2 italic tracking-tighter font-sans"><Receipt size={18} /> Novo Gasto</h3>
                                    <button onClick={() => setIsCatModalOpen(true)} className="text-[9px] font-black text-[#c5a04a] border border-[#c5a04a] px-3 py-1.5 rounded-full uppercase hover:bg-[#c5a04a] hover:text-white transition-all">Categorias</button>
                                </div>
                                <form onSubmit={handleAddRecurringCost} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 tracking-widest font-sans not-italic">Descrição</label>
                                        <select name="desc" className="w-full px-3 py-2 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#c5a04a] not-italic">
                                            {costCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                    <CustomInput label="Valor" name="amount" type="number" step="0.01" required />
                                    <CustomInput label="Vencimento" name="dueDay" type="number" min="1" max="31" required />
                                    <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-10 rounded-xl font-black uppercase text-[10px] shadow-md active:scale-95 transition-all">Registrar</button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {/* Linha RH Fixa */}
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between opacity-70 italic">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Folha Salarial Real (Automático RH)</p>
                                        <p className="text-xs font-black text-[#5c1f20]">R$ {stats.folhaSalarial.toLocaleString()}</p>
                                    </div>
                                    <CheckCircle className="text-green-500" size={24} />
                                </div>
                                {recurringCosts.map(c => {
                                    const isPaid = c.lastPaidMonth === currentMonthYear;
                                    return (
                                        <div key={c.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 italic ${isPaid ? 'bg-green-50/10 border-green-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] uppercase font-black ${!isPaid && new Date().getDate() === c.dueDay ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#c5a04a]/10 text-[#c5a04a]'}`}>Dia {c.dueDay}</span>
                                                    <p className={`text-xs font-black uppercase truncate ${isPaid ? 'line-through text-gray-400' : 'text-[#5c1f20]'}`}>{c.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-xs font-black ${isPaid ? 'line-through text-gray-400' : 'text-gray-900'}`}>R$ {c.amount.toFixed(2)}</p>
                                                    <div className="flex items-center gap-1.5 ml-2">
                                                        <input type="number" id={`inp-${c.id}`} className="max-w-[70px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none not-italic" defaultValue={c.amount} disabled={isPaid} />
                                                        {!isPaid && <button onClick={() => handleUpdateCost(c.id, document.getElementById(`inp-${c.id}`).value)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"><Save size={14} /></button>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setRecurringCosts(prev => prev.filter(x => x.id !== c.id))} className="text-red-200 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                                <button onClick={() => togglePaymentStatus(c.id)} className={`transition-all ${isPaid ? 'text-green-600 scale-110' : 'text-gray-300 hover:text-[#5c1f20]'}`}>
                                                    {isPaid ? <CheckCircle size={28} fill="rgba(34, 197, 94, 0.1)" /> : <Circle size={28} />}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financeiro' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                <h3 className="text-lg font-black text-[#5c1f20] uppercase mb-8 tracking-tighter">Lançamento de Vendas</h3>
                                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end italic">
                                    <CustomInput label="Bruto" name="amount" type="number" step="0.01" required />
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 not-italic tracking-widest">Canal</label>
                                        <select name="platform" className="w-full px-3 py-2 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#c5a04a]">
                                            <option value="ifood">iFood</option><option value="anotaai">Anota AI</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-[#696965] uppercase ml-1 not-italic tracking-widest">Pagamento</label>
                                        <select name="payment" className="w-full px-3 py-2 bg-[#fdfffd] border border-gray-200 rounded-xl font-bold text-sm outline-none not-italic focus:ring-2 focus:ring-[#c5a04a]">
                                            <option value="pix">PIX</option><option value="cartao">Cartão</option><option value="online">Online</option><option value="dinheiro">Dinheiro</option>
                                        </select>
                                    </div>
                                    <CustomInput label="Data" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                                    <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-10 rounded-xl font-black uppercase text-[10px] shadow-lg">Lançar</button>
                                </form>
                            </div>
                            <div className="space-y-2">
                                {transactions.map(t => (
                                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between italic">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${t.platform === 'ifood' ? 'bg-[#5c1f20]' : 'bg-[#c5a04a]'}`} />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-[#5c1f20] uppercase truncate font-sans">{t.platform} - {t.payment}</p>
                                                <p className="text-[9px] font-bold text-gray-400 font-mono">{t.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-xs font-black text-gray-900 tracking-tighter">R$ {t.amount.toFixed(2)}</p>
                                            <button onClick={() => setTransactions(prev => prev.filter(x => x.id !== t.id))} className="text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'rh' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm italic">
                                <h3 className="text-lg font-black text-[#5c1f20] uppercase flex items-center gap-2 mb-6 tracking-tighter"><Users size={20} /> Gestão de Equipe</h3>
                                <form onSubmit={handleAddEmployee} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                    <CustomInput label="Nome" name="name" required />
                                    <CustomInput label="Cargo" name="role" required />
                                    <CustomInput label="Salário" name="salary" type="number" step="0.01" required />
                                    <button type="submit" className="bg-[#5c1f20] text-[#c5a04a] h-10 rounded-xl font-black uppercase text-[10px] shadow-md">Registrar</button>
                                </form>
                            </div>
                            <div className="space-y-3">
                                {employees.map(emp => (
                                    <div key={emp.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between italic">
                                        <div className="min-w-0">
                                            <p className="font-black text-[#5c1f20] uppercase text-xs truncate italic">{emp.name}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{emp.role}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-gray-900 italic">R$ {emp.salary.toLocaleString()}</span>
                                            <button onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'closing' && (
                        <div className="max-w-3xl mx-auto italic font-black">
                            <div className="bg-white p-6 sm:p-12 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 rotate-12 opacity-5"><Logo className="w-48 h-48" /></div>
                                <h3 className="text-2xl sm:text-3xl font-black text-[#5c1f20] uppercase tracking-tighter relative z-10 font-sans">Balanço do Mês</h3>
                                <div className="mt-8 space-y-4 relative z-10 font-sans tracking-tight">
                                    <div className="flex justify-between items-center border-b pb-2"><span className="text-[#696965] uppercase text-[10px] font-black">Faturamento Bruto</span><span className="text-green-700">R$ {stats.bruto.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Canais de Venda</span><span>R$ {(stats.bruto - stats.liquido).toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Folha Salarial Real</span><span>R$ {stats.folhaSalarial.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center border-b pb-2 text-xs"><span className="text-red-500 uppercase text-[10px] font-black">Gastos Operacionais</span><span>R$ {(stats.custosFixosTotal - stats.folhaSalarial).toFixed(2)}</span></div>
                                    <div className="mt-8 bg-[#5c1f20] p-6 rounded-[1.5rem] text-white shadow-xl italic">
                                        <p className="text-[10px] font-black text-[#c5a04a] uppercase tracking-widest mb-1">Sobrou no Reino</p>
                                        <h4 className="text-2xl sm:text-4xl font-black tracking-tighter truncate font-mono">R$ {(stats.liquido - (stats.custosFixosTotal - stats.folhaSalarial) - stats.folhaSalarial).toFixed(2)}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="max-w-4xl mx-auto font-black italic">
                            <div className="bg-white p-6 sm:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                                <h3 className="text-lg font-black text-[#5c1f20] uppercase mb-8 flex items-center gap-3 font-sans"><Settings size={22} /> Configurações</h3>
                                <form onSubmit={handleUpdateSettings} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans italic tracking-tighter">
                                        <CustomInput label="Nome da Esfiharia" name="businessName" defaultValue={settings.businessName} />
                                        <CustomInput label="Aviso Vencimento (Dias)" name="alertDaysBefore" type="number" defaultValue={settings.alertDaysBefore} />
                                        <CustomInput label="Taxa iFood (%)" name="ifoodTax" type="number" step="0.1" defaultValue={settings.ifoodTax} />
                                        <CustomInput label="Taxa Anota AI (%)" name="anotaaiTax" type="number" step="0.1" defaultValue={settings.anotaaiTax} />
                                        <CustomInput label="Nova Senha" name="appPassword" type="password" />
                                        <CustomInput label="Lembrete de Senha" name="passwordReminder" type="text" defaultValue={settings.passwordReminder} />
                                    </div>
                                    <button type="submit" className="w-full bg-[#5c1f20] text-[#fdfffd] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c5a04a] shadow-xl">Salvar</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}