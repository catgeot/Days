/**
 * 사용자-facing 업데이트 공지 SSOT.
 * 배포 시 최신 항목을 배열 맨 앞에 추가합니다.
 */
export const RELEASE_NOTES = [
  {
    id: '2026-05-24',
    title: 'GATEO 로고가 새로워졌어요',
    items: ['홈·메뉴에 새 이미지 로고가 적용되었습니다'],
  },
];

export function getLatestRelease() {
  return RELEASE_NOTES[0] ?? null;
}
