/**
 * Cloud feature Preview용 작업 로그 SSOT.
 * 에이전트: 세션마다 항목을 맨 앞에 append · 프로젝트 끝나면 active=false.
 * 상세 규칙: AGENTS.md Cloud「세션 표기 · 고정 Preview · 작업 로그」
 */
export const cloudPreviewProject = {
  active: true,
  title: '독도 검색',
  sessionNo: 1,
  sessionPhase: '허브 SSOT',
  branch: 'cursor/dokdo-search-a849',
  previewPath: '/',
  qaShareSlug: 'dokdo',
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
