import { TRIPLINK_PACKAGES } from './tripLinkPackages';

// 패키지 ID로 패키지 객체를 쉽게 찾기 위한 맵
const PACKAGE_MAP = {
  'jeju': TRIPLINK_PACKAGES.domestic[0], // 제주도 (012nec)
  'vietnam': TRIPLINK_PACKAGES.family[0], // 베트남 다낭/나트랑 (hbxakj)
  'hokkaido': TRIPLINK_PACKAGES.family[1], // 일본 홋카이도 (iosw2r)
  'singapore': TRIPLINK_PACKAGES.family[2], // 싱가포르 (op19uq)
  'philippines': TRIPLINK_PACKAGES.family[3], // 필리핀 (qi88tt)
  'thailand': TRIPLINK_PACKAGES.family[4], // 태국 (ynrf5y)
  'china': TRIPLINK_PACKAGES.family[5], // 북경 (1c9qfq)
  'hongkong': TRIPLINK_PACKAGES.family[6], // 홍콩/마카오 (1y2ntm)
  'taiwan': TRIPLINK_PACKAGES.family[7], // 대만 (o8qb0s)
  'tokyo': TRIPLINK_PACKAGES.family[8], // 도쿄 (xp28zi)
  'osaka': TRIPLINK_PACKAGES.family[9], // 오사카/간사이 (6fr41e)
  'fukuoka': TRIPLINK_PACKAGES.family[10], // 쿠슈/후쿠오카 (1emhcj)
  'honshu': TRIPLINK_PACKAGES.family[11], // 혼슈 (5pxm7h)
  'tsushima': TRIPLINK_PACKAGES.family[12], // 대마도 (06r8p6)
  'westeurope': TRIPLINK_PACKAGES.longhaul[0], // 서유럽 (wx9egs)
  'easteurope': TRIPLINK_PACKAGES.longhaul[1], // 동유럽 (74gnjs)
  'india': TRIPLINK_PACKAGES.longhaul[2], // 인도 (ja02dx)
  'northeurope': TRIPLINK_PACKAGES.longhaul[3], // 북유럽 (rpc4cq)
  'africa': TRIPLINK_PACKAGES.longhaul[4], // 아프리카 (3k2cki)
  'mongolia': TRIPLINK_PACKAGES.longhaul[5], // 몽골/내몽골 (23krvj)
  'northamerica': TRIPLINK_PACKAGES.longhaul[6], // 북미 (xy0ko4)
  'useast': TRIPLINK_PACKAGES.longhaul[7], // 미동부 (z3lrma)
  'uswest': TRIPLINK_PACKAGES.longhaul[8], // 미서부 (75wl18)
  'australia': TRIPLINK_PACKAGES.longhaul[9], // 호주 (w154cc)
  'latinamerica': TRIPLINK_PACKAGES.longhaul[10], // 중남미 (jknahu)
  'malaysia': TRIPLINK_PACKAGES.resort[1], // 코타키나발루 (nnpyr1)
  'indonesia': TRIPLINK_PACKAGES.resort[2], // 발리/인도네시아 (4uxv69)
  'laos': TRIPLINK_PACKAGES.resort[3], // 라오스 (jd3bcv)
  'okinawa': TRIPLINK_PACKAGES.resort[4], // 오키나와 (561up2)
  'hawaii': TRIPLINK_PACKAGES.resort[5], // 하와이 (buliqr)
  'guam': TRIPLINK_PACKAGES.resort[6], // 괌 (e4xgws)
  'saipan': TRIPLINK_PACKAGES.resort[7], // 사이판 (58ipjw)
};

