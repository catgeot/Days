/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '테마여행',
  sessionNo: 51,
  sessionPhase: '인근 명소 거리순',
  branch: 'cursor/korea-theme',
  previewPath: '/korea',
  qaShareSlug: 'korea-theme',
};

/** @returns {string} 예: Cloud 작업 규칙 #1, 이어하기·Preview 고정 */
export function cloudPreviewSessionLabel(project = cloudPreviewProject) {
  return `${project.title} #${project.sessionNo}, ${project.sessionPhase}`;
}

/**
 * @type {{ id: string, session: string, title: string, detail: string, at: string }[]}
 * 최신이 배열 앞.
 */
export const cloudPreviewWorkLog = [
  {
    id: '2026-08-07-korea-theme-festival-nearby-distance-sort',
    session: '테마여행 #51, 인근 명소 거리순',
    title: '인근 명소를 축제장 가까운 순으로',
    detail:
      '축제 상세 「인근 명소」를 축제장 좌표 기준 가까운 순으로 정렬하고 km 배지를 붙였습니다. Preview /korea 축제 상세에서 목록이 가까운 순·거리 표기인지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-festival-nearby-myeongso-label',
    session: '테마여행 #50, 인근 명승지 라벨 정리',
    title: '축제 상세 인근 라벨을 명소로',
    detail:
      '축제 상세 본문의 「인근 명승지」·「○○ 명승지 더보기」·상세 eyebrow를 GATEO 선정 명소 목록에 맞게 「인근 명소」·「○○ 명소 더보기」로 바꿨습니다. Preview /korea 축제 상세에서 라벨과 목록이 맞는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-06-korea-theme-scenic-nearby-list',
    session: '테마여행 #49, 내주변 목록',
    title: '내 주변 명소·명승·관광지 거리순',
    detail:
      '축제홈과 같이 「내 주변」으로 GPS를 받아 80km 안 GATEO 선정 명소·국가유산 명승·TourAPI 관광지를 가까운 순으로 나열합니다. Preview에서 위치 허용→거리 배지·건수 문구·닫기 후 권역 칩 복귀를 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-gateo-myeongso-expand',
    session: '테마여행 #48, 명소목록',
    title: 'GATEO 선정 명소 라벨·목록 확장',
    detail:
      '큐레이션 라벨을 「GATEO 선정 명소」로 바꾸고, hub exact+TourAPI contentId 검증으로 34곳→97곳으로 확장했습니다(수도권17·강원11·충청9·전라20·경상29·제주11). Preview에서 선정 명소 섹션 제목·권역별 목록·상세 모달을 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-cha-heritage-detail',
    session: '테마여행 #47, 국가유산 명승 상세 보강',
    title: '지정 명승 상세·사진 갤러리 보강',
    detail:
      '국가 지정 명승 상세에 지정번호·한자명·지정일·분류·면적·소유·관리와 국가유산청 사진 여러 장을 넣었습니다. Preview에서 국가유산 명승 하나를 열어 개요 아래 메타와 사진 N장을 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-cha-heritage-scenic',
    session: '테마여행 #46, 국가유산 명승 목록',
    title: '국가유산청 지정 명승 141곳 연결',
    detail:
      '네이버·국가유산청 OpenAPI 명승(종목코드 15)을 동기화해 `/korea/theme/scenic`에 「국가유산 명승」목록을 넣었습니다. GATEO 선정은 유지하고, TourAPI 관광지는 아래 보조 목록으로 둡니다. Preview에서 권역 칩 숫자·명승 상세(개요·사진·국가유산청 링크)를 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-nearby-hub-scenic-home',
    session: '테마여행 #45, 인근 여행지 hub 명승 홈',
    title: '인근 여행지를 시·군 명승 홈으로',
    detail:
      '명승 상세 「인근 여행지」(보령·공주·태안 등)가 같은 충남 목록으로 뭉개지던 문제를 고쳤습니다. 각 도시마다 hub 필터가 붙은 명승 홈으로 이동하고, 선정 명승·관광지 목록도 그 시·군 주소로 거릅니다. Preview에서 명승 상세→인근 보령/공주가 서로 다른 목록인지 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-mooni-inplace',
    session: '테마여행 #44, 무니에게 묻기',
    title: '무니 채팅을 명승 상세에서 바로 열기',
    detail:
      '「무니에게 묻기」가 지구본 홈으로 갔다가 채팅이 뜨던 흐름을 없앴습니다. 명승 상세 위에서 바로 채팅 모달이 열리고, 닫으면 다시 그 상세로 돌아갑니다. Preview 명승 상세→무니→닫기를 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-photo-swipe',
    session: '테마여행 #43, 명승 사진 복구·스와이프',
    title: '명승 본문 사진 복구·쓸어 넘기기',
    detail:
      '명승 본문 Tour 사진은 유지합니다(#42에서 잘못 제거한 부분 복구). 사진 리스트·대표 사진을 누르면 확대보기에서 좌우 쓸어 넘기기·화살표로 볼 수 있습니다. 장소 카드 링크만 무니·유튜브로 대체한 상태입니다. Preview 명승 상세에서 사진·스와이프를 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-nearby-mooni-videos',
    session: '테마여행 #42, 명승 인근 여행지',
    title: '인근 여행지→명승 홈 · 무니·유튜브',
    detail:
      '명승 상세 「인근 여행지」(보령·공주·태안 등)가 장소 카드가 아니라 해당 지역 명승지 홈으로 갑니다. 본문 「장소 카드 보기」만 무니·유튜브로 바꿨습니다(본문 Tour 사진은 #43에서 복구). Preview에서 명승 상세→인근·무니·영상을 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-place-label',
    session: '테마여행 #41, 목록 시도·도시 표기',
    title: '명승 목록을 시도·도시로 표기',
    detail:
      '목록 이름 옆 표기를 「수도권 · 서울」「강원 · 강원」같은 권역·시도 대신 「강원 춘천」「경북 경주」「서울 종로」처럼 시도+도시로 바꿨습니다. Preview `/korea/theme/scenic`에서 선정 명승·관광지 목록을 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-stay-tna-region-keyword',
    session: '테마여행 #40, 숙소·투어 지역 검색',
    title: '숙소·투어 링크를 지역명으로',
    detail:
      '주변 관광지·맛집 등 상세의 숙소·투어 CTA가 관광지 이름(예: 생명건강 과학원)이 아니라 주소의 시·군(예: 춘천)으로 MRT 검색합니다. Preview에서 명승→주변 관광지→숙소·투어 문구와 검색 결과를 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-region-chip-total',
    session: '테마여행 #39, 페이지 최적화',
    title: '권역·시도 칩에 지역 전체 수량',
    detail:
      '최상단 권역(수도권·강원…)과 시도 칩 숫자는 종목(자연·인문) 필터와 무관한 해당 지역 전체 관광지 수입니다. 종목 칩만 필터된 수량을 보여 줍니다. Preview에서 자연/인문을 바꿔도 권역 칩 숫자가 그대로인지 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-list-sort',
    session: '테마여행 #38, 페이지 최적화',
    title: '관광지 목록 · 이미지 우선·수정일순',
    detail:
      '명승 DB 관광지 목록을 대표 이미지가 있는 항목 먼저, 그다음 TourAPI 수정일(최신순)으로 나열합니다. 이미지가 없는 항목은 뒤에 이어집니다. Preview `/korea/theme/scenic`에서 강원 등 목록 상단에 사진 있는 최근 수정 관광지가 오는지 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-06-korea-theme-scenic-catalog-heading',
    session: '테마여행 #37, 페이지 최적화',
    title: '지역 대분류에 맞춘 관광지 명칭·전체 수량',
    detail:
      '상단 권역·시도를 바꾸면 목록 제목이 「전국 관광지」가 아니라 「강원도 관광지」「수도권 관광지」처럼 맞춰집니다. 옆 수량은 종목 필터와 무관한 해당 지역 전체 건수입니다. Preview `/korea/theme/scenic`에서 강원·제주·수도권→서울을 눌러 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-05-korea-theme-scenic-chip-counts',
    session: '테마여행 #36, 페이지 최적화',
    title: '필터 칩에 항목 수 표시',
    detail:
      '명승 권역·시도·종목(대·소분류) 칩 안에 해당 필터의 관광지 건수를 표시합니다. 코스 지역 칩에도 건수를 붙였습니다. Preview `/korea/theme/scenic`에서 칩 숫자와 목록 「N곳」이 맞게 줄어드는지 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-scenic-region-inherit',
    session: '테마여행 #35, 페이지 최적화',
    title: '권역 대분류 → 시도 소분류 승계',
    detail:
      '명승 권역(수도권·충청 등) 아래에 속한 시도 칩(서울·인천·경기…)을 두고, 선정 명승·전국 관광지·종목 필터가 상위 권역을 승계해 좁혀집니다. Preview에서 수도권→서울→자연 순으로 목록이 줄어드는지 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-scenic-page-optimize',
    session: '테마여행 #35, 페이지 최적화',
    title: '명승 지역칩·관광공사 종목 분리',
    detail:
      '명승 권역 칩에서 「전체」를 빼고 기본 권역(수도권)을 씁니다. 전국 관광지 목록은 한국관광공사 TourAPI 대분류(자연·인문) 아래 소분류(자연관광지·역사관광지 등) 칩으로 걸러 봅니다. Preview `/korea/theme/scenic`에서 권역·대분류·소분류 전환과 목록 건수를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-two-top-cross-nav',
    session: '테마여행 #34, 투톱 크로스 네비',
    title: '축제↔명승 상호 네비 · 상세 크로스 정합',
    detail:
      '축제 헤더에 「명승」칩을 상시 노출하고, 축제 상세에도 숙소·투어·패키지 매칭 CTA를 붙였습니다. `/korea/theme/top10|regions|packages`는 명승으로 리다이렉트하며, 명승 모달은 레거시 10대·방방곡곡 딥링크를 숨깁니다. Preview에서 `/korea`↔명승 왕복·축제 상세 레일·레거시 URL 리다이렉트를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-two-top-ia',
    session: '테마여행 #33, 페이지 정리',
    title: '축제·명승 투톱 · 탑레벨 정리',
    detail:
      '제품명을 「한국의 명승」으로 바꾸고 축제(`/korea`)·명승(`/korea/theme/scenic`) 투톱으로 잠갔습니다. 10대 절경·방방곡곡·패키지(·코스)는 랜딩 타일에서 숨겼고, 패키지·숙소·투어는 상세 매칭으로만 이어집니다. 홈 진입·명승 헤더「축제」칩·플랜 §1.0을 Preview에서 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-mrt-package-destinations',
    session: '테마여행 #32, MRT 상품지',
    title: 'MRT 상품 있는 여행지 큐레이션',
    detail:
      '마이리얼트립 LIVE 검색으로 국내 패키지·에어텔이 있는 여행지만 `/korea/theme/packages`에 올렸습니다(제주·여수·울릉도·강원·순천·홍도·흑산·백령도). 경주는 상주 오탐으로 제외했고, 부산(출발지 해외패키지)도 넣지 않았습니다. 명승·테마 상세의 패키지 CTA도 같은 hub 매핑을 씁니다. Preview 테마→패키지 상품에서 목록과 mylink를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-course-festival',
    session: '테마여행 #31, 코스↔축제',
    title: '코스↔축제 양방향 연결',
    detail:
      '축제 상세에 시도 기준 「인근 여행코스」목록·코스 모달을 붙이고, 코스 상세에는 festivalWindow 캐시로 「인근 축제」·`/korea?festival=` 딥링크를 연결했습니다. type25는 locationBasedList가 비는 경우가 많아 areaBasedList+거리 정렬을 씁니다. Preview /korea 축제 상세와 /korea/theme/courses 코스 상세에서 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-nearby-leisure-culture',
    session: '테마여행 #30, 레포츠·문화 주변',
    title: '축제·명소 주변 레포츠·문화(API)',
    detail:
      '축제 상세·테마 상세 모달에 TourAPI 레포츠(type28)·문화시설(type14) 주변 목록을 locationBasedList로 연결했습니다. 전량 DB는 하지 않았고, 레포츠/문화 상세에서는 hub 대신 DB 주변 관광지로 크로스합니다. Preview /korea 축제 상세와 명승 상세에서 「주변 레포츠」「주변 문화」를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-festival-scenic-addr-fallback',
    session: '테마여행 #29, 축제 본문 인근 여행지',
    title: '인근 명승지 addr1 폴백·Preview 재배포',
    detail:
      '축제 목록에 areaCode가 비어 「인근 명승지」가 안 뜨던 문제를 addr1→시도 감지로 고쳤습니다. hub→장소카드는 없습니다. Preview /korea 축제 상세에서 「인근 명승지」목록과 「○○ 명승지 더보기」를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-festival-scenic-link',
    session: '테마여행 #28, 맛집 주변 API',
    title: '축제 인근을 명승지로',
    detail:
      '축제 상세의 「인근 여행지」hub→장소카드 연결을 없애고, 축제 권역의 GATEO 명승 목록과 「○○ 명승지 더보기」(/korea/theme/scenic?region=…)로 바꿨습니다. Preview /korea 축제 상세에서 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-food-cross-attractions',
    session: '테마여행 #28, 맛집 주변 API',
    title: '맛집 상세·주변 관광지 크로스',
    detail:
      '맛집 상세에서 hub「인근 여행지」를 빼고 DB 주변 관광지 목록을 보여 맛집↔관광지 크로스 확인이 되게 했습니다. Preview /korea 축제 → 주변 맛집 → 상세에서 「주변 관광지」를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-nearby-restaurants',
    session: '테마여행 #28, 맛집 주변 API',
    title: '축제·명소 주변 맛집(API)',
    detail:
      '축제 상세·테마 상세 모달에 TourAPI 맛집(type39) 주변 목록을 locationBasedList로 연결했습니다. 전량 DB 적재는 하지 않았고, Edge에 짧은 TTL 캐시를 둡니다. Preview /korea 축제 상세와 명승 상세에서 「주변 맛집」을 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-homepage-label',
    session: '테마여행 #26, 축제 주변 관광지',
    title: '상세 홈페이지를 짧은 라벨로',
    detail:
      '테마 상세 모달 홈페이지에 긴 URL 대신 「국가유산청」처럼 짧은 라벨을 보여 줍니다. 링크는 그대로 열립니다. Preview에서 자규루 및 관풍헌 등 상세의 홈페이지 표기를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-festival-nearby-locality',
    session: '테마여행 #26, 축제 주변 관광지',
    title: '주변 목록 지역을 읍·면·동·리로',
    detail:
      '주변 관광지 부제를 「강원」같은 권역 대신 주소의 시·군·읍·면·동·리(예: 영월군 영월읍 방절리)로 표기합니다. Preview /korea 축제 상세 목록에서 위치를 가늠할 수 있는지 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-festival-nearby-filter',
    session: '테마여행 #26, 축제 주변 관광지',
    title: '주변 관광지 선별(화장실·일반교회 제외)',
    detail:
      '축제 주변 관광지에서 화장실·일반 교회/성당을 제외하고, 성지·문화재·성공회·제일교회 등 명소 표기가 있는 종교 시설만 남깁니다. Preview /korea 축제 상세 「주변 관광지」에서 강릉교회·해변 화장실이 안 보이는지 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-festival-nearby',
    session: '테마여행 #26, 축제 주변 관광지',
    title: '축제 상세·주변 관광지(DB)',
    detail:
      '축제 상세 안내 탭에 축제장 좌표 기준 tourapi_attraction 주변 관광지(반경 8km) 목록을 연결했습니다. 항목을 누르면 기존 테마 상세 모달이 열립니다. 축제 지도·칩 로직은 손대지 않았습니다. Preview /korea에서 축제 하나를 열어 「주변 관광지」를 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-attraction-db',
    session: '테마여행 #23, 국내여행지 DB',
    title: 'type12 Supabase·scenic DB 목록',
    detail:
      'TourAPI 관광지(type12)를 tourapi_attraction에 적재하고 주 1회 sync 스크립트로 갱신합니다. /korea/theme/scenic은 GATEO 선정 레일 + 전국 관광지(DB) 목록을 보여 줍니다. 맛집 전량 DB·축제 지도 리팩터는 하지 않았습니다. Preview에서 명승 페이지 목록·상세 모달을 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-product-flow',
    session: '테마여행 #25, 제품 흐름 재잠금',
    title: '명승 본선·DB·보류 모듈 플랜',
    detail:
      '국내 관광지(type12)를 DB에 두고 주 1회 갱신하는 흐름으로 플랜을 잠갔습니다. 명승이 본선이고, 축제 주변 관광지·맛집 API·MRT 상품지 큐레이션·코스 연동을 이어갑니다. 10대 절경·방방곡곡은 보류입니다. 다음 세션은 「테마여행 #23, 국내여행지 DB」— 일지 핸드오프·목록 sync≈시도 17회·detail 전수 금지.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-scenic-tourapi-probe',
    session: '테마여행 #22, 명승지 위치 정보',
    title: '명승 TourAPI 규모·위치 프로브',
    detail:
      'TourAPI 관광지(type12) 전국 약 7,294건·목록에 mapx/mapy 좌표가 있음을 LIVE로 확인했습니다. 이후 #25에서 DB·주간 sync·명승 본선으로 제품 흐름을 재잠갔습니다. /korea/theme/scenic 현재는 curated 34곳입니다.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-nav-back',
    session: '테마여행 #21, 테마간 이동 개선',
    title: '크로스 이동 후 이전 테마·상세 복귀',
    detail:
      '상세 모달에서 다른 테마·축제·코스로 이동하면 「이전」과 이전 상태 표기(예: 보성녹차밭 · 10대 절경)로 직전 상세까지 돌아갑니다. 목록은 ?spot=으로 모달을 복원합니다. /korea/theme/top10에서 보성녹차밭 → 축제/명승 등 → 이전을 눌러 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-05-korea-theme-detail-stack',
    session: '테마여행 #20, 본문 가독성 개선',
    title: '상세 본문 소제목 아래 배치',
    detail:
      '테마 상세 모달에서 개요·주소·이용 시간 등 소제목과 본문이 좌우로 갈라지던 레이아웃을, 소제목 아래 본문이 오는 세로 배치로 바꿨습니다. 좁은 모바일에서 본문 폭이 넓어집니다. /korea/theme/top10에서 한라산 등 모달을 열어 확인해 주세요.',
    at: '2026-08-05',
  },
  {
    id: '2026-08-04-korea-theme-cross-rail',
    session: '테마여행 #19, 크로스 레일',
    title: '상세 모달 하단 크로스 레일',
    detail:
      '절경·명승·방방곡곡 상세 모달 아래에 속한 테마·같은 도시·인근·숙소/투어·축제/코스·패키지 연결을 붙였습니다. 축제·코스·방방곡곡은 ?area=로 해당 시도를 엽니다. /korea/theme/top10에서 한라산 모달을 스크롤해 레일을 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-cross-links',
    session: '테마여행 #18, 테마 연결',
    title: '테마 크로스 연결 전략·매처',
    detail:
      '절경·명승·방방곡곡이 숙소·투어·축제·코스·인근 hub와 같은 조인키(hub/area/좌표)로 맞물리도록 전략(§2.5)과 매처를 잠갔습니다. 모달 하단 레일 UI는 다음 세션(#19). Preview 동작은 #17과 동일합니다.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-detail-fill',
    session: '테마여행 #17, 상세 정보 전수보강',
    title: 'top10·방방곡곡 Tour 상세 전수보강',
    detail:
      '10대 절경 contentId 10/10, 명승 34/34 유지, 방방곡곡은 Tour SSOT로 약 76% LIVE 연결(나머지는 GATEO 안내+장소 카드). /korea/theme/top10 · scenic · regions에서 모달 개요·사진이 비지 않는지 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-scenic-contentid',
    session: '테마여행 #16, 명승 contentId 보강',
    title: '명승 34곳 contentId 전부 채움',
    detail:
      'scenic overrides null 20곳을 TourAPI searchKeyword+detailCommon으로 검증해 채웠습니다(34/34). /korea/theme/scenic에서 경복궁·남이섬·수원화성 등 모달에 Tour 개요·사진이 뜨는지 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-spot-modal',
    session: '테마여행 #15, 테마 상세 모달',
    title: '10대·명승·방방곡곡 → 상세 모달',
    detail:
      '목록 클릭이 Place로 바로 가지 않고 상세 모달(개요·주소·이용·사진)을 엽니다. contentId가 있으면 Tour type12 LIVE, 없으면 GATEO 안내만. 모달 안 「장소 카드 보기」가 2차 CTA입니다. /korea/theme/top10 · scenic · regions에서 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-chips',
    session: '테마여행 #14, 코스 지역칩 정리',
    title: '0건 숨김 · 소량은 기타 칩',
    detail:
      '여행코스 지역칩에서 0건 권역은 숨기고, 1~2건 소량 권역은 「기타」 한 칩으로 묶었습니다(3건 이상만 단독). /korea/theme/courses에서 서울·제주가 없고 기타에 충북·경북 등이 묶이는지 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-copy-short',
    session: '테마여행 #14, 코스 소개 문구',
    title: '여행코스 소개 문구 간략화',
    detail:
      'TourAPI 여행코스 안내를 「한국관광공사 공개 여행코스입니다.」한 줄로 줄였습니다. /korea/theme/courses 상단 문구를 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-modal-chrome',
    session: '테마여행 #14, 모달 전면·하단 버튼',
    title: '모달 전면 + 사방 패딩·위로·닫기',
    detail:
      '모바일에서 모달이 화면 거의 전체를 쓰고, 사방에 얇은 패딩으로 뒤 목록이 보이게 했습니다. 하단에 「위로」「닫기」 버튼을 넣었습니다. /korea/theme/courses에서 코스를 열어 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-modal',
    session: '테마여행 #14, 코스 상세 모달',
    title: '여행코스 목록·상세 모달 분리',
    detail:
      '코스를 펼쳐 아래에 붙이던 방식을 없애고, 목록 클릭 시 모달로 개요·사진·구간을 보여 줍니다. 닫기·배경·Esc로 목록으로 돌아갑니다. /korea/theme/courses에서 강원 코스를 눌러 모달·닫기를 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-magazine',
    session: '테마여행 #13, 여행코스 보강',
    title: '여행코스 매거진형 전폭 사진',
    detail:
      '옆 작은 썸네일을 없애고, 각 코스 카드 상단에 본문 넓이(16:9) 사진을 둔 뒤 제목이 이어지게 바꿨습니다. 펼치면 구간도 전폭 사진→구간명→설명 순입니다. /korea/theme/courses에서 강원 코스 카드 레이아웃을 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-media',
    session: '테마여행 #13, 여행코스 보강',
    title: '여행코스 사진(대표·구간) 표시',
    detail:
      '여행코스 펼침에 TourAPI 대표 사진·구간별 사진·갤러리 스트립을 넣었습니다. 목록 썸네일도 키웠습니다. 공식 API에 동영상은 없어 사진은 관광공사 이미지만 씁니다. /korea/theme/courses에서 강원 코스를 펼쳐 구간 사진을 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-04-korea-theme-courses-scenic',
    session: '테마여행 #12, 여행코스·명승확장',
    title: '여행코스 모듈 + 명승 34곳',
    detail:
      'TourAPI contentType 25 여행코스 페이지(/korea/theme/courses)를 넣었습니다. 시도 칩→코스 목록→개요·구간 펼침입니다. 명승지는 TourAPI 키워드(12) 검증으로 14곳을 더해 34곳입니다. 테마 랜딩에 「여행코스」 타일·명승 목록·강원 등 코스 시도를 확인해 주세요.',
    at: '2026-08-04',
  },
  {
    id: '2026-08-03-korea-theme-seo-qa',
    session: '테마여행 #10, SEO·QA링크',
    title: '테마 SEO·sitemap · /qa/korea-theme',
    detail:
      '테마 랜딩·하위 페이지 Helmet을 유지하고, sitemap·vite에 /korea/theme·top10·scenic·regions·packages를 넣었습니다. 공유는 https://www.gateo.kr/qa/korea-theme → Preview /korea/theme 입니다. 우측 작업 로그의공유 링크·각 테마 URL을 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-festival-link',
    session: '테마여행 #9, 축제 연결',
    title: '테마↔축제 복귀 (?from=theme)',
    detail:
      '테마 랜딩의 축제 타일·헤더「축제」가 /korea?from=theme으로 이어집니다. 축제 헤더에 「← 테마여행으로」 한 줄이 보이고, 누르면 /korea/theme으로 돌아옵니다. 홈「국내」·/korea 단독 진입에는 한 줄이 없습니다. 칩·지도·필터는 그대로입니다.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-packages',
    session: '테마여행 #8, 패키지',
    title: '패키지 MRT CTA (제주·홈·경주)',
    detail:
      '/korea/theme/packages에 제주 검색·패키지 홈·경주 검색 CTA를 올렸습니다. 누르면 마이리얼트립이 새 탭으로 열립니다. 가짜 상품 카드는 없습니다. 테마→패키지 상품에서 세 링크와 mylink를 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-regions',
    session: '테마여행 #7, 방방곡곡',
    title: '방방곡곡 시도→명소 목록→place',
    detail:
      '시도 칩을 고르면 hub 요약이 아니라 그 지역 큐레이션 명소가 리스트로 나옵니다. 서울이면 경복궁·남산타워 등 항목을 누르세요. place에서 뒤로 오면 목록으로 돌아옵니다.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-place-return',
    session: '테마여행 #6, 뒤로복귀',
    title: 'PlaceCard→테마 목록 navigate(returnTo)',
    detail:
      '테마·명승 목록에서 place로 들어간 뒤 뒤로를 누르면 목록으로 돌아가도록 고쳤습니다. 이전 경로가 없을 때 startsWith 오류로 버튼이 죽던 문제도 함께 막았습니다. /korea/theme/top10·scenic → 항목 → place → 뒤로를 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-scenic',
    session: '테마여행 #5, 명승지',
    title: '명승지 curated 20 + 권역 필터',
    detail:
      '경복궁·하회·채석강·천지연 등 20곳을 /korea/theme/scenic에 올렸습니다. 권역(수도권·강원·충청·전라·경상·제주) 필터와 place 이동을 확인해 주세요. PlaceCard 뒤로복귀 핫픽스는 다음 세션입니다.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-top10',
    session: '테마여행 #4, 10대 절경',
    title: 'GATEO 선정 10대 절경 페이지',
    detail:
      '한라산·성산·설악·순천만·주상절리·해운대·불국사·내장산·보성·통영 10곳을 /korea/theme/top10에 올렸습니다. 항목을 누르면 place로 가고, 뒤로 오면 이 목록으로 돌아옵니다. 「GATEO 선정」 고지를 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-modules',
    session: '테마여행 #3, 모듈 SSOT',
    title: '모듈 SSOT·랜딩 타일 5개',
    detail:
      '축제·10대 절경·명승지·방방곡곡·패키지 타일을 order SSOT로 연결했습니다. 축제는 /korea, 나머지는 빈 페이지 라우트입니다. Preview /korea/theme에서 타일 순서·이동을 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-home-label',
    session: '테마여행 #2, 셸 라우트',
    title: '홈 진입 버튼 문구',
    detail:
      '홈 진입 링크 라벨을 「한국의 테마 여행」으로 바꿨습니다. 로고 아래에서 축제 링크와 함께 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-theme-shell',
    session: '테마여행 #2, 셸 라우트',
    title: '/korea/theme 셸·홈 진입',
    detail:
      '테마여행 랜딩 껍데기와 홈「테마여행」링크, /qa/korea-theme 공유 링크를 넣었습니다. Preview에서 /korea/theme이 뜨고 홈→테마여행→홈으로가 되는지 확인해 주세요. 모듈 타일은 다음 세션입니다.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-korea-chip-icons',
    session: '축제 페이지 #2, 칩 아이콘 통일',
    title: '시간·지역·테마 상하 칩 아이콘 통일',
    detail:
      '대분류(지금·지역·테마)와 하위 칩이 같은 아이콘을 쓰도록 맞췄습니다. 시간은 달력, 지역은 핀, 테마는 스파클입니다. /korea에서 대분류를 눌러 하위 목록이 같은 아이콘인지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-il-highlight-fill',
    session: '지구본 나라 목록 #6, 이스라엘 하이라이트 fill',
    title: '이스라엘 선택 시 빈 외곽(halo) 수정',
    detail:
      '중동에 넣은 뒤 이스라엘을 고르면 분쟁 경계 halo가 fill보다 크게 남아 안이 비어 보였습니다. halo를 비분쟁 국경에 맞추고, 소권역 바 중복 sync로 fill이 지워지던 것도 막았습니다. 홈→휴양→중동→이스라엘에서 보라 fill이 국경 안에 채워지는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-me-israel-jordan',
    session: '지구본 나라 목록 #5, 중동 이스라엘·요르단',
    title: '이스라엘·요르단을 아시아 중동으로',
    detail:
      '아프리카「북아프리카·레반트」에 있던 이스라엘·요르단을 아시아「중동」으로 옮겼습니다. 북아프리카 칩 라벨도 정리했습니다. 홈→도시(아시아)→중동에서 이스라엘·요르단이 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-mid-hscroll-full',
    session: '지구본 나라 목록 #4, 중분류 좌우 스크롤',
    title: '중분류 스크롤 바를 화면 거의 전체 폭으로',
    detail:
      '중분류 바가 좌측 절반에 묶이던 것을 뷰포트 폭으로 풀었습니다. 나라·카테고리 칩은 왼쪽 그대로입니다. 홈(모바일)→도시에서 중분류 바가 화면 가로로 넓게 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-mid-hscroll',
    session: '지구본 나라 목록 #4, 중분류 좌우 스크롤',
    title: '모바일 중분류 칩 좌우 스크롤 복구',
    detail:
      '중분류 칩이 가로로 늘어나 잘리던 문제를 min-w-0·너비 고정으로 고쳤습니다. 홈→도시(유럽)에서 서유럽~소국·공국 칩을 좌우로 밀어 끝까지 보이는지 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-03-globe-mid-microstates',
    session: '지구본 나라 목록 #3, 중분류·소국 재편',
    title: '중분류를 직관 권역으로 나누고 소국·공국 분리',
    detail:
      '유럽은 서유럽·영국·남유럽·북유럽·중동유럽·소국·공국·북극으로 나누고, 아시아도 동남아/남아시아·중동/중앙아시아로 쪼갰습니다. 중분류 안 나열은 인접국 연쇄를 유지합니다. 홈→도시(유럽)에서 소국·공국 칩과 흐름을 확인해 주세요.',
    at: '2026-08-03',
  },
  {
    id: '2026-08-02-country-scroll-top',
    session: '지구본 나라 목록 #2, 스크롤 상단 시작',
    title: '나라 리스트 스크롤을 상단에서 시작',
    detail:
      '나라가 많아 스크롤이 생길 때 기본 위치를 하단이 아니라 상단으로 맞췄습니다. 짧은 목록의 하단 고정 배치는 그대로입니다. 홈→권역→중분류에서 긴 나라 목록이 위에서부터 보이고 아래로 스크롤되는지 확인해 주세요.',
    at: '2026-08-02',
  },
  {
    id: '2026-08-02-neighbor-chain',
    session: '지구본 나라 목록 #1, 인접국 연쇄 정렬',
    title: '중분류 나라 목록을 인접국 연쇄로 정렬',
    detail:
      '중분류 나라 목록을 인기·시드 순이 아니라 좌표 기준 인접국 연쇄로 이어 보이게 바꿨습니다. 홈→권역→중분류에서 목록이 이웃 나라끼리 이어지는지 확인해 주세요.',
    at: '2026-08-02',
  },
];
