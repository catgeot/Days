import { supabase } from '../../../shared/api/supabase';
import { apiClient } from './apiClient';
import { getPlaceChatIntroSystemPrompt } from './prompts';
import { MOONI_GEMINI } from '../../../utils/mooniChatModel';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';
import { MOONI_TOPIC_HINT } from './mooniQuickReplies';
import {
  isSyntheticOrEmptyPlaceDesc,
  needsPlaceChatIntroHydration,
} from './placeDescText.js';

export { isSyntheticOrEmptyPlaceDesc, needsPlaceChatIntroHydration };

const LS_PREFIX = 'days_place_chat_intro:';

const INVALID_DESTINATIONS = new Set(['', 'new session', 'scanning...', 'mooni']);

export function normalizeDestinationKey(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * 무니·장소 채팅용 표시 라벨 — 「일본 쿠시로」처럼 국가+지명.
 * placeholder 국가(Explore 등)·중복 표기는 생략.
 */
export function formatPlaceChatLabel(loc) {
  if (!loc || typeof loc !== 'object') {
    return normalizeDestinationKey(loc);
  }
  const name = normalizeDestinationKey(loc.name || loc.displayLabel || '');
  if (!name) return '';
  const country = normalizeDestinationKey(loc.country || '');
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

function isValidIntroDestination(key) {
  const lower = key.trim().toLowerCase();
  return key.length > 0 && !INVALID_DESTINATIONS.has(lower);
}

function localStorageKey(destinationKey) {
  return `${LS_PREFIX}${encodeURIComponent(destinationKey)}`;
}

export function loadPlaceChatIntroLocal(destinationKey) {
  try {
    const raw = localStorage.getItem(localStorageKey(destinationKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const s = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';
    return s || null;
  } catch {
    return null;
  }
}

export function savePlaceChatIntroLocal(destinationKey, summary) {
  try {
    localStorage.setItem(
      localStorageKey(destinationKey),
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

  const hint = String(MOONI_TOPIC_HINT || '').trim();
  if (hint && body.endsWith(hint)) {
    body = body.slice(0, -hint.length).trim();
  } else if (hint) {
    const idx = body.lastIndexOf(hint);
    if (idx >= 0 && idx >= body.length - hint.length - 8) {
      body = body.slice(0, idx).trim();
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
export function buildPlaceChatIntroKeys(locOrName) {
  if (locOrName == null) return [];
  if (typeof locOrName === 'string') {
    const key = normalizeDestinationKey(locOrName);
    return isValidIntroDestination(key) ? [key] : [];
  }

  const name = normalizeDestinationKey(locOrName.name || locOrName.displayLabel || '');
  const label = normalizeDestinationKey(
    locOrName.displayLabel || formatPlaceChatLabel(locOrName)
  );
  const country = normalizeDestinationKey(locOrName.country || '');
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

async function fetchIntroByExactKey(destinationKey) {
  if (!isValidIntroDestination(destinationKey)) return null;

  const { data, error } = await supabase
    .from('place_chat_intro')
    .select('summary')
    .eq('destination_key', destinationKey)
    .maybeSingle();

  if (!error && data?.summary) {
    const text = String(data.summary).trim();
    if (text) {
      savePlaceChatIntroLocal(destinationKey, text);
      return text;
    }
  }

  return loadPlaceChatIntroLocal(destinationKey);
}

export async function fetchPlaceChatIntroSummary(destinationDisplayName) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
  if (!isValidIntroDestination(destinationKey)) return null;
  return fetchIntroByExactKey(destinationKey);
}

/** 여러 키 후보로 조회 후 써머리용 본문 반환 */
export async function fetchPlaceChatIntroSummaryForLocation(locOrName) {
  const keys = buildPlaceChatIntroKeys(locOrName);
  const placeName =
    typeof locOrName === 'string'
      ? locOrName
      : locOrName?.name || locOrName?.displayLabel || keys[0] || '';

  for (const key of keys) {
    const raw = await fetchIntroByExactKey(key);
    if (!raw) continue;
    const stripped = stripPlaceChatIntroForSummary(raw, placeName);
    if (stripped) return stripped;
  }
  return null;
}

export async function persistPlaceChatIntroSummary(destinationDisplayName, summary) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
  const text = String(summary ?? '').trim();
  if (!isValidIntroDestination(destinationKey) || !text) return;

  savePlaceChatIntroLocal(destinationKey, text);

  const { data: existing, error: selErr } = await supabase
    .from('place_chat_intro')
    .select('id')
    .eq('destination_key', destinationKey)
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
      .eq('destination_key', destinationKey);
    if (error) console.warn('[place_chat_intro] update failed:', error);
  } else {
    const { error } = await supabase.from('place_chat_intro').insert({
      destination_key: destinationKey,
      summary: text,
      updated_at: now
    });
    if (error) console.warn('[place_chat_intro] insert failed:', error);
  }
}

export async function generatePlaceChatIntroWithAi(destinationDisplayName) {
  const name = normalizeDestinationKey(destinationDisplayName);
  if (!isValidIntroDestination(name)) {
    throw new Error('유효하지 않은 여행지 이름입니다.');
  }
  const system = getPlaceChatIntroSystemPrompt();
  const userText = `여행지 이름: ${name}\n이 장소를 처음 듣는 사람에게 왜 가볼 만한지, 어떤 분위기·매력이 있는지 2~4문장으로 소개해줘. 위 여행지 이름 자체(예: 상위 도시·섬만)로 범위를 바꾸지 말고, 지정된 장소만 소개해줘.`;
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
  const { generateIfMissing = true } = options;
  const keys = buildPlaceChatIntroKeys(locOrName);
  if (!keys.length) return null;

  const cached = await fetchPlaceChatIntroSummaryForLocation(locOrName);
  if (cached) return cached;
  if (!generateIfMissing) return null;

  const primaryKey = keys[0];
  if (introEnsureFailed.has(primaryKey)) return null;

  const existing = introEnsureInflight.get(primaryKey);
  if (existing) return existing;

  const placeName =
    typeof locOrName === 'string'
      ? locOrName
      : locOrName?.name || locOrName?.displayLabel || primaryKey;
  const generateLabel =
    typeof locOrName === 'string'
      ? normalizeDestinationKey(locOrName)
      : formatPlaceChatLabel(locOrName) || primaryKey;

  const promise = (async () => {
    try {
      const raw = await generatePlaceChatIntroWithAi(generateLabel);
      if (!raw) {
        introEnsureFailed.add(primaryKey);
        return null;
      }
      await persistPlaceChatIntroSummary(generateLabel, raw);
      const stripped = stripPlaceChatIntroForSummary(raw, placeName);
      return stripped || null;
    } catch (err) {
      introEnsureFailed.add(primaryKey);
      console.warn('[place_chat_intro] ensure generate failed:', err);
      return null;
    } finally {
      introEnsureInflight.delete(primaryKey);
    }
  })();

  introEnsureInflight.set(primaryKey, promise);
  return promise;
}
