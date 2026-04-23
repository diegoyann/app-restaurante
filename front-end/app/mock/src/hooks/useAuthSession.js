import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { authApi } from '../services/api.js';

export function useAuthSession() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    let activeController = null;

    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }

        activeController?.abort();
        activeController = new AbortController();

        const payload = await authApi.getSession({ signal: activeController.signal });
        if (mounted) {
          setError('');
          setSession(payload);
        }
      } catch (apiError) {
        if (apiError?.name === 'AbortError') {
          return;
        }

        if (mounted) {
          setError(apiError.message || 'Falha ao validar sessão.');
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        return;
      }

      load();
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
