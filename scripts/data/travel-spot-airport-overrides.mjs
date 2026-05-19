/**
 * 여행지 slug별 도착 공항 수동·검수 매핑 (배너 없음·오탐 보정).
 * IATA는 rentalAirportHubs.js에 등록되어 있어야 런타임·배너에 반영됩니다.
 *
 * @type {Record<string, { primaryIatas: string[], preferredLinkIata?: string, kind?: 'single'|'multi', bannerNote?: string, confidence?: string, rationale?: string }>}
 */
export const TRAVEL_SPOT_AIRPORT_OVERRIDES = {
  hvar: { primaryIatas: ['DBV'], preferredLinkIata: 'DBV', confidence: 'high', rationale: '스플리트·두브로브니크 공항 경유 페리' },
  'chichen-itza': { primaryIatas: ['CUN'], preferredLinkIata: 'CUN', confidence: 'high', rationale: '칸쿤 국제공항 후 육로' },
  'annapurna-circuit': { primaryIatas: ['KTM', 'PKR'], preferredLinkIata: 'PKR', kind: 'multi', confidence: 'high', rationale: '카트만두·포카라 관문' },
  bodrum: { primaryIatas: ['BJV'], preferredLinkIata: 'BJV', confidence: 'high', rationale: '밀라스·보드룸 공항' },
  jaipur: { primaryIatas: ['JAI'], preferredLinkIata: 'JAI', confidence: 'high', rationale: '자이푸르 국제공항' },
  'la-reunion': { primaryIatas: ['RUN'], preferredLinkIata: 'RUN', confidence: 'high', rationale: '생드니 공항' },
  ephesus: { primaryIatas: ['ADB'], preferredLinkIata: 'ADB', confidence: 'high', rationale: '이즈미르 아드난 멘데레스' },
  sapa: { primaryIatas: ['HAN'], preferredLinkIata: 'HAN', confidence: 'high', rationale: '하노이 후 육로·기차' },
  corsica: { primaryIatas: ['AJA', 'BIA'], preferredLinkIata: 'AJA', kind: 'multi', confidence: 'high', rationale: '아작시오·바스티아 공항' },
  crete: {
    primaryIatas: ['HER', 'CHQ'],
    preferredLinkIata: 'HER',
    kind: 'multi',
    confidence: 'high',
    rationale: '동부 이라클리온·서부 하니아 — 아테네 경유 국내선·페리',
    bannerNote:
      '크레타는 이라클리온(HER)·하니아(CHQ) 등 도착 공항이 나뉩니다. 입·출국 공항을 다르게 잡는 일정도 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  'santiago-de-compostela': {
    primaryIatas: ['SCQ', 'MAD'],
    preferredLinkIata: 'SCQ',
    kind: 'multi',
    confidence: 'high',
    rationale: '순례 종착지 SCQ — 마드리드(MAD) 경유·국내선 루트도 흔함',
    bannerNote:
      '산티아고 데 콤포스텔라는 보통 SCQ 공항 직항·입국이 기준입니다. 마드리드(MAD) 도착 후 기차·국내선으로 오는 일정도 많으니, 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  'grand-canyon': { primaryIatas: ['LAS', 'FLG'], preferredLinkIata: 'LAS', kind: 'multi', confidence: 'medium', rationale: '라스베이거스·그랜드캐니언 공항' },
  hampi: { primaryIatas: ['BLR'], preferredLinkIata: 'BLR', confidence: 'medium', rationale: '방갈로르 후 장거리 육로' },
  meteora: { primaryIatas: ['SKG'], preferredLinkIata: 'SKG', confidence: 'high', rationale: '테살로니키 공항' },
  miyakojima: { primaryIatas: ['MMY'], preferredLinkIata: 'MMY', confidence: 'high', rationale: '미야코지마 공항' },
  borobudur: { primaryIatas: ['JOG'], preferredLinkIata: 'JOG', confidence: 'high', rationale: '욕야카르타 공항' },
  seattle: {
    primaryIatas: ['SEA'],
    preferredLinkIata: 'SEA',
    confidence: 'high',
    rationale: '시애틀터코마국제공항(SEA)',
  },
  boracay: {
    primaryIatas: ['KLO', 'MPH'],
    preferredLinkIata: 'KLO',
    kind: 'multi',
    confidence: 'high',
    rationale: '칼리보·카틱란 관문',
    bannerNote:
      '보라카이는 칼리보(KLO) 국제선 후 버스·페리, 또는 카틱란(MPH) 직항·국내선으로 들어오는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 아래 제휴 링크 검색어도 그 공항에 맞춰 주세요.'
  },
  'phi-phi-islands': {
    primaryIatas: ['HKT'],
    preferredLinkIata: 'HKT',
    confidence: 'high',
    rationale: '푸켓 국제공항 후 랏사다 항구 페리(툴킷 여정·직항 일정)'
  },
  'el-nido': {
    primaryIatas: ['ENI', 'PPS', 'MNL'],
    preferredLinkIata: 'ENI',
    kind: 'multi',
    confidence: 'high',
    rationale: '엘니도 직항·PPS 육로·MNL 경유',
    bannerNote:
      '항공권·경로 비교\n· 루트 1(추천·비용↑): 인천→마닐라(MNL)→엘니도(ENI). AirSWIFT 독점, MNL 제4터미널(T4) 환승·짐 비연결 → 환승 3~4시간 이상 권장.\n· 루트 2(가성비·육로): 인천→푸에르토프린세사(PPS)→밴·버스→엘니도(5시간+). 체력 소모 큼.\n티켓의 최종 도착 코드로 제휴 링크 검색어를 맞춰 주세요.'
  },
  palawan: {
    primaryIatas: ['ENI', 'PPS', 'MNL'],
    preferredLinkIata: 'PPS',
    kind: 'multi',
    confidence: 'high',
    rationale: '엘니도·푸에르토프린세사·마닐라 관문',
    bannerNote:
      '팔라완·엘니도는 ENI 직항(MNL 경유·AirSWIFT), PPS 육로, MNL 국제선 관문이 나뉩니다. 엘니도 상세 경로는 엘니도 여행지 배너를 참고해 주세요.'
  },
  ishigaki: { primaryIatas: ['ISG'], preferredLinkIata: 'ISG', confidence: 'high', rationale: '이시가키 공항' },
  arequipa: { primaryIatas: ['AQP'], preferredLinkIata: 'AQP', confidence: 'high', rationale: '아레키파 공항' },
  varanasi: { primaryIatas: ['VNS'], preferredLinkIata: 'VNS', confidence: 'high', rationale: '바라나시 공항' },
  'nazca-lines': { primaryIatas: ['LIM'], preferredLinkIata: 'LIM', confidence: 'medium', rationale: '리마 후 버스·소형기' },
  fez: { primaryIatas: ['FEZ'], preferredLinkIata: 'FEZ', confidence: 'high', rationale: '페스 사이스 공항' },
  'abu-simbel': { primaryIatas: ['ASW'], preferredLinkIata: 'ASW', confidence: 'medium', rationale: '아스완 후 투어·국내선' },
  'milford-sound': { primaryIatas: ['ZQN'], preferredLinkIata: 'ZQN', confidence: 'high', rationale: '퀸즈타운 공항' },
  fiordland: { primaryIatas: ['ZQN'], preferredLinkIata: 'ZQN', confidence: 'high', rationale: '퀸즈타운·티아나우 관문' },
  'christmas-island': {
    primaryIatas: ['XCH', 'PER'],
    preferredLinkIata: 'XCH',
    kind: 'multi',
    confidence: 'high',
    rationale: '섬 도착 XCH, 호주 본토 경유 PER',
    bannerNote:
      '호주령 크리스마스섬 직항은 크리스마스섬(XCH)입니다. 퍼스(PER) 등 호주 본토에서 정기편·경유로 이어지는 일정이 일반적입니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  bagan: {
    primaryIatas: ['NYU'],
    preferredLinkIata: 'NYU',
    confidence: 'high',
    rationale: '바간 관문 냥우(NYU) 공항',
    bannerNote:
      '국제선은 양곤(RGN) 또는 만달레이(MDL) 경유 후 바간행 국내선이 NYU(냥우)에 도착하는 일정이 많습니다. 렌터카·픽업·항공 제휴는 최종 도착 NYU 기준입니다.',
  },
  tikal: { primaryIatas: ['GUA'], preferredLinkIata: 'GUA', confidence: 'high', rationale: '과테말라시티 공항' },
  'torres-del-paine': { primaryIatas: ['PUQ'], preferredLinkIata: 'PUQ', confidence: 'high', rationale: '푼타아레나스 공항' },
  persepolis: { primaryIatas: ['SYZ'], preferredLinkIata: 'SYZ', confidence: 'high', rationale: '시라즈 공항' },
  qingdao: { primaryIatas: ['TAO'], preferredLinkIata: 'TAO', confidence: 'high', rationale: '칭다오 공항' },
  'banff-national-park': { primaryIatas: ['YYC'], preferredLinkIata: 'YYC', confidence: 'high', rationale: '캘거리 공항' },
  lhasa: { primaryIatas: ['LXA'], preferredLinkIata: 'LXA', confidence: 'high', rationale: '라싸 공항' },
  zhangjiajie: { primaryIatas: ['DYG'], preferredLinkIata: 'DYG', confidence: 'high', rationale: '장가계 공항' },
  'andaman-islands': { primaryIatas: ['IXZ'], preferredLinkIata: 'IXZ', confidence: 'high', rationale: '포트블레어 비르 사바르카르' },
  'sahara-desert': { primaryIatas: ['RAK'], preferredLinkIata: 'RAK', confidence: 'medium', rationale: '마라케시·메르주가 관문' },
  'iguazu-falls': { primaryIatas: ['IGR'], preferredLinkIata: 'IGR', confidence: 'high', rationale: '이과수 폴스 공항' },
  'uyuni-salt-flat': { primaryIatas: ['LPB', 'UYU'], preferredLinkIata: 'UYU', kind: 'multi', confidence: 'high', rationale: '라파스·우유니 공항' },
  'terracotta-army': { primaryIatas: ['XIY'], preferredLinkIata: 'XIY', confidence: 'high', rationale: '시안 공항' },
  'victoria-falls': { primaryIatas: ['VFA'], preferredLinkIata: 'VFA', confidence: 'high', rationale: '빅토리아폴스 공항' },
  'raja-ampat': { primaryIatas: ['SOQ'], preferredLinkIata: 'SOQ', confidence: 'high', rationale: '소롱 공항' },
  'peninsula-valdes': { primaryIatas: ['PMY'], preferredLinkIata: 'PMY', confidence: 'high', rationale: '푸에르토마드린' },
  svalbard: { primaryIatas: ['LYR'], preferredLinkIata: 'LYR', confidence: 'high', rationale: '롱위어비엔 공항' },
  madagascar: { primaryIatas: ['TNR'], preferredLinkIata: 'TNR', confidence: 'high', rationale: '안타ananarivo 국제공항' },
  ulaanbaatar: { primaryIatas: ['UBN'], preferredLinkIata: 'UBN', confidence: 'high', rationale: '칭기스칸 국제공항' },
  'diego-garcia': {
    primaryIatas: ['MLE'],
    preferredLinkIata: 'MLE',
    confidence: 'medium',
    rationale: '민간 출입 불가, 인도양 경유 허브 참고',
    bannerNote:
      '디에고가르시아는 영국령 군사 기지로 일반 관광 출입이 불가합니다. 아래 링크는 인도양 권역(몰디브 등) 연결·일정 참고용이며, 실제 목적지와 다릅니다.'
  },
  'carstensz-pyramid': {
    primaryIatas: ['TIM', 'CGK', 'DPS'],
    preferredLinkIata: 'TIM',
    kind: 'multi',
    confidence: 'high',
    rationale: '국제선 CGK/DPS 후 파푸아 티미카(TIM) 국내선 — 카르스텐츠 원정 관문',
    bannerNote:
      '카르스텐츠 원정은 보통 자카르타(CGK) 또는 발리(DPS) 국제선 후 티미카(TIM) 국내선으로 들어옵니다. 센타니(DJJ)는 자야푸라 관문으로 흔하지 않습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  'cape-verde': { primaryIatas: ['SID'], preferredLinkIata: 'SID', confidence: 'high', rationale: '살 국제공항' },
  lalibela: {
    primaryIatas: ['ADD', 'LLI'],
    preferredLinkIata: 'ADD',
    kind: 'multi',
    confidence: 'high',
    rationale: '아디스아바바 국제선·랄리벨라(LLI) 국내선 관문',
    bannerNote:
      '랄리벨라는 보통 아디스아바바(ADD) 국제선 후 국내선(LLI)으로 이어집니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  galapagos: {
    primaryIatas: ['GPS', 'GYE'],
    preferredLinkIata: 'GPS',
    kind: 'multi',
    confidence: 'high',
    rationale: '산크리스토발(GPS)·과야킬(GYE) 관문 — 툴킷·배너 SSOT',
    bannerNote:
      '갈라파고스는 산크리스토발(GPS) 직항·과야킬(GYE) 경유 일정이 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  iceland: {
    primaryIatas: ['KEF'],
    preferredLinkIata: 'KEF',
    confidence: 'high',
    rationale: '케플라비크(KEF) 국제공항 — 레이캬비크·링로드 관문'
  },
  phuket: {
    primaryIatas: ['HKT'],
    preferredLinkIata: 'HKT',
    confidence: 'high',
    rationale: '푸켓국제공항(HKT)'
  },
  reykjavik: {
    primaryIatas: ['KEF'],
    preferredLinkIata: 'KEF',
    confidence: 'high',
    rationale: '케플라비크(KEF) — 레이캬비크 시내 관문'
  },
  ushuaia: {
    primaryIatas: ['USH'],
    preferredLinkIata: 'USH',
    confidence: 'high',
    rationale: '우수아이아 마샬공항(USH) — 남극·파타고니아 크루즈 관문'
  },
  cusco: {
    primaryIatas: ['CUZ'],
    preferredLinkIata: 'CUZ',
    confidence: 'high',
    rationale: '쿠스코 국제공항(CUZ) — 마추픽추 관문'
  },
  patagonia: {
    primaryIatas: ['USH', 'PUQ'],
    preferredLinkIata: 'USH',
    kind: 'multi',
    confidence: 'high',
    rationale: '우수아이아(USH)·푼타아레나스(PUQ) 남미 남단 관문',
    bannerNote:
      '파타고니아는 칠레·아르헨티나 남단에 걸쳐 있어 우수아이아(USH)·푼타아레나스(PUQ) 등 관문이 나뉩니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  yellowknife: { primaryIatas: ['YZF'], preferredLinkIata: 'YZF', confidence: 'high', rationale: '옐로나이프 공항' },
  dunhuang: { primaryIatas: ['DNH'], preferredLinkIata: 'DNH', confidence: 'high', rationale: '둔황 공항' },
  uluru: { primaryIatas: ['AYQ'], preferredLinkIata: 'AYQ', confidence: 'high', rationale: '울루루 에어스' },
  timbuktu: { primaryIatas: ['BKO'], preferredLinkIata: 'BKO', confidence: 'medium', rationale: '바마코 후 육로·강' },
  kiribati: { primaryIatas: ['TRW'], preferredLinkIata: 'TRW', confidence: 'high', rationale: '타라와 공항' },
  'kamchatka-peninsula': { primaryIatas: ['PKC'], preferredLinkIata: 'PKC', confidence: 'high', rationale: '페트로파블롭스크캄차츠키' },
  kamchatka: { primaryIatas: ['PKC'], preferredLinkIata: 'PKC', confidence: 'high', rationale: '페트로파블롭스크캄차츠키' },
  'midway-atoll': {
    primaryIatas: ['HNL'],
    preferredLinkIata: 'HNL',
    confidence: 'high',
    rationale: '호놀룰루 경유 정부·에코투어',
    bannerNote:
      '미드웨이 환초는 상용 정기 노선이 없으며, 미국 Fish & Wildlife 허가·투어로 호놀룰루(HNL) 등에서 이어지는 일정이 일반적입니다.'
  },
  denali: { primaryIatas: ['ANC'], preferredLinkIata: 'ANC', confidence: 'high', rationale: '앵커리지 공항' },
  yakutsk: { primaryIatas: ['YKS'], preferredLinkIata: 'YKS', confidence: 'high', rationale: '야쿠츠크 공항' },
  alaska: { primaryIatas: ['ANC'], preferredLinkIata: 'ANC', confidence: 'high', rationale: '앵커리지·페어뱅크스 관문' },
  'st-helena': {
    primaryIatas: ['HLE', 'JNB'],
    preferredLinkIata: 'HLE',
    kind: 'multi',
    confidence: 'high',
    rationale: '섬 공항 HLE, 남아공·개항편 연결 JNB',
    bannerNote:
      '세인트헬레나 최종 도착은 세인트헬레나(HLE)입니다. 요하네스버그(JNB) 등에서 연결·개항편으로 이어지는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'kerguelen-islands': {
    primaryIatas: ['RUN'],
    preferredLinkIata: 'RUN',
    confidence: 'high',
    rationale: '레위니옹 경유 프랑스 남방군도',
    bannerNote:
      '케르겔렌은 연구·군사 목적 선박·전용 항공만 접근 가능합니다. 레위니옹(RUN) 등 프랑스 남방 영토 관문을 거치는 탐험 일정이 일반적입니다.'
  },
  'angkor-wat': {
    primaryIatas: ['SAI'],
    preferredLinkIata: 'SAI',
    confidence: 'high',
    rationale: '시엠립 앙코르국제공항(SAI) — 구 REP 폐쇄 후 관문'
  },
  'angkor-thom': {
    primaryIatas: ['SAI'],
    preferredLinkIata: 'SAI',
    confidence: 'high',
    rationale: '앙코르 권역 — SAI 관문(angkor-wat와 동일)'
  },
  borneo: {
    primaryIatas: ['BKI', 'KCH', 'KUL'],
    preferredLinkIata: 'BKI',
    kind: 'multi',
    confidence: 'high',
    rationale: '사바·사라왕·반도 국제 관문',
    bannerNote:
      '보르네오는 말레이시아·인도네시아·브루나이에 걸친 대섬입니다. 키나발루·세피록(사바)은 코타키나발루(BKI), 쿠칭·사라왕은 쿠칭(KCH), 국제선은 쿠알라룸푸르(KUL) 경유가 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'easter-island': { primaryIatas: ['IPC'], preferredLinkIata: 'IPC', confidence: 'high', rationale: '이스터섬 마타베리' },
  antarctica: {
    primaryIatas: ['USH'],
    preferredLinkIata: 'USH',
    confidence: 'high',
    rationale: '남극 크루즈·연구 기지는 우수아이아 등 남미 관문',
    bannerNote: '남극 본토는 상용 노선이 없습니다. 우수아이아(USH) 등 남미 관문에서 크루즈·전용기로 이어지는 일정이 일반적입니다.'
  }
};
