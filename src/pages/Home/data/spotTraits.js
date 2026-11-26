/** Explore v2 spot traits + monthly picks (does not modify travelSpots.js). */

/** @typedef {{ url: string, label: string, label_en?: string }} MonthlyPickSource */
/** @typedef {{ slug: string, reason: string, reason_en: string, best?: string, best_en?: string, sources: MonthlyPickSource[], checked: string, estimate?: boolean }} MonthlyPickEntry */

/** @type {Record<string, MonthlyPickEntry[]>} */
export const MONTHLY_PICKS = {
  '2026-11': [
    {
      slug: 'kyoto',
      reason: '11월 중순 단풍·야경',
      reason_en: 'Nov leaves·lights',
      best: '11월 중순부터 단풍 달력이 물드는 때를 알려 줘요. 단풍철에는 일부 사찰과 신사에서 야간 라이트업을 해요.',
      best_en: 'From mid-November the leaf calendar tracks the color. Some temples and shrines light up in the evening during leaf season.',
      sources: [
        {
          url: 'https://www.kyoto.travel/en/seasonal-info/autumnleaves/',
          label: '교토관광협회',
          label_en: 'Kyoto City Tourism Association',
        },
        {
          url: 'https://www.kyoto.travel/en/events',
          label: '교토관광협회·이벤트',
          label_en: 'Kyoto City Tourism Association · events',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'chiang-mai',
      reason: '11/23~25 이펭·건기',
      reason_en: 'Yi Peng Nov 23–25',
      best: '시내에서는 하늘 풍등을 날리지 말라고 관광경찰이 안내해요. 11월은 북부가 서늘해지는 계절이에요.',
      best_en: 'Tourist police ask you not to release sky lanterns in the city. November is when the north turns cool.',
      sources: [
        {
          url: 'https://chiangmaipost.net/event/33-chiang-mai-tourist-police-public-announcement-yi-peng-festival-2026',
          label: '치앙마이 포스트',
          label_en: 'Chiang Mai Post',
        },
        {
          url: 'https://www.tourismthailand.org/Articles/thailand-november',
          label: '태국관광청·11월',
          label_en: 'Tourism Authority of Thailand · November',
        },
        {
          url: 'https://www.thailandtravel.or.jp/about/calendar/',
          label: '태국관광청',
          label_en: 'Tourism Authority of Thailand',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'phu-quoc',
      reason: '11월 건기 시작',
      reason_en: 'Dry season·Nov',
      best: '11월부터 4월까지가 건기예요. 바다가 잔잔하고 하늘이 맑아서, 사오 해변과 혼톰 케이블카를 보기 좋아요.',
      best_en: 'November to April is the dry season. Seas stay calm and skies clear, so Sao Beach and the Hon Thom cable car are at their best.',
      sources: [
        {
          url: 'https://vietnam.travel/places-to-go/mekong-delta/phu-quoc/',
          label: '베트남 관광청',
          label_en: 'Vietnam Tourism',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'jeju',
      reason: '11월 말 해안·오름',
      reason_en: 'Late Nov·coast',
      best: '11월 말에는 새별오름에서 서쪽 해안과 비양도를 봐요. 정상까지 20~30분이고, 연중 열려 있어요.',
      best_en: 'In late November, Saebyeol Oreum looks over the west coast and Biyangdo. The summit is a 20–30 minute walk, and it stays open all year.',
      sources: [
        {
          url: 'https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500309',
          label: '제주관광공사',
          label_en: 'Jeju Tourism Organization',
        },
        {
          url: 'https://www.visitjeju.net/kr/themtour/view?contentsid=CNTS_200000000013988',
          label: '제주관광공사·테마투어',
          label_en: 'Jeju Tourism Organization · theme tour',
        },
      ],
      checked: '2026-11-20',
      estimate: false,
    },
    {
      slug: 'dubai',
      reason: '11월 피트니스·산책',
      reason_en: 'Nov fitness walks',
      best: '11월에는 두바이 피트니스 챌린지가 열려요. 30일 동안 하루 30분을 움직이고, 마리나 워크와 주메이라 트랙을 걷기 좋아요.',
      best_en: 'November is the Dubai Fitness Challenge: 30 minutes a day for 30 days. Marina Walk and the Jumeirah track are easy walks.',
      sources: [
        {
          url: 'https://www.visitdubai.com/en/-/media/Images/pdf/2026/dubai-city-guide-en-2026.pdf',
          label: '두바이 관광청',
          label_en: 'Visit Dubai',
        },
        {
          url: 'https://www.visitdubai.com/en/articles/dubai-in-november-weather-guide',
          label: '두바이 관광청·11월 날씨',
          label_en: 'Visit Dubai · November weather',
        },
        {
          url: 'https://weatherspark.com/y/105470/Average-Weather-in-Dubai-United-Arab-Emirates-Year-Round',
          label: '웨더스파크',
          label_en: 'WeatherSpark',
        },
      ],
      checked: '2026-11-01',
      estimate: false,
    },
    {
      slug: 'melbourne',
      reason: '11월 말 멜버른·해변',
      reason_en: 'Late Nov·gardens',
      best: '11월은 멜버른의 봄이에요. 식물원이 피고, 세인트킬다 해변을 산책하기 좋아요.',
      best_en: 'November is spring in Melbourne. The gardens are in bloom, and St Kilda beach is an easy walk.',
      sources: [
        {
          url: 'https://www.visitvictoria.com/regions/melbourne/see-and-do/itineraries/melbourne-in-spring',
          label: '빅토리아 관광청·봄',
          label_en: 'Visit Victoria · spring',
        },
        {
          url: 'https://www.visitvictoria.com/regions/melbourne/see-and-do/nature-and-wildlife/beaches-and-coastlines',
          label: '빅토리아 관광청·해변',
          label_en: 'Visit Victoria · beaches',
        },
        {
          url: 'https://www.visitvictoria.com/regions/melbourne',
          label: '빅토리아 관광청',
          label_en: 'Visit Victoria',
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
      best: '11월 20일부터 3월 14일까지 오도리 공원 조명이 켜져요. 자정까지라서 밤산책이 좋아요.',
      best_en: 'Odori Park stays lit from 20 November to 14 March, until midnight, so a late walk works.',
      sources: [
        {
          url: 'https://www.sapporo.travel/en/event/event-list/sapporo_white_illumination/',
          label: '삿포로 관광',
          label_en: 'Sapporo Tourism',
        },
        {
          url: 'https://www.sapporo.travel/white-illumination/event/illumination/odori/',
          label: '오도리 회장',
          label_en: 'Odori venue',
        },
        {
          url: 'https://www.visit-hokkaido.jp/en/event/detail_11003.html',
          label: '홋카이도 관광',
          label_en: 'Visit Hokkaido',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'vienna',
      reason: '빈 마켓 11/13~',
      reason_en: 'Xmas market Nov–',
      best: '시청 광장 마켓에서 수공예와 따뜻한 음료를 즐겨요. 공원 아이스링크도 있고, 대부분 10시부터 22시까지예요.',
      best_en: 'The Rathausplatz market has crafts and warm drinks, plus skating in the park. Most days run 10:00–22:00.',
      sources: [
        {
          url: 'https://www.wien.info/de/aktuell/veranstaltungen/wiener-christkindlmarkt-1001446',
          label: '빈 관광청',
          label_en: 'Vienna Tourist Board',
        },
        {
          url: 'https://www.christkindlmarkt.at/besuch/',
          label: '크리스트킨들마르트',
          label_en: 'Christkindlmarkt',
        },
        {
          url: 'https://www.wien.gv.at/freizeit/weihnachtsmaerkte',
          label: '빈 시청',
          label_en: 'City of Vienna',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'hong-kong',
      reason: '윈터페스트 11/18~',
      reason_en: 'WinterFest Nov 18–',
      best: '11월 18일부터 1월 5일까지 센트럴과 침사추이 윈터 원더랜드가 열려요. 빅토리아 하버에서 새해 카운트다운도 해요.',
      best_en: 'Winter Wonderlands in Central and Tsim Sha Tsui run from 18 November to 5 January, with a New Year countdown over Victoria Harbour.',
      sources: [
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest.html',
          label: '홍콩관광청 WinterFest',
          label_en: 'Hong Kong Tourism Board · WinterFest',
        },
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest/winter-wonderland-in-tsim-sha-tsui.html',
          label: '침사추이',
          label_en: 'Tsim Sha Tsui',
        },
        {
          url: 'https://www.discoverhongkong.com/eng/events/hong-kong-winterfest/winter-wonderland-in-causeway-bay.html',
          label: '코즈웨이베이',
          label_en: 'Causeway Bay',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'seoul',
      reason: '빛초롱 12/11~',
      reason_en: 'Lantern fest Dec',
      best: '12월 11일부터 1월 31일까지 청계천에서 빛초롱이 켜져요. 매일 18시부터 23시까지고, 무료예요.',
      best_en: 'Lanterns light Cheonggyecheon from 11 December to 31 January, 18:00–23:00, and entry is free.',
      sources: [
        {
          url: 'https://www.stolantern.com/',
          label: '서울빛초롱축제 공식',
          label_en: 'Seoul Lantern Festival',
        },
        {
          url: 'https://korean.visitseoul.net/events/2026SeoulLanternFestival/KOPi0rhml',
          label: '서울 공식 관광정보',
          label_en: 'Visit Seoul',
        },
      ],
      checked: '2026-11-13',
      estimate: false,
    },
    {
      slug: 'sydney',
      reason: '12/31 새해 불꽃',
      reason_en: 'NYE Dec 31',
      best: '자정에 하버 브리지와 오페라 하우스에서 메인 불꽃을 터뜨려요. 9시에는 퍼스트 네이션 불꽃이 먼저 나와요.',
      best_en: 'At midnight the main fireworks launch from the Harbour Bridge and the Opera House. A First Nations display starts at 9pm.',
      sources: [
        {
          url: 'https://www.sydneynewyearseve.com/',
          label: '시드니 새해맞이',
          label_en: 'Sydney New Year’s Eve',
        },
        {
          url: 'https://www.sydneynewyearseve.com/fireworks',
          label: '불꽃놀이',
          label_en: 'Fireworks schedule',
        },
        {
          url: 'https://www.nsw.gov.au/visiting-and-exploring-nsw/nsw-events/new-years-eve-sydney',
          label: 'NSW 정부',
          label_en: 'NSW Government',
        },
      ],
      checked: '2026-11-10',
      estimate: false,
    },
    {
      slug: 'reykjavik',
      reason: '12월 오로라 관측시기',
      reason_en: 'Aurora view season',
      best: '12월은 오로라를 보기 좋은 달이에요. 9월 초부터 4월 말까지 보일 수 있고, 10월부터 3월이 더 잘 맞아요.',
      best_en: 'December sits in aurora season. Lights can show from early September through April, and October to March is the better window.',
      sources: [
        {
          url: 'https://visitreykjavik.is/reykjavik-faqs',
          label: '비짓 레이캬비크 FAQ',
          label_en: 'Visit Reykjavík FAQ',
        },
      ],
      checked: '2026-11-25',
      estimate: false,
    },
  ],
};
