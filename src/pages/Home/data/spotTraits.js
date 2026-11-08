/** Explore v2 spot traits + monthly picks (does not modify travelSpots.js). */

/** Step 1 ships November 2026 picks only (`2026-11-01-november-picks.md`). */
export const EXPLORE_V2_MONTHLY_PICK_KEY = '2026-11';

/** @typedef {{ url: string, label: string }} MonthlyPickSource */
/** @typedef {{ slug: string, reason: string, sources: MonthlyPickSource[], checked: string, estimate?: boolean }} MonthlyPickEntry */

/** @type {Record<string, MonthlyPickEntry[]>} */
export const MONTHLY_PICKS = {
  '2026-11': [
    {
      slug: 'kyoto',
      reason: '11월 중순 단풍 절정. 밤 라이트업까지 맞습니다.',
      sources: [
        {
          url: 'https://www.kyoto.travel/en/seasonal-info/autumnleaves/',
          label: '교토관광협회',
        },
        {
          url: 'https://www.kyoto.travel/en/events',
          label: '교토관광협회·이벤트',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'chiang-mai',
      reason: '11/23–25 이펭. 건기라 하늘이 맑습니다.',
      sources: [
        {
          url: 'https://www.thailandtravel.or.jp/about/calendar/',
          label: '태국관광청',
        },
        {
          url: 'https://chiangmaipost.net/event/33-chiang-mai-tourist-police-public-announcement-yi-peng-festival-2026',
          label: '치앙마이 포스트',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'phu-quoc',
      reason: '11월 건기 시작. 바다가 잔잔해집니다.',
      sources: [
        {
          url: 'https://vietnam.travel/places-to-go/mekong-delta/phu-quoc/',
          label: '베트남 관광청',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'jeju',
      reason: '억새 절정은 10월. 11월 중순 이후는 추정.',
      sources: [
        {
          url: 'https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500309',
          label: '제주관광공사',
        },
        {
          url: 'https://www.visitjeju.net/kr/themtour/view?contentsid=CNTS_200000000013988',
          label: '제주관광공사·테마투어',
        },
      ],
      checked: '2026-11-01',
      estimate: true,
    },
    {
      slug: 'dubai',
      reason: '더위가 풀린 11월. 걷고 챌린지하기 좋습니다.',
      sources: [
        {
          url: 'https://www.visitdubai.com/en/-/media/Images/pdf/2026/dubai-city-guide-en-2026.pdf',
          label: '두바이 관광청',
        },
        {
          url: 'https://www.visitdubai.com/en/articles/dubai-in-november-weather-guide',
          label: '두바이 관광청·11월 날씨',
        },
        {
          url: 'https://weatherspark.com/y/105470/Average-Weather-in-Dubai-United-Arab-Emirates-Year-Round',
          label: '웨더스파크',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'melbourne',
      reason: '11/3 멜버른컵. 도시가 가장 붐비는 주간.',
      sources: [
        {
          url: 'https://www.vrc.com.au/race-days-and-events/2026-2027/lexus-melbourne-cup-day/',
          label: '빅토리아 경마장',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
  ],
};
