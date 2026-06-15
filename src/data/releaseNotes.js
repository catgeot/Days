/**
 * 사용자-facing 업데이트 공지 SSOT.
 *
 * 배포 시 최신 항목을 RELEASE_NOTES 배열 **맨 앞**에 추가합니다.
 * id는 YYYY-MM-DD 형식(같은 날 여러 건이면 -2, -3 접미사).
 *
 * @typedef {'feature' | 'partner' | 'fix' | 'notice'} ReleaseCategory
 * @typedef {{ id: string, title: string, items: string[], category?: ReleaseCategory, date?: string }} ReleaseNote
 */

/** @type {ReleaseNote[]} */
export const RELEASE_NOTES = [
  {
    id: '2026-06-15',
    category: 'feature',
    title: '홈 지구본 카테고리 버튼으로 대륙을 빠르게 둘러보세요',
    items: [
      '카테고리 버튼을 누르면 서울·아프리카·유럽·북미·남미 권역으로 지구본이 이동해요.',
    ],
  },
  {
    id: '2026-06-07',
    category: 'fix',
    title: '3D 투어 중에도 지명과 행정 구분선을 볼 수 있어요',
    items: [
      '3D 투어를 보면서도 지도의 지명과 국경·행정 구분선이 표시돼요 (눈 버튼이 켜져 있을 때).',
      '투어 중 화면의 지명이나 마커를 탭하면 그 장소를 바로 선택할 수 있어요.',
    ],
  },
  {
    id: '2026-06-03',
    category: 'feature',
    title: '홈 지구본에서 여행지 3D 투어를 즐겨보세요',
    items: [
      '장소를 고르면 「3D 투어」로 그곳의 지형과 풍경을 둘러볼 수 있어요.',
      '휴대폰에서는 화면을 넓게 쓰도록 간결한 안내와 Skip·2D로 복귀 버튼을 제공해요.',
      '투어가 끝나면 다시 지구본으로 돌아와 다른 여행지를 탐색할 수 있어요.',
    ],
  },
  {
    id: '2026-06-01',
    category: 'feature',
    title: 'MOONi 채팅 — 여행 정보 확인부터 예약까지',
    items: [
      'MOONi 채팅을 통해 항공권, 숙소, 교통 정보를 확인하고 예약까지 이어갈 수 있어요.',
      'MOONi와 함께 여행지를 탐색하고, 출발해 보세요.',
    ],
  },
  {
    id: '2026-05-29',
    category: 'feature',
    title: 'MOONi 채팅 — 주제 칩·해외 출발 항공 연동',
    items: [
      '장소카드 MOONi에서 「궁금해?」「가는 방법」「출발 준비」「즐길거리」 2단 주제 칩으로 빠르게 질문할 수 있어요.',
      '마닐라·싱가포르·런던 등 해외 출발지도 항공 검색에 반영돼요 (예: 마닐라→발리 MNL→DPS).',
    ],
  },
  {
    id: '2026-05-26',
    category: 'feature',
    title: 'MOONi 채팅에서 예약·출발 전 준비까지',
    items: [
      'MOONi 채팅으로 예약과 출발 전 준비를 할 수 있어요',
      '복잡한 여행 준비를 MOONi와 함께 시작해 보세요',
    ],
  },
  {
    id: '2026-05-25-3',
    category: 'feature',
    title: '미크로네시아 연방 여행지가 새로 추가됐어요',
    items: [
      '야프·추크 라군·코스라에·폰페이 네 곳을 검색하거나 지구본에서 바로 열 수 있어요',
      '각 섬의 사진 갤러리·여행 위키·여행 준비 가이드를 이용할 수 있어요',
    ],
  },
  {
    id: '2026-05-25-2',
    category: 'fix',
    title: '미크로네시아 여행지 플래너가 더 안정적으로 열려요',
    items: [
      '야프·추크 라군·코스라에·폰페이를 검색하거나 지구본에서 눌러도 같은 여행지로 연결돼요',
      '이전에 만든 여행 준비 가이드도 다시 불러올 수 있어요',
    ],
  },
  {
    id: '2026-05-25',
    category: 'fix',
    title: '장소 카드 읽기가 더 편해졌어요',
    items: [
      '갤러리·위키·리뷰 탭에서도 상단 헤더를 탭하면 맨 위로 이동해요',
      '본문을 두 손가락으로 확대해 읽을 수 있어요',
    ],
  },
  {
    id: '2026-05-24-2',
    category: 'feature',
    title: 'MOONi AI 여행 도우미를 만나보세요',
    items: [
      '채팅봇 MOONi와 여행 이야기를 나눌 수 있어요',
      '목적지·일정·여행 팁 등 궁금한 점을 편하게 물어보세요',
      'MOONi 를 드래그해서 원하는 위치로 옮길 수 있어요',
    ],
  },
  {
    id: '2026-05-24',
    category: 'feature',
    title: 'GATEO 로고가 새로워졌어요',
    items: ['홈·메뉴에 새 이미지 로고가 적용되었습니다'],
  },
];

export const RELEASE_CATEGORY_LABELS = {
  feature: '새 기능',
  partner: '제휴 입점',
  fix: '개선',
  notice: '공지',
};

export function getLatestRelease() {
  return RELEASE_NOTES[0] ?? null;
}

export function getAllReleases() {
  return RELEASE_NOTES;
}

export function formatReleaseDate(release) {
  const raw = release?.date ?? release?.id ?? '';
  const match = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;
  const [, year, month, day] = match;
  return `${year}. ${Number(month)}. ${Number(day)}.`;
}
