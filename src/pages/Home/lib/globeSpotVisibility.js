/**
 * 지구본 여행지 tier 노출 SSOT
 *
 * - denseRegion 밀집 권역: 줌 단계별 tier 필터 유지 (겹침 완화)
 * - denseRegion 없음(섬·미크로네시아 등): tier 구분 없이 전체 노출
 */

export function isDenseGlobeSpot(spot) {
  const region = spot?.denseRegion;
  return typeof region === 'string' && region.trim().length > 0;
}

export function passesGlobeTierPolicy(spot, maxTier) {
  if (!isDenseGlobeSpot(spot)) return true;
  return (Number(spot.tier) || 3) <= maxTier;
}
