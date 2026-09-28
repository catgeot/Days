import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../shared/api/supabase';
import { nextLogbookLikeState, readLogbookLikeCount } from '../../../utils/logbookReactions';
import { fetchMyReportLikeIds, toggleReportLike } from '../lib/logbookReactionClient';

export function useLogbookLikes(reports, enabled) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [overrides, setOverrides] = useState({});
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const pendingRef = useRef(new Set());
  const likedIdsRef = useRef(likedIds);
  const overridesRef = useRef(overrides);
  likedIdsRef.current = likedIds;
  overridesRef.current = overrides;

  const idsKey = useMemo(() => {
    if (!enabled) return '';
    return (reports || []).map((report) => String(report?.id ?? '').trim()).filter(Boolean).join('\n');
  }, [enabled, reports]);

  useEffect(() => {
    if (!idsKey) {
      setLikedIds(new Set());
      return undefined;
    }
    let cancelled = false;
    const ids = idsKey.split('\n');
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) {
        if (!cancelled) setLikedIds(new Set());
        return;
      }
      const { ids: liked, missing } = await fetchMyReportLikeIds(supabase, user.id, ids);
      if (cancelled || missing) return;
      setLikedIds(new Set(liked));
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const resolveLike = useCallback((report) => {
    const id = String(report?.id ?? '');
    const serverCount = readLogbookLikeCount(report);
    if (!id || serverCount == null) return { likeCount: null, liked: false, pending: false };
    const override = overrides[id];
    return {
      likeCount: override ? override.likeCount : serverCount,
      liked: override ? override.liked : likedIds.has(id),
      pending: pendingIds.has(id),
    };
  }, [likedIds, overrides, pendingIds]);

  const toggleLike = useCallback(async (report) => {
    const id = String(report?.id ?? '').trim();
    const serverCount = readLogbookLikeCount(report);
    if (!id || serverCount == null || pendingRef.current.has(id)) return;

    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      pendingRef.current.delete(id);
      setPendingIds(new Set(pendingRef.current));
      if (window.confirm(t('logbook.reactions.loginConfirm'))) {
        const from = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        navigate('/auth/login', { state: { from } });
      }
      return;
    }

    const override = overridesRef.current[id];
    const current = {
      liked: override ? override.liked : likedIdsRef.current.has(id),
      likeCount: override ? override.likeCount : serverCount,
    };
    const next = nextLogbookLikeState(current);
    setOverrides((prev) => ({ ...prev, [id]: next }));
    const { error } = await toggleReportLike(supabase, {
      reportId: id,
      userId: user.id,
      liked: current.liked,
    });
    pendingRef.current.delete(id);
    setPendingIds(new Set(pendingRef.current));
    if (error) {
      setOverrides((prev) => ({ ...prev, [id]: { liked: current.liked, likeCount: current.likeCount } }));
      console.warn('[logbook] like', error.message);
      return;
    }
    setLikedIds((prev) => {
      const copy = new Set(prev);
      if (next.liked) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }, [navigate, t]);

  return { resolveLike, toggleLike };
}
