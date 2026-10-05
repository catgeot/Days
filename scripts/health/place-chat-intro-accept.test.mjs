import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isPlaceChatIntroSentenceComplete,
  isPlaceChatIntroSummaryAccepted,
} from '../../src/pages/Home/lib/placeChatIntroLimits.js';

const SUTA_STUMP = '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수';

const OK_INTRO =
  '강원도 홍천의 공작산 자락에 아늑하게 품겨 있는 수타사는 신라 시대에 처음 세워졌다고 전해지는 유서 깊은 산사입니다. ' +
  '사계절 숲길과 고즈넉한 법당이 어우러져, 잠시 발길을 멈추고 쉬어 가 보기 좋습니다.';

test('rejects mid-sentence place_intro stump (Cos 수타사)', () => {
  assert.equal(isPlaceChatIntroSentenceComplete(SUTA_STUMP), false);
  assert.equal(isPlaceChatIntroSummaryAccepted(SUTA_STUMP), false);
});

test('accepts complete Korean intro ending with period', () => {
  assert.equal(isPlaceChatIntroSummaryAccepted(OK_INTRO), true);
});

test('rejects Draft / Stick to leak markers even when long', () => {
  const leak =
    'Stick to historical/visual facts.\n\n**Draft\n\n' +
    '제주도는 한국 최남단의 섬으로 해안 드라이브가 인기 있는 여행지입니다. ' +
    '올레길과 해변 카페를 즐기기 좋습니다.';
  assert.equal(isPlaceChatIntroSummaryAccepted(leak), false);
});

test('rejects Thinking marker lines', () => {
  const leak =
    'Thinking: outline the intro.\n\n' +
    '부산 해운대는 넓은 백사장과 야경이 어우러진 대표 해변입니다. ' +
    '인근 맛집과 산책로도 함께 둘러보기 좋습니다.';
  assert.equal(isPlaceChatIntroSummaryAccepted(leak), false);
});
