/**
 * Overseas «내 위치» ask. The sentence is the SSOT the model hint parses.
 * Domestic city asks stay in festivalDomesticOrigins.js.
 */

function isEn(locale) {
  return String(locale || '').slice(0, 2) === 'en';
}

function targetWord(kind, en) {
  if (kind === 'place') return en ? 'place' : '여행지';
  return en ? 'festival' : '축제장';
}

/** Visible user bubble. Route details stay in the ask sentence and the origin chip. */
export function overseasMyLocationBubbleText(kind, locale) {
  const en = isEn(locale);
  const place = kind === 'place';
  if (en) {
    return place
      ? 'How do I get from my location to this place?'
      : 'How do I get from my location to this festival?';
  }
  return place
    ? '내 위치에서 이 여행지까지 가는 법을 알려줘'
    : '내 위치에서 이 축제장까지 가는 법을 알려줘';
}

/**
 * @param {{
 *   locale?: string,
 *   kind?: 'festival' | 'place',
 *   city: string,
 *   country: string,
 *   originLabel: string,
 *   originIata: string,
 *   arrivalLabel?: string,
 *   arrivalIata?: string,
 * }} input
 */
/** Short 출발 chip. The ask sentence is separate and is sent once. */
export function buildOverseasOriginChipLabel({ city, country, originIata, koreaIata } = {}) {
  const cityName = String(city || '').trim();
  const countryName = String(country || '').trim();
  const from = String(originIata || '').trim().toUpperCase();
  const to = String(koreaIata || '').trim().toUpperCase();
  if (!cityName || !countryName || from.length !== 3) return '';
  const hop = to && to !== from ? `${from} → ${to}` : from;
  return `${cityName} · ${countryName} (${hop})`;
}

export function buildOverseasMyLocationAsk(input) {
  const en = isEn(input.locale);
  const city = String(input.city || '').trim();
  const country = String(input.country || '').trim();
  const originLabel = String(input.originLabel || '').trim();
  const originIata = String(input.originIata || '').trim().toUpperCase();
  const arrivalLabel = String(input.arrivalLabel || '').trim();
  const arrivalIata = String(input.arrivalIata || '').trim().toUpperCase();
  const target = targetWord(input.kind, en);
  const via = arrivalIata && arrivalIata !== originIata && arrivalLabel;
  if (!city || !country || !originLabel || originIata.length !== 3) return '';
  if (en) {
    if (!via) {
      return `How do I get from ${city}, ${country} via ${originLabel} (${originIata}) to this ${target}?`;
    }
    return `How do I get from ${city}, ${country} via ${originLabel} (${originIata}) to ${arrivalLabel} (${arrivalIata}), and then to this ${target}?`;
  }
  if (!via) {
    return `${city} · ${country}에서 ${originLabel}(${originIata})에 내린 뒤 이 ${target}까지 가는 법을 알려줘`;
  }
  return `${city} · ${country}에서 ${originLabel}(${originIata})을 거쳐 ${arrivalLabel}(${arrivalIata})으로 간 다음 이 ${target}까지 가는 법을 알려줘`;
}

/**
 * @param {unknown} text
 * @returns {{
 *   city: string,
 *   country: string,
 *   originLabel: string,
 *   originIata: string,
 *   arrivalLabel: string,
 *   arrivalIata: string,
 *   kind: 'festival' | 'place',
 * } | null}
 */
export function parseOverseasMyLocationAsk(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const enVia = raw.match(/^How do I get from (.+?), (.+?) via (.+?) \(([A-Z]{3})\) to (.+?) \(([A-Z]{3})\), and then to this (festival|place)\?$/);
  if (enVia) {
    return {
      city: enVia[1],
      country: enVia[2],
      originLabel: enVia[3],
      originIata: enVia[4],
      arrivalLabel: enVia[5],
      arrivalIata: enVia[6],
      kind: enVia[7] === 'place' ? 'place' : 'festival',
    };
  }
  const enSame = raw.match(/^How do I get from (.+?), (.+?) via (.+?) \(([A-Z]{3})\) to this (festival|place)\?$/);
  if (enSame) {
    return {
      city: enSame[1],
      country: enSame[2],
      originLabel: enSame[3],
      originIata: enSame[4],
      arrivalLabel: enSame[3],
      arrivalIata: enSame[4],
      kind: enSame[5] === 'place' ? 'place' : 'festival',
    };
  }
  const koVia = raw.match(/^(.+?) · (.+?)에서 (.+?)\(([A-Z]{3})\)을 거쳐 (.+?)\(([A-Z]{3})\)으로 간 다음 이 (축제장|여행지)까지 가는 법을 알려줘$/);
  if (koVia) {
    return {
      city: koVia[1],
      country: koVia[2],
      originLabel: koVia[3],
      originIata: koVia[4],
      arrivalLabel: koVia[5],
      arrivalIata: koVia[6],
      kind: koVia[7] === '여행지' ? 'place' : 'festival',
    };
  }
  const koSame = raw.match(/^(.+?) · (.+?)에서 (.+?)\(([A-Z]{3})\)에 내린 뒤 이 (축제장|여행지)까지 가는 법을 알려줘$/);
  if (koSame) {
    return {
      city: koSame[1],
      country: koSame[2],
      originLabel: koSame[3],
      originIata: koSame[4],
      arrivalLabel: koSame[3],
      arrivalIata: koSame[4],
      kind: koSame[5] === '여행지' ? 'place' : 'festival',
    };
  }
  return null;
}

/** Model line. Does not invent trains from a Korean city. */
export function overseasMyLocationModelHint(route, locale = 'ko') {
  if (!route?.originIata || !route.city || !route.country) return '';
  const en = isEn(locale);
  const hop = route.arrivalIata && route.arrivalIata !== route.originIata;
  if (en) {
    const via = hop
      ? `Fly ${route.originIata} to ${route.arrivalIata}, then continue to the venue.`
      : `Continue from ${route.originIata} to the venue.`;
    return `\n- The traveler is in ${route.city}, ${route.country}. Do not move them to a Korean city. ${via}`;
  }
  const via = hop
    ? `${route.originIata}에서 ${route.arrivalIata}로 비행한 다음 행사장소까지 이어서 안내하세요.`
    : `${route.originIata}에서 행사장소까지 이어서 안내하세요.`;
  return `\n- 여행자는 ${route.country} ${route.city}에 있어요. 한국 도시로 출발지를 바꾸지 마세요. ${via}`;
}
