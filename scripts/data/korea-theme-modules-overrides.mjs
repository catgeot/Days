/**
 * 한국의 명승 · 축제 투톱 모듈 SSOT (#33).
 * `npm run generate:korea-theme-modules` → koreaThemeModules.json
 *
 * 탑레벨 노출: festivals · scenic 만.
 * top10 / regions / packages / courses = enabled:false (라우트·deep-link용 유지).
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
      id: 'scenic',
      label: '한국의 명승',
      blurb: '관광지·맛집·숙소·투어로 이어가는 명승',
      order: 20,
      enabled: true,
      path: '/korea/theme/scenic',
      icon: 'landmark',
    },
    {
      id: 'courses',
      label: '여행코스',
      blurb: '상세에서 이어가는 추천 코스',
      order: 90,
      enabled: false,
      path: '/korea/theme/courses',
      icon: 'route',
    },
    {
      id: 'top10',
      label: '한국의 10대 절경',
      blurb: 'GATEO가 고른 대표 절경 열 곳',
      order: 91,
      enabled: false,
      path: '/korea/theme/top10',
      icon: 'mountain',
    },
    {
      id: 'regions',
      label: '방방곡곡',
      blurb: '시도·도시 허브로 이어가는 국내 여행',
      order: 92,
      enabled: false,
      path: '/korea/theme/regions',
      icon: 'map',
    },
    {
      id: 'packages',
      label: '패키지 상품',
      blurb: '상세에서 매칭되는 MRT 패키지',
      order: 93,
      enabled: false,
      path: '/korea/theme/packages',
      icon: 'package',
    },
  ],
};
