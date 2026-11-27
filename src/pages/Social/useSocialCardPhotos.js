import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchSocialTargetPhotoUrl,
  resolveSocialCardPhotoUrl,
  socialPhotoCreditFor,
  syncSocialTargetPhotoUrl,
} from './socialLinksTargetPhoto.js';

function stableCardsKey(cards) {
  return (Array.isArray(cards) ? cards : [])
    .map((card) => {
      const target = card?.targets?.[0];
      const targetKey =
        target?.type === 'festival'
          ? `festival:${target?.id || ''}`
          : `place:${target?.slug || ''}`;
      return [card?.campaignId || '', card?.photoUrl || '', targetKey].join('\t');
    })
    .join('\n');
}

/**
 * @param {object[]} cards
 */
export function useSocialCardPhotos(cards) {
  const source = Array.isArray(cards) ? cards : [];
  const cardsKey = stableCardsKey(source);
  const [remoteUrls, setRemoteUrls] = useState({});
  const [broken, setBroken] = useState({});
  const attemptedRef = useRef(new Set());

  const syncKeyed = useMemo(() => {
    /** @type {Record<string, string>} */
    const map = {};
    for (const card of source) {
      const id = String(card?.campaignId || '');
      if (!id || card?.photoUrl) continue;
      const url = syncSocialTargetPhotoUrl(card?.targets?.[0]);
      if (url) map[id] = url;
    }
    return map;
  }, [cardsKey]);

  useEffect(() => {
    attemptedRef.current = new Set();
    setRemoteUrls({});
    setBroken({});
  }, [cardsKey]);

  useEffect(() => {
    if (globalThis.__GATEO_DISABLE_SOCIAL_PHOTO_FETCH__) return undefined;
    let cancelled = false;
    const pending = source.filter((card) => {
      if (card?.photoUrl) return false;
      const id = String(card?.campaignId || '');
      if (!id) return false;
      if (syncKeyed[id] || attemptedRef.current.has(id)) return false;
      return Boolean(card?.targets?.[0]);
    });
    if (!pending.length) return undefined;

    for (const card of pending) {
      attemptedRef.current.add(String(card.campaignId));
    }

    let disposed = false;
    (async () => {
      const updates = {};
      await Promise.all(
        pending.map(async (card) => {
          if (disposed) return;
          const id = String(card.campaignId);
          const url = await fetchSocialTargetPhotoUrl(card.targets[0]);
          if (url) updates[id] = url;
        }),
      );
      if (disposed || cancelled || !Object.keys(updates).length) return;
      setRemoteUrls((prev) => ({ ...prev, ...updates }));
    })();

    return () => {
      cancelled = true;
      disposed = true;
    };
  }, [cardsKey, syncKeyed]);

  const photoForCard = (card) => {
    const id = String(card?.campaignId || '');
    const url =
      resolveSocialCardPhotoUrl(card) ||
      remoteUrls[id] ||
      '';
    if (broken[id]) return { url: '', credit: null };
    const primary = card?.targets?.[0] || null;
    const credit =
      card?.photoCredit ||
      socialPhotoCreditFor(url, primary?.imageCredit);
    return { url, credit };
  };

  const markBroken = (campaignId) => {
    const id = String(campaignId || '');
    if (!id) return;
    setBroken((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  return { photoForCard, markBroken };
}