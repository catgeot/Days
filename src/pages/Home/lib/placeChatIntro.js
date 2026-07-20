import { supabase } from '../../../shared/api/supabase';
import { apiClient } from './apiClient';
import { getPlaceChatIntroSystemPrompt } from './prompts';
import { MOONI_GEMINI } from '../../../utils/mooniChatModel';
import { isPlaceholderCountry } from '../../../utils/travelSpotResolve';

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

export async function fetchPlaceChatIntroSummary(destinationDisplayName) {
  const destinationKey = normalizeDestinationKey(destinationDisplayName);
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

  const local = loadPlaceChatIntroLocal(destinationKey);
  if (local) return local;

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
  const userText = `여행지 이름: ${name}\n이 장소를 처음 듣는 사람에게 왜 가볼 만한지, 어떤 분위기·매력이 있는지 2~4문장으로 소개해줘.`;
  const raw = await apiClient.fetchProxyGemini(null, [], system, userText, [], MOONI_GEMINI.INTRO);
  return String(raw ?? '').trim();
}
