import { isGateoMooniScopedFestivalEnabled } from '../../../shared/gateoFeatureFlags.js';
import {
  MOONI_GENERAL_CHAT_MAX_AGE_MS,
  resolveMooniChatScope,
} from './mooniChatScope.js';

const MOONI_LAST_CHAT_SESSION_KEY = 'gateo_mooni_last_chat_id';
const MOONI_LAST_CHAT_LOCAL_KEY = 'gateo_mooni_last_chat_id';
const MOONI_LAST_CHAT_SAVED_AT_SESSION_KEY = 'gateo_mooni_last_chat_saved_at';
const MOONI_LAST_CHAT_SAVED_AT_LOCAL_KEY = 'gateo_mooni_last_chat_saved_at';

/** 로그인 유저는 userId별 localStorage — 배포 후 재접속·다른 탭에서도 MOONi 대화 복원 */
export function mooniLastChatStorageKey(userId) {
  return userId ? `${MOONI_LAST_CHAT_LOCAL_KEY}_${userId}` : MOONI_LAST_CHAT_LOCAL_KEY;
}

function mooniLastChatSavedAtStorageKey(userId) {
  return userId
    ? `${MOONI_LAST_CHAT_SAVED_AT_LOCAL_KEY}_${userId}`
    : MOONI_LAST_CHAT_SAVED_AT_LOCAL_KEY;
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

function encodeScopedEntry(chatId, savedAt = Date.now()) {
  return JSON.stringify({ id: String(chatId), savedAt: Number(savedAt) });
}

function readLegacySavedAt(userId) {
  const sessionRaw = sessionStorage.getItem(MOONI_LAST_CHAT_SAVED_AT_SESSION_KEY);
  if (sessionRaw != null && sessionRaw !== '') {
    const fromSession = Number(sessionRaw);
    if (Number.isFinite(fromSession)) return fromSession;
  }
  const localRaw = localStorage.getItem(mooniLastChatSavedAtStorageKey(userId));
  if (localRaw != null && localRaw !== '') {
    const fromLocal = Number(localRaw);
    if (Number.isFinite(fromLocal)) return fromLocal;
  }
  return undefined;
}

function parseLegacyMooniLastChatRaw(raw) {
  if (raw == null || raw === '') return null;
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      const id = parsed?.id != null ? String(parsed.id) : '';
      if (!id) return null;
      const savedAt = Number(parsed.savedAt);
      return { id, savedAt: Number.isFinite(savedAt) ? savedAt : undefined };
    } catch {
      return null;
    }
  }
  const id = String(raw).trim();
  if (!id) return null;
  return { id, savedAt: undefined };
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
  const now = Date.now();
  const payload = scope ? encodeScopedEntry(id, now) : id;
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
  const sessionRaw = sessionStorage.getItem(MOONI_LAST_CHAT_SESSION_KEY);
  const userLocalRaw = userId ? localStorage.getItem(mooniLastChatStorageKey(userId)) : null;
  const guestLocalRaw = localStorage.getItem(MOONI_LAST_CHAT_LOCAL_KEY);

  /** @type {'session' | 'local-user' | 'local-guest' | null} */
  let source = null;
  let parsed = null;

  if (sessionRaw) {
    parsed = parseLegacyMooniLastChatRaw(sessionRaw);
    if (parsed?.id) source = 'session';
  }
  if (!parsed?.id && userId && userLocalRaw) {
    parsed = parseLegacyMooniLastChatRaw(userLocalRaw);
    if (parsed?.id) source = 'local-user';
  }
  if (!parsed?.id && guestLocalRaw) {
    parsed = parseLegacyMooniLastChatRaw(guestLocalRaw);
    if (parsed?.id) source = 'local-guest';
  }

  if (!parsed?.id || !source) return null;

  const savedAt =
    parsed.savedAt ??
    readLegacySavedAt(source === 'local-user' ? userId : source === 'local-guest' ? null : userId) ??
    0;

  const payload = encodeScopedEntry(parsed.id, savedAt);
  try {
    sessionStorage.setItem(sessionKeyForScope('general'), payload);
    localStorage.setItem(localKeyForScope(userId, 'general'), payload);
    if (source === 'session') {
      sessionStorage.removeItem(MOONI_LAST_CHAT_SESSION_KEY);
      sessionStorage.removeItem(MOONI_LAST_CHAT_SAVED_AT_SESSION_KEY);
    } else if (source === 'local-user' && userId) {
      localStorage.removeItem(mooniLastChatStorageKey(userId));
      localStorage.removeItem(mooniLastChatSavedAtStorageKey(userId));
    } else if (source === 'local-guest') {
      localStorage.removeItem(MOONI_LAST_CHAT_LOCAL_KEY);
      localStorage.removeItem(mooniLastChatSavedAtStorageKey(null));
    }
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
