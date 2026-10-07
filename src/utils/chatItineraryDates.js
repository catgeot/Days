import { extractMooniTripFacts } from '../pages/Home/lib/mooniTripSession.js';

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return ymdLocal(d);
}

/**
 * @param {string} userText
 * @param {{ nights?: number | null }} [tripSession]
 */
export function extractItineraryStayDates(userText, tripSession = {}) {
  const raw = String(userText ?? '');
  const today = new Date();
  let year = today.getFullYear();
  let month = null;
  let day = null;

  const ko = raw.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (ko) {
    month = Number(ko[1]);
    day = Number(ko[2]);
  } else {
    const slash = raw.match(/(?:^|[^\d])(\d{1,2})\s*\/\s*(\d{1,2})(?:[^\d]|$)/);
    if (slash) {
      month = Number(slash[1]);
      day = Number(slash[2]);
    }
  }

  if (month == null || day == null) {
    return { checkIn: null, checkOut: null };
  }

  let checkIn = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const probe = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (probe < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    year += 1;
    checkIn = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const facts = extractMooniTripFacts(raw, {});
  const nights =
    facts.nights != null && facts.nights >= 1
      ? facts.nights
      : tripSession?.nights != null && tripSession.nights >= 1
        ? tripSession.nights
        : null;

  const checkOut =
    nights != null ? addDaysYmd(checkIn, nights) : addDaysYmd(checkIn, 1);

  return { checkIn, checkOut };
}
