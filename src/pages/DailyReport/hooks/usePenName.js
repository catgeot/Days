import { useState, useEffect, useCallback } from 'react';
import { supabase, fetchUserProfile } from '../../../shared/api/supabase';

const MAX_LEN = 40;

/**
 * 공개 로그북·리뷰와 동일하게 `profiles.display_name`에 필명을 저장합니다.
 */
export function usePenName(user) {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setDisplayName('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const p = await fetchUserProfile(user.id);
    setDisplayName(typeof p?.display_name === 'string' ? p.display_name : '');
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (!user?.id) return { ok: false };
    setSaving(true);
    const trimmed = displayName.trim().slice(0, MAX_LEN);
    const payload = {
      id: user.id,
      display_name: trimmed || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    setSaving(false);

    if (error) {
      console.warn('[PenName] save failed:', error);
      return { ok: false, error };
    }
    return { ok: true };
  }, [user?.id, displayName]);

  return {
    displayName,
    setDisplayName,
    loading,
    saving,
    save,
    reload: load,
    maxLen: MAX_LEN,
  };
}
