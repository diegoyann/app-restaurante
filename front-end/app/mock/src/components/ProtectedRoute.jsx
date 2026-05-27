import { Navigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthSession } from '../hooks/useAuthSession.js';
import { canAccessTenant, getAccessibleTenantSlug } from '../features/session/sessionModel.js';
import { isMockDataSource } from '../config/dataSource.js';
import { supabase } from '../lib/supabase.js';
import MfaChallenge from './MfaChallenge.jsx';

export default function ProtectedRoute({ mode = 'authenticated', children }) {
  const params = useParams();
  const { loading, session } = useAuthSession();
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaRefreshKey, setMfaRefreshKey] = useState(0);
  const checkedMfaUserIdRef = useRef('');
  const userId = session?.user?.id || '';

  useEffect(() => {
    let cancelled = false;

    async function checkMfa() {
      if (isMockDataSource() || !userId) {
        if (!cancelled) {
          checkedMfaUserIdRef.current = '';
          setMfaRequired(false);
          setMfaLoading(false);
        }
        return;
      }

      const shouldBlockRoute = checkedMfaUserIdRef.current !== userId;
      if (shouldBlockRoute) {
        setMfaLoading(true);
      }

      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;

        if (!cancelled) {
          checkedMfaUserIdRef.current = userId;
          setMfaRequired(data?.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel);
        }
      } catch {
        if (!cancelled) {
          checkedMfaUserIdRef.current = userId;
          setMfaRequired(false);
        }
      } finally {
        if (!cancelled) {
          setMfaLoading(false);
        }
      }
    }

    checkMfa();

    return () => {
      cancelled = true;
    };
  }, [userId, mfaRefreshKey]);

  if (loading || mfaLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] text-[#2A1E15] font-black uppercase tracking-[0.18em]">Carregando sessão...</div>;
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  if (mfaRequired) {
    return <MfaChallenge onVerified={() => setMfaRefreshKey((value) => value + 1)} />;
  }

  if (mode === 'admin') {
    return session.user.role === 'super_admin'
      ? typeof children === 'function'
        ? children({ session })
        : children
      : <Navigate to="/login" replace />;
  }

  if (mode === 'tenant') {
    const requestedTenantSlug = String(params.tenant || '').trim();
    const tenantSlug = getAccessibleTenantSlug(session, requestedTenantSlug);

    if (!tenantSlug || !canAccessTenant(session, tenantSlug)) {
      return <Navigate to="/login" replace />;
    }

    if (requestedTenantSlug !== tenantSlug) {
      return <Navigate to={`/app/${tenantSlug}`} replace />;
    }

    return typeof children === 'function'
      ? children({ session, tenantSlug })
      : children;
  }

  return typeof children === 'function' ? children({ session }) : children;
}
