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
const SAFETY_OCT31 = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335043/detail2?ntnCd=248',
};
const SAFETY_OCT31_DAY = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335045/detail2?ntnCd=248',
};
const SAFETY = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335041/detail2?ntnCd=248',
};
const SAFETY_PROTESTS = {
  name: '외교부 안전공지 (주프랑스대사관)',
  url: 'https://www.0404.go.kr/bbs/safetyNtc/1335039/detail2?ntnCd=248',
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
      '외교부 안전공지(2026-10-31·주프랑스대사관)는 10.31(토) 전국 3차 시위 날 파리 행진이 14:00 포르트 드 바뇰레에서 포르트 드 샤랑통까지 진행됐어요.\n바스티유 등 도심 행진과 국회 앞 집회는 금지됐고, 경찰 요청으로 다수 지하철·RER 역이 폐쇄됐어요.\n레퓌블리크·레알 일부 구역에는 10.31~11.1 밤 23:00~06:00 통행금지가 시행됐다고 해요.\n외교부 안전공지(2026-10-20·주프랑스대사관)는 11.5(목) 주요 노조 전국 파업·시위가 예정돼 대중교통 차질 가능성이 있다고 해요.\n주프랑스대사관 야간·휴일 긴급연락은 +33-6-8028-5396이고, 영사콜센터는 +82-2-3210-0404예요.',
      [SAFETY_OCT31, SAFETY_OCT31_DAY, SAFETY, SAFETY_PROTESTS],
      '2026-11-02',
      {
        id: 'safety',
        kind: 'event',
        checkedOn: '2026-11-02',
        endsAt: '2026-11-05',
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
