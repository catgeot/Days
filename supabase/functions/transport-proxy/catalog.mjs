/**
 * Festival transport card — station IDs from the 2026-10-11 staging probes.
 * Null IDs are not used. Terminals that returned nothing on every probe stay
 * out of the live query list (see UNQUERIED_TERMINALS).
 *
 * AREX station IDs are stored and never queried: TrainInfo returned 0, and
 * that 0 is "outside TAGO", not a published timetable.
 */

export const SOURCE = "국토교통부 TAGO";

export const TAGO_OPS = {
  train: {
    service: "TrainInfo",
    op: "GetStrtpntAlocFndTrainInfo",
    depParam: "depPlaceId",
    arrParam: "arrPlaceId",
  },
  expBus: {
    service: "ExpBusInfo",
    op: "GetStrtpntAlocFndExpbusInfo",
    depParam: "depTerminalId",
    arrParam: "arrTerminalId",
  },
  suburbsBus: {
    service: "SuburbsBusInfo",
    op: "GetStrtpntAlocFndSuberbsBusInfo",
    depParam: "depTerminalId",
    arrParam: "arrTerminalId",
  },
};

export const BOOKING_URLS = {
  Korail: "https://www.letskorail.com/",
  SR: "https://etk.srail.kr/",
  expBus: "https://www.kobus.co.kr/",
  suburbsBus: "https://txbus.t-money.co.kr/",
  arex: "https://www.airportrailroad.com/",
};

/** 수서 출발은 SR 예매. 등급명이 KTX여도 바꾸지 않는다. */
export const SUSEO_STATION_ID = "NATH30000";

export const AREX_STATION_IDS = ["NATC10580", "NATC30058"];

export const STATIONS = {
  NAT010000: { name: "서울역" },
  NAT010032: { name: "용산" },
  NATH30000: { name: "수서" },
  NAT014445: { name: "부산역" },
  NAT014331: { name: "사상" },
  NAT750046: { name: "부전" },
  NATC10580: { name: "인천공항T1", arex: true },
  NATC30058: { name: "인천공항T2", arex: true },
  NAT031857: { name: "광주송정" },
  NAT883012: { name: "광주역" },
  NAT032212: { name: "함평역" },
  NAT880345: { name: "마산역" },
  NAT880281: { name: "창원중앙" },
  NAT130126: { name: "청량리" },
  NAT601936: { name: "강릉역" },
  NAT041993: { name: "여수EXPO" },
  NAEK020: { name: "센트럴시티" },
  NAEK021: { name: "센트럴시티" },
  NAEK010: { name: "서울경부" },
  NAEK030: { name: "동서울" },
  NAEK031: { name: "동서울" },
  NAEK032: { name: "동서울" },
  NAEK035: { name: "동서울" },
  NAEK700: { name: "부산" },
  NAEK703: { name: "부산사상" },
  NAEK105: { name: "인천공항T1" },
  NAEK117: { name: "인천공항T2" },
  NAEK500: { name: "광주(유·스퀘어)" },
  NAEK581: { name: "함평" },
  NAEK705: { name: "마산" },
  NAEK710: { name: "창원" },
  NAEK200: { name: "강릉" },
  NAEK510: { name: "여수" },
  NAI0511601: { name: "동서울" },
  NAI0654501: { name: "서울경부" },
  NAI0654502: { name: "서울경부" },
  NAI0671801: { name: "서울남부" },
  NAI4620401: { name: "부산동부" },
  NAI4620402: { name: "노포" },
  NAI4696901: { name: "부산서부(사상)" },
  NAI2238202: { name: "인천공항2터미널" },
  NAI6193701: { name: "광주(유·스퀘어)" },
  NAI6193705: { name: "광주(유·스퀘어)" },
  NAI6193710: { name: "광주(유·스퀘어)" },
  NAI6193713: { name: "광주(유·스퀘어)" },
  NAI5715301: { name: "함평" },
  NAI5135601: { name: "마산" },
  NAI5890605: { name: "마산" },
  NAI5175001: { name: "마산남부" },
  NAI6242901: { name: "송정역" },
  NAI2551901: { name: "강릉" },
  NAI5971501: { name: "여수" },
};

