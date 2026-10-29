import { isGateoMooniScopedFestivalEnabled } from '../../../shared/gateoFeatureFlags.js';
import {
  MOONI_GENERAL_CHAT_MAX_AGE_MS,
  resolveMooniChatScope,
} from './mooniChatScope.js';

const MOONI_LAST_CHAT_SESSION_KEY = 'gateo_mooni_last_chat_id';
const MOONI_LAST_CHAT_LOCAL_KEY = 'gateo_mooni_last_chat_id';

/** 로그인 유저는 userId별 localStorage — 배포 후 재접속·다른 탭에서도 MOONi 대화 복원 */
export function mooniLastChatStorageKey(userId) {
  return userId ? `${MOONI_LAST_CHAT_LOCAL_KEY}_${userId}` : MOONI_LAST_CHAT_LOCAL_KEY;
}

function resolvePersistScope(scopeOrContext) {
  if (!isGateoMooniScopedFestivalEnabled()) return null;
  if (typeof scopeOrContext === 'string' && scopeOrContext.trim()) {
    return scopeOrContext.trim();
  }
  return resolveMooniChatScope(
    scopeOrContext && typeof scopeOrContext === 'object' ? scopeOrContext : {},
  );
}

function sessionKeyForScope(scope) {
  if (!scope) return MOONI_LAST_CHAT_SESSION_KEY;
  return `${MOONI_LAST_CHAT_SESSION_KEY}:${scope}`;
}

function localKeyForScope(userId, scope) {
  const base = mooniLastChatStorageKey(userId);
  if (!scope) return base;
  return `${base}:${scope}`;
}

function encodeScopedEntry(chatId) {
  return JSON.stringify({ id: String(chatId), savedAt: Date.now() });
}

/**
 * @param {string | null} raw
 * @param {string | null} scope
 */
export function decodeMooniScopedLastChatEntry(raw, scope) {
  if (raw == null || raw === '') return null;
  if (!isGateoMooniScopedFestivalEnabled()) return String(raw);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return String(raw);
  }
  const id = parsed?.id != null ? String(parsed.id) : '';
  if (!id) return null;
  if (scope === 'general') {
    const savedAt = Number(parsed.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > MOONI_GENERAL_CHAT_MAX_AGE_MS) {
      return null;
    }
  }
  return id;
}

/**
 * @param {string | number | null | undefined} chatId
 * @param {string | null | undefined} userId
 * @param {string | { boundSpot?: object, mooniPlaceContext?: object } | null} [scopeOrContext]
 */
export function persistMooniLastChatId(chatId, userId, scopeOrContext = null) {
  if (chatId == null || chatId === '') return;
  const id = String(chatId);
  const scope = resolvePersistScope(scopeOrContext);
  const payload = scope ? encodeScopedEntry(id) : id;
  try {
    sessionStorage.setItem(sessionKeyForScope(scope), payload);
    localStorage.setItem(localKeyForScope(userId, scope), payload);
  } catch {
    // private mode
  }
}

function readLegacyMooniLastChatId(userId) {
  return (
    sessionStorage.getItem(MOONI_LAST_CHAT_SESSION_KEY) ||
    localStorage.getItem(mooniLastChatStorageKey(userId)) ||
    localStorage.getItem(MOONI_LAST_CHAT_LOCAL_KEY)
  );
}

function migrateLegacyMooniLastChatToGeneral(userId) {
  const legacyRaw = readLegacyMooniLastChatId(userId);
  if (legacyRaw == null || legacyRaw === '') return null;
  if (legacyRaw.startsWith('{')) return null;
  const id = String(legacyRaw).trim();
  if (!id) return null;
  const payload = encodeScopedEntry(id);
  try {
    sessionStorage.setItem(sessionKeyForScope('general'), payload);
    localStorage.setItem(localKeyForScope(userId, 'general'), payload);
    sessionStorage.removeItem(MOONI_LAST_CHAT_SESSION_KEY);
    localStorage.removeItem(mooniLastChatStorageKey(userId));
    localStorage.removeItem(MOONI_LAST_CHAT_LOCAL_KEY);
  } catch {
    // private mode
  }
  return decodeMooniScopedLastChatEntry(payload, 'general');
}

/**
 * @param {string | null | undefined} userId
 * @param {string | { boundSpot?: object, mooniPlaceContext?: object } | null} [scopeOrContext]
 */
export function readMooniLastChatId(userId, scopeOrContext = null) {
  const scope = resolvePersistScope(scopeOrContext);
  try {
    if (!scope) {
      return readLegacyMooniLastChatId(userId);
    }
    const sessionRaw = sessionStorage.getItem(sessionKeyForScope(scope));
    const fromSession = decodeMooniScopedLastChatEntry(sessionRaw, scope);
    if (fromSession) return fromSession;
    const localRaw = localStorage.getItem(localKeyForScope(userId, scope));
    const fromLocal = decodeMooniScopedLastChatEntry(localRaw, scope);
    if (fromLocal) return fromLocal;
    if (scope === 'general') {
      return migrateLegacyMooniLastChatToGeneral(userId);
    }
    return null;
  } catch {
    return null;
  }
}

export function findTripById(trips, id) {
  if (id == null || id === '') return null;
  return trips.find((t) => String(t.id) === String(id)) ?? null;
}

/**
 * saved_trips row: 사이드바/지도 말풍선에 "대화"로 표시할 DB 내용이 있는지.
 * (빈 [] 또는 개설만 한 행은 제외)
 */
export function tripHasPersistedDialogue(trip) {
  const m = trip?.messages;
  if (!Array.isArray(m) || m.length === 0) return false;
  return m.some(
    (msg) =>
      msg &&
      (msg.role === "user" || msg.role === "model") &&
      String(
        typeof msg.text === "object" ? msg.text?.text ?? "" : msg.text ?? ""
      ).trim().length > 0
  );
}
