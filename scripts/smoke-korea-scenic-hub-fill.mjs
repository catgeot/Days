/**
 * 선정 명소 권역 보강 도구 스모크.
 *
 *   npm run smoke:korea-scenic-hub-fill
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildScenicFillRounds,
  draftScenicSpotsForHubs,
  isDistrictHub,
  listEmptyScenicHubs,
} from './lib/koreaScenicHubFill.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const areaCodes = JSON.parse(
  readFileSync(
    join(__dirname, '../src/pages/Home/data/koreaAreaCodes.json'),
    'utf8',
  ),
);
const scenic = JSON.parse(
  readFileSync(
    join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json'),
    'utf8',
  ),
);

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
  !empty.some((h) => h.hubId === 'gimpo'),
  '김포는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'goyang'),
  '고양은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'gwangmyeong'),
  '광명은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'hanam'),
  '하남은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'anseong'),
  '안성은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'anyang'),
  '안양은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'bucheon'),
  '부천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'namyangju'),
  '남양주는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'pocheon'),
  '포천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'siheung'),
  '시흥은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'uiwang'),
  '의왕은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yangpyeong'),
  '양평은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yongin'),
  '용인은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'gunpo'),
  '군포는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'guri'),
  '구리는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'gwacheon'),
  '과천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'gwangju_gi'),
  '경기 광주는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'hwaseong'),
  '화성은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'ongjin'),
  '옹진은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'osan'),
  '오산은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'jincheon'),
  '진천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'asan'),
  '아산은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'cheonan'),
  '천안은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'uijeongbu'),
  '의정부는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yeoju'),
  '여주는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yeoncheon'),
  '연천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'cheorwon'),
  '철원은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'dongducheon'),
  '동두천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'icheon'),
  '이천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'pyeongtaek'),
  '평택은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'wonju'),
  '원주는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yangju'),
  '양주는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'inje'),
  '인제는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yeongwol'),
  '영월은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'goseong'),
  '고성은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'hongcheon'),
  '홍천은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'yanggu'),
  '양구는 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'jeongseon'),
  '정선은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'taebaek'),
  '태백은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.hubId === 'uljin'),
  '울진은 선정 있음 → 빈 목록 제외',
);
assert(
  !empty.some((h) => h.district),
  '기본 목록에 자치구 없음',
);

const byHubId = areaCodes?.byHubId && typeof areaCodes.byHubId === 'object'
  ? areaCodes.byHubId
  : {};
const curatedHubIds = [
  ...new Set(
    (Array.isArray(scenic?.spots) ? scenic.spots : [])
      .map((s) =>
        String(s?.hubId || '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean),
  ),
];
const unlinked = curatedHubIds.filter((id) => byHubId[id] == null);
assert(
  unlinked.length === 0,
  `선정 hub 전부 area 색인 (missing: ${unlinked.slice(0, 8).join(',') || 'none'})`,
);

const rounds = buildScenicFillRounds(empty, { batchSize: 10 });
assert(rounds.length >= 1, `rounds≥1 (got ${rounds.length})`);
assert(
  rounds[0].workerA.length + rounds[0].workerB.length <= 10,
  'R01 size≤10',
);

const already = draftScenicSpotsForHubs(['yangyang']);
assert(
  already.drafts.length === 0 &&
    already.skipped.some(
      (s) => s.hubId === 'yangyang' && String(s.reason).startsWith('already-complete'),
    ),
  'yangyang already-complete (전수 선정)',
);

const target = empty.find((h) => h.attractions >= 5);
if (target) {
  const full = draftScenicSpotsForHubs([target.hubId]);
  assert(
    full.drafts.length === target.attractions,
    `default drafts ALL attractions for ${target.hubId} (got ${full.drafts.length}, hub has ${target.attractions}) — no per-hub=4 default`,
  );
  const capped = draftScenicSpotsForHubs([target.hubId], { perHub: 2 });
  assert(
    capped.drafts.length === 2,
    `--per-hub=2 caps ${target.hubId} to 2`,
  );
  assert(
    full.drafts.every((d) => d.hubId === target.hubId && d.region && d.attractionName),
    `${target.hubId} draft fields`,
  );
  assert(
    full.drafts.every((d) => d.order > maxOrder),
    'draft orders after maxOrder',
  );
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-scenic-hub-fill SMOKE OK');
