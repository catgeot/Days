/**
 * 한국의 10대 절경 — GATEO curated SSOT.
 * `npm run generate:korea-top10-scenic` → koreaTop10Scenic.json
 *
 * 공식 「국가 지정 10대」가 아님. 한국관광 100선(자연·경관)·언론 비경·
 * cityAttractionHubs exact 매칭으로 GATEO가 고른 10곳.
 *
 * attractionName = hub attractions[].name exact (부분 매칭 금지)
 *
 * @type {{
 *   spots: Array<{
 *     rank: number,
 *     id: string,
 *     name: string,
 *     blurb: string,
 *     region: string,
 *     hubId: string,
 *     attractionName: string,
 *     contentId?: string | null,
 *   }>,
 * }}
 */
export const KOREA_TOP10_SCENIC_OVERRIDES = {
  spots: [
    {
      rank: 1,
      id: 'hallasan',
      name: '한라산국립공원',
      blurb: '제주 중심의 한라 — 사계절 능선과 백록담 풍경',
      region: '제주',
      hubId: 'jeju',
      attractionName: '한라산국립공원',
      contentId: '127635',
    },
    {
      rank: 2,
      id: 'seongsan-ilchulbong',
      name: '성산일출봉',
      blurb: '유네스코 세계자연유산 — 일출과 분화구 능선',
      region: '제주',
      hubId: 'seogwipo',
      attractionName: '성산일출봉',
      contentId: '126435',
    },
    {
      rank: 3,
      id: 'seoraksan',
      name: '설악산',
      blurb: '권금성에서 내려다보는 외설악 암봉과 계곡',
      region: '강원',
      hubId: 'sokcho',
      attractionName: '설악산 권금성',
      contentId: '127586',
    },
    {
      rank: 4,
      id: 'suncheon-bay',
      name: '순천만습지',
      blurb: '갈대와 S자 수로 — 흑두루미가 찾는 생태 절경',
      region: '전라',
      hubId: 'suncheon',
      attractionName: '순천만습지',
      contentId: '126730',
    },
    {
      rank: 5,
      id: 'jusangjeolli',
      name: '주상절리대',
      blurb: '중문 해안 기둥 바위 — 파도와 현무암 절벽',
      region: '제주',
      hubId: 'seogwipo',
      attractionName: '주상절리대',
      // Tour title: 대포주상절리
      contentId: '127053',
    },
    {
      rank: 6,
      id: 'haeundae-gwangalli',
      name: '해운대·광안 야경',
      blurb: '부산 해변과 광안대교가 만드는 밤바다 빛',
      region: '경상',
      hubId: 'busan',
      attractionName: '해운대해수욕장',
      contentId: '126081',
    },
    {
      rank: 7,
      id: 'bulguksa',
      name: '불국사·석굴암 일대',
      blurb: '세계유산 사찰과 토함산 자락의 고요한 경관',
      region: '경상',
      hubId: 'gyeongju',
      attractionName: '불국사',
      contentId: '126166',
    },
    {
      rank: 8,
      id: 'naejangsan',
      name: '내장산국립공원',
      blurb: '단풍으로 유명한 내장 — 능선과 계곡의 사계',
      region: '전라',
      hubId: 'jeongeup',
      attractionName: '내장산국립공원',
      contentId: '126237',
    },
    {
      rank: 9,
      id: 'boseong-tea',
      name: '보성녹차밭',
      blurb: '구릉을 따라 펼쳐진 녹차밭의 초록 물결',
      region: '전라',
      hubId: 'boseong',
      attractionName: '보성녹차밭',
      // Tour title: 대한다원 (보성 녹차밭 대표)
      contentId: '127869',
    },
    {
      rank: 10,
      id: 'tongyeong-hallyeo',
      name: '통영·한려 경관',
      blurb: '한려해상 다도해 — 케이블카에서 보는 통영 앞바다',
      region: '경상',
      hubId: 'tongyeong',
      attractionName: '통영케이블카',
      contentId: '533874',
    },
  ],
};
