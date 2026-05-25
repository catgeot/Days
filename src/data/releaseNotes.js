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
    id: '2026-05-25-2',
    category: 'fix',
    title: '미크로네시아 여행지 플래너가 더 안정적으로 열려요',
    items: [
      '야프·추크·코스라에·폰페이를 검색하거나 지구본에서 눌러도 같은 여행지로 연결돼요',
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
