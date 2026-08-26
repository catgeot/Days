/**
 * 해외·큐레이션 행사 SSOT — overrides → `npm run generate:world-events`
 * `worldEvents.json` 직접 편집 금지.
 *
 * Wave 1 slug·행사 12~15건은 세션 #6 (P2-a)에서 추가.
 * P0-a: 스키마·파이프라인 검증용 스켈레톤 (예시 0건).
 *
 * @typedef {import('../lib/world-event-schema.mjs').WorldEventOverride} WorldEventOverride
 */

/** @type {WorldEventOverride[]} */
export const WORLD_EVENT_OVERRIDES = [
  // 예시 (주석 해제 후 generate · audit로 검증):
  // {
  //   id: 'vienna-staatsoper-season-2026',
  //   slug: 'vienna',
  //   hubId: 'vienna',
  //   type: 'season',
  //   title: '빈 국립오페라 시즌',
  //   titleEn: 'Vienna State Opera Season',
  //   startDate: '2026-09-01',
  //   endDate: '2027-06-30',
  //   recurrence: 'annual',
  //   recurrenceNote: '9월~익년 6월',
  //   venue: { name: 'Vienna State Opera' },
  //   source: 'curated',
  //   sourceUrl: 'https://www.wiener-staatsoper.at/en/',
  //   bookingHints: '오페라 시즌 숙소는 1구·카발티에르 근처',
  //   priority: 1,
  // },
];
