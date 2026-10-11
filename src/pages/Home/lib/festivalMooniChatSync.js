/** Guards ChatModal trip/draft hydration from clobbering a newer in-memory thread. */

export function shouldHydrateTripMessages({
  activeChatId,
  lastSyncedChatId,
  tripMessageCount,
  localMessageCount,
}) {
  if (!activeChatId) return false;
  const chatChanged = String(lastSyncedChatId ?? '') !== String(activeChatId);
  const tripCount = Number(tripMessageCount) || 0;
  const localCount = Number(localMessageCount) || 0;
  return chatChanged || tripCount >= localCount;
}

export function shouldHydrateDraftMessages({ localMessageCount, isLoading }) {
  if (isLoading) return false;
  return (Number(localMessageCount) || 0) === 0;
}
