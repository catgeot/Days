import {
  getWorldEventById,
  getWorldEventDetailOverview,
  getWorldEventPlaceLabel,
  getWorldEventTitle,
} from '../utils/worldEvents.js';
import { stripHtmlAndMarkdown, trimMetaDescription } from './placeMetaDescription.js';

const SITE_ORIGIN = 'https://www.gateo.kr';
const HANGUL_START = /^[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/;
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function localeKey(locale) {
  return locale === 'en' ? 'en' : 'ko';
}

/** Fixed calendar text so Edge and Node emit the same crawler snippet. */
function formatYmd(ymd, locale) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || '').trim());
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  if (locale === 'en') return `${EN_MONTHS[month - 1]} ${day}, ${year}`;
  return `${year}년 ${month}월 ${day}일`;
}

function formatRange(event, locale) {
  const start = formatYmd(event?.startDate, locale);
  const end = formatYmd(event?.endDate, locale);
  if (!start) return '';
  if (!end || end === start) return start;
  return `${start}–${end}`;
}

function eventTitle(name, city) {
  const eventName = stripHtmlAndMarkdown(name);
  const place = stripHtmlAndMarkdown(city);
  if (eventName && place && eventName !== place) return `${eventName} — ${place}`;
  return eventName || place;
}

function sentence(value) {
  const text = stripHtmlAndMarkdown(value);
  if (!text) return '';
  if (/[.!?。！？…]$/.test(text)) return text;
  return `${text}.`;
}

function composeDescription(parts) {
  const text = parts.filter(Boolean).join(' ');
  return trimMetaDescription(text);
}

function englishLead(name, city, dates) {
  const eventName = stripHtmlAndMarkdown(name);
  const place = stripHtmlAndMarkdown(city);
  const when = stripHtmlAndMarkdown(dates);
  const nameOk = eventName && !HANGUL_START.test(eventName);
  const placeOk = place && !HANGUL_START.test(place);
  if (nameOk && placeOk && when) return `${eventName} in ${place} (${when}).`;
  if (nameOk && placeOk) return `${eventName} in ${place}.`;
  if (nameOk && when) return `${eventName} (${when}).`;
  if (nameOk) return `${eventName}.`;
  if (placeOk && when) return `Event in ${place} (${when}).`;
  if (placeOk) return `Event in ${place}.`;
  if (when) return `World event (${when}).`;
  return 'World event dates and travel notes on GATEO.';
}

function buildDescription(event, locale) {
  const loc = localeKey(locale);
  const name = getWorldEventTitle(event, loc);
  const city = getWorldEventPlaceLabel(event?.slug, loc);
  const dates = formatRange(event, loc);
  const overview = getWorldEventDetailOverview(event, loc);

  if (loc === 'en') {
    const lead = englishLead(name, city, dates);
    const intro = sentence(overview);
    const combined = intro && !HANGUL_START.test(intro) ? `${lead} ${intro}` : lead;
    const description = composeDescription([combined]);
    if (description && !HANGUL_START.test(description)) return description;
    return composeDescription([lead]) || 'World event dates and travel notes on GATEO.';
  }

  const eventName = stripHtmlAndMarkdown(name);
  const place = stripHtmlAndMarkdown(city);
  let lead = '';
  if (place && eventName) lead = `${place}에서 열리는 ${eventName}`;
  else lead = eventName || place;
  if (dates) lead = lead ? `${lead} (${dates})` : dates;
  return (
    composeDescription([sentence(lead), sentence(overview)]) ||
    '세계 행사 일정과 여행 정보를 GATEO에서 확인하세요.'
  );
}

export function buildWorldEventCrawlerMetaFromEvent(event, locale = 'ko') {
  if (!event || typeof event !== 'object') return null;
  const id = String(event.id || '').trim();
  if (!id) return null;
  const loc = localeKey(locale);
  const name = getWorldEventTitle(event, loc);
  const city = getWorldEventPlaceLabel(event.slug, loc);
  const title = eventTitle(name, city);
  if (!title) return null;
  const description = buildDescription(event, loc);
  if (!description) return null;
  const path = `/world-events/${encodeURIComponent(id)}`;
  const canonicalUrl = loc === 'en' ? `${SITE_ORIGIN}${path}?lang=en` : `${SITE_ORIGIN}${path}`;
  const hero = String(event.heroImage || event.heroImages?.[0]?.url || '').trim();
  const keywordParts = [stripHtmlAndMarkdown(name), stripHtmlAndMarkdown(city), loc === 'en' ? 'world events' : '세계 행사'];
  return {
    locale: loc,
    title,
    description,
    keywords: keywordParts.filter(Boolean).join(', '),
    canonicalUrl,
    hreflangAlternates: [
      { hreflang: 'ko', href: `${SITE_ORIGIN}${path}` },
      { hreflang: 'en', href: `${SITE_ORIGIN}${path}?lang=en` },
      { hreflang: 'x-default', href: `${SITE_ORIGIN}${path}` },
    ],
    ogImage: hero || undefined,
    worldEventId: id,
  };
}

export function resolveWorldEventCrawlerMeta(eventId, locale = 'ko') {
  const event = getWorldEventById(eventId);
  if (!event) return null;
  return buildWorldEventCrawlerMetaFromEvent(event, locale);
}