export const DESTINATION_PACKAGE_MAP = {
  // 국내 - 제주도
  '제주': PACKAGE_MAP['jeju'],
  '제주도': PACKAGE_MAP['jeju'],
  '제주시': PACKAGE_MAP['jeju'],
  '서귀포': PACKAGE_MAP['jeju'],
  'jeju': PACKAGE_MAP['jeju'],
  'jejudo': PACKAGE_MAP['jeju'],
  'seogwipo': PACKAGE_MAP['jeju'],

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

  // 일본 (도쿄)
  '도쿄': PACKAGE_MAP['tokyo'],
  '동경': PACKAGE_MAP['tokyo'],
  'tokyo': PACKAGE_MAP['tokyo'],

  // 일본 (오사카/간사이)
  '오사카': PACKAGE_MAP['osaka'],
  '교토': PACKAGE_MAP['osaka'],
  '나라': PACKAGE_MAP['osaka'],
  '고베': PACKAGE_MAP['osaka'],
  'osaka': PACKAGE_MAP['osaka'],
  'kyoto': PACKAGE_MAP['osaka'],
  'nara': PACKAGE_MAP['osaka'],
  'kobe': PACKAGE_MAP['osaka'],

  // 일본 (쿠슈/후쿠오카)
  '후쿠오카': PACKAGE_MAP['fukuoka'],
  '복강': PACKAGE_MAP['fukuoka'],
  '규슈': PACKAGE_MAP['fukuoka'],
  '구슈': PACKAGE_MAP['fukuoka'],
  '큐슈': PACKAGE_MAP['fukuoka'],
  '나가사키': PACKAGE_MAP['fukuoka'],
  '구마모토': PACKAGE_MAP['fukuoka'],
  'fukuoka': PACKAGE_MAP['fukuoka'],
  'kyushu': PACKAGE_MAP['fukuoka'],
  'nagasaki': PACKAGE_MAP['fukuoka'],
  'kumamoto': PACKAGE_MAP['fukuoka'],

  // 일본 (혼슈)
  '혼슈': PACKAGE_MAP['honshu'],
  '히로시마': PACKAGE_MAP['honshu'],
  '가나자와': PACKAGE_MAP['honshu'],
  '요코하마': PACKAGE_MAP['honshu'],
  'honshu': PACKAGE_MAP['honshu'],
  'hiroshima': PACKAGE_MAP['honshu'],
  'kanazawa': PACKAGE_MAP['honshu'],
  'yokohama': PACKAGE_MAP['honshu'],

  // 일본 (대마도)
  '대마도': PACKAGE_MAP['tsushima'],
  '쓰시마': PACKAGE_MAP['tsushima'],
  'tsushima': PACKAGE_MAP['tsushima'],

  // 일본 (오키나와)
  '오키나와': PACKAGE_MAP['okinawa'],
  '나하': PACKAGE_MAP['okinawa'],
  '이시가키': PACKAGE_MAP['okinawa'],
  'okinawa': PACKAGE_MAP['okinawa'],
  'naha': PACKAGE_MAP['okinawa'],
  'ishigaki': PACKAGE_MAP['okinawa'],

  // 싱가포르
  '싱가포르': PACKAGE_MAP['singapore'],
  'singapore': PACKAGE_MAP['singapore'],

  // 필리핀
  '세부': PACKAGE_MAP['philippines'],
  '보홀': PACKAGE_MAP['philippines'],
  '보라카이': PACKAGE_MAP['philippines'],
  '마닐라': PACKAGE_MAP['philippines'],
  'cebu': PACKAGE_MAP['philippines'],
  'bohol': PACKAGE_MAP['philippines'],
  'boracay': PACKAGE_MAP['philippines'],
  'manila': PACKAGE_MAP['philippines'],

  // 태국
  '방콕': PACKAGE_MAP['thailand'],
  '푸켓': PACKAGE_MAP['thailand'],
  '치앙마이': PACKAGE_MAP['thailand'],
  'bangkok': PACKAGE_MAP['thailand'],
  'phuket': PACKAGE_MAP['thailand'],
  'chiang mai': PACKAGE_MAP['thailand'],

  // 중국
  '북경': PACKAGE_MAP['china'],
  '베이징': PACKAGE_MAP['china'],
  '상하이': PACKAGE_MAP['china'],
  '상해': PACKAGE_MAP['china'],
  'beijing': PACKAGE_MAP['china'],
  'shanghai': PACKAGE_MAP['china'],

  // 홍콩/마카오
  '홍콩': PACKAGE_MAP['hongkong'],
  '마카오': PACKAGE_MAP['hongkong'],
  '홍콩섬': PACKAGE_MAP['hongkong'],
  'hong kong': PACKAGE_MAP['hongkong'],
  'hongkong': PACKAGE_MAP['hongkong'],
  'macau': PACKAGE_MAP['hongkong'],
  'macao': PACKAGE_MAP['hongkong'],

  // 대만
  '대만': PACKAGE_MAP['taiwan'],
  '타이베이': PACKAGE_MAP['taiwan'],
  '타이중': PACKAGE_MAP['taiwan'],
  '가오슝': PACKAGE_MAP['taiwan'],
  'taiwan': PACKAGE_MAP['taiwan'],
  'taipei': PACKAGE_MAP['taiwan'],
  'taichung': PACKAGE_MAP['taiwan'],
  'kaohsiung': PACKAGE_MAP['taiwan'],

  // 인도
  '인도': PACKAGE_MAP['india'],
  '뉴델리': PACKAGE_MAP['india'],
  'india': PACKAGE_MAP['india'],
  'new delhi': PACKAGE_MAP['india'],
  'delhi': PACKAGE_MAP['india'],

  // 인도네시아
  '발리': PACKAGE_MAP['indonesia'],
  '자카르타': PACKAGE_MAP['indonesia'],
  '롬복': PACKAGE_MAP['indonesia'],
  'bali': PACKAGE_MAP['indonesia'],
  'jakarta': PACKAGE_MAP['indonesia'],
  'lombok': PACKAGE_MAP['indonesia'],

  // 라오스
  '라오스': PACKAGE_MAP['laos'],
  '비엔티안': PACKAGE_MAP['laos'],
  '방비엥': PACKAGE_MAP['laos'],
  '루앙프라방': PACKAGE_MAP['laos'],
  'laos': PACKAGE_MAP['laos'],
  'vientiane': PACKAGE_MAP['laos'],
  'vang vieng': PACKAGE_MAP['laos'],
  'luang prabang': PACKAGE_MAP['laos'],

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
  '자그레브': PACKAGE_MAP['easteurope'],
  '바르샤바': PACKAGE_MAP['easteurope'],
  'prague': PACKAGE_MAP['easteurope'],
  'budapest': PACKAGE_MAP['easteurope'],
  'vienna': PACKAGE_MAP['easteurope'],
  'dubrovnik': PACKAGE_MAP['easteurope'],
  'zagreb': PACKAGE_MAP['easteurope'],
  'warsaw': PACKAGE_MAP['easteurope'],

  // 북유럽
  '노르웨이': PACKAGE_MAP['northeurope'],
  '스웨덴': PACKAGE_MAP['northeurope'],
  '덴마크': PACKAGE_MAP['northeurope'],
  '핀란드': PACKAGE_MAP['northeurope'],
  '오슬로': PACKAGE_MAP['northeurope'],
  '스톡홀름': PACKAGE_MAP['northeurope'],
  '코펜하겐': PACKAGE_MAP['northeurope'],
  '헬싱키': PACKAGE_MAP['northeurope'],
  '레이캬비크': PACKAGE_MAP['northeurope'],
  'norway': PACKAGE_MAP['northeurope'],
  'sweden': PACKAGE_MAP['northeurope'],
  'denmark': PACKAGE_MAP['northeurope'],
  'finland': PACKAGE_MAP['northeurope'],
  'oslo': PACKAGE_MAP['northeurope'],
  'stockholm': PACKAGE_MAP['northeurope'],
  'copenhagen': PACKAGE_MAP['northeurope'],
  'helsinki': PACKAGE_MAP['northeurope'],
  'reykjavik': PACKAGE_MAP['northeurope'],
  'iceland': PACKAGE_MAP['northeurope'],

  // 아프리카
  '케냐': PACKAGE_MAP['africa'],
  '탄자니아': PACKAGE_MAP['africa'],
  '남아프리카공화국': PACKAGE_MAP['africa'],
  '이집트': PACKAGE_MAP['africa'],
  '모로코': PACKAGE_MAP['africa'],
  '나이로비': PACKAGE_MAP['africa'],
  '카이로': PACKAGE_MAP['africa'],
  '마라케시': PACKAGE_MAP['africa'],
  'kenya': PACKAGE_MAP['africa'],
  'tanzania': PACKAGE_MAP['africa'],
  'south africa': PACKAGE_MAP['africa'],
  'egypt': PACKAGE_MAP['africa'],
  'morocco': PACKAGE_MAP['africa'],
  'nairobi': PACKAGE_MAP['africa'],
  'cairo': PACKAGE_MAP['africa'],
  'marrakech': PACKAGE_MAP['africa'],

  // 몽골/내몽골
  '몽골': PACKAGE_MAP['mongolia'],
  '울란바토르': PACKAGE_MAP['mongolia'],
  '내몽골': PACKAGE_MAP['mongolia'],
  'mongolia': PACKAGE_MAP['mongolia'],
  'ulaanbaatar': PACKAGE_MAP['mongolia'],
  'inner mongolia': PACKAGE_MAP['mongolia'],

  // 북미
  '미국': PACKAGE_MAP['northamerica'],
  '캐나다': PACKAGE_MAP['northamerica'],
  '토론토': PACKAGE_MAP['northamerica'],
  '밴쿠버': PACKAGE_MAP['northamerica'],
  'usa': PACKAGE_MAP['northamerica'],
  'united states': PACKAGE_MAP['northamerica'],
  'canada': PACKAGE_MAP['northamerica'],
  'toronto': PACKAGE_MAP['northamerica'],
  'vancouver': PACKAGE_MAP['northamerica'],

  // 미동부
  '뉴욕': PACKAGE_MAP['useast'],
  '워싱턴': PACKAGE_MAP['useast'],
  '보스턴': PACKAGE_MAP['useast'],
  '필라델피아': PACKAGE_MAP['useast'],
  'new york': PACKAGE_MAP['useast'],
  'washington': PACKAGE_MAP['useast'],
  'boston': PACKAGE_MAP['useast'],
  'philadelphia': PACKAGE_MAP['useast'],
  'washington dc': PACKAGE_MAP['useast'],

  // 미서부
  '로스앤젤레스': PACKAGE_MAP['uswest'],
  '샌프란시스코': PACKAGE_MAP['uswest'],
  '라스베가스': PACKAGE_MAP['uswest'],
  '시애틀': PACKAGE_MAP['uswest'],
  '샌디에이고': PACKAGE_MAP['uswest'],
  'los angeles': PACKAGE_MAP['uswest'],
  'san francisco': PACKAGE_MAP['uswest'],
  'las vegas': PACKAGE_MAP['uswest'],
  'seattle': PACKAGE_MAP['uswest'],
  'san diego': PACKAGE_MAP['uswest'],

  // 하와이
  '하와이': PACKAGE_MAP['hawaii'],
  '호놀룰루': PACKAGE_MAP['hawaii'],
  '와이키키': PACKAGE_MAP['hawaii'],
  '마우이': PACKAGE_MAP['hawaii'],
  'hawaii': PACKAGE_MAP['hawaii'],
  'honolulu': PACKAGE_MAP['hawaii'],
  'waikiki': PACKAGE_MAP['hawaii'],
  'maui': PACKAGE_MAP['hawaii'],

  // 호주
  '호주': PACKAGE_MAP['australia'],
  '시드니': PACKAGE_MAP['australia'],
  '멜버른': PACKAGE_MAP['australia'],
  '브리즈번': PACKAGE_MAP['australia'],
  '골드코스트': PACKAGE_MAP['australia'],
  'australia': PACKAGE_MAP['australia'],
  'sydney': PACKAGE_MAP['australia'],
  'melbourne': PACKAGE_MAP['australia'],
  'brisbane': PACKAGE_MAP['australia'],
  'gold coast': PACKAGE_MAP['australia'],

  // 중남미
  '페루': PACKAGE_MAP['latinamerica'],
  '브라질': PACKAGE_MAP['latinamerica'],
  '아르헨티나': PACKAGE_MAP['latinamerica'],
  '칠레': PACKAGE_MAP['latinamerica'],
  '멕시코': PACKAGE_MAP['latinamerica'],
  '리마': PACKAGE_MAP['latinamerica'],
  '리우데자네이루': PACKAGE_MAP['latinamerica'],
  '부에노스아이레스': PACKAGE_MAP['latinamerica'],
  'peru': PACKAGE_MAP['latinamerica'],
  'brazil': PACKAGE_MAP['latinamerica'],
  'argentina': PACKAGE_MAP['latinamerica'],
  'chile': PACKAGE_MAP['latinamerica'],
  'mexico': PACKAGE_MAP['latinamerica'],
  'lima': PACKAGE_MAP['latinamerica'],
  'rio de janeiro': PACKAGE_MAP['latinamerica'],
  'buenos aires': PACKAGE_MAP['latinamerica'],

  // 괌
  '괌': PACKAGE_MAP['guam'],
  'guam': PACKAGE_MAP['guam'],

  // 사이판
  '사이판': PACKAGE_MAP['saipan'],
  'saipan': PACKAGE_MAP['saipan'],

  // 말레이시아
  '코타키나발루': PACKAGE_MAP['malaysia'],
  '쿠알라룸푸르': PACKAGE_MAP['malaysia'],
  'kota kinabalu': PACKAGE_MAP['malaysia'],
  'kuala lumpur': PACKAGE_MAP['malaysia'],
};

