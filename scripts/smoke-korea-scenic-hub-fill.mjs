/**
 * 선정 명소 권역 보강 도구 스모크.
 *
 *   npm run smoke:korea-scenic-hub-fill
 */
import {
  buildScenicFillRounds,
  draftScenicSpotsForHubs,
  isDistrictHub,
  listEmptyScenicHubs,
} from './lib/koreaScenicHubFill.mjs';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

assert(isDistrictHub({ aliases: ['강남구', 'Gangnam'] }), '강남구 = district');
assert(!isDistrictHub({ aliases: ['양양군', 'yangyang'] }), '양양군 ≠ district');
assert(!isDistrictHub({ aliases: ['양구군', 'yanggu'] }), '양구군 ≠ district');

const { empty, maxOrder, curatedHubs } = listEmptyScenicHubs();
assert(Array.isArray(empty), 'empty list');
assert(curatedHubs >= 1, `curatedHubs≥1 (got ${curatedHubs})`);
assert(maxOrder >= 10, `maxOrder≥10 (got ${maxOrder})`);
assert(
  !empty.some((h) => h.hubId === 'yangyang'),
  '양양은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'pyeongchang'),
  '평창은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'namhae'),
  '남해는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'ansan'),
  '안산은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'ganghwa'),
  '강화는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.district),
  '기본 목록에 자치구 없음',
);

const rounds = buildScenicFillRounds(empty, { batchSize: 10 });
assert(rounds.length >= 1, `rounds≥1 (got ${rounds.length})`);
assert(
  rounds[0].workerA.length + rounds[0].workerB.length <= 10,
  'R01 size≤10',
);

const already = draftScenicSpotsForHubs(['yangyang']);
assert(
  already.drafts.length === 0 && already.skipped.some((s) => s.hubId === 'yangyang'),
  'yangyang draft skipped (already curated)',
);

const target = empty.find((h) => h.attractions > 0);
if (target) {
  const { drafts, skipped } = draftScenicSpotsForHubs([target.hubId], {
    perHub: 2,
  });
  assert(
    drafts.length > 0 || skipped.length > 0,
    `draft ${target.hubId} produces drafts or skip`,
  );
  if (drafts.length) {
    assert(
      drafts.every((d) => d.hubId === target.hubId && d.region && d.attractionName),
      `${target.hubId} draft fields`,
    );
    assert(
      drafts.every((d) => d.order > maxOrder),
      'draft orders after maxOrder',
    );
  }
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-scenic-hub-fill SMOKE OK');
