import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  NO_MATCH_KO,
  NO_MATCH_KO_DETAIL,
  buildMooniKoreaFestivalSystemHint,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const FESTIVAL_CTX_790124 = {
  contentId: '790124',
  title: '홍천 인삼한우 명품축제',
  eventStartDate: '20261008',
  eventEndDate: '20261011',
  dateLabel: '10.08 – 10.11',
  timeText: '09:00 ~ 22:00',
  feeText: '무료',
  venue: '도시산림공원 토리숲',
  address: '강원특별자치도 홍천군 홍천읍 갈마곡리',
  gateoUrl: 'https://www.gateo.kr/korea/?festival=790124',
};

const FOLLOW_UP_QUESTIONS = [
  '이 축제 언제 해?',
  '입장료는 얼마예요?',
  '주차장은 어디에 있어요?',
];

function assertFestivalBoundHint(hint) {
  assert.ok(hint.includes('홍천 인삼한우 명품축제'), '제목');
  assert.ok(hint.includes('20261008') && hint.includes('20261011'), '기간 YMD');
  assert.ok(hint.includes('09:00') && hint.includes('22:00'), '시간');
  assert.ok(hint.includes('무료'), '요금');
  assert.ok(hint.includes('도시산림공원 토리숲'), '장소');
  assert.ok(hint.includes('강원특별자치도 홍천군 홍천읍 갈마곡리'), '주소');
  assert.ok(hint.includes('https://www.gateo.kr/korea/?festival=790124'), 'GATEO 링크');
  assert.ok(!hint.includes('[GATEO 한국 축제 — 매칭 없음]'), '#394 매칭 없음 블록 금지');
  assert.ok(!hint.includes(NO_MATCH_KO_DETAIL), '겹치는 행사 없음 금지');
}

test('790124 festivalContext — 1~3번째 후속 질문마다 축제 사실 힌트 (축제 키워드 없어도)', async () => {
  for (const userText of FOLLOW_UP_QUESTIONS) {
    const { hint } = await resolveMooniChatKoreaFestivalHint({
      userText,
      festivalContext: FESTIVAL_CTX_790124,
      locale: 'ko',
    });
    assertFestivalBoundHint(hint);
  }
});

test('790124 festivalContext — 어느 턴에도 #394 매칭 없음 힌트 없음', async () => {
  const turns = ['이 축제 언제 해?', '주차는?', '다른 축제도 추천해줘'];
  for (const userText of turns) {
    const { hint } = await resolveMooniChatKoreaFestivalHint({
      userText,
      festivalContext: FESTIVAL_CTX_790124,
      locale: 'ko',
      loadFestivalItems: async () => [
        {
          contentId: '999',
          title: '다른 축제',
          eventStartDate: '20261201',
          eventEndDate: '20261203',
          addr1: '서울',
        },
      ],
    });
    assert.ok(!hint.includes('[GATEO 한국 축제 — 매칭 없음]'));
    assert.ok(!hint.includes(NO_MATCH_KO_DETAIL));
  }
});

test('비축제 세션 — #394 매칭 없음 힌트 유지', () => {
  const NOW = new Date(2026, 9, 5);
  const hint = buildMooniKoreaFestivalSystemHint({
    userText: '이번 주말 제주도 축제 뭐 있어?',
    boundPlaceName: '제주',
    items: [],
    locale: 'ko',
    now: NOW,
  });
  assert.ok(hint.includes(NO_MATCH_KO) || hint.includes('매칭 없음'));
  assert.ok(hint.includes(NO_MATCH_KO_DETAIL) || hint.includes('겹치는 행사가 없습니다'));
});

test('ChatModal · usePlaceChat — resolvePlaceChatKoreaFestivalHint 경로', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  const usePlaceChat = readFileSync(
    join(root, 'src/components/PlaceCard/hooks/usePlaceChat.js'),
    'utf8',
  );
  const bridge = readFileSync(
    join(root, 'src/pages/Home/lib/resolvePlaceChatKoreaFestivalHint.js'),
    'utf8',
  );
  assert.match(chatModal, /resolvePlaceChatKoreaFestivalHint/);
  assert.match(usePlaceChat, /resolvePlaceChatKoreaFestivalHint/);
  assert.match(bridge, /resolveMooniChatKoreaFestivalHint/);
  assert.match(chatModal, /koreaFestivalHint/);
  assert.match(usePlaceChat, /koreaFestivalHint/);
});
