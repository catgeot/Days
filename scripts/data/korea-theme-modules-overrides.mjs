/**
 * 한국의 테마여행 모듈 카탈로그 SSOT.
 * `npm run generate:korea-theme-modules` → koreaThemeModules.json
 *
 * order로 랜딩 타일 순서를 나중에 재정렬한다.
 *
 * @type {{
 *   modules: Array<{
 *     id: string,
 *     label: string,
 *     blurb: string,
 *     order: number,
 *     enabled: boolean,
 *     path: string,
 *     icon: string,
 *   }>,
 * }}
 */
export const KOREA_THEME_MODULE_OVERRIDES = {
  modules: [
    {
      id: 'festivals',
      label: '한국의 축제',
      blurb: '시즌·지역·테마로 찾는 축제 현장',
      order: 10,
      enabled: true,
      path: '/korea',
      icon: 'calendar',
    },
    {
      id: 'top10',
      label: '한국의 10대 절경',
      blurb: 'GATEO가 고른 대표 절경 열 곳',
      order: 20,
      enabled: true,
      path: '/korea/theme/top10',
      icon: 'mountain',
    },
    {
      id: 'scenic',
      label: '한국의 명승지',
      blurb: '권역별 명승·풍경 큐레이션',
      order: 30,
      enabled: true,
      path: '/korea/theme/scenic',
      icon: 'landmark',
    },
    {
      id: 'courses',
      label: '여행코스',
      blurb: 'TourAPI 지역별 추천 코스·구간',
      order: 35,
      enabled: true,
      path: '/korea/theme/courses',
      icon: 'route',
    },
    {
      id: 'regions',
      label: '방방곡곡',
      blurb: '시도·도시 허브로 이어가는 국내 여행',
      order: 40,
      enabled: true,
      path: '/korea/theme/regions',
      icon: 'map',
    },
    {
      id: 'packages',
      label: '패키지 상품',
      blurb: 'MRT 국내 패키지·에어텔 둘러보기',
      order: 50,
      enabled: true,
      path: '/korea/theme/packages',
      icon: 'package',
    },
  ],
};
