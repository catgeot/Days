import { supabase } from '../api/supabase';

/**
 * Session for UI and for the user id sent with RLS requests.
 * Do not call auth.getUser() here. auth-js deletes the stored session when
 * /user answers session_not_found, including on a transient miss, so a refresh
 * or a new window asks for login again.
 */
export async function readSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) return null;
  return data.session.user;
}

export function subscribeAuthUser(onUser) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    onUser(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}
