/**
 * hub 「부모의 종류 · 명소명」 등 실문장 없는 합성 desc 여부.
 * 비어 있으면 true (써머리 hydrate 대상).
 */
export function isSyntheticOrEmptyPlaceDesc(location) {
  const desc = String(location?.desc || location?.description || '').trim();
  if (!desc) return true;

  const parent = String(location?.parentCity || '').trim();
  const name = String(location?.name || '').trim();
  const badge = String(location?.badge || location?.attractionKind || '').trim();
  const d = desc.replace(/\s+/g, ' ');

  if (parent && name) {
    if (d === `${parent} · ${name}` || d === `${name} · ${parent}`) return true;
    // attractionToPlacePin: `${hub.name}의 ${kindLabel} · ${attraction.name}`
    if (d.startsWith(`${parent}의 `) && d.includes(' · ') && d.endsWith(name)) {
      return true;
    }
  }
  if (name && badge && (d === `${name} · ${badge}` || d === `${badge} · ${name}`)) {
    return true;
  }
  if (parent && badge && d === `${parent} · ${badge}`) return true;

  // hubToPlacePin / hubToSuggestion 고정 문구
  if (name && /지역을 탐색합니다\.?\s*$/.test(d)) return true;
  if (name && d === `${name}의 명소·명물을 둘러보세요.`) return true;

  return false;
}

export function needsPlaceChatIntroHydration(location) {
  if (!location?.name) return false;
  return isSyntheticOrEmptyPlaceDesc(location);
}
