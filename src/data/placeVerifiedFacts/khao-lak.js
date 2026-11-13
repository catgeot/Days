/**
 * 카오락 LI — plans/2026-11-11-khao-lak-place-plan §3 · links-draft §5-1·§6.
 * 식당 칸·명소 카드 없음. 택시·밴 요금 등 공식 없는 값은 넣지 않음.
 */
import { verifiedSlot } from './schema.js';

const DAY = '2026-11-11';

const MOFA_TH = {
  name: '외교부 여행경보',
  url: 'https://www.0404.go.kr/ntnSafetyInfo/260/detail',
};
const TDAC = {
  name: 'TDAC (태국 디지털 입국카드)',
  url: 'https://tdac.immigration.go.th/',
};
const AOT_HKT = {
  name: '푸켓 국제공항 교통 안내',
  url: 'https://phuket.airportthai.co.th/service/transportation/detail/1176',
};
const TAT_KHAO_LAK = {
  name: '태국관광청 보도자료',
  url: 'https://news.cision.com/tourism-authority-of-thailand/r/7-best-things-to-do-in-khao-lak,c3416503',
};
const BANG_NIANG_MARKET = {
  name: '방니앙 시장',
  url: 'https://bangniangmarket.com/',
};
const TAT_JP_BAN_NAM = {
  name: '태국관광청 일본사무소 (반남켐)',
  url: 'https://www.thailandtravel.or.jp/bannamkhemtsunamimemorialpark/',
};
const TAT_JP_TAKUA = {
  name: '태국관광청 일본사무소 (따꾸아빠)',
  url: 'https://www.thailandtravel.or.jp/takua-pa/',
};
const PRD_SIMILAN = {
  name: '태국 정부홍보국',
  url: 'https://prd.go.th/main/article/0000a994-18ba-4c93-ba0f-eff02dc7ab47',
};
const DNP_OPEN = {
  name: '국립공원청',
  url: 'http://news.dnp.go.th/news/50005',
};

