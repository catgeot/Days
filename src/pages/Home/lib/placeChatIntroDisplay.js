import {
  buildPlaceChatIntroKeys,
  loadPlaceChatIntroLocal,
  stripPlaceChatIntroForSummary,
} from './placeChatIntro.js';
import { getLocalizedPlaceName } from '../../../components/PlaceCard/common/locationDisplay.js';

/** DB·AI 호출 없이 캐시된 @en intro만 (표시용) */
export function peekCachedPlaceChatIntroEn(location) {
  if (!location || typeof location !== 'object') return '';
  const stored = String(location.placeChatIntroEn || '').trim();
  if (stored) return stored;

  const keys = buildPlaceChatIntroKeys(location, 'en');
  const placeName = getLocalizedPlaceName(location, 'en') || location.name || '';
  for (const key of keys) {
    const raw = loadPlaceChatIntroLocal(key, 'en');
    if (!raw) continue;
    const stripped = stripPlaceChatIntroForSummary(raw, placeName);
    if (stripped) return stripped;
  }
  return '';
}
