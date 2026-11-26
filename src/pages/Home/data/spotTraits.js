/** Explore v2 spot traits + monthly picks (does not modify travelSpots.js). */

/** @typedef {{ url: string, label: string }} MonthlyPickSource */
/** @typedef {{ slug: string, reason: string, reason_en: string, sources: MonthlyPickSource[], checked: string, estimate?: boolean }} MonthlyPickEntry */

/** @type {Record<string, MonthlyPickEntry[]>} */
export const MONTHLY_PICKS = {
  '2026-11': [
    {
      slug: 'kyoto',
      reason: '11월 중순 단풍·야경',
      reason_en: 'Nov leaves·lights',
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
      reason: '11/23~25 이펭·건기',
      reason_en: 'Yi Peng Nov 23–25',
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
      reason: '11월 건기 시작',
      reason_en: 'Dry season·Nov',
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
      reason: '11월 말 해안·오름',
      reason_en: 'Late Nov·coast',
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
      checked: '2026-11-20',
      estimate: false,
    },
    {
      slug: 'dubai',
      reason: '11월 피트니스·산책',
      reason_en: 'Nov fitness walks',
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
      reason: '11월 말 멜버른·해변',
      reason_en: 'Late Nov·gardens',
      sources: [
        {
          url: 'https://www.visitvictoria.com/regions/melbourne',
          label: '빅토리아 관광청',
        },
      ],
      checked: '2026-11-20',
      estimate: false,
    },
  ],
  '2026-12': [
    {
      slug: 'sapporo',
      reason: '오도리 일루 11/20~',
      reason_en: 'Odori lights Nov–',
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
      reason: '빈 마켓 11/13~',
      reason_en: 'Xmas market Nov–',
      sources: [
        {
          url: 'https://www.wien.info/de/aktuell/veranstaltungen/wiener-christkindlmarkt-1001446',
          label: '빈 관광청',
        },
        {
          url: 'https://www.christkindlmarkt.at/besuch/',
          label: '크리스트킨들마르트',
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
      reason: '윈터페스트 11/18~',
      reason_en: 'WinterFest Nov 18–',
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
      reason: '빛초롱 12/11~',
      reason_en: 'Lantern fest Dec',
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
      reason: '12/31 새해 불꽃',
      reason_en: 'NYE Dec 31',
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
      reason: '12월 오로라 관측시기',
      reason_en: 'Aurora view season',
      sources: [
        {
          url: 'https://visitreykjavik.is/reykjavik-faqs',
          label: '비짓 레이캬비크 FAQ',
        },
      ],
      checked: '2026-11-25',
      estimate: false,
    },
  ],
  '2027-01': [
    {
      slug: 'okinawa',
      reason: '나고 벚꽃 1/30~',
      reason_en: 'Nago sakura 1/30–',
      sources: [
        {
          url: 'https://nagomun.or.jp/recommend/18205/',
          label: '나고시관광협회',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'kuala-lumpur',
      reason: '타이푸삼 순례 1/22',
      reason_en: 'Thaipusam Jan 22',
      sources: [
        {
          url: 'https://www.timeanddate.com/holidays/malaysia/thaipusam',
          label: '타임앤데이트(2차)',
        },
        {
          url: 'https://ecentral.my/wp-content/uploads/2026/10/HKA_2027.pdf',
          label: '공휴일표 사본(2차)',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'banff-national-park',
      reason: '스노데이즈 1/21~2/7',
      reason_en: 'SnowDays 1/21–2/7',
      sources: [
        {
          url: 'https://www.banfflakelouise.com/events/snowdays',
          label: '밴프·레이크루이스 관광청',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'zermatt',
      reason: '스키 시즌 ~4/30',
      reason_en: 'Ski season to 4/30',
      sources: [
        {
          url: 'https://snow.myswitzerland.com/snow_reports/zermatt-matterhorn-ski-paradise-170/',
          label: '스위스관광청',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'maldives',
      reason: '11~4월 건기',
      reason_en: 'Dry season Nov–Apr',
      sources: [
        {
          url: 'https://visitmaldives.com/en/maldives/travel-information',
          label: '비짓 몰디브',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'hawaii',
      reason: '혹등고래 12~5월',
      reason_en: 'Whales Dec–May',
      sources: [
        {
          url: 'https://www.gohawaii.com/experiences/adventure/whale-watching',
          label: 'Go Hawaii',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'bangkok',
      reason: '11~2월 시원한 건기',
      reason_en: 'Cool dry Nov–Feb',
      sources: [
        {
          url: 'https://www.tatnews.org/2020/11/thailands-comfortable-cooler-months-of-november-february-are-a-fantastic-time-to-travel/',
          label: '태국관광청(2020)',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
    {
      slug: 'perth',
      reason: '프린지 1/20~2/14',
      reason_en: 'Fringe 1/20–2/14',
      sources: [
        {
          url: 'https://fringeworld.com.au/',
          label: 'FRINGE WORLD',
        },
      ],
      checked: '2026-11-17',
      estimate: false,
    },
  ],
};