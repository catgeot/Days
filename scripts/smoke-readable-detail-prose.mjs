/**
 * TourAPI 상세 prose — 문장·문단 분리 스모크
 *   node scripts/smoke-readable-detail-prose.mjs
 */
import {
  splitTourApiDetailParagraphs,
  shouldUseReadableDetailProse,
} from '../src/shared/readableDetail/splitTourApiDetailParagraphs.js';

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log(`OK    ${msg}`);
  else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

const denseNoSpace =
  '경복궁은 1395년에 창건된 조선왕조의 법궁이다.1392년 이성계가 조선을 건국하고 한양으로 수도를 옮기면서 경복궁을 짓기 시작하였다.1443년에 완공되었으며 광화문·근정전·경회루 등이 있다.1990년대부터 대규모 복원이 진행되었다.';

const paras = splitTourApiDetailParagraphs(denseNoSpace);
assert(paras.length >= 2, `no-space overview splits into ≥2 paragraphs (got ${paras.length})`);
assert(
  paras.every((p) => p.length <= 320),
  'each paragraph stays under readable width target',
);
assert(shouldUseReadableDetailProse(denseNoSpace), 'dense overview uses prose mode');

const short = '입장료는 무료입니다.';
assert(splitTourApiDetailParagraphs(short).length === 1, 'short line stays one paragraph');
assert(!shouldUseReadableDetailProse(short), 'short line skips prose mode');

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-readable-detail-prose: all assertions passed');
