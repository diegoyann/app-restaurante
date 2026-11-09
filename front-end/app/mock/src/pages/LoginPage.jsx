import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    UtensilsCrossed,
    Mail,
    Lock,
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import { useAuthSession } from '../hooks/useAuthSession.js';
import { resolveSessionDestination } from '../features/session/sessionModel.js';
import { authApi } from '../services/api.js';
import { isMockDataSource } from '../config/dataSource.js';
import { featureFlags } from '../config/featureFlags.js';
import { signInWithMockPassword } from '../services/mockAuth.js';

function getLoginErrorMessage(error, stage) {
    const message = error?.message || '';

    if (/failed to fetch|networkerror|network request failed/i.test(message)) {
        return stage === 'supabase'
            ? 'Não foi possível alcançar o Supabase. Verifique bloqueadores de conteúdo, DNS ou rede que possam bloquear *.supabase.co.'
            : 'Login confirmado, mas não foi possível validar a sessão na API. Tente novamente em instantes.';
    }

    return message || 'E-mail ou senha inválidos.';
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loading: sessionLoading, session } = useAuthSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionLoading || !session?.user) {
            return;
        }

        navigate(resolveSessionDestination(session), { replace: true });
    }, [navigate, session, sessionLoading]);

    const doLogin = async (emailValue, passwordValue) => {
        setError('');
        setLoading(true);
        let stage = 'supabase';

        try {
            if (isMockDataSource()) {
                await signInWithMockPassword({
                    email: emailValue,
                    password: passwordValue
                });
                const payload = await authApi.getSession();
                navigate(resolveSessionDestination(payload), { replace: true });
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: emailValue,
                password: passwordValue
            });

            if (signInError) {
                throw signInError;
            }

            stage = 'session';
            const payload = await authApi.getSession();
            navigate(resolveSessionDestination(payload), { replace: true });
        } catch (apiError) {
            setError(getLoginErrorMessage(apiError, stage));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await doLogin(email, password);
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            if (isMockDataSource()) {
                throw new Error('Login Google não está disponível no modo mock.');
            }

            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (oauthError) {
                throw oauthError;
            }
        } catch (apiError) {
            setError(apiError.message || 'Falha ao iniciar login com Google.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#3A281B] to-[#2A1E15] flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#D4A373]/8 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#2A1E15]/15 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-[440px] relative">
                {/* Voltar para landing */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-white/40 hover:text-[#D4A373] transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Voltar ao site</span>
                </Link>

                {/* Card de login */}
                <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#2A1E15] to-[#3a1213] rounded-2xl flex items-center justify-center shadow-xl mb-5 ring-2 ring-[#D4A373]/20">
                            <UtensilsCrossed className="text-[#D4A373]" size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">
                            GESTÃO<span className="text-[#D4A373] italic">FOOD</span>
                        </h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">
                            Acesse sua conta
                        </p>
                    </div>

                        {/* Formulário */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                        {featureFlags.googleAuth && (<>
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 bg-white text-[#2A1E15] hover:bg-[#FAF6EF] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                        >
                            <ShieldCheck size={17} />
                            Entrar com Google
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">ou</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>
                        </>)}

                        {/* E-mail */}
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest block ml-1">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A5A2B]" size={16} />
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    autoComplete="email"
                                    className="w-full pl-11 pr-4 py-3.5 bg-[#f9f1e6] border border-[#D4A373]/35 rounded-xl text-[#2A1E15] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent transition-all placeholder:text-[#8A7A6D]"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <label htmlFor="login-password" className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest block ml-1">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A5A2B]" size={16} />
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-11 pr-12 py-3.5 bg-[#f9f1e6] border border-[#D4A373]/35 rounded-xl text-[#2A1E15] font-semibold text-sm outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent transition-all placeholder:text-[#8A7A6D]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A5A2B] hover:text-[#2A1E15] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Erro */}
                        {(error || location.state?.sessionError) && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                <AlertCircle size={14} className="text-red-400 shrink-0" />
                                <p className="text-xs font-bold text-red-400">{error || location.state.sessionError}</p>
                            </div>
                        )}

                        {/* Esqueci senha */}
                        <div className="text-right">
                            <button
                                type="button"
                                className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-[#D4A373] transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${loading
                                ? 'bg-[#D4A373]/50 text-[#2A1E15]/50 cursor-wait'
                                : 'bg-[#D4A373] text-[#2A1E15] hover:bg-[#C58F5E] shadow-xl shadow-[#D4A373]/20 cursor-pointer'
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

                </div>
            </div>
        </div>
    );
}
