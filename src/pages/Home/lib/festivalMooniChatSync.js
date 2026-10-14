/** Guards ChatModal trip/draft hydration from clobbering a newer in-memory thread. */

function messageBody(message) {
  if (!message) return '';
  if (typeof message.text === 'object') return String(message.text?.text || '');
  return String(message.text || '');
}

/** Stable compare key for last-turn staleness (no server message ids). */
export function mooniMessageStableKey(message) {
  if (!message) return '';
  const role = String(message.role || '');
  const body = messageBody(message).replace(/\s+/g, ' ').trim().slice(0, 240);
  const raw = String(message.mooniRawReply || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const seq = message.mooniSeq != null ? String(message.mooniSeq) : '';
  const at = message.mooniAt != null ? String(message.mooniAt) : '';
  return `${role}|${seq}|${at}|${raw || body}`;
}

export function mooniThreadTailFingerprint(messages) {
  const arr = Array.isArray(messages) ? messages : [];
  const len = arr.length;
  if (!len) return 'len:0';
  const last = arr[len - 1];
  return `len:${len}|${mooniMessageStableKey(last)}`;
}

/**
 * Trip row is older than the in-memory thread (same length but weaker last turn).
 */
export function isTripThreadStaleVersusLocal(tripMessages, localMessages) {
  const trip = Array.isArray(tripMessages) ? tripMessages : [];
  const local = Array.isArray(localMessages) ? localMessages : [];
  if (trip.length < local.length) return true;
  if (trip.length > local.length) return false;
  if (!trip.length) return false;
  const tKey = mooniMessageStableKey(trip[trip.length - 1]);
  const lKey = mooniMessageStableKey(local[local.length - 1]);
  if (tKey === lKey) return false;
  const lLast = local[local.length - 1];
  const tLast = trip[trip.length - 1];
  if (lLast?.role === 'model' && tLast?.role !== 'model') return true;
  if (lLast?.role === 'model' && tLast?.role === 'model' && lKey !== tKey) {
    const lAt = Number(lLast.mooniAt) || 0;
    const tAt = Number(tLast.mooniAt) || 0;
    if (lAt && tAt) return lAt > tAt;
    return messageBody(lLast).length > messageBody(tLast).length;
  }
  if (lLast?.role === 'user' && tLast?.role === 'user' && lKey !== tKey) {
    return messageBody(lLast).length > messageBody(tLast).length;
  }
  return false;
}

/** Model answer or guidance bubble that the DB row does not contain yet. */
export function localProtectedTailMissing(localMessages, tripMessages) {
  const local = Array.isArray(localMessages) ? localMessages : [];
  if (!local.length) return false;
  const last = local[local.length - 1];
  const protectedTail = last?.role === 'model' || last?.role === 'error' || last?.mooniGuidance === true;
  if (!protectedTail) return false;
  const key = mooniMessageStableKey(last);
  if (!key) return false;
  const trip = Array.isArray(tripMessages) ? tripMessages : [];
  return !trip.some((message) => mooniMessageStableKey(message) === key);
}

function tripIsPrefixOfLocal(tripMessages, localMessages) {
  const trip = Array.isArray(tripMessages) ? tripMessages : [];
  const local = Array.isArray(localMessages) ? localMessages : [];
  if (trip.length > local.length) return false;
  for (let i = 0; i < trip.length; i += 1) {
    if (mooniMessageStableKey(trip[i]) !== mooniMessageStableKey(local[i])) return false;
  }
  return true;
}

/** Locale bucket swap only when the open thread is still empty. */
export function shouldReplaceMessagesOnLocaleMismatch(localMessageCount) {
  return (Number(localMessageCount) || 0) === 0;
}

export function shouldHydrateTripMessages({
  activeChatId,
  lastSyncedChatId,
  tripMessageCount,
  localMessageCount,
  tripMessages,
  localMessages,
}) {
  if (!activeChatId) return false;
  const chatChanged = String(lastSyncedChatId ?? '') !== String(activeChatId);
  if (localProtectedTailMissing(localMessages, tripMessages)) {
    const staleSameThread = tripIsPrefixOfLocal(tripMessages, localMessages) || !chatChanged;
    if (staleSameThread) return false;
  }
  const tripCount = Number(tripMessageCount) || 0;
  const localCount = Number(localMessageCount) || 0;
  if (chatChanged) return true;
  if (tripCount > localCount) return true;
  if (tripCount < localCount) return false;
  if (tripCount === 0 && localCount === 0) return true;
  if (isTripThreadStaleVersusLocal(tripMessages, localMessages)) return false;
  return (
    mooniThreadTailFingerprint(tripMessages) === mooniThreadTailFingerprint(localMessages)
  );
}

/**
 * A turn in flight already belongs to activeChatId. Remember it so the
 * saved_trips echo (often user-only) is not treated as a different chat
 * and does not wipe the answer that just arrived.
 */
export function rememberInFlightChatId(lastSyncedChatId, activeChatId, isLoading) {
  if (isLoading && activeChatId != null && String(activeChatId) !== '') {
    return String(activeChatId);
  }
  return lastSyncedChatId ?? null;
}

export function shouldHydrateDraftMessages({ localMessageCount, isLoading }) {
  if (isLoading) return false;
  return (Number(localMessageCount) || 0) === 0;
}

/** Session cache when trip row missing from chatHistory (same locale bucket only). */
export function shouldHydrateDraftCacheFallback({
  activeChatId,
  hasTripRow,
  localMessageCount,
  isLoading,
}) {
  if (!activeChatId || isLoading) return false;
  if ((Number(localMessageCount) || 0) > 0) return false;
  return !hasTripRow;
}
