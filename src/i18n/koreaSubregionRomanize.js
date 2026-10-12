/**
 * Revised Romanization for Korean administrative subregion labels (시·군·구).
 * Used when hub SSOT has no EN name.
 */

const CHO = [
  'g',
  'gg',
  'n',
  'd',
  'dd',
  'r',
  'm',
  'b',
  'bb',
  's',
  'ss',
  '',
  'j',
  'jj',
  'ch',
  'k',
  't',
  'p',
  'h',
];
const JUNG = [
  'a',
  'ae',
  'ya',
  'yae',
  'eo',
  'e',
  'yeo',
  'ye',
  'o',
  'wa',
  'wae',
  'oe',
  'yo',
  'u',
  'wo',
  'we',
  'wi',
  'yu',
  'eu',
  'ui',
  'i',
];
const JONG = [
  '',
  'g',
  'gg',
  'gs',
  'n',
  'nj',
  'nh',
  'd',
  'l',
  'lg',
  'lm',
  'lb',
  'ls',
  'lt',
  'lp',
  'lh',
  'm',
  'b',
  'bs',
  's',
  'ss',
  'ng',
  'j',
  'ch',
  'k',
  't',
  'p',
  'h',
];

/** Single-syllable district stems (광역시 구). */
const DISTRICT_STEM_EN = {
  북: 'Buk',
  남: 'Nam',
  동: 'Dong',
  서: 'Seo',
  중: 'Jung',
};

const ADMIN_SUFFIX_EN = {
  시: 'si',
  군: 'gun',
  구: 'gu',
};

/**
 * @param {string} syllable — one Hangul syllable
 */
function romanizeSyllable(syllable) {
  const code = syllable.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return syllable;
  const s = code - 0xac00;
  const ci = Math.floor(s / 588);
  const vi = Math.floor((s % 588) / 28);
  const fi = s % 28;
  return `${CHO[ci]}${JUNG[vi]}${JONG[fi]}`;
}

/**
 * @param {string} text — Hangul (and optional non-Hangul ignored)
 */
export function romanizeKoreanHangul(text) {
  let out = '';
  for (const ch of String(text || '')) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) out += romanizeSyllable(ch);
  }
  return out;
}

/**
 * @param {string} ko — e.g. 북구, 수원시, 고양시
 * @returns {string} — e.g. Buk-gu, Suwon-si; empty if not mappable
 */
export function romanizeKoreanAdminSubregion(ko) {
  const raw = String(ko || '').trim();
  if (!raw || !/[가-힣]/u.test(raw)) return raw;
  const m = raw.match(/^(?<stem>.+?)(?<suf>시|군|구)$/u);
  if (!m) {
    const bare = romanizeKoreanHangul(raw);
    if (!bare) return raw;
    const cap = bare.charAt(0).toUpperCase() + bare.slice(1);
    return /[가-힣]/u.test(cap) ? raw : cap;
  }
  const stem = m.groups.stem;
  const sufKey = m.groups.suf;
  const suffix = ADMIN_SUFFIX_EN[sufKey];
  if (!suffix) return raw;

  let stemEn = DISTRICT_STEM_EN[stem];
  if (!stemEn) {
    const roman = romanizeKoreanHangul(stem);
    if (!roman) return raw;
    stemEn = roman.charAt(0).toUpperCase() + roman.slice(1);
  }
  return `${stemEn}-${suffix}`;
}
