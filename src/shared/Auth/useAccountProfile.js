import { useCallback, useEffect, useState } from 'react';
import { fetchUserProfile, supabase } from '../api/supabase';
import { PROFILE_UPDATED_EVENT, profileAvatarUrl, profileLabel } from './profileAvatar';

export function useAccountProfile() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [storedAvatar, setStoredAvatar] = useState('');

  const applyUser = useCallback(async (nextUser) => {
    setUser(nextUser || null);
    if (!nextUser?.id) {
      setDisplayName('');
      setStoredAvatar('');
      return;
    }
    const profile = await fetchUserProfile(nextUser.id);
    setDisplayName(typeof profile?.display_name === 'string' ? profile.display_name : '');
    setStoredAvatar(typeof profile?.avatar_url === 'string' ? profile.avatar_url : '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeApply = (next) => {
      if (!cancelled) void applyUser(next);
    };
    supabase.auth.getUser().then(({ data }) => safeApply(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      safeApply(session?.user ?? null);
    });
    const onProfile = () => {
      supabase.auth.getUser().then(({ data }) => safeApply(data.user));
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfile);
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfile);
    };
  }, [applyUser]);

  const avatarUrl = profileAvatarUrl(user) || profileAvatarUrl(storedAvatar);
  return {
    user,
    displayName,
    avatarUrl,
    label: profileLabel(displayName, user),
  };
}
