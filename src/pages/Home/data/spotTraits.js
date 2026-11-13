/** Explore v2 spot traits + monthly picks (does not modify travelSpots.js). */

/** @typedef {{ url: string, label: string }} MonthlyPickSource */
/** @typedef {{ slug: string, reason: string, sources: MonthlyPickSource[], checked: string, estimate?: boolean }} MonthlyPickEntry */

/** @type {Record<string, MonthlyPickEntry[]>} */
export const MONTHLY_PICKS = {
  '2026-11': [
    {
      slug: 'kyoto',
      reason: '11월 중순 단풍 절정·밤 라이트업',
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
      reason: '11/23~25 이펭. 건기 2월까지',
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
      reason: '11월 건기 시작(전환기)',
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
      reason: '10월 억새 절정. 11월 중순은 추정',
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
      reason: '11월 피트니스 챌린지. 걷기 좋아요',
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
      reason: '11/3 멜버른컵. 카니발 10/31~11/7',
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
  '2026-12': [
    {
      slug: 'sapporo',
      reason: '화이트일루 11/20~3/14 오도리~12/25',
      sources: [
        {
          url: 'https://www.sapporo.travel/en/event/event-list/sapporo_white_illumination/',
          label: '삿포로 관광',
        },
        {
          url: 'https://www.sapporo.travel/white-illumination/event/illumination/odori/',
          label: '오도리 회장',
        },
        {
          url: 'https://www.visit-hokkaido.jp/en/event/detail_11003.html',
          label: '홋카이도 관광',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'vienna',
      reason: '라트하우스 마켓 11/13~12/26',
      sources: [
        {
          url: 'https://www.wien.info/de/aktuell/veranstaltungen/wiener-christkindlmarkt-1001446',
          label: '빈 관광청',
        },
        {
          url: 'https://www.christkindlmarkt.at/besuch/',
          label: '크리스트킨들마르크트',
        },
        {
          url: 'https://www.wien.gv.at/freizeit/weihnachtsmaerkte',
          label: '빈 시청',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'hong-kong',
      reason: 'WinterFest 11/18~1/5',
      sources: [
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest.html',
          label: '홍콩관광청 WinterFest',
        },
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest/winter-wonderland-in-tsim-sha-tsui.html',
          label: '침사추이',
        },
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest/winter-wonderland-in-causeway-bay.html',
          label: '코즈웨이베이',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'seoul',
      reason: '서울빛초롱 12/11~1/31 청계천 18~23 무료',
      sources: [
        {
          url: 'https://www.stolantern.com/',
          label: '서울빛초롱축제 공식',
        },
        {
          url: 'https://korean.visitseoul.net/events/2026SeoulLanternFestival/KOPi0rhml',
          label: '서울 공식 관광정보',
        },
      ],
      checked: '2026-11-13',
      estimate: false,
    },
    {
      slug: 'sydney',
      reason: '시드니 새해 불꽃 12/31 21시·자정',
      sources: [
        {
          url: 'https://www.sydneynewyearseve.com/',
          label: '시드니 새해맞이',
        },
        {
          url: 'https://www.sydneynewyearseve.com/fireworks',
          label: '불꽃놀이',
        },
        {
          url: 'https://www.nsw.gov.au/visiting-and-exploring-nsw/nsw-events/new-years-eve-sydney',
          label: 'NSW 정부',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'reykjavik',
      reason: '오로라 9월~4월 가능(보장 없음)',
      sources: [
        {
          url: 'https://visitreykjavik.is/reykjavik-faqs',
          label: '비짓 레이캬비크 FAQ',
        },
        {
          url: 'https://visitreykjavik.is/festivals-and-events-reykjavik/new-years-eve-reykjavik',
          label: '새해 전야',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
  ],
};
