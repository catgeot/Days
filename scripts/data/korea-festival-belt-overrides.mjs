/**
 * 축제 로드(벨트) SSOT — overrides → `npm run generate:korea-festival-belts`
 * `koreaFestivalBelts.json` 직접 편집 금지.
 *
 * Phase 1: 강원 시범 4로드 (#1 확정)
 * `gw-west`(hongcheon→inje)는 #7 밀도 검증 후 append.
 *
 * @type {{
 *   pilotRegion: string,
 *   belts: Array<{
 *     id: string,
 *     label: string,
 *     labelEn: string,
 *     order: number,
 *     pilot?: boolean,
 *     stops: string[],
 *     blurb?: string,
 *   }>,
 * }}
 */
export const KOREA_FESTIVAL_BELT_OVERRIDES = {
  pilotRegion: 'gangwon',
  belts: [
    {
      id: 'gw-north-inland',
      label: '강원 북부 내륙로',
      labelEn: 'Gangwon North Inland Road',
      order: 1,
      pilot: true,
      blurb: '춘천·철원·양구·화천·홍천·횡성 — DMZ·산천어·내륙 축제 동선',
      stops: [
        'chuncheon',
        'cheorwon',
        'yanggu',
        'hwacheon',
        'hongcheon',
        'hoengseong',
      ],
    },
    {
      id: 'gw-east-coast',
      label: '강원 동해안 축제로드',
      labelEn: 'Gangwon East Coast Festival Road',
      order: 2,
      pilot: true,
      blurb: '고성·양양·속초·강릉·삼척 — 동해안 해변·해맞이 축제 루트',
      stops: ['goseong', 'yangyang', 'sokcho', 'gangneung', 'samcheok'],
    },
    {
      id: 'gw-central',
      label: '강원 중부 횡단로',
      labelEn: 'Gangwon Central Cross Road',
      order: 3,
      pilot: true,
      blurb: '원주·정선·평창 — 중부 내륙·겨울·레저 축제 횡단',
      stops: ['wonju', 'jeongseon', 'pyeongchang'],
    },
    {
      id: 'gw-west-jungbu',
      label: '원주·충북 북부로',
      labelEn: 'Wonju · Northern Chungbuk Road',
      order: 4,
      pilot: true,
      blurb: '원주·제천·단양 — 강원-충북 경계 내륙·계곡 축제',
      stops: ['wonju', 'jecheon', 'danyang'],
    },
  ],
};
