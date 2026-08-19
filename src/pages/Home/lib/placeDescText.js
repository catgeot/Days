/**
 * hub 「부모의 종류 · 명소명」 등 실문장 없는 합성 desc 여부.
 * 비어 있으면 true.
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

  // EN hub/suggestion placeholders
  if (name && /(?:explore|discover)\s+(?:the\s+)?region/i.test(d)) return true;
  if (name && /browse\s+(?:attractions|highlights|local\s+specialties)/i.test(d)) return true;
  if (name && new RegExp(`^Explore\\s+${escapeRegExp(name)}`, 'i').test(d)) return true;

  return false;
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 써머리·갤러리 overview를 place_chat_intro(무니 인트로)로 통일할지.
 * SSOT 하드코딩 desc도 대상 — 이미 intro로 채운 경우만 skip.
 */
export function needsPlaceChatIntroHydration(location) {
  if (!location?.name) return false;
  if (location.placeChatIntroApplied) return false;
  return true;
}
