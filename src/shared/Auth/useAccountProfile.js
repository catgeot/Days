import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchUserProfile } from '../api/supabase';
import { readSessionUser, subscribeAuthUser } from './sessionUser.js';
import {
  PROFILE_UPDATED_EVENT,
  ownerProfilePhotos,
  ownerProfilePublic,
  profileLabel,
} from './profileAvatar';

export function useAccountProfile() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [profile, setProfile] = useState(null);

  const applyUser = useCallback(async (nextUser) => {
    setUser(nextUser || null);
    if (!nextUser?.id) {
      setDisplayName('');
      setProfile(null);
      return;
    }
    const nextProfile = await fetchUserProfile(nextUser.id);
    setProfile(nextProfile);
    setDisplayName(typeof nextProfile?.display_name === 'string' ? nextProfile.display_name : '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeApply = (next) => {
      if (!cancelled) void applyUser(next);
    };
    const unsubscribe = subscribeAuthUser(safeApply);
    const onProfile = () => {
      readSessionUser().then(safeApply);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfile);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfile);
    };
  }, [applyUser]);

  const photos = useMemo(() => ownerProfilePhotos(profile, user), [profile, user]);
  const profilePublic = ownerProfilePublic(profile, user);
  return {
    user,
    displayName,
    avatarUrl: photos[0] || '',
    photos,
    photoCount: photos.length,
    profilePublic,
    label: profileLabel(displayName, user),
  };
}
