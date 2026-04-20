import { TRIPLINK_PACKAGES } from './tripLinkPackages';

// 패키지 ID로 패키지 객체를 쉽게 찾기 위한 맵
const PACKAGE_MAP = {
  'vietnam': TRIPLINK_PACKAGES.family[0], // 베트남 다낭/나트랑 (hbxakj)
  'hokkaido': TRIPLINK_PACKAGES.family[1], // 일본 홋카이도 (iosw2r)
  'westeurope': TRIPLINK_PACKAGES.longhaul[0], // 서유럽 (wx9egs)
  'easteurope': TRIPLINK_PACKAGES.longhaul[1], // 동유럽 (8zfodz)
  'guam': TRIPLINK_PACKAGES.resort[0], // 괌/사이판 (1c4mmw)
  'malaysia': TRIPLINK_PACKAGES.resort[1], // 코타키나발루 (nnpyr1)
};

export const DESTINATION_PACKAGE_MAP = {
  // 베트남
  '다낭': PACKAGE_MAP['vietnam'],
  '나트랑': PACKAGE_MAP['vietnam'],
  '푸꾸옥': PACKAGE_MAP['vietnam'],
  '호이안': PACKAGE_MAP['vietnam'],
  'da nang': PACKAGE_MAP['vietnam'],
  'nha trang': PACKAGE_MAP['vietnam'],
  'phu quoc': PACKAGE_MAP['vietnam'],
  'hoi an': PACKAGE_MAP['vietnam'],

  // 일본 (홋카이도)
  '삿포로': PACKAGE_MAP['hokkaido'],
  '홋카이도': PACKAGE_MAP['hokkaido'],
  '북해도': PACKAGE_MAP['hokkaido'],
  'sapporo': PACKAGE_MAP['hokkaido'],
  'hokkaido': PACKAGE_MAP['hokkaido'],

  // 서유럽
  '파리': PACKAGE_MAP['westeurope'],
  '런던': PACKAGE_MAP['westeurope'],
  '로마': PACKAGE_MAP['westeurope'],
  '피렌체': PACKAGE_MAP['westeurope'],
  '베네치아': PACKAGE_MAP['westeurope'],
  '밀라노': PACKAGE_MAP['westeurope'],
  '마드리드': PACKAGE_MAP['westeurope'],
  '바르셀로나': PACKAGE_MAP['westeurope'],
  'paris': PACKAGE_MAP['westeurope'],
  'london': PACKAGE_MAP['westeurope'],
  'rome': PACKAGE_MAP['westeurope'],
  'florence': PACKAGE_MAP['westeurope'],
  'venice': PACKAGE_MAP['westeurope'],
  'milan': PACKAGE_MAP['westeurope'],
  'madrid': PACKAGE_MAP['westeurope'],
  'barcelona': PACKAGE_MAP['westeurope'],

  // 동유럽/발칸
  '프라하': PACKAGE_MAP['easteurope'],
  '부다페스트': PACKAGE_MAP['easteurope'],
  '비엔나': PACKAGE_MAP['easteurope'],
  '빈': PACKAGE_MAP['easteurope'],
  '크로아티아': PACKAGE_MAP['easteurope'],
  '두브로브니크': PACKAGE_MAP['easteurope'],
  'prague': PACKAGE_MAP['easteurope'],
  'budapest': PACKAGE_MAP['easteurope'],
  'vienna': PACKAGE_MAP['easteurope'],
  'dubrovnik': PACKAGE_MAP['easteurope'],

  // 남태평양
  '괌': PACKAGE_MAP['guam'],
  '사이판': PACKAGE_MAP['guam'],
  'guam': PACKAGE_MAP['guam'],
  'saipan': PACKAGE_MAP['guam'],

  // 말레이시아
  '코타키나발루': PACKAGE_MAP['malaysia'],
  '쿠알라룸푸르': PACKAGE_MAP['malaysia'],
  'kota kinabalu': PACKAGE_MAP['malaysia'],
  'kuala lumpur': PACKAGE_MAP['malaysia'],
};

// 지역별/국가별 폴백 (매핑이 없을 때 대륙/국가 정보로 추천)
export const FALLBACK_PACKAGE_MAP = {
  '유럽': PACKAGE_MAP['westeurope'],
  'europe': PACKAGE_MAP['westeurope'],
  '베트남': PACKAGE_MAP['vietnam'],
  'vietnam': PACKAGE_MAP['vietnam'],
  '일본': PACKAGE_MAP['hokkaido'], // 임시로 홋카이도 패키지로 연결
  'japan': PACKAGE_MAP['hokkaido'],
  '말레이시아': PACKAGE_MAP['malaysia'],
  'malaysia': PACKAGE_MAP['malaysia']
};