export const UNQUERIED_TERMINALS = [
  { id: "NAEK020", reason: "센트럴시티 실측 0. NAEK021만 조회" },
  { id: "NAEK030", reason: "동서울 실측 0. NAEK032만 조회" },
  { id: "NAEK031", reason: "동서울 실측 0. NAEK032만 조회" },
  { id: "NAEK035", reason: "동서울 실측 0. NAEK032만 조회" },
  { id: "NAEK105", reason: "인천공항T1 고속 실측 0. T2 NAEK117만 재조회" },
  { id: "NAI6193705", reason: "광주 시외 도착은 NAI6193701만 응답" },
  { id: "NAI6193710", reason: "광주 시외 도착은 NAI6193701만 응답" },
  { id: "NAI6193713", reason: "광주 시외 도착은 NAI6193701만 응답" },
  { id: "NAI0654501", reason: "서울경부 시외는 세 목적지 실측 0. 고속 NAEK010만 조회" },
  { id: "NAI0654502", reason: "서울경부 시외는 세 목적지 실측 0. 고속 NAEK010만 조회" },
  { id: "NAI0671801", reason: "서울남부 시외 실측 0" },
  { id: "NAI4620402", reason: "노포 실측 0. 부산동부 NAI4620401만 조회" },
  { id: "NAI4696901", reason: "부산서부(사상) 시외 실측 0" },
  { id: "NAI5890605", reason: "마산 시외는 NAI5135601만 부산동부에서 응답" },
  { id: "NAI6242901", reason: "송정역 시외→함평 실측 0" },
  { id: "NAEK710", reason: "창원은 마산 축제 도착지가 아님" },
  { id: "NAT880281", reason: "창원중앙은 마산 축제 도착지가 아님" },
  { id: "NATC10580", reason: "공항철도. TAGO TrainInfo 0 — 조회하지 않고 unverified" },
  { id: "NATC30058", reason: "공항철도. TAGO TrainInfo 0 — 조회하지 않고 unverified" },
];

export const ORIGINS = {
  "seoul-station": { label: "서울역" },
  yongsan: { label: "용산" },
  suseo: { label: "수서" },
  "central-city": { label: "센트럴시티" },
  dongseoul: { label: "동서울" },
  "seoul-gyeongbu": { label: "서울경부" },
  busan: { label: "부산" },
  "incheon-airport": { label: "인천공항" },
  cheongnyangni: { label: "청량리" },
  yeosu: { label: "여수" },
};

export const REPRESENTATIVE_ORIGIN_IDS = [
  "seoul-station",
  "yongsan",
  "suseo",
  "central-city",
  "dongseoul",
  "seoul-gyeongbu",
  "busan",
  "incheon-airport",
];

function pair(mode, depId, arrId, originId, role) {
  return { mode, depId, arrId, originId, role };
}

