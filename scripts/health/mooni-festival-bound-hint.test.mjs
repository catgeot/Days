import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  NO_MATCH_KO,
  NO_MATCH_KO_DETAIL,
  buildMooniKoreaFestivalSystemHint,
  mergeMooniKoreaFestivalReply,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import {
  isFestivalItineraryAsk,
  isFestivalOperatingScheduleAsk,
  shouldMooniScopedFestivalReplaceEmptyCandidates,
} from '../../src/pages/Home/lib/mooniKoreaFestivalTurn.js';

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
  assert.ok(hint.includes('- 날짜: 10/8~11'), '짧은 날짜');
  assert.ok(!/10월\s*8일부터/.test(hint), '긴 날짜 없음');
  assert.ok(!/시작까지 \d+일/.test(hint), '카운트다운 없음');
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

const HAEUNDAE_SCHEDULE_ASK =
  '해운대 빛축제(2026.11.28~2027.1.10) 기간 중 토요일 하루 일정을 짜 줘';

const FESTIVAL_CTX_2048902 = {
  contentId: '2048902',
  title: '해운대 빛축제',
  eventStartDate: '20261128',
  eventEndDate: '20270110',
  gateoUrl: 'https://www.gateo.kr/korea/?festival=2048902',
  venue: '해운대해수욕장',
};

test('bound 축제 상세 — 기간 중 토요일 일정 질문은 0건 덮어쓰기 금지', () => {
  assert.equal(
    shouldMooniScopedFestivalReplaceEmptyCandidates(HAEUNDAE_SCHEDULE_ASK, {
      boundFestivalSession: true,
    }),
    false,
  );
  const aiBody =
    '토요일이면 오후에 해운대 입구부터 산책하고, 저녁 조명 시간에 맞춰 윈드블래스트 쪽을 보는 흐름이 좋아요.';
  const merged = mergeMooniKoreaFestivalReply(aiBody, {
    candidates: [],
    userText: HAEUNDAE_SCHEDULE_ASK,
    locale: 'ko',
    scopedFestivalEnabled: true,
    boundFestivalSession: true,
  });
  assert.equal(merged, aiBody);
  assert.ok(!merged.includes(NO_MATCH_KO_DETAIL));
  assert.ok(!/겹치는\s*행사는\s*없어요/.test(merged));
});

test('bound 축제 상세 — 이번 주 다른 축제 찾기는 0건 덮어쓰기 유지', () => {
  assert.equal(
    shouldMooniScopedFestivalReplaceEmptyCandidates('이번 주말 부산 다른 축제 있어?', {
      boundFestivalSession: true,
    }),
    true,
  );
  const merged = mergeMooniKoreaFestivalReply('모델 본문', {
    candidates: [],
    userText: '부산 이번 주말 축제',
    locale: 'ko',
    scopedFestivalEnabled: true,
    boundFestivalSession: true,
  });
  assert.match(merged, /겹치는 행사는 없어요|GATEO 축제 목록/);
});

test('1095732 style — 일정을 짜 줘 is itinerary intent', () => {
  const ask =
    '서울빛초롱축제(12.11~1.31) 기간 중 토요일 하루 일정을 짜 줘';
  assert.equal(isFestivalItineraryAsk(ask), true);
});

test('bound hint — itinerary ask includes day-route coach line', async () => {
  const ask = HAEUNDAE_SCHEDULE_ASK;
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: ask,
    festivalContext: FESTIVAL_CTX_2048902,
    locale: 'ko',
  });
  assert.match(hint, /하루 동선·일정/);
});

test('bound hint — 운영 일정 질문은 day-route coach 없음', async () => {
  const ask = '축제 기간 중 일정 알려줘';
  assert.equal(isFestivalItineraryAsk(ask), false);
  assert.equal(isFestivalOperatingScheduleAsk(ask), true);
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: ask,
    festivalContext: FESTIVAL_CTX_2048902,
    locale: 'ko',
  });
  assert.ok(!/하루 동선·일정/.test(hint));
  assert.match(hint, /운영 일정\(기간·시간·장소\)만/);
  assert.ok(!/주변 맛집\(GATEO\)/.test(hint));
});

test('bound hint — 토요일 일정 알려줘 strips restaurants and adds schedule coach', async () => {
  const ask = '토요일 일정 알려줘';
  assert.equal(isFestivalOperatingScheduleAsk(ask), true);
  const ctx = {
    ...FESTIVAL_CTX_2048902,
    nearbyRestaurants: [{ name: '테스트식당', distKm: 0.2, cat3: '한식' }],
    nearbyPlaces: ['해운대해수욕장', '동백섬'],
  };
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: ask,
    festivalContext: ctx,
    locale: 'ko',
  });
  assert.ok(!/주변 맛집/.test(hint));
  assert.ok(!/근처\(GATEO\)/.test(hint));
  assert.match(hint, /맛집 이름은 쓰지 않아요/);
});

test('2048902 bound hint — 일정 질문에 매칭 없음·겹침 문구 없음', async () => {
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: HAEUNDAE_SCHEDULE_ASK,
    festivalContext: FESTIVAL_CTX_2048902,
    locale: 'ko',
  });
  assert.ok(hint.includes('해운대 빛축제'));
  assert.ok(!hint.includes(NO_MATCH_KO_DETAIL));
  assert.ok(!hint.includes('[GATEO 한국 축제 — 매칭 없음]'));
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
