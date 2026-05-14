import { supabase } from '../../../shared/api/supabase';
import { apiClient } from './apiClient';
import { getPlaceChatIntroSystemPrompt } from './prompts';

const LS_PREFIX = 'days_place_chat_intro:';

const INVALID_DESTINATIONS = new Set(['', 'new session', 'scanning...']);

export function normalizeDestinationKey(name) {
  return String(name ?? '')
    .trim()
    .replace(/\s+/g, ' ');
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
  const raw = await apiClient.fetchProxyGemini(null, [], system, userText, [], 'gemini-2.5-flash');
  return String(raw ?? '').trim();
}