const HAMPYEONG_PAIRS = [
  pair("train", "NAT010032", "NAT032212", "yongsan", "venue"),
  pair("train", "NAT010032", "NAT031857", "yongsan", "hub"),
  pair("train", "NAT010000", "NAT032212", "seoul-station", "venue"),
  pair("train", "NAT010000", "NAT031857", "seoul-station", "hub"),
  pair("train", "NATH30000", "NAT031857", "suseo", "hub"),
  pair("train", "NAT014445", "NAT032212", "busan", "venue"),
  pair("train", "NAT014445", "NAT031857", "busan", "hub"),
  pair("expBus", "NAEK021", "NAEK581", "central-city", "venue"),
  pair("expBus", "NAEK021", "NAEK500", "central-city", "hub"),
  pair("expBus", "NAEK032", "NAEK581", "dongseoul", "venue"),
  pair("expBus", "NAEK032", "NAEK500", "dongseoul", "hub"),
  pair("expBus", "NAEK010", "NAEK581", "seoul-gyeongbu", "venue"),
  pair("expBus", "NAEK010", "NAEK500", "seoul-gyeongbu", "hub"),
  pair("expBus", "NAEK703", "NAEK500", "busan", "hub"),
  pair("expBus", "NAEK700", "NAEK500", "busan", "hub"),
  pair("expBus", "NAEK700", "NAEK581", "busan", "venue"),
  pair("expBus", "NAEK117", "NAEK581", "incheon-airport", "venue"),
  pair("expBus", "NAEK117", "NAEK500", "incheon-airport", "hub"),
  pair("suburbsBus", "NAI2238202", "NAI5715301", "incheon-airport", "venue"),
  pair("suburbsBus", "NAI2238202", "NAI6193701", "incheon-airport", "hub"),
  pair("train", "NAT031857", "NAT032212", null, "transfer"),
  pair("train", "NAT883012", "NAT032212", null, "transfer"),
  pair("expBus", "NAEK500", "NAEK581", null, "transfer"),
  pair("suburbsBus", "NAI6193701", "NAI5715301", null, "transfer"),
];

const MASAN_PAIRS = [
  pair("train", "NAT010000", "NAT880345", "seoul-station", "venue"),
  pair("train", "NATH30000", "NAT880345", "suseo", "venue"),
  pair("train", "NAT010032", "NAT880345", "yongsan", "venue"),
  pair("train", "NAT750046", "NAT880345", "busan", "venue"),
  pair("train", "NAT014331", "NAT880345", "busan", "venue"),
  pair("train", "NAT014445", "NAT880345", "busan", "venue"),
  pair("expBus", "NAEK010", "NAEK705", "seoul-gyeongbu", "venue"),
  pair("expBus", "NAEK032", "NAEK705", "dongseoul", "venue"),
  pair("expBus", "NAEK021", "NAEK705", "central-city", "venue"),
  pair("expBus", "NAEK700", "NAEK705", "busan", "venue"),
  pair("expBus", "NAEK703", "NAEK705", "busan", "venue"),
  pair("expBus", "NAEK117", "NAEK705", "incheon-airport", "venue"),
  pair("suburbsBus", "NAI4620401", "NAI5135601", "busan", "venue"),
  pair("suburbsBus", "NAI4620401", "NAI5175001", "busan", "venue"),
  pair("suburbsBus", "NAI0511601", "NAI5135601", "dongseoul", "venue"),
  pair("suburbsBus", "NAI2238202", "NAI5135601", "incheon-airport", "venue"),
];

const GANGNEUNG_PAIRS = [
  pair("train", "NAT010000", "NAT601936", "seoul-station", "venue"),
  pair("train", "NAT010032", "NAT601936", "yongsan", "venue"),
  pair("train", "NATH30000", "NAT601936", "suseo", "venue"),
  pair("train", "NAT130126", "NAT601936", "cheongnyangni", "venue"),
  pair("train", "NAT750046", "NAT601936", "busan", "venue"),
  pair("train", "NAT014445", "NAT601936", "busan", "venue"),
  pair("train", "NAT041993", "NAT601936", "yeosu", "venue"),
  pair("train", "NAT041993", "NAT010000", null, "link"),
  pair("expBus", "NAEK010", "NAEK200", "seoul-gyeongbu", "venue"),
  pair("expBus", "NAEK032", "NAEK200", "dongseoul", "venue"),
  pair("expBus", "NAEK021", "NAEK200", "central-city", "venue"),
  pair("expBus", "NAEK510", "NAEK200", "yeosu", "venue"),
  pair("expBus", "NAEK700", "NAEK200", "busan", "venue"),
  pair("expBus", "NAEK117", "NAEK200", "incheon-airport", "venue"),
  pair("suburbsBus", "NAI0511601", "NAI2551901", "dongseoul", "venue"),
  pair("suburbsBus", "NAI4620401", "NAI2551901", "busan", "venue"),
  pair("suburbsBus", "NAI5971501", "NAI2551901", "yeosu", "venue"),
  pair("suburbsBus", "NAI2238202", "NAI2551901", "incheon-airport", "venue"),
];

