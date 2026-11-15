/**
 * Shared Hangul search helpers for departure-city match and explore choseong search.
 * useSearchEngine must not import this module (health lock — the old home matcher stays removed).
 *
 * The old home search (a1c43118) crashed on missing name_en/country_en and treated
 * short or empty fragments as a match for every name (`includes('')` is true).
 * These helpers never throw, and a choseong query shorter than 2 consonants
 * matches nothing — an empty choseong must not select a place.
 */

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const CHO_SET = new Set(CHO);
const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;

function asText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function hangulChoseong(value) {
  try {
    const text = asText(value);
    let out = '';
    for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code == null || code < SYLLABLE_BASE || code > SYLLABLE_LAST) continue;
      const idx = Math.floor((code - SYLLABLE_BASE) / 588);
      const piece = CHO[idx];
      if (piece) out += piece;
    }
    return out;
  } catch {
    return '';
  }
}

/**
 * Choseong search only when every character is a single choseong and length is at least 2.
 * One consonant, vowels, cluster jamo, latin, and symbols are not a choseong query.
 * @param {unknown} value
 */
export function isChoseongQuery(value) {
  try {
    const text = asText(value).replace(/\s+/g, '');
    if (text.length < 2) return false;
    for (const ch of text) {
      if (!CHO_SET.has(ch)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function decomposeJamo(value) {
  try {
    const text = asText(value);
    const out = [];
    for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code == null) continue;
      if (code >= SYLLABLE_BASE && code <= SYLLABLE_LAST) {
        const syl = code - SYLLABLE_BASE;
        const cho = Math.floor(syl / 588);
        const jung = Math.floor((syl % 588) / 28);
        const jong = syl % 28;
        if (CHO[cho]) out.push(CHO[cho]);
        if (JUNG[jung]) out.push(JUNG[jung]);
        if (jong > 0 && JONG[jong]) out.push(JONG[jong]);
        continue;
      }
      out.push(ch);
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function hangulSyllableCount(value) {
  try {
    let n = 0;
    for (const ch of asText(value)) {
      const code = ch.codePointAt(0);
      if (code != null && code >= SYLLABLE_BASE && code <= SYLLABLE_LAST) n += 1;
    }
    return n;
  } catch {
    return 0;
  }
}

/**
 * Jamo Levenshtein. Long inputs return a large distance instead of throwing.
 * @param {unknown} a
 * @param {unknown} b
 */
export function jamoEditDistance(a, b) {
  try {
    const left = decomposeJamo(a);
    const right = decomposeJamo(b);
    const n = left.length;
    const m = right.length;
    if (n > 64 || m > 64) return 99;
    if (n === 0) return m;
    if (m === 0) return n;
    let prev = new Array(m + 1);
    let cur = new Array(m + 1);
    for (let j = 0; j <= m; j += 1) prev[j] = j;
    for (let i = 1; i <= n; i += 1) {
      cur[0] = i;
      const li = left[i - 1];
      for (let j = 1; j <= m; j += 1) {
        const cost = li === right[j - 1] ? 0 : 1;
        const del = prev[j] + 1;
        const ins = cur[j - 1] + 1;
        const sub = prev[j - 1] + cost;
        cur[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
      }
      const swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[m];
  } catch {
    return 99;
  }
}

/**
 * Enter confirms only after compositionend. compositionstart~end must not commit a place.
 * @param {{ composing?: boolean, key?: string }} [state]
 */
export function shouldConfirmHangulEntry(state = {}) {
  try {
    if (state?.composing === true) return false;
    const key = String(state?.key || '');
    return key === 'Enter';
  } catch {
    return false;
  }
}
