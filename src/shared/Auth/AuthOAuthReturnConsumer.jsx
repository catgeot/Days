import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { consumeAuthOAuthPostLoginPath } from './authOAuthPostLoginStorage.js';

export default function AuthOAuthReturnConsumer() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const tryRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session) return;
      const path = consumeAuthOAuthPostLoginPath();
      if (path) navigate(path, { replace: true });
    };

    tryRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const path = consumeAuthOAuthPostLoginPath();
        if (path) navigate(path, { replace: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
}