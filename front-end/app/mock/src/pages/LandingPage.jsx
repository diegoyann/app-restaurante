import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Receipt,
    Users,
    PieChart,
    ShoppingBag,
    Shield,
    Zap,
    Star,
    ArrowRight,
    Check,
    Menu,
    X,
    Play,
    Phone,
    Mail,
    UtensilsCrossed,
    ChefHat,
    Store
} from 'lucide-react';

// --- NOME E BRANDING DA PLATAFORMA ---
const PLATFORM_NAME = 'GestãoFood';
const PLATFORM_TAGLINE = 'Gestão inteligente para restaurantes';

// --- ANIMAÇÃO DE ENTRADA ---
const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
        >
            {children}
        </div>
    );
};

// --- FEATURES ---
const FEATURES = [
    {
        icon: LayoutDashboard,
        title: 'Painel em Tempo Real',
        desc: 'Veja faturamento bruto, líquido, pedidos e margem em um dashboard completo atualizado em tempo real.',
        color: '#2A1E15'
    },
    {
        icon: Receipt,
        title: 'Controle Financeiro',
        desc: 'Lançamento de vendas por plataforma, cálculo automático de taxas e acompanhamento de custos fixos e operacionais.',
        color: '#D4A373'
    },
    {
        icon: Users,
        title: 'Gestão de Equipe',
        desc: 'Cadastro de funcionários fixos e por fora, controle de folha salarial, descontos e gestão completa de RH.',
        color: '#2A1E15'
    },
    {
        icon: PieChart,
        title: 'Fechamento Mensal',
        desc: 'Balanço completo do mês com dedução automática de taxas, custos e folha salarial. Saiba exatamente o que sobra.',
        color: '#D4A373'
    },
    {
        icon: ShoppingBag,
        title: 'Gestão de Insumos',
        desc: 'Cadastro de matéria-prima, receitas base com composição de ingredientes e cálculo de custo por produto.',
        color: '#2A1E15'
    },
    {
        icon: Shield,
        title: 'Multi-Unidade Seguro',
        desc: 'Cada restaurante tem seu ambiente isolado. Dados separados, acesso direcionado e segurança total.',
        color: '#D4A373'
    }
];

// --- PRICING ---
const PLANS = [
    {
        name: 'Básico',
        price: 'R$ 89',
        period: '/mês',
        features: ['1 unidade', 'Dashboard completo', 'Financeiro', 'Custos fixos', 'Suporte por e-mail'],
        highlight: false
    },
    {
        name: 'Profissional',
        price: 'R$ 149',
        period: '/mês',
        features: ['Até 3 unidades', 'Tudo do Básico', 'Gestão de RH', 'Insumos e receitas', 'Relatórios avançados', 'Suporte prioritário'],
        highlight: true
    },
    {
        name: 'Enterprise',
        price: 'Sob consulta',
        period: '',
        features: ['Unidades ilimitadas', 'Tudo do Profissional', 'API de integração', 'SLA dedicado', 'Consultoria de implantação'],
        highlight: false
    }
];

