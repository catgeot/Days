import { useState, useEffect } from 'react';
import { supabase } from '../shared/api/supabase';
import {
  fetchToolkitRow,
  getEssentialGuide,
} from '../utils/toolkitPlaceIdResolve';
import { mergeCanonicalTravelSpot } from '../utils/travelSpotResolve';
import { i18n } from '../i18n/config';
import { normalizeAppLocale } from '../i18n/constants';

/** slug·locale별 툴킷 essential_guide — 채팅 CTA용 (세션 내 캐시) */
const guideCache = new Map();

function guideCacheKey(slug, locale = i18n.language) {
  return `${String(slug).trim().toLowerCase()}:${normalizeAppLocale(locale)}`;
}

/**
 * @param {string | null | undefined} slug
 * @param {string} [destinationName]
 * @returns {Record<string, unknown> | null}
 */
export function useChatEssentialGuide(slug, destinationName = '') {
  const appLocale = normalizeAppLocale(i18n.language);
  const [essentialGuide, setEssentialGuide] = useState(() => {
    const key = slug ? guideCacheKey(slug, appLocale) : '';
    return key ? guideCache.get(key) ?? null : null;
  });

  useEffect(() => {
    const key = slug ? String(slug).trim().toLowerCase() : '';
    if (!key) {
      setEssentialGuide(null);
      return;
    }

    const cacheKey = guideCacheKey(key, appLocale);
    if (guideCache.has(cacheKey)) {
      setEssentialGuide(guideCache.get(cacheKey));
      return;
    }

    let cancelled = false;
    const location = mergeCanonicalTravelSpot({
      slug: key,
      name: destinationName || key,
    });

    (async () => {
      try {
        const row = await fetchToolkitRow(supabase, location, appLocale);
        const guide = getEssentialGuide(row, location, appLocale);
        guideCache.set(cacheKey, guide);
        if (!cancelled) setEssentialGuide(guide);
      } catch (err) {
        console.warn('[useChatEssentialGuide] fetch failed', key, err);
        guideCache.set(cacheKey, null);
        if (!cancelled) setEssentialGuide(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, destinationName, appLocale]);

  return essentialGuide;
}

/**
 * CTA resolve 직전 호출 — 캐시 hit이면 동기, 없으면 DB 1회 조회.
 * @param {string | null | undefined} slug
 * @param {string} [destinationName]
 */
export async function ensureChatEssentialGuide(slug, destinationName = '', locale = i18n.language) {
  const key = slug ? String(slug).trim().toLowerCase() : '';
  if (!key) return null;
  const appLocale = normalizeAppLocale(locale);
  const cacheKey = guideCacheKey(key, appLocale);
  if (guideCache.has(cacheKey)) return guideCache.get(cacheKey);

  const location = mergeCanonicalTravelSpot({
    slug: key,
    name: destinationName || key,
  });

  try {
    const row = await fetchToolkitRow(supabase, location, appLocale);
    const guide = getEssentialGuide(row, location, appLocale);
    guideCache.set(cacheKey, guide);
    return guide;
  } catch (err) {
    console.warn('[ensureChatEssentialGuide] fetch failed', key, err);
    guideCache.set(cacheKey, null);
    return null;
  }
}

/** 테스트·캐시 초기화 */
export function clearChatEssentialGuideCache() {
  guideCache.clear();
}
