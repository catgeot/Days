import { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';

/** @typedef {'check' | 'no-session' | 'no-admin' | 'yes'} AdminGatePhase */

/**
 * Client admin gate — same RPC as gallery admin (`am_i_app_admin`).
 * @param {string} [scope]
 * @returns {AdminGatePhase}
 */
export function useAppAdminGate(scope = 'gallery') {
  const [phase, setPhase] = useState('check');

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        if (!cancel) setPhase('no-session');
        return;
      }
      const { data, error } = await supabase.rpc('am_i_app_admin', { p_scope: scope });
      if (cancel) return;
      if (error || data !== true) {
        setPhase('no-admin');
        return;
      }
      setPhase('yes');
    })();
    return () => {
      cancel = true;
    };
  }, [scope]);

  return phase;
}
