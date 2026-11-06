/**
 * 파리 LI-2. 2026-10-22에 읽은 문장만.
 * 돈 칸은 비움(안전 칸만). CDG 본문 없음, RATP는 보안 확인 화면, IDFM·파리관광청은 노선·요금·일자 동선을 확인하지 못함.
 * France-Visas는 HTTP 403이었고, 화면에 보인 온라인 판정 안내만 씀. 국적별 면제는 쓰지 않음.
 * ETIAS는 미운영·신청 없음·시작일 사전 고지만. 필요·시행 중으로 쓰지 않음.
 */
import { emptySlot, verifiedSlot } from './schema.js';

const DAY = '2026-10-22';

const FRANCE_VISAS = {
  name: 'France-Visas',
  url: 'https://france-visas.gouv.fr/',
};
const EES = {
  name: 'EU 출입국 시스템(EES)',
  url: 'https://travel-europe.europa.eu/en/ees/what-is-the-ees',
};
const ETIAS = {
  name: 'EU ETIAS',
  url: 'https://travel-europe.europa.eu/etias_en',
};
const LOUVRE = {
  name: '루브르 박물관 방문 안내',
  url: 'https://www.louvre.fr/en/visit',
};
const SAFETY_NOV5 = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335046/detail2?ntnCd=248',
};
const SAFETY_OCT31_DAY = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335045/detail2?ntnCd=248',
};

export const PARIS_CITY_FACTS = {
  kind: 'city',
  slug: 'paris',
  name: '파리',
  nameEn: 'Paris',
  aliases: ['파리', 'Paris', 'paris'],
  slots: [
    verifiedSlot(
      '입국',
      'France-Visas 온라인 도우미에서 체류 계획에 비자가 필요한지 확인해요.\n비유럽연합 국적자는 단기 체류로 들어올 때 출입국 시스템(EES)에 등록돼요.\n프랑스는 이 시스템을 쓰는 나라예요.\n입국과 출국, 입국 거절이 전자로 기록돼요.\nEES는 지문과 얼굴 정보를 써요.\n단기 체류는 180일 안의 90일까지예요.\nETIAS는 아직 운영되지 않아요.\n여행허가 신청을 받지 않아요.\n시작일은 시행 수개월 전에 유럽연합이 알려요.',
      [FRANCE_VISAS, EES, ETIAS],
      DAY,
      { id: 'entry' },
    ),
    emptySlot('airport', '공항→시내'),
    emptySlot('stay-area', '머물 지역'),
    verifiedSlot(
      '루브르 방문',
      '루브르 박물관은 화요일에 쉬어요.\n월·목·토·일은 09:00~18:00이에요.\n수·금은 09:00~21:00이에요.\n마지막 입장은 폐관 1시간 전이에요.\n전시실은 폐관 30분 전에 비워요.\n시간 지정 예매를 권하고, 무료 입장도 포함해요.\n피라미드가 주 출입구예요.\n혼잡하면 카루젤이나 Porte des Lions 출입구를 쓸 수 있어요.\n예매한 시간과 날짜만 유효하고, 변경·교환·환불은 안 돼요.',
      [LOUVRE],
      DAY,
      { id: 'itinerary', headingKey: 'louvre-visit' },
    ),
    verifiedSlot(
      '치안',
      '외교부 안전공지(2026-11-05·주프랑스대사관)는 11.5(목) 전국 파업·시위로 대중교통·항공 운행 차질 가능성을 안내해요.\n10.31(토) 전국 3차 시위가 있었어요.\n11.4 오후 언론 보도 기준(변경될 수 있음) 노조는 바스티유 광장~콩코르드 광장 행진(13:00~14:00경 출발)을 신고했지만 경찰청 승인이 나지 않아 법원에서 다투는 중이고, 직전에 금지되거나 외곽 경로로 바뀔 수 있어요.\nRATP 지하철·버스는 대체로 정상이지만 행진 경로 주변 역은 임시 폐쇄될 수 있어요.\nRER A는 정상, B는 차질(샤를드골 공항 이용 시 유의, 평소보다 일찍 출발), D는 큰 차질이에요.\nSNCF TGV 일부 차질, TER·Intercités·Transilien 차질이에요.\nDGAC·공항 지상직 파업으로 샤를드골·오를리 항공편 감축·출국 수속 지연 가능성이 있어요.\n일부 학교·구청 업무 차질이 있을 수 있어요.\n바스티유~콩코르드 일대와 집회 장소에는 가지 말고, 집회를 마주치면 구경·촬영하지 말고 바로 떠나라고 해요.\n11.7(토) 14:00 콩코르드 광장에서 노란조끼 4차 시위가 예고돼 주말까지 도심 집회가 이어질 수 있어요.\n이동 전 RATP·SNCF·항공사·파리경찰청 공식 안내를 확인해요.\n주프랑스대사관 야간·휴일 긴급연락은 +33-6-8028-5396이고, 영사콜센터는 +82-2-3210-0404예요.',
      [SAFETY_NOV5, SAFETY_OCT31_DAY],
      '2026-11-05',
      {
        id: 'safety',
        kind: 'event',
        checkedOn: '2026-11-05',
        endsAt: '2026-11-07',
      },
    ),
    emptySlot('season', '시즌'),
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
  PARIS_CITY_FACTS.slug,
  PARIS_CITY_FACTS.name,
  PARIS_CITY_FACTS.nameEn,
  ...(PARIS_CITY_FACTS.aliases || []),
]) {
  const nk = norm(key);
  if (nk) cardByKey.set(nk, PARIS_CITY_FACTS);
}

export function resolveParisVerifiedFacts(locationOrName) {
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
