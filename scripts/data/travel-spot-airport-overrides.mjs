/**
 * 여행지 slug별 도착 공항 수동·검수 매핑 (배너 없음·오탐 보정).
 * IATA는 rentalAirportHubs.js에 등록되어 있어야 런타임·배너에 반영됩니다.
 *
 * @type {Record<string, { primaryIatas: string[], preferredLinkIata?: string, tripFlightArrivalIata?: string, kind?: 'single'|'multi', bannerNote?: string, confidence?: string, rationale?: string }>}
 */
export const TRAVEL_SPOT_AIRPORT_OVERRIDES = {
  hvar: {
    primaryIatas: ['SPU'],
    preferredLinkIata: 'SPU',
    confidence: 'high',
    rationale: '스플리트(SPU) 도착 후 페리 — 흐바르 타운',
    bannerNote:
      '흐바르는 보통 스플리트(SPU) 공항 도착 후 페리로 들어갑니다. 귀국은 동선에 따라 두브로브니크(DBV)나 자그레브(ZAG) 아웃을 쓰는 경우가 많습니다. 티켓의 최종 도착 코드가 다르면 실제 코드에 맞춰 검색·제휴 링크를 바꿔 주세요.',
  },
  kotor: {
    primaryIatas: ['TIV', 'TGD'],
    preferredLinkIata: 'TIV',
    kind: 'multi',
    confidence: 'high',
    rationale: '티바트(TIV)·포드고리차(TGD) — 몬테네그로 코토르 관문; 툴킷 DBV 오탐 보정',
    searchHintIatas: ['TIV', 'TGD'],
    bannerNote:
      '코토르는 티바트(TIV, 차로 약 15분)·포드고리차(TGD, 몬테네그로 주요 국제공항) 도착이 일반적입니다. 발칸 일주 여행객은 두브로브니크(DBV, 크로아티아) 후 버스로 들어오는 일정도 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  lofoten: {
    primaryIatas: ['BOO', 'EVE', 'LKN', 'SVJ'],
    preferredLinkIata: 'EVE',
    kind: 'multi',
    confidence: 'high',
    rationale: '로포텐 다관문 — toolkit-sync BOO·OSL 오탐 보정',
    searchHintIatas: ['BOO', 'EVE', 'LKN', 'SVJ'],
    bannerNote:
      '로포텐으로 가는 항로는 공항마다 역할이 다릅니다. 레크네스(LKN)·스볼바어(SVJ)는 군도 위 공항이라, 국내선 등으로 섬에 직접 도착한 뒤 렌터카·이동을 이어가기 좋습니다. 이베네스(EVE)는 본토(하르스타드·나르비크) 쪽 관문으로 국제·국내 대형 노선이 많고, 차나 버스로 로포텐으로 들어오는 일정이 흔합니다. 보되(BOO)는 로포텐 남쪽 본토에서 페리(예: 보되–모스케네스)나 국내선으로 군도에 이어질 때 자주 쓰입니다. 인천 등에서는 오슬로(OSL) 등 유럽 경유 후 위 공항으로 국내선을 이어 붙입니다. 실제 티켓·일정에 적힌 도착 공항(IATA)을 확인한 뒤, 아래 제휴 링크 검색어도 그 공항에 맞춰 바꿔 주세요.',
  },
  'costa-rica': {
    primaryIatas: ['SJO', 'LIR'],
    preferredLinkIata: 'SJO',
    kind: 'multi',
    confidence: 'high',
    rationale: '수도 산호세(SJO)·북서 휴양지 리베리아(LIR) 관문',
    searchHintIatas: ['SJO', 'LIR'],
    bannerNote:
      '코스타리카는 수도 산호세의 후안 산타마리아(SJO) 또는 북서부 휴양지 접근이 편한 리베리아(LIR) 중 일정에 맞게 선택하세요. 미국·캐나다·멕시코 경유가 일반적이며 직항은 없습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  'chichen-itza': { primaryIatas: ['CUN'], preferredLinkIata: 'CUN', confidence: 'high', rationale: '칸쿤 국제공항 후 육로' },
  'annapurna-circuit': { primaryIatas: ['KTM', 'PKR'], preferredLinkIata: 'PKR', kind: 'multi', confidence: 'high', rationale: '카트만두·포카라 관문' },
  bodrum: { primaryIatas: ['BJV'], preferredLinkIata: 'BJV', confidence: 'high', rationale: '밀라스·보드룸 공항' },
  bled: {
    primaryIatas: ['LJU', 'ZAG', 'VCE'],
    preferredLinkIata: 'LJU',
    kind: 'multi',
    confidence: 'high',
    rationale: '슬로베니아 류블랴나(LJU) 관문 — ZAG·VCE는 대안 루트',
    searchHintIatas: ['LJU', 'ZAG', 'VCE'],
    bannerNote:
      '블레드는 보통 류블랴나(LJU) 공항 도착 후 셔틀·버스(약 30~45분)로 이동합니다. 항공료 절감을 위해 자그레브(ZAG)·베네치아(VCE) 입국 후 육로로 오는 일정도 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  jaipur: { primaryIatas: ['JAI'], preferredLinkIata: 'JAI', confidence: 'high', rationale: '자이푸르 국제공항' },
  'la-reunion': {
    primaryIatas: ['RUN'],
    preferredLinkIata: 'RUN',
    confidence: 'high',
    rationale: '생드니 공항',
    klookRentalHomeSearchLabel: '롤랑 가로스 공항'
  },
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
  'grand-canyon': { primaryIatas: ['LAS', 'FLG'], preferredLinkIata: 'LAS', kind: 'multi', confidence: 'high', rationale: '라스베이거스·그랜드캐니언 공항' },
  hampi: { primaryIatas: ['BLR'], preferredLinkIata: 'BLR', confidence: 'high', rationale: '방갈로르 후 장거리 육로' },
  meteora: { primaryIatas: ['SKG'], preferredLinkIata: 'SKG', confidence: 'high', rationale: '테살로니키 공항' },
  miyakojima: {
    primaryIatas: ['SHI', 'MMY'],
    preferredLinkIata: 'SHI',
    kind: 'multi',
    confidence: 'high',
    rationale: '인천 직항 시모지시마(SHI)·나하 경유 미야코(MMY) 관문',
    searchHintIatas: ['SHI', 'MMY'],
    bannerNote:
      '인천 직항(진에어 등)은 시모지시마 공항(SHI) 도착이 일반적이며, 오키나와(나하) 경유 시 미야코 공항(MMY)입니다. 시모지시마는 다리로 본섬과 연결되어 렌터카·이동이 편합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크 검색어도 그 공항에 맞춰 주세요.'
  },
  borobudur: {
    primaryIatas: ['YIA'],
    preferredLinkIata: 'YIA',
    confidence: 'high',
    rationale: '족자카르타 국제공항(YIA) — 툴킷 여정·국내선 최종 도착',
    bannerNote:
      '보로부두르·마겔랑 권역은 보통 인천→자카르타(CGK) 또는 발리(DPS) 경유 후 족자카르타(YIA) 국내선 도착이 일반적입니다. 티켓의 최종 도착 코드가 다르면 실제 코드에 맞춰 검색·제휴 링크를 바꿔 주세요.',
  },
  rarotonga: {
    primaryIatas: ['RAR'],
    preferredLinkIata: 'RAR',
    confidence: 'high',
    rationale: '라로통가 국제공항(RAR) — 쿡 제도 최종 도착',
    bannerNote:
      '라로통가(쿡 제도)는 보통 인천→오클랜드(AKL) 경유 후 라로통가(RAR) 도착이 일반적입니다. 날짜변경선으로 도착일이 하루 당겨질 수 있으니 티켓·숙소 날짜를 확인하세요.',
  },
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
  'nazca-lines': { primaryIatas: ['LIM'], preferredLinkIata: 'LIM', confidence: 'high', rationale: '리마 후 버스·소형기' },
  fez: { primaryIatas: ['FEZ'], preferredLinkIata: 'FEZ', confidence: 'high', rationale: '페스 사이스 공항' },
  'abu-simbel': { primaryIatas: ['ASW'], preferredLinkIata: 'ASW', confidence: 'high', rationale: '아스완 후 투어·국내선' },
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
  'torres-del-paine': {
    primaryIatas: ['PUQ'],
    preferredLinkIata: 'PUQ',
    confidence: 'high',
    rationale: '푼타아레나스(PUQ) — 칠레 남부 토레스 델 파이네·W트레킹 관문',
    bannerNote:
      '토레스 델 파이네는 칠레 남부 파타고니아 국립공원입니다. 보통 푼타아레나스(PUQ) 직항·경유 후 버스·투어로 들어갑니다. 아르헨티나 북부 파타고니아·우수아이아와 관문이 다릅니다.'
  },
  persepolis: { primaryIatas: ['SYZ'], preferredLinkIata: 'SYZ', confidence: 'high', rationale: '시라즈 공항' },
  qingdao: { primaryIatas: ['TAO'], preferredLinkIata: 'TAO', confidence: 'high', rationale: '칭다오 공항' },
  'banff-national-park': { primaryIatas: ['YYC'], preferredLinkIata: 'YYC', confidence: 'high', rationale: '캘거리 공항' },
  lhasa: { primaryIatas: ['LXA'], preferredLinkIata: 'LXA', confidence: 'high', rationale: '라싸 공항' },
  zhangjiajie: { primaryIatas: ['DYG'], preferredLinkIata: 'DYG', confidence: 'high', rationale: '장가계 공항' },
  'andaman-islands': { primaryIatas: ['IXZ'], preferredLinkIata: 'IXZ', confidence: 'high', rationale: '포트블레어 비르 사바르카르' },
  'sahara-desert': { primaryIatas: ['RAK'], preferredLinkIata: 'RAK', confidence: 'high', rationale: '마라케시·메르주가 관문' },
  'iguazu-falls': { primaryIatas: ['IGR'], preferredLinkIata: 'IGR', confidence: 'high', rationale: '이과수 폴스 공항' },
  'uyuni-salt-flat': { primaryIatas: ['LPB', 'UYU'], preferredLinkIata: 'UYU', kind: 'multi', confidence: 'high', rationale: '라파스·우유니 공항' },
  'terracotta-army': { primaryIatas: ['XIY'], preferredLinkIata: 'XIY', confidence: 'high', rationale: '시안 공항' },
  'victoria-falls': { primaryIatas: ['VFA'], preferredLinkIata: 'VFA', confidence: 'high', rationale: '빅토리아폴스 공항' },
  'raja-ampat': { primaryIatas: ['SOQ'], preferredLinkIata: 'SOQ', confidence: 'high', rationale: '소롱 공항' },
  'peninsula-valdes': { primaryIatas: ['PMY'], preferredLinkIata: 'PMY', confidence: 'high', rationale: '푸에르토마드린' },
  socotra: {
    primaryIatas: ['SCT', 'AUH'],
    preferredLinkIata: 'SCT',
    tripFlightArrivalIata: 'AUH',
    kind: 'multi',
    confidence: 'high',
    rationale: 'AUH 국제선·전세기 후 SCT 최종 — Trip AUH·렌터카 SCT 분리',
    bannerNote:
      '소코트라는 인천→아부다비(AUH) 국제선 도착 후, 아부다비에서 주 1~2회 운항하는 정부 인가 전세기(주로 Air Arabia)로 소코트라(SCT)에 들어갑니다. 스카이스캐너·Trip.com 등 항공권 검색은 AUH까지, SCT 구간은 현지 투어 에이전시를 통해서만 발권됩니다. 렌터카·픽업·섬 일정은 SCT 도착 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 맞춰 주세요.'
  },
  svalbard: { primaryIatas: ['LYR'], preferredLinkIata: 'LYR', confidence: 'high', rationale: '롱위어비엔 공항' },
  madagascar: { primaryIatas: ['TNR'], preferredLinkIata: 'TNR', confidence: 'high', rationale: '안타ananarivo 국제공항' },
  'marshall-islands': {
    primaryIatas: ['MAJ', 'GUM', 'HNL'],
    preferredLinkIata: 'MAJ',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'GUM·HNL 경유 유나이티드 아일랜드 호퍼 후 MAJ 최종 — Trip HNL·렌터카 MAJ',
    bannerNote:
      '마셜 제도(마주로)는 인천→호놀룰루(HNL) 또는 괌(GUM) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(Island Hopper)로 마주로(MAJ)에 들어갑니다. Trip.com 등 항공권 검색은 HNL(또는 일정에 맞게 GUM)까지 — MAJ 구간은 아일랜드 호퍼 예약이 필요합니다. 렌터카·픽업·섬 일정은 MAJ 도착 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 맞춰 주세요.'
  },
  ulaanbaatar: { primaryIatas: ['UBN'], preferredLinkIata: 'UBN', confidence: 'high', rationale: '칭기스칸 국제공항' },
  'diego-garcia': {
    primaryIatas: ['MLE'],
    preferredLinkIata: 'MLE',
    confidence: 'high',
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
  'cape-verde': {
    primaryIatas: ['SID', 'RAI'],
    preferredLinkIata: 'SID',
    kind: 'multi',
    confidence: 'high',
    rationale: '살(SID) 휴양·프라이아(RAI) 행정 — LIS/CMN 국제선 경유',
    searchHintIatas: ['SID', 'RAI'],
    bannerNote:
      '보베르데는 섬마다 공항이 나뉩니다. 휴양·해양 액티비티는 살 섬 아밀카르 카브랄(SID), 행정·문화 중심은 산티아고 섬 프라이아 넬슨 만델라(RAI) 도착이 일반적입니다. 한국에서는 리스본(LIS)·카사블랑카(CMN) 등 경유 후 섬행 직항으로 이어지는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  lalibela: {
    primaryIatas: ['LLI', 'ADD'],
    preferredLinkIata: 'LLI',
    kind: 'multi',
    confidence: 'high',
    rationale: 'ADD 국제선 후 LLI 국내선 — 최종 도착·렌터카 LLI',
    bannerNote:
      '랄리벨라는 보통 인천→아디스아바바(ADD) 국제선 후 랄리벨라(LLI) 국내선으로 이어집니다. 렌터카·픽업·투어는 랄리벨라 공항(LLI) 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
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
  madeira: {
    primaryIatas: ['FNC'],
    preferredLinkIata: 'FNC',
    confidence: 'high',
    rationale: '마데이라(푼샬) 공항 FNC — Phase D-3·승격 slug'
  },
  vladivostok: {
    primaryIatas: ['VVO'],
    preferredLinkIata: 'VVO',
    confidence: 'high',
    rationale: '블라디보스토크 국제공항(VVO) — citiesData 승격'
  },
  irkutsk: {
    primaryIatas: ['IKT'],
    preferredLinkIata: 'IKT',
    confidence: 'high',
    rationale: '이르쿠츠크 국제공항(IKT) — 바이칼 관문·citiesData 승격'
  },
  'alice-springs': {
    primaryIatas: ['ASP'],
    preferredLinkIata: 'ASP',
    confidence: 'high',
    rationale: '앨리스스프링스 공항(ASP) — 레드센터·울루루 관문'
  },
  ushuaia: {
    primaryIatas: ['USH'],
    preferredLinkIata: 'USH',
    confidence: 'high',
    rationale: '우수아이아 마샬공항(USH) — 티에라델푸에고·남극 크루즈 관문'
  },
  'el-calafate': {
    primaryIatas: ['FTE'],
    preferredLinkIata: 'FTE',
    confidence: 'high',
    rationale: '엘칼라파테(FTE) — 페리토 모레노·남부 아르헨티나 파타고니아 관문',
    bannerNote:
      '엘칼라파테는 페리토 모레노 빙하·로스글라시아레스 국립공원 관문(FTE)입니다. 북부 파타고니아(바릴로체 BRC)·우수아이아(USH)·토레스 델 파이네(PUQ)와 관문이 다릅니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  cusco: {
    primaryIatas: ['CUZ', 'LIM'],
    preferredLinkIata: 'CUZ',
    kind: 'multi',
    confidence: 'high',
    bannerNote:
      '국제선은 리마(LIM)에 도착한 뒤 쿠스코(CUZ) 국내선으로 이어집니다. 렌터카·픽업·투어는 쿠스코 공항 기준입니다.',
    rationale: 'LIM 국제선 후 CUZ 국내선 — 마추픽추·쿠스코 관문'
  },
  'machu-picchu': {
    primaryIatas: ['CUZ', 'LIM'],
    preferredLinkIata: 'CUZ',
    kind: 'multi',
    confidence: 'high',
    bannerNote:
      '국제선은 리마(LIM)에 도착한 뒤 쿠스코(CUZ) 국내선으로 이어집니다. 렌터카·픽업·투어는 쿠스코 공항 기준입니다.',
    rationale: 'LIM 국제선 후 CUZ 국내선 — 마추픽추는 쿠스코 경유'
  },
  'inca-trail': {
    primaryIatas: ['CUZ', 'LIM'],
    preferredLinkIata: 'CUZ',
    kind: 'multi',
    confidence: 'high',
    bannerNote:
      '국제선은 리마(LIM)에 도착한 뒤 쿠스코(CUZ) 국내선으로 이어집니다. 렌터카·픽업·투어는 쿠스코 공항 기준입니다.',
    rationale: 'LIM 국제선 후 CUZ 국내선 — 잉카 트레일 출발은 쿠스코'
  },
  patagonia: {
    primaryIatas: ['BRC', 'EZE'],
    preferredLinkIata: 'BRC',
    kind: 'multi',
    confidence: 'high',
    rationale: '아르헨티나 북부 파타고니아 — 바릴로체(BRC)·부에노스아이레스(EZE) 국제선 관문',
    bannerNote:
      '이 여행지는 **아르헨티나 북부 파타고니아**(바릴로체·호수·안데스)입니다. 보통 부에노스아이레스(EZE) 국제선 후 바릴로체(BRC) 국내선으로 이어집니다. 남부(우수아이아 USH·토레스 델 파이네 PUQ)는 별도 여행지를 참고하세요. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  yellowknife: { primaryIatas: ['YZF'], preferredLinkIata: 'YZF', confidence: 'high', rationale: '옐로나이프 공항' },
  dunhuang: { primaryIatas: ['DNH'], preferredLinkIata: 'DNH', confidence: 'high', rationale: '둔황 공항' },
  uluru: { primaryIatas: ['AYQ'], preferredLinkIata: 'AYQ', confidence: 'high', rationale: '울루루 에어스' },
  timbuktu: { primaryIatas: ['BKO'], preferredLinkIata: 'BKO', confidence: 'high', rationale: '바마코 후 육로·강' },
  singapore: { primaryIatas: ['SIN'], preferredLinkIata: 'SIN', confidence: 'high', rationale: '창이국제공항(SIN)' },
  london: { primaryIatas: ['LHR'], preferredLinkIata: 'LHR', confidence: 'high', rationale: '히스로공항(LHR)' },
  seoul: {
    primaryIatas: ['ICN', 'GMP'],
    preferredLinkIata: 'ICN',
    kind: 'multi',
    confidence: 'high',
    rationale: '인천(ICN) 국제선·김포(GMP) 국내·단거리 국제선',
    bannerNote:
      '서울은 인천(ICN) 국제선·김포(GMP) 국내·단거리 국제선이 나뉩니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  shanghai: {
    primaryIatas: ['PVG', 'SHA'],
    preferredLinkIata: 'PVG',
    kind: 'multi',
    confidence: 'high',
    rationale: '푸둥(PVG) 국제선·훙차오(SHA) 국내·단거리 국제선',
    searchHintIatas: ['PVG', 'SHA'],
    bannerNote:
      '상하이는 인천→푸둥(PVG) 직항과 김포→훙차오(SHA) 단거리 노선이 흔합니다. 시내 접근성은 훙차오가 좋으나 항공편 선택지는 푸둥이 더 많습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  jeju: { primaryIatas: ['CJU'], preferredLinkIata: 'CJU', confidence: 'high', rationale: '제주국제공항(CJU)' },
  kilimanjaro: {
    primaryIatas: ['JRO', 'NBO'],
    preferredLinkIata: 'JRO',
    kind: 'multi',
    confidence: 'high',
    rationale: '킬리만자로(JRO) 국제공항·나이로비(NBO) 경유',
    bannerNote:
      '킬리만자로 원정은 킬리만자로(JRO) 직항·나이로비(NBO) 경유 육로가 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'everest-base-camp': {
    primaryIatas: ['KTM'],
    preferredLinkIata: 'KTM',
    confidence: 'high',
    rationale: '카트만두(KTM) — 루클라(LUA) 국내선·트레킹 관문'
  },
  'kuala-lumpur': { primaryIatas: ['KUL'], preferredLinkIata: 'KUL', confidence: 'high', rationale: '쿠알라룸푸르국제공항(KUL)' },
  amsterdam: { primaryIatas: ['AMS'], preferredLinkIata: 'AMS', confidence: 'high', rationale: '스키폴공항(AMS)' },
  'cape-town': { primaryIatas: ['CPT'], preferredLinkIata: 'CPT', confidence: 'high', rationale: '케이프타운국제공항(CPT)' },
  luxor: { primaryIatas: ['LXR'], preferredLinkIata: 'LXR', confidence: 'high', rationale: '룩소르국제공항(LXR)' },
  serengeti: {
    primaryIatas: ['JRO', 'NBO'],
    preferredLinkIata: 'JRO',
    kind: 'multi',
    confidence: 'high',
    rationale: '북부 탄자니아 — 킬리만자로(JRO)·나이로비(NBO) 관문'
  },
  'similan-islands': { primaryIatas: ['HKT'], preferredLinkIata: 'HKT', confidence: 'high', rationale: '푸켓(HKT) 후 보트·다이빙 투어' },
  bohol: {
    primaryIatas: ['CEB', 'TAG'],
    preferredLinkIata: 'TAG',
    kind: 'multi',
    confidence: 'high',
    rationale: '타그비라란(TAG) 직항·세부(CEB) 페리 관문',
    bannerNote:
      '보홀은 타그비라란(TAG) 공항 직항·세부(CEB) 페리로 들어오는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  yokohama: {
    primaryIatas: ['HND', 'NRT'],
    preferredLinkIata: 'HND',
    kind: 'multi',
    confidence: 'high',
    rationale: '하네다(HND)·나리타(NRT) — 도쿄권 국제·국내선 관문',
    bannerNote:
      '요코하마는 도쿄권 하네다(HND)·나리타(NRT) 공항 후 JR·지하철로 이동하는 일정이 일반적입니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  tsushima: {
    primaryIatas: ['TSJ', 'FUK'],
    preferredLinkIata: 'FUK',
    kind: 'multi',
    confidence: 'high',
    rationale: '対馬島(대마도·쓰시마) — 한국인 주 경로 부산 페리·히타카츠; TSJ·FUK는 일본 측 항공 관문',
    bannerNote:
      '대마도(쓰시마·対馬島)는 같은 섬입니다. 한국에서 가는 일반 경로는 부산국제여객터미널→히타카츠항 페리이며, 인천(ICN) 직항은 없습니다. 아래 TSJ·FUK는 일본 국내선·후쿠오카 경유 일정 참고용이고, 페리·렌터카는 툴킷 여정(부산 출발)을 우선해 주세요.'
  },
  kiribati: { primaryIatas: ['TRW'], preferredLinkIata: 'TRW', confidence: 'high', rationale: '타라와 공항' },
  yap: {
    primaryIatas: ['YAP', 'HNL'],
    preferredLinkIata: 'YAP',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'HNL 경유 United 아일랜드 호퍼 후 YAP — Trip HNL·렌터카 YAP',
    bannerNote:
      '야프(YAP)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼로 들어갑니다. Trip.com 등 항공권 검색은 HNL까지 — YAP 구간은 United 공식 예약이 필요합니다. 렌터카·픽업·섬 일정은 YAP 도착 기준입니다.'
  },
  chuuk: {
    primaryIatas: ['TKK', 'HNL'],
    preferredLinkIata: 'TKK',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'HNL 경유 United 아일랜드 호퍼 후 TKK — Trip HNL·렌터카 TKK',
    bannerNote:
      '추크(TKK)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(경유 MAJ)로 들어갑니다. Trip.com 등 항공권 검색은 HNL까지 — TKK 구간은 United 공식 예약이 필요합니다. 렌터카·픽업·섬 일정은 TKK 도착 기준입니다.'
  },
  kosrae: {
    primaryIatas: ['KOS', 'HNL'],
    preferredLinkIata: 'KOS',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'HNL 경유 United 아일랜드 호퍼 후 KOS — Trip HNL·렌터카 KOS · United 예약 코드 KSA',
    bannerNote:
      '코스라에(KOS)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼로 들어갑니다. Trip.com 등 항공권 검색은 HNL까지 — United 예약 시 목적지 코드 KSA를 사용합니다. 렌터카·픽업·섬 일정은 KOS 도착 기준입니다.'
  },
  pohnpei: {
    primaryIatas: ['PNI', 'HNL'],
    preferredLinkIata: 'PNI',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'HNL 경유 United 아일랜드 호퍼 후 PNI — Trip HNL·렌터카 PNI',
    bannerNote:
      '폰페이(PNI)는 인천→호놀룰루(HNL) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(경유 MAJ)로 들어갑니다. Trip.com 등 항공권 검색은 HNL까지 — PNI 구간은 United 공식 예약이 필요합니다. 렌터카·픽업·섬 일정은 PNI 도착 기준입니다.'
  },
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
      '보르네오는 말레이시아·인도네시아·브루나이에 걸친 대섬입니다. 키나발루·세피록(사바)은 코타키나발루(BKI), 쿠칭·사라왕은 쿠칭(KCH), 국제선은 쿠알라룸푸르(KUL) 경유가 흔합니다. 브루나이(BWN)는 별도 여행지입니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  brunei: {
    primaryIatas: ['BWN'],
    preferredLinkIata: 'BWN',
    confidence: 'high',
    rationale: '브루나이 국제공항(BWN) — 보르네오(borneo)와 별도 여행지',
    bannerNote:
      '보르네오섬 북부의 독립 국가입니다. 말레이시아 사바·보르네오(borneo)와 입국 서류·관문(BKI)이 다릅니다. 티켓 도착은 BWN을 확인해 주세요.'
  },
  'easter-island': { primaryIatas: ['IPC'], preferredLinkIata: 'IPC', confidence: 'high', rationale: '이스터섬 마타베리' },
  antarctica: {
    primaryIatas: ['USH'],
    preferredLinkIata: 'USH',
    confidence: 'high',
    rationale: '남극 크루즈·연구 기지는 우수아이아 등 남미 관문',
    bannerNote: '남극 본토는 상용 노선이 없습니다. 우수아이아(USH) 등 남미 관문에서 크루즈·전용기로 이어지는 일정이 일반적입니다.'
  },
  // —— 세션 C placeIds_only 승격 (2026-05-21) ——
  hamburg: {
    primaryIatas: ['HAM'],
    preferredLinkIata: 'HAM',
    confidence: 'high',
    rationale: '함부르크 공항 HAM — 툴킷 FRA 오탐 보정'
  },
  'cocos-islands': {
    primaryIatas: ['CCK', 'PER'],
    preferredLinkIata: 'CCK',
    kind: 'multi',
    confidence: 'high',
    rationale: '코코스 제도 CCK, 호주 본토 경유 PER',
    bannerNote:
      '호주령 코코스(킬링) 제도는 코코스 제도(CCK) 직항·퍼스(PER) 등 호주 본토 경유 일정이 일반적입니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'pitcairn-islands': {
    primaryIatas: ['PPT'],
    preferredLinkIata: 'PPT',
    confidence: 'high',
    rationale: '타히티 PPT 국제선 관문 — 렌터카·픽업은 타히티 대기 구간 기준',
    bannerNote:
      '핏케언 제도는 상용 직항이 없습니다. 타히티(PPT) 국제선 도착 → 망가레바(GMR) 국내선 → 리키테아 페리·전용 여객선 순이 일반적입니다. 위 연동 공항은 타히티(PPT) 기준입니다.'
  },
  greenland: {
    primaryIatas: ['CPH', 'GOH'],
    preferredLinkIata: 'CPH',
    kind: 'multi',
    confidence: 'high',
    rationale: '덴마크 CPH 경유·누크 GOH',
    bannerNote:
      '그린란드는 코펜하겐(CPH) 등 유럽 관문 경유 후 누크(GOH)·일룰리사트 등으로 이어지는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'falkland-islands': {
    primaryIatas: ['MPM', 'SCL'],
    preferredLinkIata: 'MPM',
    kind: 'multi',
    confidence: 'high',
    rationale: 'MPM 스탠리·칠레 SCL 경유',
    bannerNote:
      '포클랜드 제도는 MPM(마운트 플레전트) 도착·칠레(SCL) 경유 일정이 일반적입니다. 토레스 델 파이네(PUQ)와 혼동하지 마세요.'
  },
  'solomon-islands': {
    primaryIatas: ['HIR', 'BNE'],
    preferredLinkIata: 'HIR',
    kind: 'multi',
    confidence: 'high',
    rationale: '호니아라 HIR·호주 BNE 경유'
  },
  nauru: {
    primaryIatas: ['INU', 'BNE'],
    preferredLinkIata: 'INU',
    kind: 'multi',
    confidence: 'high',
    rationale: '나우루 INU·호주 BNE 관문'
  },
  queenstown: {
    primaryIatas: ['ZQN'],
    preferredLinkIata: 'ZQN',
    confidence: 'high',
    rationale: '퀸즈타운 ZQN'
  },
  minneapolis: {
    primaryIatas: ['MSP'],
    preferredLinkIata: 'MSP',
    confidence: 'high',
    rationale: 'MSP 국제공항'
  },
  perth: {
    primaryIatas: ['PER'],
    preferredLinkIata: 'PER',
    confidence: 'high',
    rationale: '서호주 PER'
  },
  bahamas: {
    primaryIatas: ['NAS', 'MIA', 'ATL'],
    preferredLinkIata: 'NAS',
    kind: 'multi',
    confidence: 'high',
    rationale: '나소 NAS·미 동부 MIA/ATL 경유',
    bannerNote:
      '바하마는 나소(NAS) 등 섬별 관문이 다릅니다. 마이애미(MIA)·애틀랜타(ATL) 경유 일정도 흔하니 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  'sri-jayawardenapura': {
    primaryIatas: ['CMB'],
    preferredLinkIata: 'CMB',
    confidence: 'high',
    rationale: '콜롬보 CMB — 행정 수도 코놈보 인접'
  },
  venezuela: {
    primaryIatas: ['CCS'],
    preferredLinkIata: 'CCS',
    confidence: 'high',
    rationale: '카라카스 CCS — 국가 단위·툴킷 IST/MAD 오탐 보정'
  },
  havana: {
    primaryIatas: ['HAV'],
    preferredLinkIata: 'HAV',
    confidence: 'high',
    rationale: '아바나(Havana) HAV — citiesData·Phase D-4 placeIds 승격'
  },
  malta: {
    primaryIatas: ['MLA'],
    preferredLinkIata: 'MLA',
    confidence: 'high',
    rationale: '발레타(Valletta) 관문 MLA — Phase D-3 툴킷·승격 slug'
  },
  vatican: {
    primaryIatas: ['FCO'],
    preferredLinkIata: 'FCO',
    confidence: 'high',
    rationale: '바티칸 시국 — 로마 피우미치노(FCO) 관문, 로마 시내와 인접',
    bannerNote:
      '바티칸 시국은 로마 시내 서쪽에 위치한 독립국입니다. 국제선은 로마 피우미치노(FCO) 공항이 관문이며, 시내·바티칸까지 지하철·택시·도보로 이동합니다. 항공권 검색 시 도착지 FCO를 사용하세요.'
  },
  'la-spezia': {
    primaryIatas: ['FCO', 'MXP', 'FLR', 'PSA'],
    preferredLinkIata: 'FCO',
    kind: 'multi',
    confidence: 'high',
    rationale: '공항 없는 항구도시 — 로마(FCO)·밀라노(MXP) 국제선 관문, 피렌체(FLR)·피사(PSA)는 기차 이동 단축',
    searchHintIatas: ['FCO', 'MXP', 'FLR', 'PSA'],
    bannerNote:
      '라스페치아·친퀘테레 권역은 공항이 없습니다. 국제선은 로마 피우미치노(FCO) 또는 밀라노 말펜사(MXP) 입국 후 기차로 오는 일정이 가장 흔합니다. 피렌체(FLR)·피사(PSA)로 들어오면 라스페치아까지 기차 시간이 더 짧을 수 있습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  ubud: {
    primaryIatas: ['DPS'],
    preferredLinkIata: 'DPS',
    confidence: 'high',
    rationale: '우붓(Ubud) — 발리 응우라라이(DPS) 관문, 공항에서 차로 약 1~1.5시간',
    bannerNote:
      '우붓은 발리 중부 고원 마을입니다. 국제선은 응우라라이(DPS) 공항이 관문이며, 공항에서 우붓까지 차로 약 1~1.5시간이 소요됩니다. 항공권 검색 시 도착지 DPS를 사용하세요.'
  },
  bermuda: {
    primaryIatas: ['BDA'],
    preferredLinkIata: 'BDA',
    confidence: 'high',
    rationale: '버뮤다 국제공항(L.F. Wade) — 한국 직항 없음',
    bannerNote:
      '버뮤다 최종 도착은 버뮤다 국제공항(BDA)입니다. 한국에서는 인천(ICN) 직항이 없어 보통 미국 동부(뉴욕 JFK·보스턴 BOS·애틀랜타 ATL·마이애미 MIA 등) 또는 영국·유럽(런던 LHR·파리 CDG 등) 경유 후 BDA로 연결되는 일정이 일반적입니다. 미국 경유 시 ESTA·캐나다·영국 경유 시 해당 입국·트랜짓 비자 규정을 반드시 확인하세요. 항공권 검색 시 도착지 코드 BDA를 입력하고, 티켓의 최종 도착 공항을 확인한 뒤 제휴 링크도 맞춰 주세요.',
  },
};

/** travelSpots slug 없음 — placeIds-only (DB place_id 키) */
export const TRAVEL_SPOT_PLACE_ID_OVERRIDES = {
  '어센션 섬': {
    primaryIatas: ['ASI', 'JNB'],
    preferredLinkIata: 'ASI',
    kind: 'multi',
    confidence: 'high',
    rationale: '와이드어웨이크 ASI(공식 IATA), 남아공·개항편 연결 JNB',
    bannerNote:
      '어센션 섬 최종 도착은 와이드어웨이크 공항(ASI)입니다. 요하네스버그(JNB) 등에서 RAF·개항편으로 이어지는 일정이 흔합니다. 허가·제한 구역이므로 티켓의 최종 도착 코드를 확인해 주세요.'
  },
  쿠스코: {
    primaryIatas: ['CUZ', 'LIM'],
    preferredLinkIata: 'CUZ',
    kind: 'multi',
    confidence: 'high',
    bannerNote:
      '국제선은 리마(LIM)에 도착한 뒤 쿠스코(CUZ) 국내선으로 이어집니다. 렌터카·픽업·투어는 쿠스코 공항 기준입니다.',
    rationale: 'LIM 국제선 후 CUZ 국내선 — slug cusco와 동일'
  },
  마추픽추: {
    primaryIatas: ['CUZ', 'LIM'],
    preferredLinkIata: 'CUZ',
    kind: 'multi',
    confidence: 'high',
    bannerNote:
      '국제선은 리마(LIM)에 도착한 뒤 쿠스코(CUZ) 국내선으로 이어집니다. 렌터카·픽업·투어는 쿠스코 공항 기준입니다.',
    rationale: 'LIM 국제선 후 CUZ 국내선 — slug machu-picchu와 동일'
  },
  미야코지마: {
    primaryIatas: ['SHI', 'MMY'],
    preferredLinkIata: 'SHI',
    kind: 'multi',
    confidence: 'high',
    rationale: '인천 직항 시모지시마(SHI)·나하 경유 미야코(MMY) — slug miyakojima와 동일',
    searchHintIatas: ['SHI', 'MMY'],
    bannerNote:
      '인천 직항(진에어 등)은 시모지시마 공항(SHI) 도착이 일반적이며, 오키나와(나하) 경유 시 미야코 공항(MMY)입니다. 시모지시마는 다리로 본섬과 연결되어 렌터카·이동이 편합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크 검색어도 그 공항에 맞춰 주세요.'
  },
  아이투타키: {
    primaryIatas: ['AIT', 'RAR'],
    preferredLinkIata: 'AIT',
    kind: 'multi',
    confidence: 'high',
    rationale: 'AKL·RAR 국제선 경유 후 AIT 국내선 — 최종 도착·렌터카 AIT',
    bannerNote:
      '아이투타키는 보통 인천→오클랜드(AKL) 경유 후 라로통가(RAR) 국제선, 이어서 에어 라로통가 국내선으로 아이투타키(AIT) 도착이 일반적입니다. 렌터카·픽업·투어는 아이투타키 공항(AIT) 기준입니다. 날짜변경선으로 도착일이 하루 당겨질 수 있으니 티켓·숙소 날짜를 확인하세요.'
  },
  코스타리카: {
    primaryIatas: ['SJO', 'LIR'],
    preferredLinkIata: 'SJO',
    kind: 'multi',
    confidence: 'high',
    rationale: '수도 산호세(SJO)·북서 휴양지 리베리아(LIR) — slug costa-rica와 동일',
    searchHintIatas: ['SJO', 'LIR'],
    bannerNote:
      '코스타리카는 수도 산호세의 후안 산타마리아(SJO) 또는 북서부 휴양지 접근이 편한 리베리아(LIR) 중 일정에 맞게 선택하세요. 미국·캐나다·멕시코 경유가 일반적이며 직항은 없습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  라스페치아: {
    primaryIatas: ['FCO', 'MXP', 'FLR', 'PSA'],
    preferredLinkIata: 'FCO',
    kind: 'multi',
    confidence: 'high',
    rationale: '공항 없는 항구도시 — slug la-spezia와 동일',
    searchHintIatas: ['FCO', 'MXP', 'FLR', 'PSA'],
    bannerNote:
      '라스페치아·친퀘테레 권역은 공항이 없습니다. 국제선은 로마 피우미치노(FCO) 또는 밀라노 말펜사(MXP) 입국 후 기차로 오는 일정이 가장 흔합니다. 피렌체(FLR)·피사(PSA)로 들어오면 라스페치아까지 기차 시간이 더 짧을 수 있습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  보베르데: {
    primaryIatas: ['SID', 'RAI'],
    preferredLinkIata: 'SID',
    kind: 'multi',
    confidence: 'high',
    rationale: '살(SID)·프라이아(RAI) — slug cape-verde와 동일',
    searchHintIatas: ['SID', 'RAI'],
    bannerNote:
      '보베르데는 섬마다 공항이 나뉩니다. 휴양·해양 액티비티는 살 섬 아밀카르 카브랄(SID), 행정·문화 중심은 산티아고 섬 프라이아 넬슨 만델라(RAI) 도착이 일반적입니다. 한국에서는 리스본(LIS)·카사블랑카(CMN) 등 경유 후 섬행 직항으로 이어지는 일정이 흔합니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  콘다오: {
    primaryIatas: ['VCS', 'SGN'],
    preferredLinkIata: 'VCS',
    kind: 'multi',
    confidence: 'high',
    rationale: 'SGN 국제선 후 VCS 국내선 — 최종 도착·렌터카 VCS (travelSpots slug 없음)',
    bannerNote:
      '콘다오는 인천→호치민(SGN) 국제선 후 VASCO 등 국내선(SGN-VCS)으로 이어지는 일정이 일반적입니다. 국내선은 소형기·좌석이 적어 조기 예약이 필요합니다. 렌터카·픽업·제휴 링크는 콘다오 공항(VCS) 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 검색어를 맞춰 주세요.'
  },
  상하이: {
    primaryIatas: ['PVG', 'SHA'],
    preferredLinkIata: 'PVG',
    kind: 'multi',
    confidence: 'high',
    rationale: '푸둥(PVG)·훙차오(SHA) — slug shanghai와 동일',
    searchHintIatas: ['PVG', 'SHA'],
    bannerNote:
      '상하이는 인천→푸둥(PVG) 직항과 김포→훙차오(SHA) 단거리 노선이 흔합니다. 시내 접근성은 훙차오가 좋으나 항공편 선택지는 푸둥이 더 많습니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 그 공항에 맞춰 주세요.'
  },
  '소코트라 섬': {
    primaryIatas: ['SCT', 'AUH'],
    preferredLinkIata: 'SCT',
    tripFlightArrivalIata: 'AUH',
    kind: 'multi',
    confidence: 'high',
    rationale: 'AUH 국제선·전세기 후 SCT 최종 — slug socotra와 동일',
    bannerNote:
      '소코트라는 인천→아부다비(AUH) 국제선 도착 후, 아부다비에서 주 1~2회 운항하는 정부 인가 전세기(주로 Air Arabia)로 소코트라(SCT)에 들어갑니다. 스카이스캐너·Trip.com 등 항공권 검색은 AUH까지, SCT 구간은 현지 투어 에이전시를 통해서만 발권됩니다. 렌터카·픽업·섬 일정은 SCT 도착 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 맞춰 주세요.'
  },
  '마셜 제도': {
    primaryIatas: ['MAJ', 'GUM', 'HNL'],
    preferredLinkIata: 'MAJ',
    tripFlightArrivalIata: 'HNL',
    kind: 'multi',
    confidence: 'high',
    rationale: 'GUM·HNL 경유 아일랜드 호퍼 후 MAJ — slug marshall-islands와 동일',
    bannerNote:
      '마셜 제도(마주로)는 인천→호놀룰루(HNL) 또는 괌(GUM) 국제선 도착 후, 유나이티드항공 아일랜드 호퍼(Island Hopper)로 마주로(MAJ)에 들어갑니다. Trip.com 등 항공권 검색은 HNL(또는 일정에 맞게 GUM)까지 — MAJ 구간은 아일랜드 호퍼 예약이 필요합니다. 렌터카·픽업·섬 일정은 MAJ 도착 기준입니다. 티켓의 최종 도착 코드를 확인한 뒤 제휴 링크도 맞춰 주세요.'
  },
};
