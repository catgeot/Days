/**
 * Production anon QA targets (docs/qa/pr-external-return/).
 * CI must not depend on this file — use festival-external-return-fixture.js stubs.
 *
 * Owner label `8099001` was e2e-only; live TourAPI festival id is `1122739`.
 */
export const PROD_EXTERNAL_RETURN_FESTIVALS = [
  {
    id: '1122739',
    ownerE2eId: '8099001',
    slug: 'yanggu-1122739',
    region: '강원·양구',
    searchQuery: '시래기',
    title: '청춘양구 펀치볼 시래기사과축제',
    festivalHomeHost: /ygcf\.or\.kr/i,
    nearby: {
      title: '해안야생화공원',
      cardMatch: /해안야생화|야생화/,
      homepage: 'http://haean.kr/user/sub1-2.php',
      homepageHost: /haean\.kr/i,
    },
  },
  {
    id: '2930716',
    slug: 'gangneung-2930716',
    region: '강원·강릉',
    searchQuery: '강릉 국수',
    title: '강릉국수축제',
    festivalHomeHost: /gangneung|gn\.go\.kr|visitkorea/i,
    nearby: {
      title: '강릉 오금집',
      cardMatch: /오금집/,
      homepage: 'https://www.gn.go.kr/www/selectBbsNttView.do',
      homepageHost: /gn\.go\.kr/i,
    },
  },
  {
    id: '637693',
    slug: 'masan-637693',
    region: '경남·마산',
    searchQuery: '마산가고파',
    title: '마산가고파국화축제',
    festivalHomeHost: /changwon\.go\.kr/i,
    nearby: {
      title: '마산항',
      cardMatch: /^마산항/,
      homepage: 'http://masan.mof.go.kr/index.do',
      homepageHost: /masan\.mof\.go\.kr/i,
    },
  },
];

export const PROD_HTTP_NOTICE_FESTIVAL = PROD_EXTERNAL_RETURN_FESTIVALS[0];
