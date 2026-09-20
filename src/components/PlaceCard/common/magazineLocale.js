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

/** EN UI에서 KO 왓슨 본문 캐시를 읽을 때 섹션 제목만 EN */
export function shouldLocalizeWatsonShell(locale, wikiData) {
  if (normalizeAppLocale(locale) !== 'en') return false;
  const info = wikiData?.ai_practical_info;
  if (!info || info === '[[LOADING]]') return false;
  const watsonId = wikiData?.watson_place_id ?? wikiData?.place_id;
  return !isEnglishMagazineRow(watsonId);
}

const WATSON_SECTION_KO_TO_EN = [
  ['🌟 1분 요약', '🌟 1-minute summary'],
  ['🛂 입국/비용 & 이동 팁', '🛂 Entry, costs & getting around'],
  ['⚠️ 실전 안전 & 에티켓', '⚠️ Safety & etiquette'],
  ['💡 시크릿 꿀팁 & 맛집', '💡 Secret tips & dining'],
  ['작성 기준일:', 'As of:'],
];

export function localizeWatsonContentText(content, locale) {
  if (!content || normalizeAppLocale(locale) !== 'en') return content;

  let out = String(content);
  for (const [koLabel, enLabel] of WATSON_SECTION_KO_TO_EN) {
    out = out.split(koLabel).join(enLabel);
  }
  return out;
}

function magazineOnlyScore(row) {
  if (!row) return -1;
  let score = 0;
  const summary = row.summary;
  if (summary && summary !== '[[LOADING]]' && String(summary).trim()) score += 4;
  if (Array.isArray(row.sections) && row.sections.length > 0) score += 4;
  return score;
}

function hasWatsonPayload(row) {
  const info = row?.ai_practical_info;
  return Boolean(info && (info === '[[LOADING]]' || String(info).trim()));
}

function pickBestMagazineRow(rows, candidates) {
  const byId = new Map(rows.map((row) => [row.place_id, row]));
  let best = null;
  let bestScore = -1;
  let bestRank = 999;

  for (let rank = 0; rank < candidates.length; rank += 1) {
    const row = byId.get(candidates[rank]);
    if (!row) continue;
    const score = magazineOnlyScore(row);
    if (score > bestScore || (score === bestScore && rank < bestRank)) {
      best = row;
      bestScore = score;
      bestRank = rank;
    }
  }

  return best;
}

function pickWatsonRow(rows, candidates) {
  const byId = new Map(rows.map((row) => [row.place_id, row]));

  for (const id of candidates) {
    const row = byId.get(id);
    if (hasWatsonPayload(row)) return row;
  }

  return null;
}

/** 매거진·왓슨을 각각 최선 행에서 병합 (EN 왓슨 `@en` 행 우선) */
export function mergePlaceWikiRows(rows, candidates) {
  if (!rows?.length || !candidates?.length) return null;

  const magazineRow = pickBestMagazineRow(rows, candidates);
  const watsonRow = pickWatsonRow(rows, candidates);
  const base = magazineRow || watsonRow || rows[0];

  if (!base) return null;
  if (!magazineRow && !watsonRow) return base;

  return {
    ...base,
    place_id: magazineRow?.place_id ?? watsonRow?.place_id ?? base.place_id,
    summary: magazineRow?.summary ?? base.summary,
    sections: magazineRow?.sections ?? base.sections,
    source_url: magazineRow?.source_url ?? base.source_url,
    ai_practical_info: watsonRow?.ai_practical_info ?? base.ai_practical_info,
    ai_info_updated_at: watsonRow?.ai_info_updated_at ?? base.ai_info_updated_at,
    watson_place_id: watsonRow?.place_id ?? null,
  };
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
