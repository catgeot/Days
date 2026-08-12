#!/usr/bin/env node
/**
 * 큐레이션 history 객체 목록 · upsert · 하위호환 · 복원 payload.
 * Usage: node scripts/smoke-curation-history.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function makeStore() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    _map: map,
  };
}

const {
  CURATION_HISTORY_KEY,
  CURATION_HISTORY_MAX,
  normalizeCurationHistoryEntry,
  parseCurationHistory,
  historyExcludeLocations,
  upsertCurationHistoryEntry,
  readCurationHistory,
  writeCurationHistory,
  curationEntryToPanelData,
  writeCurationData,
  readCurationData,
  CURATION_DATA_KEY,
  resolveActiveCurationPanel,
  removeCurationHistoryEntry,
  upsertCurationRejectedEntry,
  readCurationRejected,
  writeCurationRejected,
  writeCurationTasteSurvey,
  readCurationTasteSurvey,
} = await import(pathToFileURL(join(root, 'src/pages/DailyReport/lib/curationHistory.js')).href);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL ${msg}`);
    failed += 1;
  } else {
    console.log(`PASS ${msg}`);
  }
}

assert(normalizeCurationHistoryEntry('') === null, 'empty string → null');
assert(normalizeCurationHistoryEntry('아이투타키')?.location === '아이투타키', 'string → location');

const legacy = parseCurationHistory(JSON.stringify(['발리', '아이투타키', '발리']));
assert(legacy.length === 2, 'legacy string dedupe');
assert(legacy[0].location === '발리' && legacy[1].location === '아이투타키', 'legacy order');

const rich = normalizeCurationHistoryEntry({
  location: '파로스',
  locationEn: 'Faroe Islands',
  title: '안개 속 섬',
  description: '스토리',
  whyHidden: '접근이 어렵다',
  bestSeason: '6~8월',
  tips: ['방수 자켓', '  ', '페리 예약'],
  lat: 0,
  lng: 0,
});
assert(rich.whyHidden === '접근이 어렵다', 'rich whyHidden');
assert(rich.bestSeason === '6~8월', 'rich bestSeason');
assert(Array.isArray(rich.tips) && rich.tips.length === 2, 'tips filter empty');
assert(rich.lat === undefined && rich.lng === undefined, 'reject 0,0 coords');

let list = [];
list = upsertCurationHistoryEntry(list, { location: 'A', title: '첫' });
list = upsertCurationHistoryEntry(list, { location: 'B', title: '둘' });
list = upsertCurationHistoryEntry(list, { location: 'A', title: '첫-갱신', description: 'd' });
assert(list[0].location === 'A' && list[0].title === '첫-갱신', 'upsert moves to front');
assert(list.length === 2, 'upsert no dup');

const many = Array.from({ length: CURATION_HISTORY_MAX + 5 }, (_, i) => ({ location: `L${i}` }));
let capped = [];
for (const item of many) capped = upsertCurationHistoryEntry(capped, item);
assert(capped.length === CURATION_HISTORY_MAX, `max ${CURATION_HISTORY_MAX}`);

assert(
  historyExcludeLocations([{ location: 'X' }, 'Y', { location: '' }]).join(',') === 'X,Y',
  'exclude names',
);

const session = makeStore();
const local = makeStore();
session.setItem(CURATION_HISTORY_KEY, JSON.stringify(['세션옛']));
const migrated = readCurationHistory({ localStorage: local, sessionStorage: session });
assert(migrated[0]?.location === '세션옛', 'migrate session→local read');
assert(local.getItem(CURATION_HISTORY_KEY), 'wrote local on migrate');

const written = writeCurationHistory(
  upsertCurationHistoryEntry(migrated, {
    location: '신규',
    title: 't',
    tips: ['a', 'b'],
  }),
  { localStorage: local, sessionStorage: session },
);
assert(written[0].location === '신규', 'write front');
assert(JSON.parse(session.getItem(CURATION_HISTORY_KEY))[0].location === '신규', 'session sync');

const panel = curationEntryToPanelData(written[0]);
assert(panel?.tips?.length === 2, 'panel restore tips');
writeCurationData(panel, session);
assert(readCurationData(session)?.location === '신규', 'curation data roundtrip');
assert(session.getItem(CURATION_DATA_KEY), 'data key set');

const emptySession = makeStore();
const histOnlyLocal = makeStore();
writeCurationHistory(
  [
    {
      location: '라자암팟 제도',
      title: '신비로운 산호의 왕국',
      description: '본문',
      whyHidden: '접근',
    },
    { location: '소코트라 섬', title: '지구의 숨겨진 보석, 소코트라' },
  ],
  { localStorage: histOnlyLocal, sessionStorage: emptySession },
);
const restored = resolveActiveCurationPanel({
  localStorage: histOnlyLocal,
  sessionStorage: emptySession,
});
assert(restored.from === 'history', 'resolve from history when session empty');
assert(restored.panel?.location === '라자암팟 제도', 'history[0] becomes main panel');
assert(readCurationData(emptySession)?.location === '라자암팟 제도', 'history fallback writes session');

const emptyBothLocal = makeStore();
const emptyBothSession = makeStore();
const emptyActive = resolveActiveCurationPanel({
  localStorage: emptyBothLocal,
  sessionStorage: emptyBothSession,
});
assert(emptyActive.panel === null && emptyActive.from === null, 'no history → no panel (execution main)');

const { getCurationPrompt } = await import(
  pathToFileURL(join(root, 'src/pages/Home/lib/prompts.js')).href
);
const prompt = getCurationPrompt([], [], [{ location: '제외지' }, '문자열제외'], {
  rejectedList: [{ location: '라자암팟 제도' }],
  tasteTags: ['sea', 'quiet'],
});
assert(prompt.includes('제외지') && prompt.includes('문자열제외'), 'prompt exclude objects');
assert(prompt.includes('whyHidden') && prompt.includes('bestSeason') && prompt.includes('tips'), 'prompt rich fields');
assert(prompt.includes('라자암팟 제도') && prompt.includes('취향 불일치'), 'prompt rejected signal');
assert(prompt.includes('바다·섬') && prompt.includes('조용한 휴식'), 'prompt survey tags');

const rejLocal = makeStore();
const rejSession = makeStore();
let histList = [
  { location: 'A', title: 'a' },
  { location: 'B', title: 'b' },
];
histList = removeCurationHistoryEntry(histList, 'A');
assert(histList.length === 1 && histList[0].location === 'B', 'remove history entry');
const rejected = writeCurationRejected(
  upsertCurationRejectedEntry([], { location: 'A', locationEn: 'A Island' }),
  { localStorage: rejLocal, sessionStorage: rejSession },
);
assert(rejected[0].location === 'A', 'rejected upsert');
assert(readCurationRejected({ localStorage: rejLocal, sessionStorage: rejSession })[0].location === 'A', 'rejected read');

const surveyLocal = makeStore();
assert(writeCurationTasteSurvey({ tags: ['sea', 'nope'] }, { localStorage: surveyLocal })?.tags.join(',') === 'sea', 'survey filters unknown tags');
assert(readCurationTasteSurvey({ localStorage: surveyLocal })?.tags[0] === 'sea', 'survey read');

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nOK smoke-curation-history');
