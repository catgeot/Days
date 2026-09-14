/**
 * 하단 칩 독: 장소 바인딩·추천받기(첫 메시지) 이후는 기존 MOONi 주제 칩.
 * 빈 범용 세션만 디스커버리 칩.
 */
export function resolveMooniChipDockMode({
  isMooniUi = false,
  hasPlaceBoundName = false,
  messageCount = 0,
  hasInitialQuery = false,
} = {}) {
  if (!isMooniUi) return 'none';
  if (hasPlaceBoundName) return 'topic';
  if (Number(messageCount) > 0 || hasInitialQuery === true) return 'topic';
  return 'discovery';
}
