import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, QrCode, ShieldCheck, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { isMockDataSource } from '../../config/dataSource.js';

function renderQrCode(qrCode) {
  if (!qrCode) return null;

  if (qrCode.startsWith('<svg')) {
    return (
      <div
        className="inline-flex rounded-2xl bg-white p-3 border border-gray-100"
        dangerouslySetInnerHTML={{ __html: qrCode }}
      />
    );
  }

  return (
    <img
      src={qrCode}
      alt="QR Code para configurar autenticação em duas etapas"
      className="w-48 h-48 rounded-2xl bg-white p-3 border border-gray-100"
    />
  );
}

export default function AccountSecuritySection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [factors, setFactors] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const verifiedFactors = useMemo(
    () => factors.filter((factor) => factor.status === 'verified'),
    [factors]
  );

  const loadFactors = async () => {
    if (isMockDataSource()) {
      setFactors([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      setFactors(data?.totp || []);
    } catch (apiError) {
      setError(apiError.message || 'Falha ao carregar fatores 2FA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFactors();
  }, []);

  const handleEnroll = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    setEnrollment(null);

    try {
      if (isMockDataSource()) {
        throw new Error('2FA não está disponível no modo mock.');
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'GestãoFood',
        friendlyName: 'App autenticador'
      });
      if (enrollError) throw enrollError;

      setEnrollment(data);
      setMessage('Escaneie o QR Code no app autenticador e confirme o código.');
    } catch (apiError) {
      setError(apiError.message || 'Falha ao iniciar 2FA.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEnrollment = async (event) => {
    event.preventDefault();
    if (!enrollment?.id) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const code = verificationCode.replace(/\s+/g, '');
      if (!/^\d{6}$/.test(code)) {
        throw new Error('Informe o código de 6 dígitos do app autenticador.');
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollment.id
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollment.id,
        challengeId: challenge.id,
        code
      });
      if (verifyError) throw verifyError;

      setEnrollment(null);
      setVerificationCode('');
      setMessage('2FA ativado para esta conta.');
      await loadFactors();
    } catch (apiError) {
      setError(apiError.message || 'Falha ao confirmar 2FA.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnenroll = async (factorId) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
      if (unenrollError) throw unenrollError;

      setMessage('Fator 2FA removido.');
      await loadFactors();
    } catch (apiError) {
      setError(apiError.message || 'Falha ao remover 2FA.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#2A1E15]/10 bg-[#fffaf0] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D4A373]">Segurança da conta</p>
            <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-[#2A1E15]">Autenticação em duas etapas</h3>
            <p className="mt-2 text-sm font-bold text-[#696965]">
              Use Google Authenticator, Microsoft Authenticator, Authy ou outro app TOTP compatível.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest ${verifiedFactors.length ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            <ShieldCheck size={14} />
            {verifiedFactors.length ? 'Ativo' : 'Inativo'}
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {error || message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 text-xs font-black uppercase tracking-widest text-[#2A1E15]">
          <Loader2 size={18} className="animate-spin" />
          Carregando segurança
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#2A1E15]">Fatores cadastrados</h4>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1E15] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#D4A373] transition-colors disabled:opacity-50"
              >
                <QrCode size={14} />
                Ativar 2FA
              </button>
            </div>

            {verifiedFactors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                Nenhum app autenticador ativo nesta conta.
              </div>
            ) : verifiedFactors.map((factor) => (
              <div key={factor.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAF6EF] px-4 py-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-[#2A1E15]">{factor.friendly_name || 'App autenticador'}</p>
                  <p className="mt-1 text-xs font-semibold text-[#7a6666]">TOTP verificado</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnenroll(factor.id)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleVerifyEnrollment} className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#2A1E15]">Configurar novo app</h4>

            {enrollment ? (
              <>
                <div className="flex justify-center">
                  {renderQrCode(enrollment.totp?.qr_code)}
                </div>
                {enrollment.totp?.uri && (
                  <p className="break-all rounded-xl bg-[#FAF6EF] p-3 text-[10px] font-bold text-[#696965]">
                    {enrollment.totp.uri}
                  </p>
                )}
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-[#FFFFFF] border border-gray-200 rounded-xl text-center text-xl font-black tracking-[0.3em] outline-none focus:ring-2 focus:ring-[#D4A373]"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#D4A373] px-4 py-3 text-xs font-black uppercase tracking-widest text-[#2A1E15] hover:bg-[#C58F5E] transition-colors disabled:opacity-50"
                >
                  Confirmar código
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2A1E15]/15 px-4 py-6 text-sm font-semibold text-[#7a6666]">
                Clique em Ativar 2FA para gerar um QR Code.
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
