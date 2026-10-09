/**
 * Call a staging gemini-proxy with the same mooni_chat body the festival chip click sends.
 *
 *   STAGING_FUNCTIONS_URL=https://<ref>.supabase.co \
 *   STAGING_ANON_KEY=... \
 *   ORIGIN=https://<allowed-preview-origin> \
 *   TOUR_API_SERVICE_KEY=... \
 *   node scripts/staging/mooni-festival-chip-probe.mjs 2930716
 *
 * FESTIVAL_FIXTURE=path.json skips TourAPI and uses that buildFestivalMooniContext input.
 * Prints answer text, model, and latency. Does not print keys.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFestivalMooniContext } from '../../src/pages/Korea/lib/festivalMooniContext.js';
import { buildMooniBoundFestivalSystemHint } from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const repliesSrc = readFileSync(join(root, 'src/pages/Home/lib/mooniQuickReplies.js'), 'utf8');
if (!repliesSrc.includes('에서 이 축제장까지 대중교통과 차로 가는 법')) {
  throw new Error('Korean festival access ask text drifted from mooniQuickReplies.js');
}
if (!repliesSrc.includes('to this festival by public transit and by car')) {
  throw new Error('English festival access ask text drifted from mooniQuickReplies.js');
}

const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));

const contentId = String(process.argv[2] || '').trim();
if (!/^\d+$/.test(contentId)) {
  console.error('usage: node scripts/staging/mooni-festival-chip-probe.mjs <contentId>');
  process.exit(1);
}

const base = String(process.env.STAGING_FUNCTIONS_URL || '').replace(/\/$/, '');
const anon = String(process.env.STAGING_ANON_KEY || '');
if (!base || !anon) {
  console.error('STAGING_FUNCTIONS_URL and STAGING_ANON_KEY are required');
  process.exit(1);
}

function chipAsks(locale) {
  const pack = locale === 'en' ? en : ko;
  const chips = pack.mooni.chips.festival;
  const access =
    locale === 'en'
      ? 'How do I get from ICN to this festival by public transit and by car?'
      : '서울에서 이 축제장까지 대중교통과 차로 가는 법을 알려줘';
  return [
    ['festival_sights', chips.festival_sights.sendText],
    ['festival_access', access],
    ['festival_nearby', chips.festival_nearby.sendText],
    ['festival_day', chips.festival_day.sendText],
    ['festival_overseas_visa', chips.festival_overseas_visa.sendText],
    ['festival_overseas_flight', chips.festival_overseas_flight.sendText],
    ['festival_overseas_airport', chips.festival_overseas_airport.sendText],
  ];
}

async function tourItems(path, query) {
  const key = process.env.TOUR_API_SERVICE_KEY;
  if (!key) return [];
  const params = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: 'gateo',
    _type: 'json',
    ...query,
  });
  const response = await fetch(
    `https://apis.data.go.kr/B551011/KorService2/${path}?serviceKey=${key}&${params.toString()}`,
    { signal: AbortSignal.timeout(15000) },
  );
  const data = await response.json().catch(() => null);
  const item = data?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function loadContextInput() {
  if (process.env.FESTIVAL_FIXTURE) {
    return JSON.parse(readFileSync(process.env.FESTIVAL_FIXTURE, 'utf8'));
  }
  const [common] = await tourItems('detailCommon2', { contentId });
  const [intro] = await tourItems('detailIntro2', { contentId, contentTypeId: '15' });
  if (!common && !intro) {
    throw new Error('No festival facts. Set FESTIVAL_FIXTURE or TOUR_API_SERVICE_KEY.');
  }
  const row = { ...(intro || {}), ...(common || {}) };
  return {
    item: {
      contentId,
      title: row.title || '',
      titleEn: row.titleEn || '',
      eventStartDate: row.eventstartdate || row.eventStartDate || '',
      eventEndDate: row.eventenddate || row.eventEndDate || '',
      addr1: row.addr1 || '',
    },
    intro: {
      eventplace: row.eventplace || '',
      playtime: row.playtime || '',
      program: row.program || '',
    },
    summaryFields: {
      timeText: row.playtime || '',
      fee: { text: row.usetimefestival || '' },
    },
    overview: row.overview || '',
    program: row.program || '',
    homepage: row.homepage || '',
    nearbyPlaces: [],
  };
}

function clientParams(locale, chipId, userText, hint, title) {
  return {
    locale,
    persona: 'PLANNER',
    tier: 'fast',
    locationName: title,
    boundPlaceName: title,
    isMooni: true,
    chipId,
    facts: null,
    tripSession: null,
    cta: 'none_quiet',
    ctaPlace: title,
    koreaFestivalHint: hint,
    showPlannerHeader: false,
    history: [],
    userText,
  };
}

const input = await loadContextInput();
const ctx = buildFestivalMooniContext(input);
if (!ctx?.title) {
  console.error(`No title for contentId ${contentId}`);
  process.exit(1);
}

const origin = String(process.env.ORIGIN || '').trim();
console.log(`festival ${ctx.contentId} ${ctx.title}`);
console.log(`nearby in this probe: ${(ctx.nearbyPlaces || []).length} (fixture only)`);

for (const locale of ['ko', 'en']) {
  const hint = buildMooniBoundFestivalSystemHint(ctx, locale);
  for (const [chipId, userText] of chipAsks(locale)) {
    const started = Date.now();
    const response = await fetch(`${base}/functions/v1/gemini-proxy`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify({
        task: 'mooni_chat',
        params: clientParams(locale, chipId, userText, hint, ctx.title),
      }),
    });
    const latencyMs = Date.now() - started;
    const data = await response.json().catch(() => null);
    const model = data?.model || data?.modelUsed || data?.meta?.model || '';
    console.log(`\n## ${locale} ${chipId} HTTP ${response.status} ${latencyMs}ms model=${model || '-'}`);
    if (data?.success && data?.text) console.log(String(data.text).trim());
    else console.log(JSON.stringify({ error: data?.error || data?.message || 'empty' }));
  }
}
