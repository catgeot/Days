const MOONI_LAST_CHAT_SESSION_KEY = 'gateo_mooni_last_chat_id';
const MOONI_LAST_CHAT_LOCAL_KEY = 'gateo_mooni_last_chat_id';

/** 로그인 유저는 userId별 localStorage — 배포 후 재접속·다른 탭에서도 MOONi 대화 복원 */
export function mooniLastChatStorageKey(userId) {
  return userId ? `${MOONI_LAST_CHAT_LOCAL_KEY}_${userId}` : MOONI_LAST_CHAT_LOCAL_KEY;
}

export function persistMooniLastChatId(chatId, userId) {
  if (chatId == null || chatId === '') return;
  const id = String(chatId);
  try {
    sessionStorage.setItem(MOONI_LAST_CHAT_SESSION_KEY, id);
    localStorage.setItem(mooniLastChatStorageKey(userId), id);
  } catch {
    // private mode
  }
}

export function readMooniLastChatId(userId) {
  try {
    return (
      sessionStorage.getItem(MOONI_LAST_CHAT_SESSION_KEY) ||
      localStorage.getItem(mooniLastChatStorageKey(userId)) ||
      localStorage.getItem(MOONI_LAST_CHAT_LOCAL_KEY)
    );
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
