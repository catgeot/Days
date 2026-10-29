/** Mapbox 정착지 placeId — intro 조회는 `{parentCity} {name}`만(DB 동명 오염 방지). */
export const SETTLEMENT_INTRO_PARENT_ONLY_IDS = new Set(['gangneung-gyo-dong']);

export function resolveSettlementPlaceId(locOrName) {
  if (!locOrName || typeof locOrName !== 'object') return '';
  const fromId = String(locOrName.id ?? '').replace(/^settlement-/u, '').trim();
  const placeId = String(locOrName.placeId ?? fromId).trim();
  return placeId;
}

export function settlementIntroUsesParentCityKeyOnly(locOrName) {
  const placeId = resolveSettlementPlaceId(locOrName);
  return Boolean(placeId && SETTLEMENT_INTRO_PARENT_ONLY_IDS.has(placeId));
}