export const KHAO_LAK_CITY_FACTS = {
  kind: 'city',
  slug: 'khao-lak',
  name: '카오락',
  nameEn: 'Khao Lak',
  aliases: ['카오락', 'Khao Lak', 'khao-lak', 'khaolak'],
  slots: [
    verifiedSlot(
      '입국',
      '여권은 도착일 기준 6개월 이상 남아 있어야 해요.\n2025-05-01부터 디지털 입국카드(TDAC) 제출이 의무예요.\n입국일 포함 3일 안에 공식 사이트에서 무료로 제출해요.\n한국어 안내가 있어요.',
      [TDAC, MOFA_TH],
      DAY,
      { id: 'entry' },
    ),
    verifiedSlot(
      '공항→시내',
      '카오락은 팡아주 안다만 해안에 있고, 관문 공항은 푸켓 국제공항(HKT)이에요.\n푸켓 공항에서 북쪽으로 약 78km, 차로 약 1시간 10분~1시간 20분 걸려요(태국관광청 자료).\n공항 교통 안내에는 카오락·탑라무 직행 노선이 없어요.\n공항 버스 8411번은 푸켓타운행이고 08:00~21:00에 3번 출구에서 출발해요.\n카오락까지는 차량 이동을 기준으로 잡고, 숙소나 투어 픽업을 미리 확인하세요.\n국제선 도착층 관광객 지원센터(TAC)는 24시간 열려 있어요(+66 76 327 100).\n관광경찰은 1155예요.',
      [AOT_HKT, TAT_KHAO_LAK],
      DAY,
      { id: 'airport' },
    ),
    verifiedSlot(
      '머물 지역',
      '낭통 해변 쪽은 쇼핑·식당·나이트라이프가 모인 중심가라 걸어 다니기 편해요.\n조용한 쪽을 원하면 방삭 해변·팍윕 해변이 있어요.\n방니앙에는 월·수·목·토 저녁에 방니앙 시장이 서요.',
      [TAT_KHAO_LAK, BANG_NIANG_MARKET],
      DAY,
      { id: 'stay-area' },
    ),
    verifiedSlot(
      '1·2·3일 동선',
      '첫째 날: 낭통 해변이나 방삭·팍윕 해변에서 쉬고, 낮에 똔총파 폭포를 다녀와요. 저녁은 방니앙 시장이 서는 날(월·수·목·토 14:00~22:00)에 맞춰요.\n'
        + '둘째 날: 탑라무 선착장에서 시미란 국립공원 당일 배를 타요(약 1시간 30분). 섬 숙박은 안 되고 당일만 가능해요.\n'
        + '셋째 날: 북쪽으로 반남켐 쓰나미 추모공원(추모공원·해변 08:00~20:00, 박물관 수~일 08:30~16:30)에 들른 뒤 따꾸아빠 올드타운을 걸어요.',
      [TAT_KHAO_LAK, BANG_NIANG_MARKET, PRD_SIMILAN, TAT_JP_BAN_NAM, TAT_JP_TAKUA],
      DAY,
      { id: 'itinerary', headingKey: 'khao-lak-3days' },
    ),
    verifiedSlot(
      '돈',
      '시미란 국립공원 섬에는 ATM이 없어요.\n전화 신호가 끊기기도 하니 현금을 챙기세요.',
      [PRD_SIMILAN],
      DAY,
      { id: 'money-safety', kind: 'standing' },
    ),
    verifiedSlot(
      '치안',
      '외교부 여행경보에서 팡아주·푸켓은 1단계(여행유의)예요.\n2·3단계는 남부 국경(송클라 남부·파타니·나라티왓·얄라)·딱 주와 태국-캄보디아 국경 50km 안이에요.\n관광경찰은 1155예요.\n영사콜센터는 +82-2-3210-0404예요.',
      [MOFA_TH],
      DAY,
      { id: 'safety', kind: 'standing', checkedOn: DAY },
    ),
    verifiedSlot(
      '시즌',
      '시미란 국립공원은 2026-10-15~2027-05-15에 열려요.\n모든 섬에서 숙박은 금지고, 아침에 나가 저녁에 돌아오는 당일 방문만 가능해요.\n외국인 국립공원 입장료는 성인 500바트, 어린이 250바트예요.\n배는 대부분 탑라무 선착장(타이므앙군) 부근에서 떠나 스피드보트나 카타마란으로 약 1시간 30분 걸려요.\n식당·매점·화장실은 4번 섬과 8번 섬에만 있어요.\n섬에는 ATM이 없고, 따차이섬은 2016년부터 상륙이 막혀 있어요.\n날씨·상황에 따라 개방 구역이 바뀔 수 있어요.\n시미란 시즌·입장료·섬 규칙은 https://www.gateo.kr/place/similan-islands 에서도 확인해요.',
      [PRD_SIMILAN, DNP_OPEN],
      DAY,
      {
        id: 'season',
        kind: 'standing',
        endsAt: '2027-05-15',
      },
    ),
  ],
};

function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

const cardByKey = new Map();
for (const key of [
  KHAO_LAK_CITY_FACTS.slug,
  KHAO_LAK_CITY_FACTS.name,
  KHAO_LAK_CITY_FACTS.nameEn,
  ...(KHAO_LAK_CITY_FACTS.aliases || []),
]) {
  const nk = norm(key);
  if (nk) cardByKey.set(nk, KHAO_LAK_CITY_FACTS);
}

export function resolveKhaoLakVerifiedFacts(locationOrName) {
  if (!locationOrName) return null;
  if (typeof locationOrName === 'string') return cardByKey.get(norm(locationOrName)) || null;
  const keys = [
    locationOrName.slug,
    locationOrName.name,
    locationOrName.name_en,
    locationOrName.name_ko,
    locationOrName.id,
  ];
  for (const key of keys) {
    const hit = cardByKey.get(norm(key));
    if (hit) return hit;
  }
  return null;
}
