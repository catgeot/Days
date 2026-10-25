/** 현지정보 확인일 신선도 — KST 달력일 기준. */

export const FRESHNESS_POLICY = {
  event: { freshMaxDays: 7, warnMaxDays: 21 },
  standing: { freshMaxDays: 30, warnMaxDays: 90 },
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDateString(value) {
  const text = String(value || '').trim();
  if (!ISO_DATE.test(text)) return false;
  const [, y, m, d] = ISO_DATE.exec(text);
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return dt.getUTCFullYear() === Number(y)
    && dt.getUTCMonth() === Number(m) - 1
    && dt.getUTCDate() === Number(d);
}

export function seoulTodayYmd(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now);
}

export function getFreshnessToday() {
  const injected = typeof globalThis !== 'undefined'
    ? globalThis.__GATEO_FRESHNESS_TODAY__
    : undefined;
  if (injected && isIsoDateString(injected)) return String(injected).trim();
  const envToday = typeof import.meta !== 'undefined'
    ? import.meta.env?.VITE_GATEO_FRESHNESS_TODAY
    : '';
  if (envToday && isIsoDateString(envToday)) return String(envToday).trim();
  return seoulTodayYmd();
}

function dayIndex(ymd) {
  const match = ISO_DATE.exec(String(ymd || '').trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function daysBetweenIsoDates(fromYmd, toYmd) {
  const from = dayIndex(fromYmd);
  const to = dayIndex(toYmd);
  if (from == null || to == null) return null;
  return to - from;
}

/**
 * @returns {'none' | 'fresh' | 'warn' | 'hidden'}
 */
export function freshnessTier(slot, todayYmd) {
  const kind = slot?.kind;
  if (kind !== 'event' && kind !== 'standing') return 'none';
  const checkedOn = String(slot?.checkedOn || '').trim();
  if (!isIsoDateString(checkedOn)) return 'none';
  const today = String(todayYmd || '').trim();
  if (!isIsoDateString(today)) return 'none';

  const endsAt = String(slot?.endsAt || '').trim();
  if (endsAt && isIsoDateString(endsAt) && dayIndex(today) > dayIndex(endsAt)) {
    return 'hidden';
  }

  const ageDays = daysBetweenIsoDates(checkedOn, today);
  if (ageDays == null || ageDays < 0) return 'none';

  const policy = FRESHNESS_POLICY[kind];
  if (ageDays > policy.warnMaxDays) return 'hidden';
  if (ageDays > policy.freshMaxDays) return 'warn';
  return 'fresh';
}

export function freshnessOf(slot, todayYmd) {
  const tier = freshnessTier(slot, todayYmd);
  const checkedOn = String(slot?.checkedOn || '').trim();
  const today = String(todayYmd || '').trim();
  const ageDays = tier === 'none' ? null : daysBetweenIsoDates(checkedOn, today);
  return {
    tier,
    kind: slot?.kind || null,
    checkedOn,
    ageDays,
  };
}

export function formatCheckedChipDate(checkedOn, locale) {
  const match = ISO_DATE.exec(String(checkedOn || '').trim());
  if (!match) return String(checkedOn || '').trim();
  const [, y, mo, d] = match;
  if (locale === 'en') return `${Number(mo)}/${Number(d)}`;
  return `${Number(mo)}/${Number(d)}`;
}

export function pickMofaSafetyUrl(sources) {
  const list = Array.isArray(sources) ? sources : [];
  for (const source of list) {
    const url = String(source?.url || '').trim();
    if (/^https?:\/\//i.test(url) && /0404\.go\.kr/i.test(url)) return url;
  }
  for (const source of list) {
    const url = String(source?.url || '').trim();
    if (/^https?:\/\//i.test(url)) return url;
  }
  return 'https://www.0404.go.kr/';
}
