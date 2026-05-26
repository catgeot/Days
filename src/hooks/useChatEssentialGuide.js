import { useState, useEffect } from 'react';
import { supabase } from '../shared/api/supabase';
import {
  fetchToolkitRow,
  getEssentialGuide,
} from '../utils/toolkitPlaceIdResolve';
import { mergeCanonicalTravelSpot } from '../utils/travelSpotResolve';

/** slug별 툴킷 essential_guide — 채팅 CTA용 (세션 내 캐시) */
const guideCache = new Map();

/**
 * @param {string | null | undefined} slug
 * @param {string} [destinationName]
 * @returns {Record<string, unknown> | null}
 */
export function useChatEssentialGuide(slug, destinationName = '') {
  const [essentialGuide, setEssentialGuide] = useState(
    () => (slug ? guideCache.get(String(slug).toLowerCase()) ?? null : null)
  );

  useEffect(() => {
    const key = slug ? String(slug).trim().toLowerCase() : '';
    if (!key) {
      setEssentialGuide(null);
      return;
    }

    if (guideCache.has(key)) {
      setEssentialGuide(guideCache.get(key));
      return;
    }

    let cancelled = false;
    const location = mergeCanonicalTravelSpot({
      slug: key,
      name: destinationName || key,
    });

    (async () => {
      try {
        const row = await fetchToolkitRow(supabase, location);
        const guide = getEssentialGuide(row, location);
        guideCache.set(key, guide);
        if (!cancelled) setEssentialGuide(guide);
      } catch (err) {
        console.warn('[useChatEssentialGuide] fetch failed', key, err);
        guideCache.set(key, null);
        if (!cancelled) setEssentialGuide(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, destinationName]);

  return essentialGuide;
}

/**
 * CTA resolve 직전 호출 — 캐시 hit이면 동기, 없으면 DB 1회 조회.
 * @param {string | null | undefined} slug
 * @param {string} [destinationName]
 */
export async function ensureChatEssentialGuide(slug, destinationName = '') {
  const key = slug ? String(slug).trim().toLowerCase() : '';
  if (!key) return null;
  if (guideCache.has(key)) return guideCache.get(key);

  const location = mergeCanonicalTravelSpot({
    slug: key,
    name: destinationName || key,
  });

  try {
    const row = await fetchToolkitRow(supabase, location);
    const guide = getEssentialGuide(row, location);
    guideCache.set(key, guide);
    return guide;
  } catch (err) {
    console.warn('[ensureChatEssentialGuide] fetch failed', key, err);
    guideCache.set(key, null);
    return null;
  }
}

/** 테스트·캐시 초기화 */
export function clearChatEssentialGuideCache() {
  guideCache.clear();
}