const AREX_LEG = {
  mode: "arex",
  from: "인천공항",
  to: "서울역",
  verified: false,
  reason: "공항철도(AREX)는 TAGO 열차정보 범위 밖. T1/T2 실측 0건이라 시각·요금을 만들지 않음.",
  bookingUrl: BOOKING_URLS.arex,
};

// Object key order sorts these numeric ids. Card order is this list.
export const DESTINATION_ORDER = ["638576", "637693", "2930716"];

export const DESTINATIONS = {
  "638576": {
    contentId: "638576",
    priority: 1,
    name: "대한민국 국향대전",
    venue: "함평엑스포공원",
    region: "전남 함평",
    cityLabel: "함평",
    originIds: REPRESENTATIVE_ORIGIN_IDS,
    pairs: HAMPYEONG_PAIRS,
    transfer: {
      summary: "함평 직결이 없으면 광주송정→함평역 열차로 환승. 광주→함평 버스는 별도 조회.",
      legs: [
        { mode: "train", depId: "NAT031857", arrId: "NAT032212", from: "광주송정", to: "함평역" },
        { mode: "train", depId: "NAT883012", arrId: "NAT032212", from: "광주역", to: "함평역" },
        { mode: "expBus", depId: "NAEK500", arrId: "NAEK581", from: "광주(유·스퀘어)", to: "함평" },
        { mode: "suburbsBus", depId: "NAI6193701", arrId: "NAI5715301", from: "광주(유·스퀘어)", to: "함평" },
      ],
    },
  },
  "637693": {
    contentId: "637693",
    priority: 2,
    name: "마산가고파국화축제",
    venue: "창원 마산합포구",
    region: "경남 창원",
    cityLabel: "마산",
    originIds: REPRESENTATIVE_ORIGIN_IDS,
    pairs: MASAN_PAIRS,
    transfer: {
      summary: "직결이 없으면 서울역→마산역 열차를 잇고, 공항철도는 TAGO 밖으로 둔다.",
      legs: [
        { mode: "train", depId: "NAT010000", arrId: "NAT880345", from: "서울역", to: "마산역" },
        { mode: "train", depId: "NATH30000", arrId: "NAT880345", from: "수서", to: "마산역" },
      ],
    },
  },
  "2930716": {
    contentId: "2930716",
    priority: 3,
    name: "강릉 국수 축제",
    venue: null,
    region: "강원 강릉",
    cityLabel: "강릉",
    originIds: [...REPRESENTATIVE_ORIGIN_IDS, "cheongnyangni", "yeosu"],
    pairs: GANGNEUNG_PAIRS,
    transfer: {
      summary: "여수EXPO→서울 KTX 후 청량리·서울→강릉 KTX. 용산 직결은 조회 결과로만 표시.",
      forOrigins: ["yeosu"],
      legs: [
        { mode: "train", depId: "NAT041993", arrId: "NAT010000", from: "여수EXPO", to: "서울역" },
        { mode: "train", depId: "NAT010000", arrId: "NAT601936", from: "서울역", to: "강릉역" },
        { mode: "train", depId: "NAT130126", arrId: "NAT601936", from: "청량리", to: "강릉역" },
        { mode: "train", depId: "NAT010032", arrId: "NAT601936", from: "용산", to: "강릉역" },
      ],
    },
    incheonTransfer: {
      summary: "공항철도는 TAGO 밖. 서울역·청량리→강릉은 같은 응답의 조회 구간만 확정.",
      legs: [
        { mode: "train", depId: "NAT010000", arrId: "NAT601936", from: "서울역", to: "강릉역" },
        { mode: "train", depId: "NAT130126", arrId: "NAT601936", from: "청량리", to: "강릉역" },
      ],
    },
  },
};

export function stationName(id) {
  return STATIONS[id]?.name || id;
}

export { AREX_LEG };
