import { normalizeAppLocale } from '../../../i18n/constants.js';
import { buildPlaceWikiIdCandidates } from '../../../utils/travelSpotResolve.js';

const MAGAZINE_LOCALE_SUFFIX = { en: '@en' };

/** place_wiki.place_id — EN 매거진 행 식별 */
export function isEnglishMagazineRow(placeId) {
  return String(placeId ?? '').trim().endsWith('@en');
}

export function magazineStorageIdForLocale(canonicalId, locale) {
  const base = String(canonicalId ?? '').trim();
  if (!base) return base;
  const norm = normalizeAppLocale(locale);
  const suffix = MAGAZINE_LOCALE_SUFFIX[norm] ?? '';
  if (!suffix || base.endsWith(suffix)) return base;
  return `${base}${suffix}`;
}

/** EN UI에서 KO 본문 캐시를 읽을 때 섹션·앵커 쉘만 EN */
export function shouldLocalizeMagazineShell(locale, wikiData) {
  if (normalizeAppLocale(locale) !== 'en') return false;
  if (!wikiData) return false;
  return !isEnglishMagazineRow(wikiData.place_id);
}

export function buildPlaceWikiLocaleCandidates(location, locale) {
  const base = buildPlaceWikiIdCandidates(location);
  if (normalizeAppLocale(locale) !== 'en') return base;

  const out = [];
  const seen = new Set();
  const push = (value) => {
    const s = String(value ?? '').trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const id of base) {
    push(magazineStorageIdForLocale(id, 'en'));
  }
  for (const id of base) {
    push(id);
  }
  return out;
}

export function getMagazineSectionTitle(sectionIndex, storedTitle, locale, t) {
  if (normalizeAppLocale(locale) === 'en') {
    const sections = t('place.wiki.magazineSections', { returnObjects: true });
    if (Array.isArray(sections) && sections[sectionIndex]) {
      return sections[sectionIndex];
    }
  }
  return storedTitle;
}

const MAGAZINE_ANCHOR_KO_TO_I18N = [
  ['시간의 흔적', 'place.wiki.magazineAnchors.timeTraces'],
  ['에디터의 시선', 'place.wiki.magazineAnchors.editorEye'],
  ['잊혀진 기록', 'place.wiki.magazineAnchors.forgottenRecord'],
  ['숨겨진 골목', 'place.wiki.magazineAnchors.hiddenAlley'],
  ['로컬의 발자취', 'place.wiki.magazineAnchors.localFootsteps'],
  ['미각의 기억', 'place.wiki.magazineAnchors.tasteMemory'],
  ['로컬 다이닝 팁', 'place.wiki.magazineAnchors.diningTip'],
  ['창밖의 풍경', 'place.wiki.magazineAnchors.windowView'],
  ['머무름의 미학', 'place.wiki.magazineAnchors.stayAesthetic'],
  ['길 위의 풍경', 'place.wiki.magazineAnchors.roadScenery'],
  ['여행자의 발걸음', 'place.wiki.magazineAnchors.travelerSteps'],
  ['현지인의 귀띔', 'place.wiki.magazineAnchors.localWhisper'],
  ['안전한 여정', 'place.wiki.magazineAnchors.safeJourney'],
  ['계절의 호흡', 'place.wiki.magazineAnchors.seasonBreath'],
  ['여행의 온도', 'place.wiki.magazineAnchors.travelTemperature'],
];

export function localizeMagazineContentText(content, locale, t) {
  if (!content || normalizeAppLocale(locale) !== 'en') return content;

  let out = String(content);
  for (const [koLabel, i18nKey] of MAGAZINE_ANCHOR_KO_TO_I18N) {
    const enLabel = t(i18nKey);
    const patterns = [
      new RegExp(`\\[\\s*${koLabel}\\s*\\]`, 'g'),
      new RegExp(`\\[${koLabel}\\]`, 'g'),
    ];
    for (const pattern of patterns) {
      out = out.replace(pattern, `[ ${enLabel} ]`);
    }
  }
  return out;
}
