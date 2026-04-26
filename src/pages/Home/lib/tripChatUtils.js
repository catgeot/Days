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
