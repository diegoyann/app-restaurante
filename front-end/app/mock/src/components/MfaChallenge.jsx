import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

export default function MfaChallenge({ onVerified }) {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [factor, setFactor] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadFactors() {
      setLoading(true);
      setError('');

      try {
        const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const verifiedFactor = data?.totp?.find((item) => item.status === 'verified') || null;
        if (!cancelled) {
          setFactor(verifiedFactor);
          if (!verifiedFactor) {
            setError('Nenhum fator 2FA verificado foi encontrado para esta conta.');
          }
        }
      } catch (apiError) {
        if (!cancelled) {
          setError(apiError.message || 'Falha ao carregar autenticação em duas etapas.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFactors();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!factor?.id || verifying) return;

    setVerifying(true);
    setError('');

    try {
      const normalizedCode = code.replace(/\s+/g, '');
      if (!/^\d{6}$/.test(normalizedCode)) {
        throw new Error('Informe o código de 6 dígitos do app autenticador.');
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: normalizedCode
      });
      if (verifyError) throw verifyError;

      onVerified?.();
    } catch (apiError) {
      setError(apiError.message || 'Código inválido ou expirado.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A1E15] via-[#3A281B] to-[#2A1E15] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[440px] bg-white/5 backdrop-blur-xl rounded-[2rem] p-8 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#D4A373] rounded-2xl flex items-center justify-center shadow-xl mb-5">
            <LockKeyhole className="text-[#2A1E15]" size={28} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Confirme sua identidade</h1>
          <p className="text-white/45 text-xs font-bold uppercase tracking-[0.18em] mt-2">
            Código do app autenticador
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 text-[#D4A373] text-xs font-black uppercase tracking-widest">
            <Loader2 size={18} className="animate-spin" />
            Carregando 2FA
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="mfa-code" className="text-[10px] font-black text-[#D4A373] uppercase tracking-widest block ml-1">
                Código de 6 dígitos
              </label>
              <input
                id="mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-4 bg-white/8 border border-white/15 rounded-xl text-white font-black text-center text-2xl tracking-[0.35em] outline-none focus:ring-2 focus:ring-[#D4A373] focus:border-transparent transition-all placeholder:text-white/20"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-xs font-bold text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!factor || verifying}
              className="w-full py-4 rounded-2xl font-black uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2 bg-[#D4A373] text-[#2A1E15] hover:bg-[#C58F5E] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#2A1E15]/20"
            >
              {verifying ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
              Verificar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
