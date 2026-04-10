import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    UtensilsCrossed,
    Mail,
    Lock,
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react';

// --- MOCK: mapa de e-mail → tenant slug ---
// Futuramente, isso será uma chamada à API de autenticação.
// A API retornará o tenant do usuário no payload do login.
const MOCK_USERS = [
    { email: 'rei@reidasesfihas.com', password: 'admin', tenantSlug: 'reidasesfihas', name: 'Rei das Esfihas' },
    { email: 'demo@gestaofood.com.br', password: 'demo', tenantSlug: 'demo', name: 'Demo Restaurante' },
    { email: 'admin@express.com', password: 'admin', tenantSlug: 'esfiharia-express', name: 'Esfiharia Express' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const doLogin = async (emailValue, passwordValue) => {
        setError('');
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        const user = MOCK_USERS.find(
            u => u.email.toLowerCase() === emailValue.toLowerCase().trim() && u.password === passwordValue
        );
        setLoading(false);
        if (!user) { setError('E-mail ou senha inválidos.'); return; }
        sessionStorage.setItem('tenantSlug', user.tenantSlug);
        navigate('/app');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await doLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a0b0b] to-[#5c1f20] flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#c5a04a]/8 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#5c1f20]/15 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-[440px] relative">
                {/* Voltar para landing */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-[#c5a04a] transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Voltar ao site</span>
                </Link>

                {/* Card de login */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#5c1f20] to-[#3a1213] rounded-2xl flex items-center justify-center shadow-xl mb-5 ring-2 ring-[#c5a04a]/20">
                            <UtensilsCrossed className="text-[#c5a04a]" size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                            GESTÃO<span className="text-[#c5a04a] italic">FOOD</span>
                        </h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">
                            Acesse sua conta
                        </p>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* E-mail */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#c5a04a] uppercase tracking-widest block ml-1">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    autoComplete="email"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white font-medium text-sm outline-none focus:ring-2 focus:ring-[#c5a04a] focus:border-transparent transition-all placeholder:text-white/20"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#c5a04a] uppercase tracking-widest block ml-1">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-11 pr-12 py-3.5 bg-white/8 border border-white/15 rounded-xl text-white font-medium text-sm outline-none focus:ring-2 focus:ring-[#c5a04a] focus:border-transparent transition-all placeholder:text-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#c5a04a] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Erro */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <p className="text-xs font-bold text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Esqueci senha */}
                        <div className="text-right">
                            <button
                                type="button"
                                className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-[#c5a04a] transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${loading
                                ? 'bg-[#c5a04a]/50 text-[#5c1f20]/50 cursor-wait'
                                : 'bg-[#c5a04a] text-[#5c1f20] hover:bg-[#d4b35e] shadow-xl shadow-[#c5a04a]/20 cursor-pointer'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Autenticando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Dica mock */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-white/20 font-bold text-center uppercase tracking-widest mb-3">
                            Contas de demonstração
                        </p>
                        <div className="space-y-2">
                            {MOCK_USERS.map((u, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { setEmail(u.email); setPassword(u.password); setError(''); doLogin(u.email, u.password); }}
                                    className="w-full flex items-center justify-between bg-white/3 hover:bg-white/8 border border-white/5 rounded-lg px-3 py-2 transition-all group"
                                >
                                    <span className="text-[10px] font-bold text-white/40 group-hover:text-white/70 truncate">
                                        {u.email}
                                    </span>
                                    <span className="text-[9px] font-black text-[#c5a04a]/50 uppercase tracking-wider shrink-0 ml-2">
                                        {u.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
