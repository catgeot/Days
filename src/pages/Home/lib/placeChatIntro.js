import { supabase } from '../../../shared/api/supabase.js';
import {
  isPlaceChatIntroKeyAccepted,
  isPlaceChatIntroSummaryAccepted,
} from './placeChatIntroLimits';
import { apiClient } from './apiClient';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';
import { MOONI_TOPIC_HINT } from './mooniQuickReplies';
import { i18n } from '../../../i18n/config';
import { normalizeAppLocale } from '../../../i18n/constants';
import { getMooniPromptBundle } from '../../../i18n/mooniPromptBundles';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../components/PlaceCard/common/locationDisplay';
import {
  isSyntheticOrEmptyPlaceDesc,
  needsPlaceChatIntroHydration,
} from './placeDescText.js';
import {
  buildMooniBoundSpotFromLocation,
  formatPlaceChatLabel,
  localizeMooniPlaceLabel,
  normalizeDestinationKey,
} from './mooniPlaceChatLabel.js';
import {
  sanitizeGeminiUserText,
} from '../../../../supabase/functions/_shared/gemini/answerSanitize.mjs';
import {
  buildPlaceChatIntroBareFallbackKeys,
  destinationKeyMatchesBareName,
  pickBareFallbackIntroFromRows,
} from './placeChatIntroBareFallback.js';

export { isSyntheticOrEmptyPlaceDesc, needsPlaceChatIntroHydration };

const LS_PREFIX = 'days_place_chat_intro:';
const INTRO_LOCALE_SUFFIX = { en: '@en' };

function introLocaleKey(lng = i18n.language) {
  const locale = normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
  return INTRO_LOCALE_SUFFIX[locale] ?? '';
}

/** DB·localStorage용 destination_key (locale 분리 — #19) */
export function withPlaceChatIntroLocale(destinationKey, lng = i18n.language) {
  const base = normalizeDestinationKey(destinationKey);
  const suffix = introLocaleKey(lng);
  return suffix && base ? `${base}${suffix}` : base;
}

function localStorageKey(destinationKey, lng = i18n.language) {
  return `${LS_PREFIX}${encodeURIComponent(withPlaceChatIntroLocale(destinationKey, lng))}`;
}

export {
  buildMooniBoundSpotFromLocation,
  formatPlaceChatLabel,
  localizeMooniPlaceLabel,
  normalizeDestinationKey,
} from './mooniPlaceChatLabel.js';

function resolveIntroLocale(lng = i18n.language) {
  return normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
}

const INVALID_DESTINATIONS = new Set(['', 'new session', 'scanning...', 'mooni']);

function isValidIntroDestination(key) {
  const lower = key.trim().toLowerCase();
  return key.length > 0 && !INVALID_DESTINATIONS.has(lower);
}

