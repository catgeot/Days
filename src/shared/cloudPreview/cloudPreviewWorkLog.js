/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '로그북',
  sessionNo: 2,
  sessionPhase: '큐레이션 페이지',
  branch: 'cursor/logbook-cta-home-bbbd',
  previewPath: '/blog/curation',
  qaShareSlug: 'logbook-curation',
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
    id: '2026-08-12-logbook-curation-layout-2',
    session: '로그북 #2, 큐레이션 페이지',
    title: '큐레이션 헤더 · 나의 큐레이션 상단 · 최근 본문',
    detail:
      '헤더를 로그북형 「큐레이션」헤더로 맞추고, 나의 큐레이션이 있으면 상단 목록·아래에 최근 실행 본문, 없으면 낙원 탐색 실행 박스가 상단에 오도록 바꿨습니다. Preview /blog/curation에서 목록·본문 순서를 확인해 주세요.',
    at: '2026-08-12',
  },
  {
    id: '2026-08-12-logbook-public-cta-home-1',
    session: '로그북 #1, 공개피드 CTA',
    title: '공개 피드 「나만의 기록 남기기」→ 로그북 홈',
    detail:
      '공개 피드(/p/:id) 본문 하단 CTA가 로그인으로 가던 것을 /blog(로그북 홈)로 바꿨습니다. Preview에서 공개 기록 하단 「나만의 기록 남기기」를 눌러 /blog로 가는지 확인해 주세요.',
    at: '2026-08-12',
  },
  {
    id: '2026-08-12-aitutaki-gyg-ayutthaya-4',
    session: '지구본 홈 #4, 아이투타키 투어 오탐',
    title: '아이투타키 투어 찾기 → 아유타야 오탐 보정',
    detail:
      'GYG에 아이투타키 재고가 없어 bare「Aitutaki」검색이 아유타야로 붙던 문제를, 확정 쿡 제도 쿼리(Rarotonga, Cook Islands)·City id 2689로 바꿨습니다. Preview에서 아이투타키 써머리 → 투어 찾기에 태국 아유타야·일본 투어가 안 뜨는지 확인해 주세요.',
    at: '2026-08-12',
  },
  {
    id: '2026-08-12-curation-photo-fallback-5',
    session: 'AI 큐레이션 #5, 사진 place_stats 폴백',
    title: '아이투타키 등 사진 준비 중 → place_stats 폴백',
    detail:
      'Unsplash/Pexels가 비거나 실패해도 place_stats(장소카드 갤러리) 썸네일로 채웁니다. 이미 「사진 준비 중」으로 저장된 아이투타키도 페이지 열면 자동 복구됩니다. Preview에서 낙원 탐색·나의 목록의 아이투타키 사진을 확인해 주세요.',
    at: '2026-08-12',
  },
  {
    id: '2026-08-11-curation-main-sync-4',
    session: 'AI 큐레이션 #4, main 동기화·병합 QA',
    title: 'main 동기화 후 Preview QA',
    detail:
      'main을 큐레이션 브랜치에 맞춰 머지했습니다. 홈 로고 아래 「AI 큐레이션」칩·/blog/curation 낙원 탐색·리치 팁·나의 목록·홈 복귀를 확인해 주세요.',
    at: '2026-08-11',
  },

  {
    id: '2026-08-02-curation-home-entry',
    session: 'AI 큐레이션 #3, 홈 진입 연결',
    title: '홈 → AI 큐레이션 바로가기',
    detail:
      '홈 로고 아래 「AI 큐레이션」칩으로 /blog/curation에 바로 들어갈 수 있습니다. 낙원 탐색·리치 팁·나의 목록·「전체 지도에서 보기」홈 복귀를 확인해 주세요.',
    at: '2026-08-02',
  },
  {
    id: '2026-07-31-curation-hub-bc',
    session: 'AI 큐레이션 #2, 인페이지 허브',
    title: '/blog/curation 인페이지 허브',
    detail:
      '전용 페이지에서 낙원 탐색·whyHidden/bestSeason/tips·나의 큐레이션 목록 복원을 담았습니다. 지구본·장소카드 CTA는 보조입니다.',
    at: '2026-07-31',
  },
  {
    id: '2026-07-31-curation-phase-a',
    session: 'AI 큐레이션 #1, 연결·비로그인',
    title: '지구본·장소카드·무니 연결',
    detail:
      '큐레이션 결과를 홈 써머리·장소카드·무니로 넘기고, 비로그인 탐색·이미지/좌표 로직을 고쳤습니다.',
    at: '2026-07-31',
  },
  {
    id: '2026-08-11-summary-mobile-bottom-3',
    session: '지구본 홈 #3, 모바일 써머리 하단',
    title: '써머리 카드 모바일 하단 고정',
    detail:
      '써머리·몰입 컴팩트 바의 모바일 bottom을 카테고리 바용 6.75rem에서 1rem+safe-area로 내리고 fixed로 뷰포트 하단에 붙였습니다. 카드가 뜰 때 카테고리 바는 숨겨지는데 예전 오프셋이 남아 중간에 떠 보이던 문제입니다. Preview 모바일에서 핀 탭 후 써머리가 화면 하단에 있는지 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-zermatt-flight-2',
    session: '지구본 홈 #2, 항로 플래너·체르마트',
    title: '항로 Bar 「여행 플래너」·체르마트 직항',
    detail:
      '항로 상태바 버튼을 「여행 플랜」→「여행 플래너」로 바꿨고, 체르마트는 ICN→ZRH 직항(MUC·GVA 경유 오탐 제거)입니다. Preview에서 체르마트→항공 경로→직항 표시와 버튼을 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-summary-planner-1b',
    session: '지구본 홈 #1, 플래너 보기 버튼',
    title: '써머리 CTA 문구 「여행 플래너」',
    detail:
      '써머리 링크 버튼 문구를 「플래너 보기」에서 「여행 플래너」로 바꿨습니다. Preview에서 플래너 있는 핀의 버튼 라벨을 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-summary-planner-1',
    session: '지구본 홈 #1, 플래너 보기 버튼',
    title: '써머리 「플래너 보기」링크',
    detail:
      '지구본 홈 써머리 장소카드의 「가까이 보기」를, place_toolkit 플래너가 있는 여행지에서는 「플래너 보기」링크로 바꿨습니다. 플래너가 없으면 기존 「가까이 보기」를 유지합니다. Preview에서 플래너 있는 핀(예: 주요 도시)과 없는 핀을 비교해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-festival-samehub-144',
    session: '테마여행 #144, 축제 같은 도시 명소 튕김',
    title: '축제→같은 도시 명소 중첩·이전 복귀',
    detail:
      '축제 상세→횡성호→안흥찐빵마을이 명소홈으로 튕기던 문제를 고쳤습니다. 같은 도시 명소는 중첩 모달로 열고, 축제 returnTo의 「이전」은 횡성호 명승 상세로 갑니다(축제홈 spot 오부착 제거). Preview에서 가을·강원·횡성한우축제→횡성호→안흥찐빵마을→닫기를 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-scenic-locate-pin-143-main',
    session: '테마여행 #143, 내 위치 핀 main 병합',
    title: '내 위치 붉은 깃발 핀 main 반영',
    detail:
      'PR #100(붉은 깃발 핀)을 main에 반영했습니다. `/qa/scenic-map`은 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 지도→내 위치(붉은 깃발)를 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-scenic-locate-pin-143',
    session: '테마여행 #143, 내 위치 핀 시인성',
    title: '내 위치 — 붉은 깃발 핀',
    detail:
      '지도 내 위치 마커를 하늘색 점에서 붉은 깃발 핀(테드롭+Flag)으로 바꿔 시인성을 높였습니다. 활성 「위치 해제」버튼도 붉은 톤으로 맞췄습니다. Preview에서 명소 지도→내 위치를 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-scenic-locate-near-142',
    session: '테마여행 #142, 지도 내 위치 주변 칩',
    title: '파드별 내 위치 주변 칩·목록 적응 반경',
    detail:
      '지도 내 위치는 파드별로 해당 파드만 가까운 칩(최대 12)·적응 반경(20→80km)으로 보여 줍니다. 분류 칩/크럼 클릭·위치 해제로 드릴로 복귀. 목록 내 주변도 동일 상한·더보기·반경 확대. Preview에서 명소 지도→내 위치→칩→분류 복귀를 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-scenic-locate-141',
    session: '테마여행 #141, 지도 내 위치',
    title: '명승 지도 — 내 위치 버튼',
    detail:
      '명승홈 지도에 「내 위치」버튼을 넣었습니다. 위치 허용 후 파란 점으로 표시하고 카메라가 이동합니다. 목록 「내 주변」필터·TourAPI는 건드리지 않습니다. Preview에서 명소/명승/관광지 지도 → 내 위치를 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-11-page-end-pad-140',
    session: '테마여행 #140, 페이지 하단 여백',
    title: '스크롤 끝 하단 여백(중앙 착지)',
    detail:
      '명승홈·테마·축제 목록에 `.page-scroll-end-pad`(약 50vh)를 적용해 끝까지 스크롤해도 마지막 접힘 버튼·본문이 화면 하단이 아니라 중앙 부근에 오도록 했습니다. Preview `/korea/theme/scenic`에서 명소 리스트 끝→국가유산 명승·지역 관광지 접힘 버튼을 확인해 주세요.',
    at: '2026-08-11',
  },
  {
    id: '2026-08-10-yanggu-porcelain-139',
    session: '테마여행 #139, 양구백자박물관 등록',
    title: '양구백자박물관 hub·GATEO 선정 등록',
    detail:
      '양구백자박물관을 yanggu hub attractions와 koreaScenicSpots에 추가했습니다(870→871 · Tour contentId 731454 · detailImage 썸네일). Tour LIVE에는 있으나 tourapi_attraction DB sync에는 없던 사례입니다. Preview에서 검색「양구백자박물관」·`/korea/theme/scenic?hub=yanggu`를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-yanggu-arboretum-138',
    session: '테마여행 #138, 양구수목원 등록',
    title: '양구 수목원 hub·GATEO 선정 등록',
    detail:
      '검색·테마에 없던 양구 수목원(공식명·옛 양구자연생태공원)을 yanggu hub attractions와 koreaScenicSpots에 추가했습니다(869→870). TourAPI에 동일 관광지 contentId가 없어 null·GATEO overview입니다. Preview에서 검색「양구 수목원」·`/korea/theme/scenic?hub=yanggu`를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-137',
    session: '테마여행 #137, 소량 hub 보강',
    title: '제천·진주·완도·진안 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 15곳을 append했습니다(854→869 · 제천·진주·완도 각 1→5 · 진안 1→4). attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=jecheon` · `jinju` · `wando` · `jinan` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-136',
    session: '테마여행 #136, 소량 hub 보강',
    title: '보령·단양·군산·구례 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 15곳을 append했습니다(839→854 · 보령 1→4 · 단양·군산·구례 각 1→5). 보령 hub 중복명 「무창포해수욕장」(신비의바닷길)은 동일 한글명 중복이라 스킵. attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=boryeong` · `danyang` · `gunsan` · `gurye` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-135',
    session: '테마여행 #135, 소량 hub 보강',
    title: '청주·광주·정읍·성남 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 20곳을 append했습니다(819→839 · 청주·광주·정읍·성남 각 1→6). attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=cheongju` · `gwangju` · `jeongeup` · `seongnam` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-134',
    session: '테마여행 #134, 소량 hub 보강',
    title: '보성·부안·남원·하동 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 20곳을 append했습니다(799→819 · 보성·부안·남원·하동 각 1→6). attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=boseong` · `buan` · `namwon` · `hadong` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-133',
    session: '테마여행 #133, 소량 hub 보강',
    title: '공주·합천·태안·부여 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 22곳을 append했습니다(777→799 · 공주 1→7 · 합천 1→7 · 태안 1→6 · 부여 1→6). attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=gongju` · `hapcheon` · `taean` · `buyeo` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-132',
    session: '테마여행 #132, 소량 hub 보강',
    title: '포항·목포·울릉·가평 미등재 명소 draft',
    detail:
      'curated 1 hub 4곳의 기존 cityAttractionHubs attractions 미등재분만 GATEO 선정 23곳을 append했습니다(754→777 · 포항 1→6 · 목포 1→7 · 울릉 1→7 · 가평 1→7). attractions 억지 추가는 없습니다. Preview에서 `/korea/theme/scenic?hub=pohang` · `mokpo` · `ulleung` · `gapyeong` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-131',
    session: '테마여행 #131, 소량 hub 보강',
    title: '소량 hub 범위 교정 · 강릉 미등재 2곳만',
    detail:
      '소량 hub는 빈 hub 큐에서 제외된(이미 선정 있는) hub만입니다. 빈 hub 보강 졸업지(원주·횡성·화천) 재팽창과 명소 억지 추가는 되돌렸고, 강릉은 기존 attractions 미등재 오죽헌·주문진항만 넣었습니다. Preview에서 `/korea/theme/scenic?hub=gangneung` 을 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-thin-hubs-130',
    session: '테마여행 #130, 소량 hub 보강',
    title: '춘천·속초·동해·삼척 소량 hub 명소 보강',
    detail:
      '빈 hub 큐는 이미 소진된 상태에서, 소량만 남아 있던 강원 4개 hub에 cityAttractionHubs 명소 추가 + GATEO 선정 32곳을 append했습니다(춘천 2→11 · 속초 2→9 · 동해 1→8 · 삼척 1→10). Preview에서 `/korea/theme/scenic?hub=chuncheon` · `sokcho` · `donghae` · `samcheok` 목록·지도를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-crumb-129-main',
    session: '테마여행 #129, 상태바 main',
    title: '상태바 세권 크럼 main 병합',
    detail:
      'PR #94를 main에 반영했습니다. `/qa/scenic-map`은 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 명소 지도 → 강원 → 세권 → 여행지 → 핀 경로 바에 세권이 남는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-crumb-129',
    session: '테마여행 #129, 상태바 세권',
    title: '지도 상태바 — 세권(4권역) 크럼',
    detail:
      '강원 등 세권 드릴 후 hub·핀 단계에서 상태바에 영서/영동 등 세권(4권역)이 빠지던 문제를 고쳤습니다. 단일 시도 권역의 「강원」중복도 제거했습니다. Preview에서 명소 지도 → 강원 → 세권 → 여행지 → 핀까지 경로 바를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-chip-spread-128',
    session: '테마여행 #128, 지도 칩 분포',
    title: '명승 지도 — 숫자 뭉치↓ · 윤곽 핀',
    detail:
      'hub·경관 리프(≤20곳)는 클러스터(숫자)를 끄고 개별 핀·라벨로 분포를 보여 줍니다. 넓은 뷰 클러스터도 반경·maxZoom을 완화했고, 근접 드릴 칩은 살짝 펼치며 좁은 스팬 과줌인을 줄였습니다. Preview에서 명소 지도 → hub까지 드릴 → 2~7곳이 숫자로 안 뭉치고 흩어지는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-brand-seo-2-main',
    session: '브랜드 SEO #2, 축제·명승 main',
    title: '축제·명승 SEO 허브 main 병합',
    detail:
      'PR #92를 main에 반영했습니다. `/qa/korea-seo`는 PROD 축제 경로로 연결됩니다. www.gateo.kr/korea · /korea/theme/scenic 탭 제목과 홈 소스의 축제·명승 링크를 확인해 주세요. Search Console 사이트맵 재제출을 권장합니다.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-brand-seo-2',
    session: '브랜드 SEO #2, 축제·명승 허브',
    title: '축제·명승 SEO 허브 보강',
    detail:
      '홈 크롤러 본문·nav에 한국의 축제/명승 링크를 넣고, Helmet 타이틀을 축제·랜딩·명승으로 구분했으며 sitemap(www)·robots Allow /korea를 맞췄습니다. Preview에서 / · /korea · /korea/theme · /korea/theme/scenic 탭 제목과 소스의 축제·명승 링크를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-list-127',
    session: '테마여행 #127, 리스트 크게',
    title: '명승 홈 리스트 「크게」·지도 옆',
    detail:
      '축제홈과 같이 명소·명승·관광지·즐겨찾기 파드 헤더의 지도 버튼 왼쪽에 「크게」토글을 두었습니다. Preview에서 크게→썸네일·행 확대, 기본→원복을 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-brand-seo-1',
    session: '브랜드 SEO #1, Days→GATEO',
    title: '검색·문서 타이틀 Days → GATEO',
    detail:
      'Helmet siteName이 「Days - 세상의 모든 여행지」로 남아 검색 결과에 Days가 노출되던 문제를 GATEO로 맞췄습니다. Preview 홈에서 브라우저 탭 제목·About/약관「Project Days」잔여·로고 패널 저작권 표기를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-126',
    session: '테마여행 #126, 명승·관광지 지도 드릴다운',
    title: '명승·관광지 지도 대→중→소 드릴다운',
    detail:
      '명승·관광지 「지도」도 명소처럼 목록에서 고른 칩 지역 핀이 아니라, 대분류(권역)부터 지도 위 칩으로 좁힙니다. 명승은 권역→시도→경관, 관광지는 권역→시도→종목 대·중·소 후 핀입니다. Preview에서 명승/관광지 지도 → 권역 칩 → 하위 → 핀을 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-125-main',
    session: '테마여행 #125, 안내 문구 main',
    title: '상태바 안내 문구 제거 main 병합',
    detail:
      'PR #88을 main에 반영했습니다. `/qa/scenic-map`은 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 상태바만 남았는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-125',
    session: '테마여행 #125, 상태바 안내 문구 제거',
    title: '상태바 하단 안내 문구 제거',
    detail:
      '지도 경로 바 아래 「칩을 눌러 좁히세요」안내 문구를 제거했습니다. Preview에서 상태바만 남았는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-124',
    session: '테마여행 #124, 상태바 검정 텍스트',
    title: '상태바 텍스트 검정',
    detail:
      '지도 상단 경로 바를 밝은 패널 + 검정(stone-900) 텍스트로 바꿨습니다. Preview에서 명소 지도 드릴다운 경로·「상위」가 읽히는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-123-main',
    session: '테마여행 #123, 경로 바 main',
    title: '경로 바 시인성·톤 main 병합',
    detail:
      'PR #86을 main에 반영했습니다. `/qa/scenic-map`은 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 지도 상위·경로 바 톤을 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-123',
    session: '테마여행 #123, 경로 바 톤 맞춤',
    title: '경로 바 — 지도 톤에 맞춤',
    detail:
      '상단 경로 바를 지도 글래스·칩 분위기에 맞게 완화했습니다. 「상위」는 연한 호박 글로우, 경로는 텍스트+현재만 살짝 강조로 시인성은 유지합니다. Preview에서 균형이 맞는지 봐 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-122',
    session: '테마여행 #122, 경로 바 시인성',
    title: '지도 상위·경로 바 시인성',
    detail:
      '드릴다운 상단 「상위」·경로 바 대비를 올렸습니다(불투명 배경·호박 테두리·큰 「상위」버튼·경로 칩). Preview에서 권역→중→소로 들어간 뒤 상위/경로가 잘 보이는지 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-121-main',
    session: '테마여행 #121, 지도 드릴다운 main',
    title: '지도 드릴다운 main 병합',
    detail:
      'PR #85를 main에 반영했습니다. `/qa/scenic-map`은 PROD 명승 경로로 연결됩니다. www.gateo.kr/korea/theme/scenic 에서 명소 지도 대→중→소 드릴다운을 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-121',
    session: '테마여행 #121, 지도 드릴다운 칩',
    title: '명소 지도 대→중→소 드릴다운',
    detail:
      '명소 「지도」는 짧은 목록 핀 확인이 아니라, 권역(대)→시도·세권(중)→여행지 hub(소) 칩을 지도 위에 펼쳐 좁히는 드릴다운입니다. hub까지 들어가면 그때 핀이 보입니다. Preview에서 명소 지도 → 권역 칩 → 중분류 → 소분류 → 핀·상세를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-120',
    session: '테마여행 #120, 접이·파드별 지도',
    title: '파드 접이 + 명소/명승/관광지 지도',
    detail:
      '명소·명승·관광지를 접이식 파드로 바꿨습니다(기본 명소만 펼침·다중 펼침 허용). 각 파드 「지도」는 그 목록 핀만 보여 줍니다. 전역 「지도」는 제거했습니다. Preview에서 명승/관광지 펼침 → 파드별 지도 → 헤더 닫기를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-119b',
    session: '테마여행 #119, 명승 홈 지도',
    title: '헤더 지도 버튼 제거',
    detail:
      '헤더의 「지도」토글은 빼고, 목록 상단(내 주변 옆) 「지도」만 남겼습니다. 지도가 열린 동안 헤더 「닫기」로 목록에 돌아갈 수 있습니다.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-10-scenic-map-119',
    session: '테마여행 #119, 명승 홈 지도',
    title: '목록↔지도 · 핀·클러스터',
    detail:
      '명승 홈에 축제와 같은 지도 전환을 넣었습니다. 목록 상단 「지도」→ 현재 목록(선정·명승·관광지) 핀·클러스터 · 핀 탭 시 상세 모달. 내 주변 GPS 연동은 다음 단계입니다. Preview에서 지도 → 핀 → 상세 → 목록 복귀를 확인해 주세요.',
    at: '2026-08-10',
  },
  {
    id: '2026-08-09-scenic-favorites-118',
    session: '테마여행 #118, 명승 홈 즐겨찾기',
    title: '명승 홈 즐겨찾기·본 항목',
    detail:
      '축제와 같이 헤더 ★로 즐겨찾기·본 항목 패널을 열고, 목록 행·상세 모달에서도 ★로 추가/해제할 수 있습니다(기기 localStorage). Preview에서 ★ 토글 → 헤더 ★로 목록 확인 → 새로고침 후에도 유지되는지 봐 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-search-focus-117b',
    session: '테마여행 #117, 검색 아이콘 포커스',
    title: '검색 포커스 — flushSync 수정',
    detail:
      '아이콘 클릭 후 setTimeout focus는 모바일에서 제스처 밖이라 커서가 안 들어갔습니다. 클릭 핸들러에서 flushSync로 검색바를 연 뒤 바로 focus 하도록 고쳤습니다. Preview에서 검색 아이콘 → 커서/키보드가 바로 뜨는지 다시 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-search-focus-117',
    session: '테마여행 #117, 검색 아이콘 포커스',
    title: '검색 아이콘 → 입력창 즉시 포커스',
    detail:
      '모바일에서 검색 아이콘을 누르면 검색바가 열리며 입력창에 바로 커서가 들어가도록 했습니다(명승·축제 동일). Preview에서 좁은 폭으로 검색 아이콘 → 키보드/커서 바로 뜨는지 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-search-junam-116',
    session: '테마여행 #116, 잔여 contentId 보강',
    title: '「주남」검색 → 주남저수지',
    detail:
      '2글자 검색이 「제주남쪽」「광주남한」에 걸려 권역이 제주/수도권으로 가며 주남저수지가 안 보이던 문제를 고쳤습니다. 본명 선두·시군 주소 위주로 맞추고, Preview에서 「주남」검색 시 창원 주남저수지가 나오는지 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-contentid-116',
    session: '테마여행 #116, 잔여 contentId 보강',
    title: '잔여 contentId 18곳 추가 채움',
    detail:
      'alias·접미 비율·경남고성 주소 힌트·캠핑장/허브꼬리 오매칭 가드를 보강해 contentId 18곳 채움(627→645 · 잔여 null 75). 퍼플섬·주남저수지·제황산공원·고성공룡박물관·나로우주센터·칠곡보·부항댐·성밖숲 등. Preview에서 Tour LIVE 상세를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-contentid-114',
    session: '테마여행 #114, 잔여 contentId 보강',
    title: 'searchKeyword로 선정 contentId 88곳 채움',
    detail:
      'areaBased만으로는 Tour 본명이 안 잡혀 0건이었습니다. 주석·(지역)·국립공원 접미를 정규화하고 searchKeyword 잔여 패스를 추가해 contentId 88곳 채움(539→627 · 잔여 null 93). 진도 시군구 1→21 교정. Preview에서 부석사·선운사·고창읍성·우포늪·직지사 Tour LIVE 상세를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-nearby-yanggu-114',
    session: '테마여행 #114, 내주변 양구 관내 누락',
    title: '내 주변 관광지 — bbox 페이지네이션',
    detail:
      '양구 「내 주변」관광지에서 bbox 후보 806건 중 앞 500만 가져와 관내(0~수 km)가 빠지고 인제·춘천이 먼저 나오던 문제를 고쳤습니다. range 페이지네이션(최대 3000) 후 거리순. Preview에서 양구 GPS(또는 위치) → 관광지 최근접이 양구 관내인지 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-mid-cluster-113',
    session: '테마여행 #113, 세권 칩 메인 반영 전 점검',
    title: '세권 칩 VERIFY·UI QA GO',
    detail:
      'main 반영 전 점검: SSOT cover·audit/smoke/build PASS · 서울 기본(세권 없음)→경기 북부·hub7→동부→강원 영서·홍천 · 명승/관광지 세권 없음. 사람 Preview OK 후 PR #78 merge.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-mid-cluster-112',
    session: '테마여행 #112, 세권 칩 SSOT·UI',
    title: '명소 세권(경기 동서남북 등) 칩',
    detail:
      '경기·강원·충청·전라·경상에 세권 중분류를 넣었습니다. 경기 선택 시 북·동·서·남 4칩 → 시·군 hub. 강원은 영서·영동·접경·산간. Preview에서 수도권→경기→북부, 강원→영서 흐름을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-default-chip-110',
    session: '테마여행 #110, 분류칩 기본 중소수',
    title: '기본값=첫 중·소분류(~10건)',
    detail:
      '명승 홈 진입 시 권역 전체(예: 수도권 179) 대신 첫 시도 중분류(서울)를 기본으로 고릅니다. 목록이 길면 여행지·경관·종목 소분류를 ~10건 안팎으로 더 좁힙니다. 명소·명승·관광지 파드 모두 동일. Preview에서 /korea/theme/scenic 진입 시 서울 칩·짧은 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-merge-108',
    session: '테마여행 #108, main 병합·전반 점검',
    title: '빈 hub 보강 PR #75 → main',
    detail:
      '일일 Tour 쿼터로 잔여 contentId(~181)는 후속으로 두고, 시·군 빈 hub 큐 소진·선정 보강·주변 areaBased 폴백·overview 전달까지 반영한 PR #75를 main에 병합했습니다. PROD /korea/theme/scenic에서 권역·hub 선정 목록·상세·네이버 칩을 전반 점검해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-contentid-107',
    session: '테마여행 #107, 잔여 contentId 보강',
    title: 'areaBased·DB로 선정 contentId 10곳 채움',
    detail:
      'searchKeyword 429를 피해 areaBasedList(시·군)+DB 엄격 매칭으로 잔여 null 중 10곳에 Tour contentId를 채웠습니다(529→539). 창원 시군구 코드 수정(마산6→창원16)·연기/군위 색인 추가. fill:korea-scenic-spot-content-ids 스크립트 추가. Preview에서 평창올림픽기념관·의왕 레일파크·화순 적벽 등 Tour LIVE 상세를 확인해 주세요. 잔여 null≈181(Tour 본명 부재·한도).',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-preview-qa-106',
    session: '테마여행 #106, Preview QA 반영',
    title: '킨텍스 overview 모달 전달 수정',
    detail:
      'Preview QA에서 고양 킨텍스가 「Tour 상세 없음」만 보이던 원인을 고쳤습니다. toModalSpot이 SSOT overview를 모달에 넘기지 않아 curated 본문이 빠졌습니다. 이제 개요·썸네일이 표시되고 TourAPI 부재 안내 문장은 사용자 본문에서 숨깁니다. 아침고요수목원 주변 섹션은 #105 폴백으로 유지됩니다.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-contentid-105',
    session: '테마여행 #105, 선정 contentId 보강',
    title: '주변 areaBased 폴백 · Tour 부재 overview',
    detail:
      'TourAPI locationBasedList 일일 한도(429)로 주변 맛집·레포츠·문화가 실패하던 문제를 시·군 areaBasedList 폴백으로 보완했습니다(가평·고양 시군구 SSOT). 킨텍스 등 Tour type12 부재 191곳은 contentId 대신 GATEO overview 본문을 채웠습니다. Preview에서 아침고요수목원·고양 킨텍스 상세의 주변 섹션과 킨텍스 개요를 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-104',
    session: '테마여행 #104, 빈 hub 명소 보강',
    title: '영덕·영양 GATEO 선정 전수 · 큐 소진',
    detail:
      '큐 잔여 영덕4·영양4 attractions 전수를 GATEO 선정에 넣었습니다(Tour contentId 2/8 · 썸네일 683/720). 경북 시도 색인에도 동시 등록했습니다. Tour LIVE 429 → DB·related 폴백 · 시·군 빈 hub 큐 0. Preview에서 /korea/theme/scenic?hub=yeongdeok · ?hub=yeongyang 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-103',
    session: '테마여행 #103, 빈 hub 명소 보강',
    title: '광양·경산·산청·성주·의령 GATEO 선정 전수',
    detail:
      '큐 R01 전라·경상 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(광양4·경산4·산청4·성주4·의령4 · Tour contentId 3/20 · 썸네일 675/712). 전남·경북·경남 시도 색인에도 동시 등록했습니다. Tour LIVE 429 → DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=gwangyang · ?hub=gyeongsan · ?hub=sancheong · ?hub=seongju · ?hub=uiryeong 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-102',
    session: '테마여행 #102, 빈 hub 명소 보강',
    title: '청송·칠곡·독도·김천·고령 GATEO 선정 전수',
    detail:
      '큐 R01 경상 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(청송4·칠곡4·독도4·김천4·고령4 · Tour contentId 7/20 · 썸네일 655/692). 경북 시도 색인(독도 포함)에도 동시 등록했습니다. Tour LIVE searchKeyword 공백·429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=cheongsong · ?hub=chilgok · ?hub=dokdo · ?hub=gimcheon · ?hub=goryeong 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-101',
    session: '테마여행 #101, 빈 hub 명소 보강',
    title: '의성·예천·영천·영주·창녕 GATEO 선정 전수',
    detail:
      '큐 R01 경상 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(의성5·예천5·영천5·영주5·창녕4 · Tour contentId 9/24 · 썸네일 635/672). 경북·경남 시도 색인에도 동시 등록했습니다. Tour LIVE searchKeyword 429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=uiseong · ?hub=yecheon · ?hub=yeongcheon · ?hub=yeongju · ?hub=changnyeong 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-100',
    session: '테마여행 #100, 빈 hub 명소 보강',
    title: '고성·구미·함안·밀양·사천 GATEO 선정 전수',
    detail:
      '큐 R01 경상 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(고성5·구미5·함안5·밀양5·사천5 · Tour contentId 12/25 · 썸네일 611/648). 경남·경북 시도 색인에도 동시 등록했습니다. Tour LIVE searchKeyword 429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=goseongnam · ?hub=gumi · ?hub=haman · ?hub=miryang · ?hub=sacheon 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-99',
    session: '테마여행 #99, 빈 hub 명소 보강',
    title: '양산·창원·청도·달성·기장 GATEO 선정 전수',
    detail:
      '큐 R01 경상 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(양산6·창원5·청도5·달성5·기장5 · Tour contentId 12/26 · 썸네일 586/623). 경남·경북·대구·부산 시도 색인에도 동시 등록했습니다. Tour LIVE searchKeyword 429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=yangsan · ?hub=changwon · ?hub=cheongdo · ?hub=dalseong · ?hub=gijang 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-98',
    session: '테마여행 #98, 빈 hub 명소 보강',
    title: '영암·거창·울주·김해·군위 GATEO 선정 전수',
    detail:
      '큐 R01 전라 잔여+경상 앞 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(영암4·거창7·울주7·김해6·군위6 · Tour contentId 9/30 · 썸네일 560/597). 전남·경남·경북·울산 시도 색인에도 동시 등록했습니다. Tour LIVE searchKeyword 429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=yeongam · ?hub=geochang · ?hub=ulju · ?hub=gimhae · ?hub=gunwi 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-97',
    session: '테마여행 #97, 빈 hub 명소 보강',
    title: '해남·함평·익산·무안·무주 GATEO 선정 전수',
    detail:
      '큐 R01 전라 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(해남4·함평4·익산4·무안4·무주4 · Tour contentId 13/20 · 썸네일 549/567). 전북·전남 시도 색인에도 동시 등록했습니다. Tour LIVE 429로 locationBasedList·DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=haenam · ?hub=hampyeong · ?hub=iksan · ?hub=muan · ?hub=muju 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-96',
    session: '테마여행 #96, 빈 hub 명소 보강',
    title: '나주·신안·순창·영광·김제 GATEO 선정 전수',
    detail:
      '큐 R01 전라 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(나주5·신안5·순창5·영광5·김제4 · Tour contentId 12/24 · 썸네일 529/547). 전북·전남 시도 색인에도 동시 등록했습니다. Tour LIVE 검색 공백으로 DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=naju · ?hub=sinan · ?hub=sunchang · ?hub=yeonggwang · ?hub=gimje 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-95',
    session: '테마여행 #95, 빈 hub 명소 보강',
    title: '화순·임실·장흥·장성·진도 GATEO 선정 전수',
    detail:
      '큐 R01 전라 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(화순5·임실5·장흥5·장성5·진도5 · Tour contentId 14/25 · 썸네일 505/523). 전북·전남 시도 색인에도 동시 등록했습니다. Tour LIVE 429로 DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=hwasun · ?hub=imsil · ?hub=jangheung · ?hub=jangseong · ?hub=jindo 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-94',
    session: '테마여행 #94, 빈 hub 명소 보강',
    title: '서천·강진·고창·고흥·함양 GATEO 선정 전수',
    detail:
      '큐 R01 워커A 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(서천6·강진5·고창5·고흥5·함양5 · Tour contentId 11/26 · 썸네일 480/498). 충남·전북·전남·경남 시도 색인에도 동시 등록했습니다. Tour LIVE 429로 DB·related 폴백을 썼습니다. Preview에서 /korea/theme/scenic?hub=seocheon · ?hub=gangjin · ?hub=gochang · ?hub=goheung · ?hub=hamyang 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-93',
    session: '테마여행 #93, 빈 hub 명소 보강',
    title: '연기·예산·완주·곡성·장수 GATEO 선정 전수',
    detail:
      '큐 R01 잔여(연기·예산)와 전라 R02 앞(완주·곡성·장수) 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(연기4·예산4·완주7·곡성6·장수6 · Tour contentId 19/27 · 썸네일 454/472). 세종·충남·전북·전남 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=yeongi · ?hub=yesan · ?hub=wanju · ?hub=gokseong · ?hub=jangsu 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-92',
    session: '테마여행 #92, 빈 hub 명소 보강',
    title: '음성·금산·홍성·논산·옥천 GATEO 선정 전수',
    detail:
      '큐 R01 충청 잔여 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(음성4·금산4·홍성4·논산4·옥천4 · Tour contentId 12/20 · 썸네일 427/445). 충북·충남 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=eumseong · ?hub=geumsan · ?hub=hongseong · ?hub=nonsan · ?hub=okcheon 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-91',
    session: '테마여행 #91, 빈 hub 명소 보강',
    title: '상주·계룡·문경·영동·봉화 GATEO 선정 전수',
    detail:
      '큐 R01 충청·경북 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(상주6·계룡5·문경5·영동5·봉화4 · Tour contentId 20/25 · 썸네일 415/425). 경북·충북·충남 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=sangju · ?hub=gyeryong · ?hub=mungyeong · ?hub=yeongdong · ?hub=bonghwa 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-90',
    session: '테마여행 #90, 빈 hub 명소 보강',
    title: '서산·보은·청양·당진·괴산 GATEO 선정 전수',
    detail:
      '큐 R01 충청 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(서산6·보은5·청양5·당진5·괴산5 · Tour contentId 24/26 · 썸네일 395/400). 충북·충남 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=seosan · ?hub=boeun · ?hub=cheongyang · ?hub=dangjin · ?hub=goesan 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-hub-fill-r01-89',
    session: '테마여행 #89, 빈 hub 명소 보강',
    title: '횡성·화천·충주·증평·세종 GATEO 선정 전수',
    detail:
      '큐 R01 잔여(횡성·화천)와 R02 앞(충주·증평·세종) 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(횡성4·화천4·충주6·증평6·세종6 · Tour contentId 24/26 · 썸네일 371/374). 강원·충북·세종(area 8) 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=hoengseong · ?hub=hwacheon · ?hub=chungju · ?hub=jeungpyeong · ?hub=sejong 선정 목록을 확인해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01-88',
    session: '테마여행 #88, 빈 hub 명소 보강',
    title: '홍천·양구·정선·태백·울진 GATEO 선정 전수',
    detail:
      '큐 R01 강원 잔여 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(홍천6·양구6·정선5·태백5·울진5 · Tour contentId 26/27 · 썸네일 347/348). 강원·경북(울진) 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=hongcheon · ?hub=yanggu · ?hub=jeongseon · ?hub=taebaek · ?hub=uljin 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01-87',
    session: '테마여행 #87, 빈 hub 명소 보강',
    title: '원주·양주·인제·영월·고성 GATEO 선정 전수',
    detail:
      '큐 R01 잔여(원주·양주)와 R02 앞(인제·영월·고성) 다섯 hub attractions 전수를 GATEO 선정에 넣었습니다(원주4·양주4·인제7·영월7·고성6 · Tour contentId 28/28). 경기·강원 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=wonju · ?hub=yangju · ?hub=inje · ?hub=yeongwol · ?hub=goseong 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01a-86',
    session: '테마여행 #86, 빈 hub 명소 보강',
    title: '연천·철원·동두천·이천·평택 GATEO 선정 전수',
    detail:
      '큐 R01 워커A 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(연천5·철원4·동두천4·이천4·평택4 · 전체 293·이미지 293 · Tour contentId 18/21). 경기·강원 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=yeoncheon · ?hub=cheorwon · ?hub=dongducheon · ?hub=icheon · ?hub=pyeongtaek 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01a-85',
    session: '테마여행 #85, 빈 hub 명소 보강',
    title: '진천·아산·천안·의정부·여주 GATEO 선정 전수',
    detail:
      '큐 R01 워커A 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(진천7·아산5·천안5·의정부5·여주5 · 전체 272·이미지 272 · Tour contentId 25/27). 경기·충북·충남 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=jincheon · ?hub=asan · ?hub=cheonan · ?hub=uijeongbu · ?hub=yeoju 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01b-84',
    session: '테마여행 #84, 빈 hub 명소 보강',
    title: '과천·경기광주·화성·옹진·오산 GATEO 선정 전수',
    detail:
      '큐 R01 잔여 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(과천5·경기광주5·화성5·옹진5·오산5 · 전체 245·이미지 245 · Tour contentId 23/25). 경기·인천 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=gwacheon · ?hub=gwangju_gi · ?hub=hwaseong · ?hub=ongjin · ?hub=osan 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
  },
  {
    id: '2026-08-08-scenic-hub-fill-r01a-83',
    session: '테마여행 #83, 빈 hub 명소 보강',
    title: '의왕·양평·용인·군포·구리 GATEO 선정 전수',
    detail:
      '큐 R01 워커A 빈 hub 다섯 곳에 hub attractions 전수를 GATEO 선정에 넣었습니다(의왕6·양평6·용인6·군포5·구리5 · 전체 220·이미지 220). 경기 시도 색인에도 동시 등록했습니다. Preview에서 /korea/theme/scenic?hub=uiwang · ?hub=yangpyeong · ?hub=yongin · ?hub=gunpo · ?hub=guri 선정 목록을 확인해 주세요.',
    at: '2026-08-08',
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
  {
    id: '2026-08-09-scenic-naver-query-89',
    session: '테마여행 #89, 네이버 검색 쿼리',
    title: '명소는 고유명 · 맛집만 지역+상호',
    detail:
      '네이버 검색 쿼리를 나눴습니다. 관광지·명소·명승·레포츠·문화는 이름만, 맛집만 지역+상호로 검색해 플레이스/본문 직행이 잘 되게 했습니다. Preview에서 명소·맛집 각각 검색 결과를 비교해 주세요.',
    at: '2026-08-09',
  },
  {
    id: '2026-08-09-scenic-naver-expand-88',
    session: '테마여행 #88, 네이버 링크 확장',
    title: '레포츠·관광지·문화에도 네이버 칩',
    detail:
      '명승·관광지·레포츠·문화·맛집 상세에 동일 위치(개요 아래·주소 위)로 「네이버 상세정보 보기」를 넣었습니다. Preview에서 주변 관광지·레포츠·문화 상세에도 칩이 보이는지 확인해 주세요.',
    at: '2026-08-09',
  },
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

];
