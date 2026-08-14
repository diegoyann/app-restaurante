import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { authApi } from '../services/api.js';
import { normalizeSessionPayload } from '../features/session/sessionModel.js';
import { isMockDataSource } from '../config/dataSource.js';
import { onMockAuthStateChange } from '../services/mockAuth.js';
import { shouldClearSessionAfterValidationError } from './sessionRecovery.js';

export function useAuthSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);
  const sessionRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let activeController = null;
    let currentRequestId = 0;

    const applySession = (payload) => {
      sessionRef.current = payload;
      setSession(payload);
      hasLoadedRef.current = true;
    };

    const load = async ({ showLoading = false } = {}) => {
      const requestId = ++currentRequestId;

      if (showLoading) {
        setLoading(true);
      }

      try {
        if (isMockDataSource()) {
          const payload = normalizeSessionPayload(await authApi.getSession());
          if (mounted && requestId === currentRequestId) {
            setError('');
            applySession(payload);
            setLoading(false);
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (mounted && requestId === currentRequestId) {
            setError('');
            applySession(null);
            setLoading(false);
          }
          return;
        }

        activeController?.abort();
        activeController = new AbortController();

        const payload = normalizeSessionPayload(await authApi.getSession({ signal: activeController.signal }));
        if (mounted && requestId === currentRequestId) {
          setError('');
          applySession(payload);
        }
      } catch (apiError) {
        if (apiError?.name === 'AbortError') {
          return;
        }

        if (mounted && requestId === currentRequestId) {
          setError(apiError.message || 'Falha ao validar sessão.');
          if (shouldClearSessionAfterValidationError(apiError) || !sessionRef.current?.user) {
            applySession(null);
          }
        }
      } finally {
        if (mounted && requestId === currentRequestId) {
          setLoading(false);
        }
      }
    };

    load({ showLoading: true });

    if (isMockDataSource()) {
      const unsubscribe = onMockAuthStateChange(() => {
        load({ showLoading: true });
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      if (event === 'SIGNED_OUT') {
        activeController?.abort();
        setError('');
        applySession(null);
        setLoading(false);
        return;
      }

      if (!['SIGNED_IN', 'USER_UPDATED'].includes(event)) {
        return;
      }

      load({ showLoading: !hasLoadedRef.current || !sessionRef.current });
    });

    return () => {
      mounted = false;
      activeController?.abort();
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    session,
    error
  };
}