export function loadPlaceChatIntroLocal(destinationKey, lng = i18n.language) {
  try {
    const raw = localStorage.getItem(localStorageKey(destinationKey, lng));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = sanitizeGeminiUserText(typeof parsed?.summary === 'string' ? parsed.summary.trim() : '');
    if (!s || !isPlaceChatIntroSummaryAccepted(s)) {
      localStorage.removeItem(localStorageKey(destinationKey, lng));
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function savePlaceChatIntroLocal(destinationKey, summary, lng = i18n.language) {
  try {
    localStorage.setItem(
      localStorageKey(destinationKey, lng),
      JSON.stringify({ summary, savedAt: Date.now() })
    );
  } catch {
    // quota / private mode
  }
}

/**
 * place_chat_intro / 채팅 버블에서 장소 써머리에 쓸 본문만 추출.
 * - MOONI_TOPIC_HINT 푸터 제거
 * - 첫 줄이 지명(또는 국가+지명)만이면 제거
 */
export function stripPlaceChatIntroForSummary(text, placeName = '') {
  let body = String(text ?? '').trim();
  if (!body) return '';

  const hints = [
    i18n.t('mooni.chat.topicHint', { lng: 'ko' }),
    i18n.t('mooni.chat.topicHint', { lng: 'en' }),
    String(MOONI_TOPIC_HINT || '').trim(),
  ].filter((h, i, arr) => h && arr.indexOf(h) === i);

  for (const hint of hints) {
    if (body.endsWith(hint)) {
      body = body.slice(0, -hint.length).trim();
      break;
    }
    const idx = body.lastIndexOf(hint);
    if (idx >= 0 && idx >= body.length - hint.length - 8) {
      body = body.slice(0, idx).trim();
      break;
    }
  }

  const nameKeys = [
    normalizeDestinationKey(placeName),
    normalizeDestinationKey(placeName).replace(/^[^\s]+\s+/, ''), // 국가 접두 제거
  ].filter((k, i, arr) => k && arr.indexOf(k) === i);

  const lines = body.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && !/[.!?。]$/.test(lines[0]) && lines[0].length < 48) {
    const first = normalizeDestinationKey(lines[0]);
    // 지명 타이틀만 있는 첫 줄 제거 — 문장(마침표)이면 본문으로 유지
    if (nameKeys.some((k) => first === k)) {
      body = lines.slice(1).join('\n').trim();
    }
  }

  return body;
}

/**
 * 조회·저장에 쓸 destination_key 후보 (순서 = 조회 순서).
 * parentCity 있음: `{parentCity} {name}` → `{country} {name}` (PROD 118건) → bare는 fetchBareFallback(동명 1건일 때만).
 * parentCity 없음: label/name → `{country} {name}`.
 */
export function buildPlaceChatIntroKeys(locOrName, lng = i18n.language) {
  if (locOrName == null) return [];
  if (typeof locOrName === 'string') {
    const key = normalizeDestinationKey(locOrName);
    return isValidIntroDestination(key) ? [key] : [];
  }

  const locale = resolveIntroLocale(lng);
  const name = normalizeDestinationKey(
    getLocalizedPlaceName(locOrName, locale) || locOrName.displayLabel || locOrName.name || '',
  );
  const label = normalizeDestinationKey(
    locOrName.displayLabel || formatPlaceChatLabel(locOrName, lng),
  );
  const country = normalizeDestinationKey(
    getLocalizedCountryName(locOrName, locale) || locOrName.country || '',
  );
  const parentCity = normalizeDestinationKey(locOrName.parentCity || '');
  const keys = [];
  const push = (k) => {
    const n = normalizeDestinationKey(k);
    if (!isValidIntroDestination(n)) return;
    if (!keys.includes(n)) keys.push(n);
  };

  if (parentCity && name && !name.includes(parentCity)) {
    push(`${parentCity} ${name}`);
    if (country && !isPlaceholderCountry(country) && !name.includes(country)) {
      push(`${country} ${name}`);
    }
    return keys;
  }

  push(label);
  push(name);
  if (country && name && !isPlaceholderCountry(country) && !name.includes(country)) {
    push(`${country} ${name}`);
  }
  return keys;
}

async function fetchIntroRowsMatchingBareName(bareName) {
  const b = normalizeDestinationKey(bareName);
  if (!isValidIntroDestination(b)) return [];

  const exactKeys = [
    withPlaceChatIntroLocale(b, 'ko'),
    withPlaceChatIntroLocale(b, 'en'),
  ].filter((k, i, arr) => k && arr.indexOf(k) === i);

  const likeBase = `% ${b}`;
  const likeEn = `% ${b}@en`;

  const [exactRes, suffixedRes, suffixedEnRes] = await Promise.all([
    supabase.from('place_chat_intro').select('destination_key, summary').in('destination_key', exactKeys),
    supabase.from('place_chat_intro').select('destination_key, summary').ilike('destination_key', likeBase),
    supabase.from('place_chat_intro').select('destination_key, summary').ilike('destination_key', likeEn),
  ]);

  const byKey = new Map();
  for (const row of [
    ...(exactRes.data ?? []),
    ...(suffixedRes.data ?? []),
    ...(suffixedEnRes.data ?? []),
  ]) {
    if (!destinationKeyMatchesBareName(row.destination_key, b)) continue;
    byKey.set(row.destination_key, row);
  }
  return [...byKey.values()];
}

async function fetchBareFallbackIntroSummary(locOrName, lng, placeName) {
  const bareKeys = buildPlaceChatIntroBareFallbackKeys(locOrName, lng);
  for (const bareKey of bareKeys) {
    const rows = await fetchIntroRowsMatchingBareName(bareKey);
    const picked = pickBareFallbackIntroFromRows(rows, bareKey, lng);
    if (!picked) continue;

    const text = sanitizeGeminiUserText(picked.summary);
    if (!text || !isPlaceChatIntroSummaryAccepted(text)) continue;

    savePlaceChatIntroLocal(picked.logicalKey, text, picked.lngUsed);
    const stripped = stripPlaceChatIntroForSummary(text, placeName);
    if (stripped) return stripped;
  }
  return null;
}

async function fetchIntroByExactKey(destinationKey, lng = i18n.language) {
  const storageKey = withPlaceChatIntroLocale(destinationKey, lng);
  if (!isValidIntroDestination(destinationKey)) return null;

  const { data, error } = await supabase
    .from('place_chat_intro')
    .select('summary')
    .eq('destination_key', storageKey)
    .maybeSingle();

  if (!error && data?.summary) {
    const text = sanitizeGeminiUserText(String(data.summary).trim());
    if (text && isPlaceChatIntroSummaryAccepted(text)) {
      savePlaceChatIntroLocal(destinationKey, text, lng);
      return text;
    }
  }

  return loadPlaceChatIntroLocal(destinationKey, lng);
}

export async function fetchPlaceChatIntroSummary(destinationDisplayName, lng = i18n.language) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
  if (!isValidIntroDestination(destinationKey)) return null;
  return fetchIntroByExactKey(destinationKey, lng);
}

/** 여러 키 후보로 조회 후 써머리용 본문 반환 */
export async function fetchPlaceChatIntroSummaryForLocation(locOrName, lng = i18n.language) {
  const keys = buildPlaceChatIntroKeys(locOrName, lng);
  const locale = resolveIntroLocale(lng);
  const placeName =
    typeof locOrName === 'string'
      ? locOrName
      : getLocalizedPlaceName(locOrName, locale) ||
        locOrName?.displayLabel ||
        locOrName?.name ||
        keys[0] ||
        '';

  for (const key of keys) {
    const raw = await fetchIntroByExactKey(key, lng);
    if (!raw) continue;
    const stripped = stripPlaceChatIntroForSummary(raw, placeName);
    if (stripped) return stripped;
  }

  if (typeof locOrName === 'object' && locOrName?.parentCity) {
    return fetchBareFallbackIntroSummary(locOrName, lng, placeName);
  }
  return null;
}

export async function persistPlaceChatIntroSummary(destinationDisplayName, summary, lng = i18n.language) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
  const storageKey = withPlaceChatIntroLocale(destinationKey, lng);
  const text = sanitizeGeminiUserText(String(summary ?? '').trim());
  if (!isValidIntroDestination(destinationKey) || !text) return;
  if (!isPlaceChatIntroKeyAccepted(storageKey) || !isPlaceChatIntroSummaryAccepted(text)) return;

  savePlaceChatIntroLocal(destinationKey, text, lng);

  const { data, error } = await supabase.rpc('save_place_chat_intro', {
    p_destination_key: storageKey,
    p_summary: text,
  });
  if (error) {
    console.warn('[place_chat_intro] save_place_chat_intro failed:', error);
    return;
  }
  if (data === false) return;
}

