import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { CAIRO_CITY_FACTS, resolveVerifiedFacts } from '../../src/data/placeVerifiedFacts/cairo.js';
import {
  assignSketchLocalInfo,
  plannerSlotForToolkit,
  selectVisitStories,
  verifiedFactSlots,
} from '../../src/data/placeVerifiedFacts/localInfoLayout.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const UNCHANGED_PLACES = [
  '파리',
  'Paris',
  'paris',
  '강릉',
  'Gangneung',
  'gangneung',
  '아디스아바바',
  'Addis Ababa',
  'addis-ababa',
];

test('no verified facts leaves the place card unchanged', () => {
  const sections = [
    { title: '도착', content: '공항 택시와 비자 심사를 통과한다.' },
    { title: '첫날', content: 'D1 시내에서 쉰다.' },
  ];
  for (const name of UNCHANGED_PLACES) {
    const card = resolveVerifiedFacts(name);
    assert.equal(card, null, name);
    assert.deepEqual(verifiedFactSlots(card), []);
    assert.deepEqual(assignSketchLocalInfo(sections, card), []);
    assert.equal(plannerSlotForToolkit(card, 'visa'), null);
    assert.equal(plannerSlotForToolkit(card, 'airport_transfer'), null);
    assert.equal(plannerSlotForToolkit(card, 'safety'), null);
  }

  const factsUi = readFileSync(join(root, 'src/components/PlaceCard/common/PlaceVerifiedFacts.jsx'), 'utf8');
  assert.match(factsUi, /if \(!card\) return null/);
  const gallery = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceGalleryView.jsx'), 'utf8');
  const wiki = readFileSync(join(root, 'src/components/PlaceCard/views/PlaceWikiDetailsView.jsx'), 'utf8');
  const planner = readFileSync(join(root, 'src/components/PlaceCard/tabs/PlannerTab.jsx'), 'utf8');
  assert.match(gallery, /<PlaceVerifiedFacts/);
  assert.match(gallery, /<PlaceVisitStories/);
  assert.equal(wiki.includes('<PlaceVerifiedFacts'), false);
  assert.equal(planner.includes('<PlaceVerifiedFacts'), false);
  assert.match(wiki, /PlaceLocalInfoInline/);
  assert.match(planner, /AiGeneratedBanner/);

  const toolkit = readFileSync(join(root, 'src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx'), 'utf8');
  const verifiedFirst = toolkit.indexOf('verifiedPlannerFirst ?');
  const adviceBlock = toolkit.indexOf('{showAdviceBlock &&');
  assert.ok(verifiedFirst > 0 && verifiedFirst < adviceBlock);
  assert.match(toolkit, /showAdviceBlock = !verifiedPlannerFirst &&/);
  assert.equal(toolkit.includes('line-clamp-3'), false);
  assert.match(toolkit, /defaultOpen/);
});

test('cairo gallery keeps filled topics only and planner skips the itinerary', () => {
  const filled = verifiedFactSlots(CAIRO_CITY_FACTS).map((slot) => slot.id);
  assert.deepEqual(filled, ['entry', 'airport', 'itinerary', 'money-safety', 'safety']);
  assert.equal(plannerSlotForToolkit(CAIRO_CITY_FACTS, 'visa')?.id, 'entry');
  assert.equal(plannerSlotForToolkit(CAIRO_CITY_FACTS, 'airport_transfer')?.id, 'airport');
  assert.equal(plannerSlotForToolkit(CAIRO_CITY_FACTS, 'safety')?.id, 'safety');
  assert.equal(plannerSlotForToolkit(CAIRO_CITY_FACTS, 'accommodation'), null);
  assert.equal(plannerSlotForToolkit(CAIRO_CITY_FACTS, 'flight'), null);
  assert.equal(
    Object.values({
      visa: plannerSlotForToolkit(CAIRO_CITY_FACTS, 'visa')?.id,
      airport: plannerSlotForToolkit(CAIRO_CITY_FACTS, 'airport_transfer')?.id,
      safety: plannerSlotForToolkit(CAIRO_CITY_FACTS, 'safety')?.id,
    }).includes('itinerary'),
    false,
  );

  const giza = resolveVerifiedFacts('기자 피라미드');
  assert.equal(giza?.kind, 'attraction');
  assert.deepEqual(
    verifiedFactSlots(giza).map((slot) => slot.id),
    ['hours', 'fee', 'booking', 'map', 'notes'],
  );
});

test('sketch assigns the first matching section once', () => {
  const sections = [
    { title: '도착, 첫 공기', content: '카이로국제공항 택시 호객이 다가온다.' },
    { title: '다시 공항', content: '택시로 공항에 돌아간다.' },
    { title: '피라미드의 아침', content: '첫날 D1 기자 고원으로 향한다.' },
    { title: '골목', content: '환전과 소매치기를 조심한다.' },
  ];
  assert.deepEqual(assignSketchLocalInfo(sections, CAIRO_CITY_FACTS), [
    { index: 0, slotId: 'airport' },
    { index: 2, slotId: 'itinerary' },
    { index: 3, slotId: 'money-safety' },
  ]);
  const withEntry = [
    { title: '입국 심사', content: '여권과 비자를 확인한다. 공항 택시도 있다.' },
    { title: '시내', content: '택시로 이동한다.' },
  ];
  assert.deepEqual(assignSketchLocalInfo(withEntry, CAIRO_CITY_FACTS), [
    { index: 0, slotId: 'entry' },
    { index: 1, slotId: 'airport' },
  ]);
});

test('visit story titles come from stored titles only', () => {
  const names = ['카이로', 'Cairo', 'cairo'];
  const stories = selectVisitStories([
    { id: '1', kind: 'logbook', title: '카이로', date: '2026-10-01', editorial: false },
    { id: '2', kind: 'review', title: '   ', date: '2026-10-09', editorial: true },
    { id: '3', kind: 'logbook', title: '사흘의 윤곽', date: '2026-10-03', editorial: true },
    { id: '4', kind: 'review', title: '사흘의 윤곽', date: '2026-10-12', editorial: false },
    { id: '5', kind: 'review', title: '골목의 코샤리', date: '2026-09-01', editorial: false },
    { id: '6', kind: 'logbook', title: '나일강의 저녁', date: '2026-10-08', editorial: false },
    { id: '7', kind: 'review', title: '예시 제목', editorial: false },
  ], names);
  assert.deepEqual(stories.map((row) => row.title), ['사흘의 윤곽', '나일강의 저녁']);
  assert.equal(stories[0].kind, 'logbook');
  assert.equal(stories[0].editorial, true);
  assert.equal(stories.some((row) => row.title === '예시 제목'), false);
  assert.equal(stories.some((row) => !row.title), false);
});
