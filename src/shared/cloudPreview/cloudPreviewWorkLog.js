/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '테마여행',
  sessionNo: 87,
  sessionPhase: '네이버 버튼 위치',
  branch: 'cursor/scenic-food-naver-link-b366',
  previewPath: '/korea/theme/scenic',
  qaShareSlug: 'scenic-food-naver',
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
    id: '2026-08-09-scenic-naver-pos-87',
    session: '테마여행 #87, 네이버 버튼 위치',
    title: '개요 아래·주소 위로 이동',
    detail:
      '네이버 상세정보 보기 버튼을 개요 바로 아래·주소 위로 옮겨, 주소·문의·영업시간 흐름을 끊지 않게 했습니다. Preview에서 맛집 상세 순서를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-naver-copy-86',
    session: '테마여행 #86, 네이버 문구·위치',
    title: '네이버 상세정보 보기 · 전화 아래',
    detail:
      '버튼 문구를 「네이버 상세정보 보기」로 바꾸고, 상세 본문에서 전화번호 바로 아래로 옮겼습니다. Preview에서 맛집 상세 전화→네이버 칩 순서를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-naver-compact-85',
    session: '테마여행 #85, 네이버 버튼 컴팩트',
    title: '네이버로 이동 버튼 축소',
    detail:
      '네이버 이동 버튼을 한 줄 칩(N · 네이버로 이동 · 외부아이콘)으로 줄였습니다. Preview에서 맛집 상세 본문 버튼 크기를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-naver-btn-84',
    session: '테마여행 #84, 네이버 이동 버튼',
    title: '네이버로 이동 CTA 버튼',
    detail:
      '맛집 상세의 네이버 링크를 텍스트 링크에서 「N · 네이버로 이동 · 새 탭에서 네이버 검색」 CTA 버튼으로 바꿨습니다. Preview에서 주변 맛집 상세의 초록 버튼을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-food-naver-83',
    session: '테마여행 #83, 맛집 네이버 링크',
    title: '맛집 상세 → 네이버에서 보기',
    detail:
      '명승·축제 연계 맛집 상세 본문에 지역+상호 네이버 검색 링크(「네이버에서 보기」)를 넣었습니다. Preview에서 명승 상세→주변 맛집→상세 본문의 네이버 링크를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-08-scenic-area-index-82',
    session: '테마여행 #82, 선정 hub 시도 색인',
    title: '보강 hub → 시도 색인 · 분류칩 복구',
    detail:
      '선정 명소가 있는데 koreaAreaCodes에 없던 hub 30곳을 시도 색인에 넣었습니다(경기·인천 강화·제주 서귀포 등). 수도권→경기 칩에서 김포·고양·안양 등 여행지 소분류가 보입니다. hub 보강 큐 사용법에 색인 필수 단계를 고정했습니다.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01b-81',
    session: '테마여행 #81, 빈 hub 명소 보강',
    title: '안양·부천·남양주·포천·시흥 GATEO 선정 전수',
    detail:
      '큐 R01 잔여 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(안양6·부천6·남양주6·포천6·시흥6 · 전체 192·이미지 192). Preview에서 /korea/theme/scenic?hub=anyang · ?hub=bucheon · ?hub=namyangju · ?hub=pocheon · ?hub=siheung 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01a-80',
    session: '테마여행 #80, 빈 hub 명소 보강',
    title: '김포·고양·광명·하남·안성 GATEO 선정 전수',
    detail:
      '큐 R01 워커A 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(김포7·고양7·광명7·하남7·안성6 · 전체 162·이미지 162). Preview에서 /korea/theme/scenic?hub=gimpo · ?hub=goyang · ?hub=gwangmyeong · ?hub=hanam · ?hub=anseong 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-full-79b',
    session: '테마여행 #79, 빈 hub 명소 보강',
    title: '선정=hub 명소 전수 · 보강 hub 채움',
    detail:
      'draft 기본 상한(per-hub=4)을 없애 hub attractions 전수로 바꿨습니다. 이미 보강한 양양·평창·남해·안산·강화도 남은 명소를 모두 넣어 각 hub 전수(양양7·평창7·남해4·안산7·강화7)입니다(전체 128·이미지 128). Preview에서 해당 hub 선정 건수를 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01-79',
    session: '테마여행 #79, 빈 hub 명소 보강',
    title: '안산·강화 GATEO 선정 8곳',
    detail:
      '큐 R01 앞쪽 빈 hub 안산·강화에 GATEO 선정 명소를 각 4곳 넣었습니다(전체 117·이미지 117). 안산=대부도·별망성지·성호공원·시화호, 강화=갑곶돈대·평화전망대·고려궁지·마니산. Preview에서 /korea/theme/scenic?hub=ansan · ?hub=ganghwa 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01-78',
    session: '테마여행 #78, 빈 hub 명소 보강',
    title: '평창·남해 GATEO 선정 8곳',
    detail:
      '빈 hub였던 평창·남해에 GATEO 선정 명소를 각 4곳 넣었습니다(전체 109·이미지 109). 평창=월정사·대관령 양떼목장·오대산 선재길·이효석문학관, 남해=독일마을·상주은모래비치·보리암·이순신순국공원. Preview에서 /korea/theme/scenic?hub=pyeongchang · ?hub=namhae 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-fill-tools-77b',
    session: '테마여행 #77, 명소 보강',
    title: '선정 상한 해제·권역 보강 큐',
    detail:
      'GATEO 선정 수량 상한을 없애고, 빈 hub 리포트·초안 배치·15라운드 큐를 넣었습니다. 다음 세션은 R01(평창·남해)부터 draft→generate→이미지 채움으로 이어가면 됩니다. Preview 양양 선정 5건은 그대로 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-yangyang-77',
    session: '테마여행 #77, 명소 보강',
    title: '양양 GATEO 선정 명소 5곳',
    detail:
      '양양 명승 홈에 GATEO 선정 명소가 0건이던 문제를 채웠습니다. 낙산사(속초→양양)·서피비치·하조대·낙산·설악 해수욕장을 선정 목록에 넣었습니다. Preview에서 /korea/theme/scenic?hub=yangyang 의 GATEO 선정에 5건이 보이는지 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-detail-overflow-76',
    session: '테마여행 #76, 상세 가로 스크롤',
    title: '관광지 상세 가로 롤링 방지',
    detail:
      '낙산도립공원 등 TourAPI 본문의 긴 URL·공백 없는 구간이 break-keep만으로 가로 넘침을 만들던 문제를 고쳤습니다. 상세·코스 모달에 break-words·overflow-x-hidden을 적용했습니다. Preview에서 낙산도립공원 본문 아래(입산통제 구간)를 세로 스크롤하며 좌우 롤링이 없는지 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-empty-chips-main-75',
    session: '테마여행 #75, main 병합',
    title: '빈 hub·제목 아이콘 main 반영',
    detail:
      '선정 명소 없는 시·군 분류칩 숨김·문구 정리(#70)와 명소·명승·관광지 제목 아이콘(#71)을 main에 반영했습니다. `/qa/scenic-empty-chips`는 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-section-icons-75c',
    session: '테마여행 #75, 빈 hub 선정 칩 숨김',
    title: '명소·명승·관광지 제목 아이콘',
    detail:
      '명승 홈 세 목록 제목에 아이콘을 맞춰 구분을 살짝 키웠습니다. GATEO 선정=랜드마크(호박), 국가유산 명승=산(초록), 관광지=핀(하늘). Preview에서 세 제목 시인성을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-empty-hub-copy-75b',
    session: '테마여행 #75, 빈 hub 선정 칩 숨김',
    title: '빈 hub GATEO 선정 문구 정리',
    detail:
      '선정 명소가 없을 때 「많이 찾는 인기 관광지를 골랐습니다」 소개가 빈 안내와 겹치던 부분을 없애고, 「양양에는 아직 GATEO 선정 명소가 없습니다…」처럼 안내 문구만 남겼습니다. Preview에서 양양 명승지 GATEO 선정 섹션 카피를 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-empty-hub-chips-75',
    session: '테마여행 #75, 빈 hub 선정 칩 숨김',
    title: '선정 명소 없는 시·군 — 분류칩 숨김',
    detail:
      '인근 여행지로 양양처럼 GATEO 선정 명소가 0건인 시·군 홈에 들어갔을 때, 「해당 명소가 없습니다」 안내 위에 수도권·강원·강릉 등 타지 수량 칩이 보이던 혼란을 없앴습니다. 선정 명소가 없으면 분류칩을 숨기고 아래 국가유산 명승으로 안내합니다. Preview에서 비와야 폭포→양양 명승지 → GATEO 선정에 칩이 없는지 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-nearby-search-clear-74',
    session: '테마여행 #74, 인근여행지 검색 잔존',
    title: '인근 여행지→검색 모달 잔존 해제',
    detail:
      '명승 홈에서 검색(예: 비와야)→본문→「인근 여행지 ○○ 명승지」로 이동할 때 이전 검색어·검색 모달이 남아 빈 결과가 나오던 문제를 고쳤습니다. 인근 hub 홈으로 갈 때 검색을 닫고 해당 시·군 목록이 보이게 합니다. Preview에서 비와야 검색→비와야 폭포→양양 명승지를 눌러 양양 목록이 뜨는지 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-nearby-home-scroll-73',
    session: '테마여행 #73, 인근여행지 홈 스크롤',
    title: '인근 여행지→명승 홈 상단 착지',
    detail:
      '관광지 본문 「인근 여행지」(예: 양양 명승지)로 다른 시·군 명승 홈에 들어가면 목록 중간으로 떨어지던 문제를 고쳤습니다. hub·권역·시도가 URL로 바뀔 때 본문을 맨 위로 올립니다(분류칩 클릭 위치 고정은 유지). Preview에서 비와야 폭포 등 상세→인근 양양 명승지를 눌러 홈 상단인지 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-chip-main-merge-72',
    session: '테마여행 #72, main 병합',
    title: '분류칩 스크롤 수정 main 반영',
    detail:
      '사람 QA 확인 후 PR #66·#67을 main에 반영했습니다. `/qa/scenic-chip`·`/qa/scenic-nearby`는 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 분류칩·짧은 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-chip-short-list-pad-72',
    session: '테마여행 #72, 관광지 짧은목록 여백',
    title: '관광지 1~2건일 때 칩 하단 고정',
    detail:
      '관광지 분류칩 결과기 1~2건이면 하단 스크롤 여백이 없어 칩이 화면 아래로 붙던 문제를 고쳤습니다. 짧은 목록일 때 본문 하단 패딩을 늘려 칩 위치를 유지합니다. Preview에서 종목 칩으로 목록을 아주 짧게 줄여 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-chip-scroll-pin-72',
    session: '테마여행 #72, 분류칩 스크롤 고정',
    title: '분류칩 클릭 시 스크롤 점프 방지',
    detail:
      '명소·명승·관광지 각 파트 분류칩을 누르면 위 목록 높이가 줄어 스크롤이 관광지 리스트 중간으로 튀던 문제를 고쳤습니다. 클릭한 칩 위치를 고정합니다. Preview `/korea/theme/scenic` → 수도권·서울 칩.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-nearby-category-chips-71',
    session: '테마여행 #71, 내주변 분류칩',
    title: '내 주변 — 분류칩으로 목록 분할',
    detail:
      '명승 「내 주변」에서 분류칩이 없어 긴 목록만 보이던 문제를 고쳤습니다. 선정 명소는 여행지 칩, 국가유산 명승은 경관 칩, 관광지는 종목(대·중·소) 칩으로 주변 풀을 나눠 짧게 탐색합니다. Preview `/korea/theme/scenic` → 내 주변 → 칩.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-search-region-audit-70',
    session: '테마여행 #70, 검색 권역 전수검증',
    title: '검색 권역 — hub 전수·최다 건수',
    detail:
      '국내 hub 208곳 감사: 화천형(명소·명승0·타권역 TourAPI) 35곳. 권역을 최다 건수로 골라 성주·함안·독도 오탐(보령 성주면·함안로 등)도 본 지역으로 갑니다. 「화천」「성주」「독도」검색을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-search-hwacheon-region-70',
    session: '테마여행 #70, 검색 화천 권역',
    title: '검색 — 관광지 전용 지명 권역 자동',
    detail:
      '「화천」처럼 선정 명소·명승 0건인 검색어가 수도권에 남아 관광지 0건이 되던 문제를 고쳤습니다. TourAPI 권역 건수로 강원 등으로 자동 전환됩니다. Preview에서 「화천」검색 → 관광지 목록 확인.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-07-scenic-nearby-hwacheon-69',
    session: '테마여행 #69, 내주변 관내 관광지',
    title: '내 주변 관광지 — 좌표 bbox 거리순',
    detail:
      '명승 「내 주변」관광지가 권역 목록 샘플을 거리로만 걸러 화천 관내(붕어섬 등)가 빠지던 문제를 고쳤습니다. GPS 좌표 bbox로 조회한 뒤 거리순으로 보여 주세요. Preview `/korea/theme/scenic` → 내 주변.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-home-korea-links-main-67',
    session: '테마여행 #67, 메인 반영',
    title: '홈·축제 헤더 간소화 main 병합',
    detail:
      'PR #62·#63을 main에 반영했습니다. 홈 투톱 부제 제거·축제 헤더 「명승」칩 제거를 PROD에서 확인해 주세요. `/qa/home-korea` → PROD `/korea`.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-festival-header-scenic-chip-67',
    session: '테마여행 #67, 축제 헤더 명승 버튼 제거',
    title: '축제 홈 헤더 명승 링크 제거',
    detail:
      '축제 홈(`/korea`) 헤더 우측 「명승」칩 버튼을 제거했습니다. Preview `/korea`에서 헤더에 명승 링크가 없고 검색·홈으로만 남는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-home-korea-links-subtitle-67',
    session: '테마여행 #67, 홈 투톱 부제 제거',
    title: '지구본 홈 축제·명승 버튼 부제 제거',
    detail:
      '홈 좌상단 「한국의 축제」「한국의 명승」진입 버튼에서 부제(지금 · 지도에서 찾기 / 선정 · 명승 · 관광지)를 빼고 제목만 남겼습니다. Preview 홈에서 두 버튼이 간소한지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-main-merge-63',
    session: '테마여행 #63, 메인 머지·테스트',
    title: '명승 투톱 main 병합 · PROD QA',
    detail:
      'PR #58을 main에 병합했습니다. 홈 투톱·`/korea`·`/korea/theme`→scenic·축제 상세를 로컬·PROD 번들에서 확인했습니다. `/qa/korea-theme`은 PROD 명승 경로로 연결됩니다.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-main-dual-entry',
    session: '테마여행 #66, 명승 메인 · 홈 투톱',
    title: '명승 메인 · 지구본 축제/명승 투톱',
    detail:
      '테마 허브(`/korea/theme`)를 명승 페이지로 리다이렉트하고, 지구본 홈에서 「한국의 축제」「한국의 명승」으로 각각 들어가게 고정했습니다. Preview 홈→축제·명승, `/korea/theme`→명승 이동을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-section-blurbs',
    session: '테마여행 #65, 파트 부연 설명 간략화',
    title: '명승 페이지 파트 부연 간략화',
    detail:
      'GATEO 선정·국가유산 명승·관광지 각 파트 부연을 한 문장으로 줄였습니다. Preview `/korea/theme/scenic`에서 세 목록 설명이 짧은지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-scrollbar-amber',
    session: '테마여행 #64, 분류칩 스크롤바 색상',
    title: '분류칩 가로 스크롤바 앰버',
    detail:
      '분류칩 커스텀 가로 스크롤바를 회색에서 앰버(트랙 연한 앰버·썸 amber-500)로 바꿨습니다. Preview `/korea/theme/scenic`에서 넘치는 칩 행 아래 바 색을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-scroll-top',
    session: '테마여행 #63, 본문 맨 위 버튼',
    title: '본문 스크롤 맨 위 버튼',
    detail:
      '축제 홈과 같은 「위로」버튼을 명소 홈 본문·검색 모달 스크롤에 넣었습니다. 조금 내리면 우측 하단에 나타나고, 누르면 맨 위로 갑니다. Preview `/korea/theme/scenic`에서 목록을 내린 뒤 「위로」를 눌러 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-home-search-modal',
    session: '테마여행 #62, 명소홈 개선',
    title: '헤더 칩 정리 · 검색 결과 모달',
    detail:
      '명소 홈 헤더의 「축제」「명승」버튼을 없앴습니다. 검색 결과는 본문 대신 모달로 열고, 배경·X·Escape로 닫습니다. Preview `/korea/theme/scenic`에서 검색 후 모달 닫기를 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-search-cat1-auto',
    session: '테마여행 #61, 검색 관광지 종목 자동 전환',
    title: '검색 관광지 — 0건 종목 자동 전환',
    detail:
      '「경포」처럼 TourAPI 매칭이 인문(A02)만 있을 때 기본 종목 자연(A01)에 묶여 0건으로 보이던 문제를 고쳤습니다. 검색 중 현재 종목이 0이면 결과가 있는 첫 종목으로 전환합니다. Preview에서 「경포」검색 후 관광지(경포호수광장 등)가 보이는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-search-close-results',
    session: '테마여행 #60, 검색 기능 개선',
    title: '검색 결과 닫기(결과 창)',
    detail:
      '검색 후 닫기는 X로 바뀐 돋보기가 아니라 헤더·본문 「닫기」로 결과 창을 닫습니다. 돋보기는 검색창 열기·수정용으로 유지됩니다. Preview에서 검색 후 「닫기」를 눌러 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-search-chips-empty',
    session: '테마여행 #59, 검색 기능 테스트',
    title: '검색 0건·단일 분류 칩 숨김',
    detail:
      '「고성」처럼 명소 0건이면 칩을 숨기고, 명승이 한 권역·한 경관뿐이면 분해 불가 칩도 숨깁니다. 결과가 있는 칩만 남깁니다. Preview에서 「고성」검색을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-search-chips',
    session: '테마여행 #59, 검색 기능 테스트',
    title: '검색 결과 → 분류 칩으로 분해',
    detail:
      '검색 후 긴 목록을 권역·시도·종목 칩으로 나눕니다. 검색을 유지한 채 칩을 바꿔 구간별로 확인할 수 있습니다. Preview `/korea/theme/scenic`에서 「경복궁」「경포」검색 후 칩을 눌러 보세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-search',
    session: '테마여행 #58, 검색 기능 도입',
    title: '명소 홈 검색 (선정·명승·관광지)',
    detail:
      '명승 홈 헤더에 축제와 같은 검색창을 넣었습니다. 명소명·지역으로 GATEO 선정·국가유산 명승·TourAPI 관광지를 전국에서 찾습니다. Preview `/korea/theme/scenic`에서 「경복궁」「경포」를 검색해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-samehub-require-detail',
    session: '테마여행 #57, 같은 도시 정보 있는 추천만',
    title: '같은 도시 명소 — 상세 있는 곳만 추천',
    detail:
      '정보가 없는 장소는 「같은 도시 명소」에 올리지 않습니다. curated 명승이거나 Tour contentId가 있을 때만 노출합니다. 계족산 황톳길처럼 Tour 상세가 없는 hub 명소는 목록에서 빠집니다. Preview 유성온천 레일에서 빈 상세로 이어지는 항목이 없는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-samehub-tour-contentid',
    session: '테마여행 #57, 같은 도시 Tour contentId',
    title: '계족산·신중앙시장 Tour contentId 채움',
    detail:
      '같은 도시 명소 본문이 비던 이유는 Tour contentId가 없어 LIVE 상세를 못 불러와서입니다. 계족산 황톳길→장동산림욕장(705678), 신중앙시장→대전 중앙시장(1434477)을 SSOT에 넣고 중첩 모달로 Tour 개요를 엽니다. Preview 유성온천→계족산·신중앙시장 본문을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-samehub-scenic-only',
    session: '테마여행 #57, 같은 도시 명소 명승 전용',
    title: '같은 도시 명소 → 명승 spot/중첩 모달',
    detail:
      '방방곡곡·top10 라우트는 명승으로 리다이렉트되며 query가 사라져 홈으로 떨어졌습니다. 같은 도시 명소는 명승 ?spot=(id|contentId) 또는 contentId 없으면 중첩 모달로만 엽니다. Preview 유성온천에서 한밭·엑스포·계족산·신중앙시장을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-samehub-deeplink',
    session: '테마여행 #57, 같은 도시 명소 deep-link',
    title: '같은 도시 명소 → 해당 상세(홈 폴백 제거)',
    detail:
      '유성온천처럼 regions-only 같은 도시 명소를 누르면 명승 홈으로 떨어지던 문제를 고쳤습니다. scenic/top10/regions 멤버십에 맞는 spot deep-link로 엽니다. Preview에서 유성온천 → 한밭수목원·엑스포과학공원 클릭을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-heritage-thumbs',
    session: '테마여행 #56, 명승 썸네일',
    title: '명승 목록 가벼운 썸네일 141/141',
    detail:
      '국가유산 명승은 SSOT에 사진은 있었지만 KHS 원본이 수 MB라 목록에서 안 뜨는 경우가 많았습니다. TourAPI·경량 KHS·갤러리 최소본으로 thumbUrl 141/141을 넣고 목록이 그걸 먼저 쓰도록 했습니다. Preview 명승 목록 썸네일을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-image-ssot',
    session: '테마여행 #56, 명소 썸네일 SSOT',
    title: '선정 명소 대표 사진 SSOT 97/97',
    detail:
      '선정 명소 썸네일이 비던 원인(tourapi_attraction에 contentId 미동기화)을 TourAPI detailCommon/detailImage로 채워 SSOT imageUrl 97/97을 넣었습니다. Preview `/korea/theme/scenic`에서 GATEO 선정 명소 목록에 대표 사진이 빠짐없이 보이는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-qa-share-redirect-fallback',
    session: '테마여행 #56, QA 단축링크 폴백',
    title: '/qa/:slug 클라이언트 폴백',
    detail:
      'PROD vercel redirect가 아직 없는 slug로 들어오면 검은 화면 대신 Preview로 이동합니다. `/qa/korea-theme`는 main 배포 후 서버 리다이렉트도 동작합니다. 단축 링크로 명승 Preview가 열리는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-thumb-memcache',
    session: '테마여행 #56, 명소 썸네일 캐시',
    title: '선정 명소 썸네일 메모리 캐시',
    detail:
      '선정 명소 first_image를 세션 메모리에 캐시합니다. 이미 본 contentId는 권역·시도 칩을 다시 골라도 Supabase를 재호출하지 않고 바로 표시합니다. Preview에서 수도권↔강원 전환 시 썸네일이 즉시 유지되는지 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-list-thumbs',
    session: '테마여행 #56, 명소',
    title: '명소·명승·관광지 리스트 대표 사진',
    detail:
      '명승·관광지·GATEO 선정 명소 목록 각 행에 대표 사진 썸네일을 넣었습니다. 명소는 TourAPI contentId로 first_image를 불러오고, 명승은 국가유산청 이미지, 관광지는 DB first_image를 씁니다. Preview `/korea/theme/scenic`에서 세 목록의 사진을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-hscroll-h1',
    session: '테마여행 #55, 분류칩 가로 스크롤',
    title: '분류칩 스크롤바 h-1',
    detail:
      '분류칩 커스텀 가로 스크롤바 높이를 h-1로 더 얇게 조정했습니다. Preview에서 바 두께를 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-hscroll-thinner',
    session: '테마여행 #55, 분류칩 가로 스크롤',
    title: '분류칩 스크롤바 한 단계 얇게',
    detail:
      '분류칩 커스텀 가로 스크롤바 높이를 h-2→h-1.5로 한 단계 줄였습니다. Preview에서 넘치는 칩 행 아래 바 두께를 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-hscroll-persist',
    session: '테마여행 #55, 분류칩 가로 스크롤',
    title: '분류칩 스크롤바·좌우 페이드 항시',
    detail:
      'OS 오버레이 스크롤바 대신 커스텀 트랙·썸을 넘침 시 항상 표시하고, 좌·우에 더 있을 때 페이드로 알려 줍니다. Preview `/korea/theme/scenic`에서 강원 소분류·관광지 cat3를 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-hscroll',
    session: '테마여행 #55, 분류칩 가로 스크롤',
    title: '대·중·소 분류칩 가로 스크롤',
    detail:
      '명소·명승·관광지 각 대·중·소 분류칩이 줄바꿈하지 않고 한 행에서 가로 스크롤됩니다. 아래에 시인성 있는 커스텀 스크롤바가 항상 보이며, 좌우로 더 있는 칩을 확인할 수 있습니다. Preview `/korea/theme/scenic`에서 강원·수도권·관광지 소분류를 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-gangwon-hub-chips',
    session: '테마여행 #54, 강원 소분류칩 복구',
    title: '강원·제주 여행지 소분류 복구',
    detail:
      '시도가 하나인 권역(강원·제주)에서는 시도 선택 없이도 강릉·속초·춘천·서귀포 같은 여행지 소분류 칩이 다시 보입니다. Preview에서 강원·제주 명소 칩을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-chip-zero-dup-hide',
    session: '테마여행 #54, 분류칩 0건·동일라벨 정리',
    title: '0건 칩·중소수 동일 라벨 숨김',
    detail:
      '중·소분류에서 수량이 0인 칩과, 중분류와 같은 라벨의 소분류(예: 서울→서울)를 숨깁니다. 명소 여행지 칩은 시도를 고른 뒤에만 보입니다. Preview에서 수도권·관광지 종목 칩을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-curated-heritage-chips',
    session: '테마여행 #54, 명소, 명승 분류 최적화',
    title: '명소·명승 섹션별 대·중·소 분류칩',
    detail:
      '페이지 상단 명승 건수 칩을 없애고, GATEO 선정 명소는 권역→시도→여행지 칩으로, 국가유산 명승은 권역→시도→경관유형(자연·문화·역사문화) 칩으로 나눕니다. Preview `/korea/theme/scenic`에서 명소·명승 각 리스트 상단 칩을 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-cat3-chips',
    session: '테마여행 #53, TourAPI 소분류 칩 세분화',
    title: '관광지 중분류 아래 소분류(산·사찰 등) 칩',
    detail:
      'TourAPI cat3를 열어 중분류(자연관광지·역사관광지 등)를 고르면 산·해수욕장·사찰·공원 같은 소분류 칩으로 목록을 더 좁힐 수 있습니다. Preview `/korea/theme/scenic`에서 자연→자연관광지→해수욕장 순으로 확인해 주세요.',
    at: '2026-08-07',
  },
  {
    id: '2026-08-07-korea-theme-scenic-place-cluster',
    session: '테마여행 #52, 명소 분류 최적화',
    title: '동일 지역 뭉침 · TourAPI 분류 유지',
    detail:
      '권역을 고르면 같은 시·군(예: 경주) 명소가 흩어지지 않고 뭉쳐 나열됩니다. TourAPI 종목 대·소분류(자연·인문·자연관광지 등) 칩은 기존처럼 유지합니다. Preview `/korea/theme/scenic?region=경상`에서 확인해 주세요.',
    at: '2026-08-07',
  },
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
    id: '2026-08-06-korea-photo-swipe',
    session: '축제 페이지 #3, 사진 스와이프·홈 줌 리셋',
    title: '축제 사진 쓸어 넘기기 · 홈 확대 잔상 수정',
    detail:
      '상세 본문·확대보기에서 좌우로 쓸어 사진을 넘길 수 있게 했습니다. 확대보기는 핀치가 페이지가 아니라 사진만 확대되고, 닫거나 홈으로 나갈 때 iOS 페이지 줌을 되돌립니다. /korea에서 축제 카드→사진 넘기기→확대 후 닫기→홈으로 진입해 지구본이 정상 배율인지 확인해 주세요.',
    at: '2026-08-06',
  },
  {
    id: '2026-08-03-dokdo-hub-ssot',
    session: '독도 검색 #1, 허브 SSOT',
    title: '독도 검색 시 별도 허브로 표시',
    detail:
      '「독도」검색이 울릉독도박물관 부분일치로 울릉만 뜨던 문제를 고쳤습니다. cityAttractionHubs에 dokdo 허브(독도등대·동도·서도·독도접안시설)를 추가했습니다. 홈 검색에 「독도」를 입력·Enter 하면 독도가 맨 앞에 나오는지 확인해 주세요. 울릉도·울릉독도박물관은 그대로입니다.',
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