export async function generatePlaceChatIntroWithAi(destinationDisplayName, lng = i18n.language) {
  const name = normalizeDestinationKey(destinationDisplayName);
  const bundle = getMooniPromptBundle(lng);
  if (!isValidIntroDestination(name)) {
    throw new Error(bundle.introInvalidDestination);
  }
  try {
    const raw = await apiClient.invokeGeminiTask('place_intro', {
      locale: lng,
      placeName: name,
    });
    const text = sanitizeGeminiUserText(String(raw?.text ?? '').trim());
    if (!isPlaceChatIntroSummaryAccepted(text)) return '';
    return text;
  } catch (err) {
    console.warn('[place_chat_intro] place_intro generate failed:', err);
    return '';
  }
}

/**
 * AI 생성·persist에 쓸 destination_key (항상 primary lookup key — fallback 키로 저장하지 않음).
 * parentCity 있으면 `{parentCity} {name}`만; country+name·bare는 조회 전용.
 */
export function resolvePlaceChatIntroPersistKey(locOrName, lng = i18n.language) {
  const keys = buildPlaceChatIntroKeys(locOrName, lng);
  if (!keys.length) return null;
  const primaryKey = keys[0];
  const parentCity =
    typeof locOrName === 'object' ? normalizeDestinationKey(locOrName?.parentCity || '') : '';
  if (typeof locOrName === 'string') {
    return normalizeDestinationKey(locOrName);
  }
  return (parentCity && primaryKey) || formatPlaceChatLabel(locOrName, lng) || primaryKey;
}

