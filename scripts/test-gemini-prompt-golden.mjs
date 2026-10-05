#!/usr/bin/env node
/**
 * 현재 클라이언트 문장 조립 === 사실 추출 → 서버 템플릿 (바이트 동일).
 * 검색 프롬프트는 origin/main useHomeHandlers 원문을 오라클로 쓴다.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { getMooniPromptBundle, fillMooniPromptTemplate } from '../src/i18n/mooniPromptBundles.js';
import { getCurationPrompt, getLogbookPrompt, getPlaceChatIntroSystemPrompt, getReviewPrompt, getSystemPrompt } from '../src/pages/Home/lib/prompts.js';
import { extractMooniChipPromptFacts, getMooniChipPromptHint } from '../src/pages/Home/lib/mooniChipPrompts.js';
import { formatMooniTripSessionHint } from '../src/pages/Home/lib/mooniTripSession.js';
import { getChatCtaPromptHint, resolveChatCtaCode } from '../src/utils/chatCtaPromptHint.js';
import {
  LOGBOOK_SYSTEM,
  REVIEW_SYSTEM,
  SEARCH_INTENT_SYSTEM,
  renderCtaHint,
  renderCuration,
  renderIntro,
  renderLogbook,
  renderMooniSystem,
  renderReview,
  renderSearchIntent,
  renderTripSessionHint,
  wrapUserTurn,
} from '../supabase/functions/_shared/gemini/templates.js';

const failures = [];

function same(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS  ${name}`);
    return;
  }
  let index = 0;
  const limit = Math.max(actual.length, expected.length);
  while (index < limit && actual[index] === expected[index]) index += 1;
  failures.push(name);
  console.error(`FAIL  ${name} at ${index} (client ${expected.length} / server ${actual.length})`);
  console.error(`  client: ${JSON.stringify(expected.slice(Math.max(0, index - 60), index + 80))}`);
  console.error(`  server: ${JSON.stringify(actual.slice(Math.max(0, index - 60), index + 80))}`);
}

function legacyWrap(system, history, userText) {
  return `${system}\n\n[이전 대화 내역]\n${JSON.stringify(history)}\n\n사용자 질문: ${userText}`;
}

function clientMooni(input) {
  const bundle = getMooniPromptBundle(input.locale);
  const tripHint = formatMooniTripSessionHint(input.tripSession, bundle);
  const chipHint = getMooniChipPromptHint({
    chipId: input.chipId,
    userText: input.userText,
    slug: input.slug,
    destinationName: input.destinationName,
    chatHistory: input.history,
    essentialGuide: input.essentialGuide,
    locale: input.locale,
    tripSession: input.tripSession,
  });
  const ctaHint = getChatCtaPromptHint({
    userText: input.userText,
    slug: input.slug,
    destinationName: input.destinationName,
    chatHistory: input.history,
    essentialGuide: input.essentialGuide,
    locale: input.locale,
  });
  return getSystemPrompt(input.persona, input.locationName, {
    locale: input.locale,
    isMooni: input.isMooni,
    boundPlaceName: input.boundPlaceName,
    chipPromptHint: chipHint,
    chatCtaHint: ctaHint,
    tripSessionHint: tripHint,
  });
}

function serverMooni(input) {
  const extracted = extractMooniChipPromptFacts({
    chipId: input.chipId,
    userText: input.userText,
    slug: input.slug,
    destinationName: input.destinationName,
    chatHistory: input.history,
    essentialGuide: input.essentialGuide,
    locale: input.locale,
    tripSession: input.tripSession,
  });
  const cta = resolveChatCtaCode({
    userText: input.userText,
    slug: input.slug,
    destinationName: input.destinationName,
    chatHistory: input.history,
    essentialGuide: input.essentialGuide,
  });
  return renderMooniSystem({
    locale: input.locale,
    persona: input.persona,
    locationName: input.locationName,
    boundPlaceName: input.boundPlaceName,
    isMooni: input.isMooni,
    tripSession: input.tripSession,
    chipId: extracted?.chipId ?? null,
    chipFacts: extracted?.facts ?? null,
    cta: cta.code,
    ctaPlace: cta.place,
  });
}

function compareMooni(name, input) {
  const client = clientMooni(input);
  const server = serverMooni(input);
  same(name, server, client);
  const history = input.history.map((turn) => ({ role: turn.role, text: turn.text }));
  same(`${name} wrap`, wrapUserTurn(server, history, input.userText), legacyWrap(client, history, input.userText));
}

const history = [
  { role: 'user', text: '파리 3박 알려줘' },
  { role: 'model', text: '센 강 주변을 가볍게 걷는 일정이 좋아요.' },
];

compareMooni('home mooni ko', {
  locale: 'ko',
  persona: 'GENERAL',
  locationName: 'MOONi',
  boundPlaceName: '',
  isMooni: true,
  chipId: null,
  userText: '이번 주말에 어디 갈까?',
  slug: null,
  destinationName: '',
  essentialGuide: null,
  tripSession: null,
  history,
});

compareMooni('home mooni en', {
  locale: 'en',
  persona: 'GENERAL',
  locationName: 'MOONi',
  boundPlaceName: '',
  isMooni: true,
  chipId: null,
  userText: 'Where should I go this weekend?',
  slug: null,
  destinationName: '',
  essentialGuide: null,
  tripSession: null,
  history,
});

const tripSession = {
  stayLabel: '3박 4일',
  nights: 3,
  days: 4,
  arrivalIata: 'CDG',
  arrivalAirportLabel: '파리 샤를 드골',
  departureIata: 'ICN',
  departureAirportLabel: '인천',
  arrivalTime: '오전 9시',
  flightNumber: 'KE501',
  condition: '첫날은 가볍게',
  companions: '둘',
  currentArea: '마레',
  notes: ['카페에서 쉬기', '박물관은 오후에'],
};

for (const chipId of ['place_overview', 'prep_flight', 'prep_transport']) {
  compareMooni(`place bind ${chipId}`, {
    locale: 'ko',
    persona: 'PLANNER',
    locationName: '파리',
    boundPlaceName: '파리',
    isMooni: true,
    chipId,
    userText: '항공이랑 공항에서 시내 가는 법 알려줘',
    slug: 'paris',
    destinationName: '파리',
    essentialGuide: {
      categories: {
        flight: { advice: '직항은 보통 12시간 안팎입니다.' },
        pre_travel: [{ title: '여권 잔여 기간' }, { title: '여행자 보험' }],
        journey_timeline: [{ title: '인천 출발', description: '저녁 비행' }],
      },
    },
    tripSession,
    history,
  });
}

same(
  'trip session hint',
  renderTripSessionHint('ko', tripSession).trim(),
  formatMooniTripSessionHint(tripSession, getMooniPromptBundle('ko')).trim(),
);

const ctaCases = [
  { name: 'cta none quiet', userText: '오늘 날씨 어때?', slug: null, destinationName: '' },
  { name: 'cta none transport', userText: '현지 교통이랑 렌터카 어디서 봐?', slug: null, destinationName: '파리' },
];
for (const item of ctaCases) {
  const code = resolveChatCtaCode(item);
  same(
    item.name,
    renderCtaHint('ko', code.code, code.place),
    getChatCtaPromptHint({ ...item, locale: 'ko' }),
  );
}

for (const locale of ['ko', 'en']) {
  const name = '교토';
  const intro = renderIntro(locale, name);
  const bundle = getMooniPromptBundle(locale);
  same(
    `intro ${locale}`,
    intro.system,
    getPlaceChatIntroSystemPrompt(locale),
  );
  same(
    `intro user ${locale}`,
    intro.userText,
    fillMooniPromptTemplate(bundle.introUser, { name }),
  );
  same(
    `intro wrap ${locale}`,
    wrapUserTurn(intro.system, [], intro.userText),
    legacyWrap(getPlaceChatIntroSystemPrompt(locale), [], fillMooniPromptTemplate(bundle.introUser, { name })),
  );
}

const handler = execFileSync('git', ['show', 'origin/main:src/pages/Home/hooks/useHomeHandlers.js'], {
  encoding: 'utf8',
});
const moodBody = handler.match(/const aiPrompt = treatAsMoodQuery\s*\?\s*`([\s\S]*?)`\s*:\s*isFacilityQuery/)?.[1];
const facilityBody = handler.match(/isFacilityQuery\(query\)\s*\?\s*`([\s\S]*?)`\s*:\s*`/)?.[1];
const typoBody = handler.match(/isFacilityQuery\(query\)\s*\?\s*`[\s\S]*?`\s*:\s*`([\s\S]*?)`;/)?.[1];
if (!moodBody || !facilityBody || !typoBody) {
  failures.push('search oracle extract');
  console.error('FAIL  could not extract origin/main search prompts');
} else {
  const legacySearch = {
    mood: new Function('query', `return \`${moodBody}\`;`),
    facility: new Function('query', `return \`${facilityBody}\`;`),
    typo: new Function('query', `return \`${typoBody}\`;`),
  };
  for (const [mode, query] of [['typo', '파라'], ['mood', '번아웃'], ['facility', '홍천 휴게소']]) {
    const rendered = renderSearchIntent(mode, query);
    same(`search ${mode} system`, rendered.system, SEARCH_INTENT_SYSTEM);
    same(`search ${mode}`, rendered.userText, legacySearch[mode](query));
    same(
      `search ${mode} wrap`,
      wrapUserTurn(rendered.system, [], rendered.userText),
      legacyWrap(SEARCH_INTENT_SYSTEM, [], legacySearch[mode](query)),
    );
  }
}

for (const rating of [2, 5]) {
  const draft = rating === 5 ? '야경이 정말 좋았다' : '사람이 너무 많았다';
  const rendered = renderReview('파리', rating, draft);
  same(`review ${rating} system`, rendered.system, REVIEW_SYSTEM);
  same(`review ${rating}`, rendered.userText, getReviewPrompt('파리', rating, draft));
  same(
    `review ${rating} wrap`,
    wrapUserTurn(rendered.system, [], rendered.userText),
    legacyWrap(REVIEW_SYSTEM, [], getReviewPrompt('파리', rating, draft)),
  );
}

for (const mode of ['essay', 'sns']) {
  for (const images of [0, 2]) {
    const rendered = renderLogbook(mode, '2026-10-03', '파리', '센 강에서 걸었다', images);
    const client = getLogbookPrompt(mode, '2026-10-03', '파리', '센 강에서 걸었다', images);
    same(`logbook ${mode} photos ${images} system`, rendered.system, LOGBOOK_SYSTEM);
    same(`logbook ${mode} photos ${images}`, rendered.userText, client);
    same(
      `logbook ${mode} photos ${images} wrap`,
      wrapUserTurn(rendered.system, [], rendered.userText),
      legacyWrap(LOGBOOK_SYSTEM, [], client),
    );
  }
}

const reports = [{ location: '교토' }, { location: '리스본' }];
const saved = [{ destination: '아이투타키' }];
const exclude = ['발리'];
const rejected = [{ location: '방콕' }];
const searches = ['조용한 섬', '온천'];
const visited = ['오사카'];
const tags = ['sea', 'quiet'];

function curationServer(locale) {
  return renderCuration({
    locale,
    reports: reports.map((row) => row.location),
    saved: saved.map((row) => row.destination),
    exclude,
    rejected: rejected.map((row) => row.location),
    recentSearches: searches,
    recentVisited: visited,
    tasteTags: tags,
  });
}

for (const locale of ['ko', 'en']) {
  const client = getCurationPrompt(reports, saved, exclude, {
    rejectedList: rejected,
    tasteTags: tags,
    recentSearches: searches,
    recentVisited: visited,
    locale,
  });
  const server = curationServer(locale);
  same(`curation ${locale}`, server, client);
  same(`curation ${locale} wrap`, wrapUserTurn(server, [], ''), legacyWrap(client, [], ''));
}

const oldCtaSrc = execFileSync('git', ['show', 'origin/main:src/utils/chatCtaPromptHint.js'], {
  encoding: 'utf8',
});
const abs = (rel) => new URL(rel, import.meta.url).href;
const rewrittenCta = oldCtaSrc
  .replace("from './chatBookingResolver.js'", `from '${abs('../src/utils/chatBookingResolver.js')}'`)
  .replace("from './placePlannerFocus.js'", `from '${abs('../src/utils/placePlannerFocus.js')}'`)
  .replace("from '../i18n/config'", `from '${abs('../src/i18n/config.js')}'`)
  .replace("from '../i18n/mooniPromptBundles'", `from '${abs('../src/i18n/mooniPromptBundles.js')}'`);
const oldCtaPath = '/tmp/gateo-old-chat-cta.mjs';
writeFileSync(oldCtaPath, rewrittenCta);
const oldCta = await import(pathToFileURL(oldCtaPath).href);
for (const item of [
  { userText: '안녕', slug: 'paris', destinationName: '파리', locale: 'ko' },
  { userText: '렌터카 어디서 찾아?', slug: null, destinationName: '파리', locale: 'ko' },
  { userText: '비자 준비 뭐가 필요해?', slug: 'paris', destinationName: '파리', locale: 'en' },
]) {
  same(
    `cta origin ${item.userText}`,
    getChatCtaPromptHint(item),
    oldCta.getChatCtaPromptHint(item),
  );
}

if (failures.length) {
  console.error(`\ntest-gemini-prompt-golden: ${failures.length} FAIL`);
  process.exit(1);
}
console.log('PASS  test-gemini-prompt-golden');
