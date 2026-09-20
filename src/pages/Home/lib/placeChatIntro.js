import { supabase } from '../../../shared/api/supabase';
import { apiClient } from './apiClient';
import { getPlaceChatIntroSystemPrompt } from './prompts';
import { MOONI_GEMINI } from '../../../utils/mooniChatModel';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';
import { MOONI_TOPIC_HINT } from './mooniQuickReplies';
import { i18n } from '../../../i18n/config';
import { normalizeAppLocale } from '../../../i18n/constants';
import { getMooniPromptBundle, fillMooniPromptTemplate } from '../../../i18n/mooniPromptBundles';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../../../components/PlaceCard/common/locationDisplay';
import {
  isSyntheticOrEmptyPlaceDesc,
  needsPlaceChatIntroHydration,
} from './placeDescText.js';
import { TRAVEL_SPOTS } from '../data/travelSpots.js';
import { resolveCatalogPlaceSlug } from './formatUrlName.js';

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

export function normalizeDestinationKey(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function resolveIntroLocale(lng = i18n.language) {
  return normalizeAppLocale(lng?.slice?.(0, 2) ?? lng);
}

/**
 * 무니·장소 채팅용 표시 라벨 — 「일본 쿠시로」/「Japan Kyoto」처럼 국가+지명.
 * placeholder 국가(Explore 등)·중복 표기는 생략.
 */
/** MOONi 칩·헤더 — slug 카탈로그 lookup 후 locale 표시명 */
export function localizeMooniPlaceLabel(place, lng = i18n.language) {
  if (!place) return '';
  const locale = resolveIntroLocale(lng);
  const catalogSlug = place.slug ? resolveCatalogPlaceSlug(place.slug) : null;
  if (catalogSlug) {
    const spot = TRAVEL_SPOTS.find((s) => s.slug === catalogSlug);
    if (spot) {
      const label = formatPlaceChatLabel(spot, locale);
      if (label) return label;
    }
  }
  return formatPlaceChatLabel(place, locale) || String(place.name || '').trim();
}

export function formatPlaceChatLabel(loc, lng = i18n.language) {
  if (!loc || typeof loc !== 'object') {
    return normalizeDestinationKey(loc);
  }
  const locale = resolveIntroLocale(lng);
  const name = normalizeDestinationKey(
    getLocalizedPlaceName(loc, locale) || loc.displayLabel || loc.name || '',
  );
  if (!name) return '';
  const country = normalizeDestinationKey(getLocalizedCountryName(loc, locale) || loc.country || '');
  if (!country || isPlaceholderCountry(country)) return name;
  if (name.includes(country) || country.includes(name)) return name;
  return `${country} ${name}`;
}

/** 장소카드 → 무니 boundSpot 시드 (SSOT slug 없어도 국가·지명 유지) */
export function buildMooniBoundSpotFromLocation(loc) {
  if (!loc?.name) return null;
  const displayLabel = formatPlaceChatLabel(loc);
  const rawSlug = typeof loc.slug === 'string' ? loc.slug.trim() : '';
  return {
    slug: rawSlug || null,
    name: String(loc.name).trim(),
    displayLabel,
    name_en: loc.name_en ?? null,
    country: isPlaceholderCountry(loc.country) ? null : (loc.country ?? null),
    country_en: isPlaceholderCountry(loc.country_en) ? null : (loc.country_en ?? null),
    lat: Number.isFinite(Number(loc.lat)) ? Number(loc.lat) : null,
    lng: Number.isFinite(Number(loc.lng)) ? Number(loc.lng) : null,
    uiPlace: Boolean(loc.uiPlace),
  };
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
    const s = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
    return s || null;
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

/** 조회·저장에 쓸 destination_key 후보 (이름 / 국가+이름 / displayLabel) */
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
  const keys = [];
  const push = (k) => {
    const n = normalizeDestinationKey(k);
    if (!isValidIntroDestination(n)) return;
    if (!keys.includes(n)) keys.push(n);
  };

  push(label);
  push(name);
  if (country && name && !isPlaceholderCountry(country) && !name.includes(country)) {
    push(`${country} ${name}`);
  }
  return keys;
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
    const text = String(data.summary).trim();
    if (text) {
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
  return null;
}

export async function persistPlaceChatIntroSummary(destinationDisplayName, summary, lng = i18n.language) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
  const storageKey = withPlaceChatIntroLocale(destinationKey, lng);
  const text = String(summary ?? '').trim();
  if (!isValidIntroDestination(destinationKey) || !text) return;

  savePlaceChatIntroLocal(destinationKey, text, lng);

  const { data: existing, error: selErr } = await supabase
    .from('place_chat_intro')
    .select('id')
    .eq('destination_key', storageKey)
    .maybeSingle();

  if (selErr) {
    console.warn('[place_chat_intro] select failed:', selErr);
    return;
  }

  const now = new Date().toISOString();
  if (existing?.id) {
    const { error } = await supabase
      .from('place_chat_intro')
      .update({ summary: text, updated_at: now })
      .eq('destination_key', storageKey);
    if (error) console.warn('[place_chat_intro] update failed:', error);
  } else {
    const { error } = await supabase.from('place_chat_intro').insert({
      destination_key: storageKey,
      summary: text,
      updated_at: now
    });
    if (error) console.warn('[place_chat_intro] insert failed:', error);
  }
}

export async function generatePlaceChatIntroWithAi(destinationDisplayName, lng = i18n.language) {
  const name = normalizeDestinationKey(destinationDisplayName);
  const bundle = getMooniPromptBundle(lng);
  if (!isValidIntroDestination(name)) {
    throw new Error(bundle.introInvalidDestination);
  }
  const system = getPlaceChatIntroSystemPrompt(lng);
  const userText = fillMooniPromptTemplate(bundle.introUser, { name });
  const raw = await apiClient.fetchProxyGemini(null, [], system, userText, [], MOONI_GEMINI.INTRO);
  return String(raw ?? '').trim();
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
  const generateLabel =
    typeof locOrName === 'string'
      ? normalizeDestinationKey(locOrName)
      : formatPlaceChatLabel(locOrName, lng) || primaryKey;

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