/** @returns {string[]} lookup-only keys (country+name, bare) — never used for AI persist */
export function placeChatIntroFallbackOnlyKeys(locOrName, lng = i18n.language) {
  if (!locOrName || typeof locOrName !== 'object' || !locOrName.parentCity) return [];
  const keys = buildPlaceChatIntroKeys(locOrName, lng);
  const bare = buildPlaceChatIntroBareFallbackKeys(locOrName, lng);
  return [...new Set([...keys.slice(1), ...bare].filter(Boolean))];
}

/** 동시 방문·탭 전환 시 동일 키 AI 재호출 방지 */
const introEnsureInflight = new Map();
/** 생성 실패 키 — 세션 내 재시도 폭주 방지 (캐시 hit는 계속 조회) */
const introEnsureFailed = new Set();

/**
 * place_chat_intro 조회 → 없으면 AI 생성·저장 → 써머리용 본문.
 * @param {object|string} locOrName
 * @param {{ generateIfMissing?: boolean }} [options]
 * @returns {Promise<string|null>}
 */
export async function ensurePlaceChatIntroForLocation(locOrName, options = {}) {
  const { generateIfMissing = true, lng = i18n.language } = options;
  const keys = buildPlaceChatIntroKeys(locOrName, lng);
  if (!keys.length) return null;

  const cached = await fetchPlaceChatIntroSummaryForLocation(locOrName, lng);
  if (cached) return cached;
  if (!generateIfMissing) return null;

  const primaryKey = keys[0];
  const inflightKey = `${introLocaleKey(lng)}:${primaryKey}`;
  if (introEnsureFailed.has(inflightKey)) return null;

  const existing = introEnsureInflight.get(inflightKey);
  if (existing) return existing;

  const locale = resolveIntroLocale(lng);
  const placeName =
    typeof locOrName === 'string'
      ? locOrName
      : getLocalizedPlaceName(locOrName, locale) ||
        locOrName?.displayLabel ||
        locOrName?.name ||
        primaryKey;
  const generateLabel = resolvePlaceChatIntroPersistKey(locOrName, lng);
  if (!generateLabel) return null;

  const promise = (async () => {
    try {
      const raw = await generatePlaceChatIntroWithAi(generateLabel, lng);
      if (!raw) {
        introEnsureFailed.add(inflightKey);
        return null;
      }
      await persistPlaceChatIntroSummary(generateLabel, raw, lng);
      const stripped = stripPlaceChatIntroForSummary(raw, placeName);
      return stripped || null;
    } catch (err) {
      introEnsureFailed.add(inflightKey);
      console.warn('[place_chat_intro] ensure generate failed:', err);
      return null;
    } finally {
      introEnsureInflight.delete(inflightKey);
    }
  })();

  introEnsureInflight.set(inflightKey, promise);
  return promise;
}
