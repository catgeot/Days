/** Explore v2 spot traits + monthly picks (does not modify travelSpots.js). */

/** Step 1 ships November 2026 picks only (`2026-11-01-november-picks.md`). */
export const EXPLORE_V2_MONTHLY_PICK_KEY = '2026-11';

/** @typedef {{ slug: string, reason: string, sources: string[], checked: string, estimate?: boolean }} MonthlyPickEntry */

/** @type {Record<string, MonthlyPickEntry[]>} */
export const MONTHLY_PICKS = {
  '2026-11': [
    {
      slug: 'kyoto',
      reason: '11월 중순 단풍 절정·11월 야간 라이트업',
      sources: [
        'https://global.kyoto.travel/ja/faq/detail.php?faq_id=2040',
        'https://ja.kyoto.travel/flower/momiji/',
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'chiang-mai',
      reason: '이펭 축제 11/23~25·11~2월 건기',
      sources: [
        'https://www.thailandtravel.or.jp/about/calendar/',
        'https://chiangmaipost.net/event/33-chiang-mai-tourist-police-public-announcement-yi-peng-festival-2026',
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'phu-quoc',
      reason: '11월 건기 시작(전환기)',
      sources: ['https://vietnam.travel/places-to-go/mekong-delta/phu-quoc/'],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'jeju',
      reason: '가을 오름 억새(10월)·11월 중순 이후 억새는 추정',
      sources: [
        'https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500309',
        'https://www.visitjeju.net/kr/themtour/view?contentsid=CNTS_200000000013988',
      ],
      checked: '2026-11-01',
      estimate: true,
    },
    {
      slug: 'dubai',
      reason: '11월 Dubai Fitness Challenge·11월 날씨 가이드',
      sources: [
        'https://www.visitdubai.com/en/-/media/Images/pdf/2026/dubai-city-guide-en-2026.pdf',
        'https://www.visitdubai.com/en/articles/dubai-in-november-weather-guide',
        'https://weatherspark.com/y/105470/Average-Weather-in-Dubai-United-Arab-Emirates-Year-Round',
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'melbourne',
      reason: '멜버른컵 2026년 11월 3일·카니발 10/31~11/7',
      sources: [
        'https://www.vrc.com.au/race-days-and-events/2026-2027/lexus-melbourne-cup-day/',
      ],
      checked: '2026-11-01',
      estimate: false,
    },
  ],
};