// 지역별/국가별 폴백 (매핑이 없을 때 대륙/국가 정보로 추천)
export const FALLBACK_PACKAGE_MAP = {
  '한국': PACKAGE_MAP['jeju'],
  'korea': PACKAGE_MAP['jeju'],
  'south korea': PACKAGE_MAP['jeju'],
  '유럽': PACKAGE_MAP['westeurope'],
  'europe': PACKAGE_MAP['westeurope'],
  '베트남': PACKAGE_MAP['vietnam'],
  'vietnam': PACKAGE_MAP['vietnam'],
  '일본': PACKAGE_MAP['tokyo'], // 도쿄를 기본 일본 패키지로
  'japan': PACKAGE_MAP['tokyo'],
  '말레이시아': PACKAGE_MAP['malaysia'],
  'malaysia': PACKAGE_MAP['malaysia'],
  '필리핀': PACKAGE_MAP['philippines'],
  'philippines': PACKAGE_MAP['philippines'],
  '태국': PACKAGE_MAP['thailand'],
  'thailand': PACKAGE_MAP['thailand'],
  '중국': PACKAGE_MAP['china'],
  'china': PACKAGE_MAP['china'],
  '인도': PACKAGE_MAP['india'],
  'india': PACKAGE_MAP['india'],
  '인도네시아': PACKAGE_MAP['indonesia'],
  'indonesia': PACKAGE_MAP['indonesia'],
  '라오스': PACKAGE_MAP['laos'],
  'laos': PACKAGE_MAP['laos'],
  '아프리카': PACKAGE_MAP['africa'],
  'africa': PACKAGE_MAP['africa'],
  '오세아니아': PACKAGE_MAP['australia'],
  'oceania': PACKAGE_MAP['australia']
};
