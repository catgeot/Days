import { publicSourceName } from './schema.js';
import { sourceNameForLocale } from './cairoEn.js';

const BOARD_NOTICE_ID = /\/bbs\/(?:safetyNtc|embsyNtc)\/(\d+)\//i;
const NTN_SAFETY_PATH = /\/ntnSafetyInfo\/(\d+)\//i;

function baseSourceLabel(source) {
  const name = String(source?.name || '').trim();
  const fallback = name || String(source?.url || '').trim();
  return publicSourceName(fallback);
}

export function sourceUrlDisambiguator(url, locale) {
  const text = String(url || '').trim();
  if (!/^https?:\/\//i.test(text)) return '';
  const boardId = BOARD_NOTICE_ID.exec(text)?.[1];
  if (boardId) return boardId;
  const ntnId = NTN_SAFETY_PATH.exec(text)?.[1];
  if (ntnId) {
    return locale === 'en' ? `country ${ntnId}` : `국가 ${ntnId}`;
  }
  try {
    const parsed = new URL(text);
    const host = parsed.hostname.replace(/^www\./i, '');
    const ntnCd = parsed.searchParams.get('ntnCd');
    if (ntnCd) return `${host} · ${ntnCd}`;
    if (/\/list(?:\?|$)/i.test(parsed.pathname)) {
      return locale === 'en' ? `${host} · list` : `${host} · 목록`;
    }
    return host;
  } catch {
    return '';
  }
}

export function sourceLinkLabelForLocale(source, sources, locale) {
  const list = Array.isArray(sources) ? sources : [];
  const base = sourceNameForLocale(baseSourceLabel(source), locale);
  const duplicateCount = list.filter(
    (item) => sourceNameForLocale(baseSourceLabel(item), locale) === base,
  ).length;
  if (duplicateCount <= 1) return base;

  const token = sourceUrlDisambiguator(source?.url, locale);
  if (token) return `${base} · ${token}`;

  const index = list.indexOf(source);
  const ord = index >= 0 ? index + 1 : duplicateCount;
  return `${base} · ${ord}`;
}
