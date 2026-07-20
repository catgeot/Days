const HANGUL_REGEX = /[\u3131-\u318e\uac00-\ud7a3]/i;

/** 시·군·구 등 행정 접미사 — 「구시로」vs「구시로시」중복 판별용 */
const ADMIN_SUFFIX_RE =
  /(특별자치시|특별자치도|광역시|특별시|자치시|자치도|광역도|시|군|구|도|현|부|주)$/i;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const hasHangul = (value) => HANGUL_REGEX.test(normalizeText(value));

const hasLatin = (value) => /[a-z]/i.test(normalizeText(value));

function corePlaceName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(ADMIN_SUFFIX_RE, '')
    .replace(/[\s\-_.']/g, '');
}

/** 같은 지명의 표기 변형(구시로/구시로시, Tokyo/Tokyo City)이면 true */
function isRedundantSecondary(primary, secondary) {
  const a = corePlaceName(primary);
  const b = corePlaceName(secondary);
  if (!a || !b) return true;
  if (a === b) return true;
  if (a.length >= 2 && b.length >= 2 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

/**
 * 카드 헤더용 주·부 지명.
 * 보조줄은 다른 문자권(한글↔영문)일 때만 — 한글끼리 행정명 중복은 숨김.
 */
export const getPlaceTitleLines = (location) => {
  const primaryName = normalizeText(location?.name);
  const englishName = normalizeText(location?.name_en || location?.curation_data?.locationEn);
  const koreanName = normalizeText(location?.name_ko || location?.curation_data?.location);

  if (!primaryName) {
    return { primaryName: '', secondaryName: '' };
  }

  const pickSecondary = (candidate) => {
    if (!candidate || candidate.toLowerCase() === primaryName.toLowerCase()) return '';
    if (isRedundantSecondary(primaryName, candidate)) return '';
    return candidate;
  };

  if (hasHangul(primaryName)) {
    // 본명이 한글이면 보조는 라틴/영문만 (「구시로시」같은 한글 변형 제외)
    if (englishName && hasLatin(englishName) && !hasHangul(englishName)) {
      return { primaryName, secondaryName: pickSecondary(englishName) };
    }
    return { primaryName, secondaryName: '' };
  }

  if (koreanName && hasHangul(koreanName)) {
    const secondary = pickSecondary(koreanName);
    if (secondary) return { primaryName, secondaryName: secondary };
  }

  if (englishName) {
    const secondary = pickSecondary(englishName);
    if (secondary) return { primaryName, secondaryName: secondary };
  }

  return { primaryName, secondaryName: '' };
};