export default function LandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] font-sans antialiased">
            {/* --- NAVBAR --- */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100'
                    : 'bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
                            <div className="w-9 h-9 bg-gradient-to-br from-[#2A1E15] to-[#3a1213] rounded-xl flex items-center justify-center shadow-lg">
                                <UtensilsCrossed className="text-[#D4A373]" size={18} />
                            </div>
                            <span className="font-black text-lg tracking-tighter text-[#2A1E15] uppercase hidden sm:inline">
                                GESTÃO<span className="text-[#D4A373] italic">FOOD</span>
                            </span>
                        </div>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {[
                                { label: 'Recursos', id: 'features' },
                                { label: 'Preview', id: 'preview' },
                                { label: 'Planos', id: 'pricing' },
                                { label: 'Contato', id: 'contact' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollToSection(item.id)}
                                    className="text-xs font-bold text-[#696965] uppercase tracking-widest hover:text-[#2A1E15] transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-[#2A1E15] text-white px-6 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-wider hover:bg-[#D4A373] transition-all shadow-lg shadow-[#2A1E15]/20 hover:shadow-[#D4A373]/30"
                            >
                                Acessar
                            </button>
                        </div>

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 text-[#2A1E15]"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-xl">
                        <div className="px-6 py-4 space-y-3">
                            {['features', 'preview', 'pricing', 'contact'].map(id => (
                                <button
                                    key={id}
                                    onClick={() => scrollToSection(id)}
                                    className="block w-full text-left text-sm font-bold text-[#696965] uppercase tracking-wider py-2 hover:text-[#2A1E15]"
                                >
                                    {id === 'features' ? 'Recursos' : id === 'preview' ? 'Preview' : id === 'pricing' ? 'Planos' : 'Contato'}
                                </button>
                            ))}
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-[#2A1E15] text-white py-3 rounded-xl font-black uppercase text-xs"
                            >
                                Acessar Sistema
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <section id="hero" className="relative overflow-hidden pt-32 sm:pt-40 pb-20 sm:pb-32">
                {/* Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-[#D4A373]/8 to-transparent rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#2A1E15]/5 to-transparent rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <FadeInSection>
                            <div className="inline-flex items-center gap-2 bg-[#2A1E15]/5 border border-[#2A1E15]/10 rounded-full px-4 py-1.5 mb-8">
                                <Zap size={14} className="text-[#D4A373]" />
                                <span className="text-[10px] font-black text-[#2A1E15] uppercase tracking-widest">
                                    {PLATFORM_TAGLINE}
                                </span>
                            </div>
                        </FadeInSection>

                        <FadeInSection delay={100}>
                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#0f172a] tracking-tighter leading-[0.9] uppercase">
                                A gestão{' '}
                                <span className="relative inline-block">
                                    <span className="text-[#2A1E15]">completa</span>
                                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                        <path d="M2 8 Q50 2, 100 6 T198 4" stroke="#D4A373" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                </span>
                                <br />
                                do seu{' '}
                                <span className="bg-gradient-to-r from-[#D4A373] to-[#C58F5E] bg-clip-text text-transparent italic">
                                    Restaurante
                                </span>
                            </h1>
                        </FadeInSection>

                        <FadeInSection delay={200}>
                            <p className="mt-8 text-base sm:text-lg text-[#696965] leading-relaxed max-w-2xl mx-auto font-medium">
                                Plataforma completa para gerenciar vendas, equipe, custos e faturamento do seu restaurante.
                                Dashboard em tempo real, controle financeiro e fechamento mensal automatizado.
                            </p>
                        </FadeInSection>

                        <FadeInSection delay={300}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="group w-full sm:w-auto bg-[#2A1E15] text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-[#D4A373] transition-all shadow-xl shadow-[#2A1E15]/25 hover:shadow-[#D4A373]/30 flex items-center justify-center gap-2"
                                >
                                    Começar Agora
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => scrollToSection('preview')}
                                    className="group w-full sm:w-auto bg-white border-2 border-gray-200 text-[#2A1E15] px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:border-[#D4A373] transition-all flex items-center justify-center gap-2"
                                >
                                    <Play size={16} className="text-[#D4A373]" />
                                    Ver Demo
                                </button>
                            </div>
                        </FadeInSection>

                        {/* Métricas */}
                        <FadeInSection delay={400}>
                            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-xl mx-auto">
                                {[
                                    { value: '500+', label: 'Restaurantes' },
                                    { value: '99.9%', label: 'Uptime' },
                                    { value: '4.9', label: 'Avaliação' },
                                ].map((stat, i) => (
                                    <div key={i} className="text-center">
                                        <p className="text-2xl sm:text-3xl font-black text-[#2A1E15] tracking-tighter">{stat.value}</p>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-[#696965] uppercase tracking-widest mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </FadeInSection>

                        {/* Tipos de restaurante */}
                        <FadeInSection delay={500}>
                            <div className="flex items-center justify-center gap-6 mt-12 flex-wrap">
                                {[
                                    { icon: ChefHat, label: 'Restaurantes' },
                                    { icon: Store, label: 'Lanchonetes' },
                                    { icon: UtensilsCrossed, label: 'Esfiharias' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[#696965]">
                                        <item.icon size={16} className="text-[#D4A373]" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* --- FEATURES --- */}
            <section id="features" className="py-20 sm:py-32 bg-gradient-to-b from-[#FFFFFF] to-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeInSection>
                        <div className="text-center mb-16 sm:mb-20">
                            <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.3em] block mb-4">
                                Funcionalidades
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#0f172a] tracking-tighter uppercase">
                                Tudo que você precisa{' '}
                                <span className="text-[#2A1E15] italic">num só lugar</span>
                            </h2>
                        </div>
                    </FadeInSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {FEATURES.map((feature, index) => (
                            <FadeInSection key={index} delay={index * 80}>
                                <div className="group bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 hover:border-[#D4A373]/30 shadow-sm hover:shadow-xl hover:shadow-[#2A1E15]/5 transition-all duration-500 h-full">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3"
                                        style={{ backgroundColor: `${feature.color}10` }}
                                    >
                                        <feature.icon size={22} style={{ color: feature.color }} />
                                    </div>
                                    <h3 className="text-base font-black text-[#0f172a] uppercase tracking-tight mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[#696965] leading-relaxed font-medium">
                                        {feature.desc}
                                    </p>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PREVIEW DO DASHBOARD --- */}
            <section id="preview" className="py-20 sm:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-[#FFFFFF] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <FadeInSection>
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.3em] block mb-4">
                                Preview
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#0f172a] tracking-tighter uppercase">
                                Veja o sistema em{' '}
                                <span className="text-[#2A1E15] italic">ação</span>
                            </h2>
                            <p className="mt-4 text-base text-[#696965] font-medium max-w-xl mx-auto">
                                Interface limpa, intuitiva e pensada para a rotina de quem vive a operação.
                            </p>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay={200}>
                        <div className="relative mx-auto max-w-5xl">
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#2A1E15]/10 via-[#D4A373]/10 to-[#2A1E15]/10 rounded-[2.5rem] blur-2xl opacity-60" />

                            <div className="relative bg-white rounded-[2rem] border border-gray-200 shadow-2xl overflow-hidden">
                                <div className="h-10 sm:h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 sm:px-6 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                    </div>
                                    <div className="flex-1 mx-4">
                                        <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-[10px] font-mono text-gray-400 max-w-xs mx-auto text-center">
                                            app.gestaofood.com.br/dashboard
                                        </div>
                                    </div>
                                </div>

                                <img
                                    src="/dashboard-preview.png"
                                    alt="Preview do Dashboard"
                                    className="w-full h-auto"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- PRICING --- */}
            <section id="pricing" className="py-20 sm:py-32 bg-gradient-to-b from-[#FFFFFF] to-gray-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeInSection>
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.3em] block mb-4">
                                Planos
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-black text-[#0f172a] tracking-tighter uppercase">
                                Escolha seu{' '}
                                <span className="text-[#2A1E15] italic">plano</span>
                            </h2>
                        </div>
                    </FadeInSection>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
                        {PLANS.map((plan, index) => (
                            <FadeInSection key={index} delay={index * 100}>
                                <div
                                    className={`relative rounded-3xl p-6 sm:p-8 h-full flex flex-col transition-all duration-500 ${plan.highlight
                                        ? 'bg-[#2A1E15] text-white border-2 border-[#D4A373] shadow-2xl shadow-[#2A1E15]/30 scale-[1.02]'
                                        : 'bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#2A1E15]/5'
                                        }`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <div className="bg-[#D4A373] text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <Star size={10} fill="white" /> Mais Popular
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <p className={`text-xs font-black uppercase tracking-widest mb-2 ${plan.highlight ? 'text-[#D4A373]' : 'text-[#696965]'}`}>
                                            {plan.name}
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl sm:text-4xl font-black tracking-tighter">{plan.price}</span>
                                            {plan.period && (
                                                <span className={`text-sm font-bold ${plan.highlight ? 'text-white/60' : 'text-[#696965]'}`}>
                                                    {plan.period}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-3 flex-1">
                                        {plan.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check size={14} className={plan.highlight ? 'text-[#D4A373]' : 'text-green-600'} />
                                                <span className={`text-sm font-medium ${plan.highlight ? 'text-white/90' : 'text-[#696965]'}`}>
                                                    {feat}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => navigate('/login')}
                                        className={`w-full mt-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all ${plan.highlight
                                            ? 'bg-[#D4A373] text-[#2A1E15] hover:bg-[#C58F5E] shadow-lg'
                                            : 'bg-gray-100 text-[#2A1E15] hover:bg-[#2A1E15] hover:text-white'
                                            }`}
                                    >
                                        Começar Agora
                                    </button>
                                </div>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-20 sm:py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#3A281B] to-[#2A1E15]" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4aDF2MWgtMVYweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <FadeInSection>
                        <div className="w-16 h-16 bg-gradient-to-br from-[#D4A373] to-[#C58F5E] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                            <UtensilsCrossed size={28} className="text-white" />
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-tight">
                            Pronto para assumir o controle{' '}
                            <span className="text-[#D4A373] italic">do seu negócio?</span>
                        </h2>
                        <p className="mt-6 text-base text-white/50 font-medium max-w-xl mx-auto">
                            Cadastre-se agora ou acesse sua conta para começar a gerenciar seu restaurante com inteligência.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                            <button
                                onClick={() => navigate('/login')}
                                className="group w-full sm:w-auto bg-[#D4A373] text-[#2A1E15] px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-[#C58F5E] transition-all shadow-xl shadow-[#D4A373]/20 flex items-center justify-center gap-2"
                            >
                                Acessar Minha Conta
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- CONTACT --- */}
            <section id="contact" className="py-20 sm:py-28 bg-[#FFFFFF]">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FadeInSection>
                        <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.3em] block mb-4">
                            Contato
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] tracking-tighter uppercase mb-6">
                            Fale com a gente
                        </h2>
                        <p className="text-base text-[#696965] font-medium mb-10">
                            Quer saber mais sobre a plataforma ou precisa de ajuda? Entre em contato.
                        </p>
                    </FadeInSection>

                    <FadeInSection delay={100}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <a
                                href="mailto:contato@gestaofood.com.br"
                                className="group flex items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#D4A373]/30 hover:shadow-lg transition-all"
                            >
                                <Mail size={18} className="text-[#D4A373]" />
                                <span className="text-sm font-bold text-[#2A1E15] group-hover:text-[#D4A373] transition-colors">
                                    contato@gestaofood.com.br
                                </span>
                            </a>
                            <a
                                href="tel:+5511999999999"
                                className="group flex items-center justify-center gap-3 bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#D4A373]/30 hover:shadow-lg transition-all"
                            >
                                <Phone size={18} className="text-[#D4A373]" />
                                <span className="text-sm font-bold text-[#2A1E15] group-hover:text-[#D4A373] transition-colors">
                                    (11) 99999-9999
                                </span>
                            </a>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-[#0f172a] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <UtensilsCrossed size={18} className="text-[#D4A373]" />
                            <span className="font-black text-sm tracking-tighter text-white uppercase">
                                GESTÃO<span className="text-[#D4A373] italic">FOOD</span>
                            </span>
                        </div>

                        <p className="text-xs text-white/30 font-medium">
                            © {new Date().getFullYear()} GestãoFood. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
