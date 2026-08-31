/**
 * 해외·큐레이션 행사 SSOT — overrides → `npm run generate:world-events`
 * `worldEvents.json` 직접 편집 금지.
 *
 * Wave 1 (P2-a): Q3 확정 slug 15건 — 유럽·아시아·아메리카·오세아니아·니치
 * Wave 2 (#33): singapore · dubai — D5-b 템플릿
 * Wave 2 (#42): barcelona · istanbul — D5-b 템플릿
 * D5-b-3 #34 배치 A: vienna · amsterdam · prague · marrakech
 * D5-b-3 #35 배치 B: tokyo · kyoto · bangkok
 *
 * @typedef {import('../lib/world-event-schema.mjs').WorldEventOverride} WorldEventOverride
 */

/** @type {WorldEventOverride[]} */
export const WORLD_EVENT_OVERRIDES = [
  {
    id: 'vienna-staatsoper-season-2026',
    slug: 'vienna',
    hubId: 'vienna',
    type: 'season',
    title: '빈 국립오페라 시즌',
    titleEn: 'Vienna State Opera Season',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    recurrence: 'annual',
    recurrenceNote: '9월~익년 6월',
    recurrenceNoteEn: 'Sep–Jun (following year)',
    venue: { name: 'Vienna State Opera' },
    source: 'official_url',
    sourceUrl: 'https://www.wiener-staatsoper.at/en/',
    bookingHints: '오페라 시즌 숙소는 1구·카발티에르 근처',
    detailOverview:
      '9월부터 익년 6월까지 이어지는 오페라·발레·콘서트 시즌입니다. 전체 기간 숙박보다 공연 일정에 맞춘 2~4박 방문이 일반적이며, 관람하려는 작품·날짜를 먼저 정한 뒤 숙소를 잡는 것이 좋습니다.',
    highlights: [
      '국립오페라 본관·Musikverein 등 클래식 공연장',
      '스탠딩석(Stehplatz) — 당일 현장 구매 가능(인기 공연은 조기 매진)',
      '1구·카발티에르 도보권 숙소가 공연장 이동에 유리',
    ],
    stayAreas: [
      {
        name: '1구 · 스테판스플atz',
        mrtKeyword: 'Vienna Innere Stadt',
        note: '국립오페라·히스토릭 센터 도보 10~15분',
      },
      {
        name: '카발티에르 · Karlsplatz',
        mrtKeyword: 'Vienna Karlsplatz',
        note: 'U-Bahn 접근 · 1구 공연장 버스 10분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Staatsoper_Wien_DSC_5273w.jpg/1280px-Staatsoper_Wien_DSC_5273w.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Staatsoper_Wien_DSC_5273w.jpg/1280px-Staatsoper_Wien_DSC_5273w.jpg',
        captionKo: '빈 국립오페라',
        captionEn: 'Vienna State Opera',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Wien_-_Haus_des_Wiener_Musikvereins_%281%29.JPG/1280px-Wien_-_Haus_des_Wiener_Musikvereins_%281%29.JPG',
        captionKo: '빈 뮤직페어라인',
        captionEn: 'Musikverein Vienna',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Wiener_Staatsoper_Front.jpg/1280px-Wiener_Staatsoper_Front.jpg',
        captionKo: '국립오페라 정면',
        captionEn: 'State Opera front',
      },
    ],
    glossaryTerms: [
      {
        id: 'staatsoper',
        termKo: '국립오페라',
        termEn: 'State Opera',
        promptKo:
          '빈 국립오페라(Staatsoper)가 오페라 시즌 방문에서 왜 중심인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'Why Vienna State Opera matters for opera season visitors in 3 short sentences.',
        searchQueryKo: '빈 국립오페라 공연 예매',
        searchQueryEn: 'Vienna State Opera tickets',
        referenceUrl: 'https://en.wikipedia.org/wiki/Vienna_State_Opera',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/빈_국립_오페라_극장',
      },
      {
        id: 'stehplatz',
        termKo: '스탠딩석',
        termEn: 'Stehplatz',
        promptKo:
          '빈 오페라 스탠딩석(Stehplatz)이 무엇인지, 당일 구매 팁을 3문장 이내로 설명해줘.',
        promptEn: 'What is Stehplatz standing room at Vienna Opera? 3 short sentences.',
        searchQueryKo: '빈 오페라 스탠딩석 Stehplatz',
        searchQueryEn: 'Vienna Opera Stehplatz standing tickets',
      },
      {
        id: 'musikverein',
        termKo: '뮤직페어라인',
        termEn: 'Musikverein',
        promptKo:
          '빈 뮤직페어라인이 국립오페라와 어떤 차이가 있는지, 클래식 공연 방문 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Musikverein vs State Opera for classical concerts in 3 short sentences.',
        searchQueryKo: '빈 뮤직페어라인 공연',
        searchQueryEn: 'Vienna Musikverein concerts',
        referenceUrl: 'https://en.wikipedia.org/wiki/Musikverein',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/뮤직_페어',
      },
      {
        id: 'innere-stadt',
        termKo: '1구 Innere Stadt',
        termEn: 'Innere Stadt',
        promptKo:
          '빈 1구(Innere Stadt) 숙소가 오페라 시즌 방문에 왜 유리한지 3문장 이내로 설명해줘.',
        promptEn: 'Why stay in Vienna Innere Stadt for opera season in 3 short sentences.',
        searchQueryKo: '빈 1구 숙소 오페라',
        searchQueryEn: 'Vienna Innere Stadt hotel opera',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'staatsoper-tickets',
            labelKo: '국립오페라 예매',
            labelEn: 'State Opera tickets',
            kind: 'tour',
            href: 'https://www.wiener-staatsoper.at/en/',
          },
          {
            id: 'musikverein-search',
            labelKo: '뮤직페어라인 검색',
            labelEn: 'Musikverein search',
            kind: 'shop',
            searchQueryKo: '빈 뮤직페어라인 공연',
            searchQueryEn: 'Vienna Musikverein concerts',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'stehplatz-guide',
            labelKo: '스탠딩석 가이드',
            labelEn: 'Stehplatz guide',
            kind: 'shop',
            searchQueryKo: '빈 오페라 스탠딩석',
            searchQueryEn: 'Vienna Opera Stehplatz',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '빈 국립오페라',
    youtubeSearchQueryEn: 'Vienna State Opera',
    mooniChips: [
      {
        id: 'stehplatz-tips',
        promptKo: '스탠딩석 당일 구매 팁 알려줘',
        promptEn: 'Tips for buying Stehplatz standing tickets?',
      },
      {
        id: 'best-shows',
        promptKo: '오페라 시즌 추천 공연 알려줘',
        promptEn: 'Which shows to book during opera season?',
      },
      {
        id: 'innere-stadt-stay',
        promptKo: '1구 숙소 추천 기준 알려줘',
        promptEn: 'How to pick a hotel in Innere Stadt?',
      },
    ],
    priority: 1,
  },
  {
    id: 'munich-oktoberfest-2026',
    slug: 'munich',
    hubId: 'munich',
    type: 'festival',
    title: '옥토버페스트',
    titleEn: 'Oktoberfest',
    startDate: '2026-09-19',
    endDate: '2026-10-04',
    recurrence: 'annual',
    recurrenceNote: '9월 중순~10월 초',
    recurrenceNoteEn: 'Mid-Sep–early Oct',
    venue: { name: 'Theresienwiese' },
    source: 'official_url',
    sourceUrl: 'https://www.oktoberfest.de/en',
    bookingHints: '테레지엔비제·하이드하우저 근처 숙소는 6~12개월 전 예약 권장',
    detailOverview:
      '뮌헨 테레지엔비제에서 열리는 세계 최대 맥주 축제로, 약 2주간 대형 맥주 텐트·놀이기구·스트리트 푸드가 이어집니다. 개막 주말·중순 주말 등 핵심 2~3일만 방문하는 짧은 일정이 일반적입니다.',
    detailOverviewEn:
      "Munich's Theresienwiese hosts the world's biggest beer festival for about two weeks of giant beer tents, rides, and street food. Most travelers visit just the key 2–3 days around opening weekend or mid-festival weekends.",
    highlights: [
      '대형 맥주 텐트 — 좌석·단체 예약은 공식 파트너·호텔 패키지 조기 마감',
      'U4/U5 Theresienwiese·Hackerbrücke 역 도보 접근',
      '평일 낮·저녁은 상대적으로 한산 — 주말·개막일 혼잡 최대',
    ],
    highlightsEn: [
      'Large beer tents — table and group reservations sell out through official partners and hotel packages',
      'Walk from U4/U5 Theresienwiese or Hackerbrücke stations',
      'Weekday afternoons and evenings are calmer — weekends and opening day are busiest',
    ],
    stayAreas: [
      {
        name: '테레지엔비제 · Schwanthalerhöhe',
        nameEn: 'Theresienwiese · Schwanthalerhöhe',
        mrtKeyword: 'Munich Theresienwiese',
        note: '축제장 도보 5~10분 · 성수기 6~12개월 전 마감',
        noteEn: '5–10 min walk to grounds · books out 6–12 months ahead in peak season',
      },
      {
        name: 'Hauptbahnhof · Ludwigsvorstadt',
        nameEn: 'Hauptbahnhof · Ludwigsvorstadt',
        mrtKeyword: 'Munich Hauptbahnhof',
        note: 'S-Bahn·U-Bahn 환승 · 텐트까지 15~20분',
        noteEn: 'S-Bahn/U-Bahn hub · 15–20 min to tents',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Oktoberfest_2015_-_Impression_5.JPG/1280px-Oktoberfest_2015_-_Impression_5.JPG',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Oktoberfest_2015_-_Impression_5.JPG/1280px-Oktoberfest_2015_-_Impression_5.JPG',
        captionKo: '옥토버페스트 현장',
        captionEn: 'Oktoberfest grounds',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Oktoberfest_Schaugeschaeft_2007_Richard_Bartz.jpg/1280px-Oktoberfest_Schaugeschaeft_2007_Richard_Bartz.jpg',
        captionKo: '옥토버페스트 현장',
        captionEn: 'Oktoberfest fairground',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/U-Bahnhof_Theresienwiese_03.jpg/1280px-U-Bahnhof_Theresienwiese_03.jpg',
        captionKo: '테레지엔비제',
        captionEn: 'Theresienwiese',
      },
    ],
    glossaryTerms: [
      {
        id: 'theresienwiese',
        termKo: '테레지엔비제',
        termEn: 'Theresienwiese',
        promptKo:
          '뮌헨 테레지엔비제가 옥토버페스트와 어떤 관계인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn:
          'What is Theresienwiese and why it matters for Oktoberfest visitors? 3 short sentences.',
        searchQueryKo: '뮌헨 테레지엔비제 옥토버페스트',
        searchQueryEn: 'Theresienwiese Munich Oktoberfest',
        referenceUrl: 'https://en.wikipedia.org/wiki/Theresienwiese',
      },
      {
        id: 'beer-tent',
        termKo: '맥주 텐트',
        termEn: 'beer tent',
        promptKo:
          '옥토버페스트 맥주 텐트 예약·좌석 규정을 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn:
          'Oktoberfest beer tent seating and reservations for travelers in 3 short sentences.',
        searchQueryKo: '옥토버페스트 맥주 텐트 예약',
        searchQueryEn: 'Oktoberfest beer tent reservation',
      },
      {
        id: 'oktoberfest',
        termKo: '옥토버페스트',
        termEn: 'Oktoberfest',
        promptKo: '뮌헨 옥토버페스트의 역사와 여행 일정 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Munich Oktoberfest basics and trip tips in 3 short sentences.',
        searchQueryKo: '뮌헨 옥토버페스트 가이드',
        searchQueryEn: 'Munich Oktoberfest guide',
        referenceUrl: 'https://en.wikipedia.org/wiki/Oktoberfest',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/옥토버페스트',
      },
      {
        id: 'hackerbruecke',
        termKo: 'Hackerbrücke',
        termEn: 'Hackerbrücke',
        promptKo:
          '옥토버페스트 때 Hackerbrücke 역 접근과 혼잡 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Hackerbrücke station access during Oktoberfest in 3 short sentences.',
        searchQueryKo: '옥토버페스트 Hackerbrücke 역',
        searchQueryEn: 'Oktoberfest Hackerbrücke station',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'tent-reservation',
            labelKo: '텐트 예약 검색',
            labelEn: 'Tent reservations',
            kind: 'shop',
            searchQueryKo: '옥토버페스트 맥주 텐트 예약',
            searchQueryEn: 'Oktoberfest beer tent reservation',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'theresienwiese-search',
            labelKo: 'Theresienwiese 검색',
            labelEn: 'Search Theresienwiese',
            kind: 'shop',
            searchQueryKo: '뮌헨 테레지엔비제 옥토버페스트',
            searchQueryEn: 'Theresienwiese Munich Oktoberfest',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeVideos: [
      {
        id: 'B5GN30_FRWU',
        titleKo: '뮌헨·옥토버페스트 가이드',
        titleEn: 'Munich & Oktoberfest guide',
      },
      {
        id: 'wHr51Uh9a0E',
        titleKo: '옥토버페스트 현장',
        titleEn: 'Inside Oktoberfest',
      },
    ],
    actionChips: [
      {
        id: 'official-site',
        labelKo: '공식 사이트',
        labelEn: 'Official site',
        href: 'https://www.oktoberfest.de/en',
        kind: 'official',
      },
      {
        id: 'theresienwiese-map',
        labelKo: 'Theresienwiese 지도',
        labelEn: 'Theresienwiese map',
        href: 'https://www.google.com/maps/search/?api=1&query=Theresienwiese+Munich',
        kind: 'map',
      },
      {
        id: 'tent-reservation',
        labelKo: '텐트 예약 검색',
        labelEn: 'Tent reservations',
        href: 'https://www.google.com/search?q=Oktoberfest+beer+tent+reservation&hl=ko',
        kind: 'search',
      },
    ],
    mooniChips: [
      {
        id: 'tent-booking',
        promptKo: '맥주 텐트 예약은 어떻게 해?',
        promptEn: 'How do I book an Oktoberfest beer tent?',
      },
      {
        id: 'weekday-weekend',
        promptKo: '평일이랑 주말 중 언제 가는 게 나아?',
        promptEn: 'Weekday or weekend — when is better to visit?',
      },
      {
        id: 'transport',
        promptKo: 'Theresienwiese 가는 교통 알려줘',
        promptEn: 'How do I get to Theresienwiese?',
      },
    ],
    priority: 1,
  },
  {
    id: 'edinburgh-fringe-2026',
    slug: 'edinburgh',
    hubId: 'edinburgh',
    type: 'festival',
    title: '에든버러 프린지',
    titleEn: 'Edinburgh Festival Fringe',
    startDate: '2026-08-07',
    endDate: '2026-08-31',
    recurrence: 'annual',
    recurrenceNote: '8월 전반',
    recurrenceNoteEn: 'Early August',
    venue: { name: 'Royal Mile & city venues' },
    source: 'official_url',
    sourceUrl: 'https://www.edfringe.com/',
    bookingHints: '올드타운·뉴타운 숙소는 공연장 도보권 위주',
    detailOverview:
      '세계 최대 규모의 공연예술 축제로, 8월 한 달간 에든버러 올드타운·프린지 등록 공연장 전역에서 수천 편의 쇼가 상연됩니다. 전체 기간 숙박보다 3~5박 짧은 방문으로 핵심 공연을 골라 보는 것이 일반적입니다.',
    detailOverviewEn:
      "The world's largest performing arts festival fills Edinburgh's Old Town and registered Fringe venues with thousands of shows throughout August. Most visitors pick a focused 3–5 night stay rather than booking for the full month.",
    highlights: [
      'Royal Mile 주변 프리 공연·스트리트 퍼포먼스',
      '오후·저녁 시간대 예약 공연 — 온라인 사전 예매 권장',
      '올드타운·뉴타운 도보권 숙소가 이동 부담 최소',
    ],
    highlightsEn: [
      'Free shows and street performances around the Royal Mile',
      'Afternoon and evening ticketed shows — book online in advance',
      'Stay in walkable Old Town or New Town to cut down on daily travel',
    ],
    stayAreas: [
      {
        name: '올드타운 · Royal Mile',
        nameEn: 'Old Town · Royal Mile',
        mrtKeyword: 'Edinburgh Old Town',
        note: '공연장 도보 10분 이내 · 성수기 조기 마감',
        noteEn: 'Within 10 min walk of venues · books early in peak season',
      },
      {
        name: '뉴타운',
        nameEn: 'New Town',
        mrtKeyword: 'Edinburgh New Town',
        note: '조용한 숙소 · 올드타운 버스 10~15분',
        noteEn: 'Quieter stays · 10–15 min bus to Old Town',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Edinburgh_Festival_Fringe_Street_Performer.jpg/1280px-Edinburgh_Festival_Fringe_Street_Performer.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Edinburgh_Festival_Fringe_Street_Performer.jpg/1280px-Edinburgh_Festival_Fringe_Street_Performer.jpg',
        captionKo: '프린지 스트리트 퍼포먼스',
        captionEn: 'Fringe street performer',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Edinburgh_Royal_Mile_from_Salisbury_Crags_20211019.jpg/1280px-Edinburgh_Royal_Mile_from_Salisbury_Crags_20211019.jpg',
        captionKo: '로얄 마일',
        captionEn: 'Royal Mile',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Edinburgh_cannon_and_old_town_20211020.jpg/1280px-Edinburgh_cannon_and_old_town_20211020.jpg',
        captionKo: '에든버러 올드타운',
        captionEn: 'Edinburgh Old Town',
      },
    ],
    glossaryTerms: [
      {
        id: 'fringe',
        termKo: '프린지',
        termEn: 'Fringe',
        promptKo:
          '에든버러 프린지 축제가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is the Edinburgh Festival Fringe for travelers? 3 short sentences.',
        searchQueryKo: '에든버러 프린지 축제',
        searchQueryEn: 'Edinburgh Festival Fringe',
        referenceUrl: 'https://en.wikipedia.org/wiki/Edinburgh_Festival_Fringe',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/에든버러_프린지',
      },
      {
        id: 'royal-mile',
        termKo: 'Royal Mile',
        termEn: 'Royal Mile',
        promptKo:
          '에든버러 Royal Mile이 프린지와 어떤 관계인지, 어디서 프리 공연을 볼 수 있는지 3문장 이내로 설명해줘.',
        promptEn: 'Royal Mile and free Fringe performances — 3 short sentences for travelers.',
        searchQueryKo: '에든버러 Royal Mile 프린지',
        searchQueryEn: 'Edinburgh Royal Mile Fringe',
      },
      {
        id: 'old-town',
        termKo: '올드타운',
        termEn: 'Old Town',
        promptKo: '에든버러 올드타운이 프린지 방문에 왜 중요한지 3문장 이내로 설명해줘.',
        promptEn: 'Why Edinburgh Old Town matters for Fringe visitors in 3 short sentences.',
        searchQueryKo: '에든버러 올드타운 프린지',
        searchQueryEn: 'Edinburgh Old Town Fringe',
      },
      {
        id: 'new-town',
        termKo: '뉴타운',
        termEn: 'New Town',
        promptKo:
          '에든버러 뉴타운 숙소의 장단점을 프린지 방문 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'New Town accommodation pros and cons for Fringe visitors in 3 short sentences.',
        searchQueryKo: '에든버러 뉴타운 숙소 프린지',
        searchQueryEn: 'Edinburgh New Town Fringe stay',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'royal-mile-search',
            labelKo: 'Royal Mile 검색',
            labelEn: 'Search Royal Mile',
            kind: 'shop',
            searchQueryKo: '에든버러 Royal Mile 프린지',
            searchQueryEn: 'Edinburgh Royal Mile Fringe',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'official-tickets',
            labelKo: '공식 예매',
            labelEn: 'Official tickets',
            kind: 'tour',
            href: 'https://www.edfringe.com/',
          },
          {
            id: 'venue-map',
            labelKo: '공연장 지도',
            labelEn: 'Venue map',
            kind: 'shop',
            href: 'https://www.edfringe.com/find-a-show/venues',
          },
        ],
      },
    ],
    youtubeVideos: [
      {
        id: '_YXE3yAUrvA',
        titleKo: '에든버러 프린지·올드타운 가이드',
        titleEn: 'Edinburgh Fringe Old Town guide',
      },
      {
        id: '6jxgY3vCAjw',
        titleKo: '프린지 방문 전 알아둘 것',
        titleEn: 'Before you go to the Fringe',
      },
    ],
    actionChips: [
      {
        id: 'official-tickets',
        labelKo: '공식 예매',
        labelEn: 'Official tickets',
        href: 'https://www.edfringe.com/',
        kind: 'official',
      },
      {
        id: 'royal-mile-map',
        labelKo: 'Royal Mile 지도',
        labelEn: 'Royal Mile map',
        href: 'https://www.google.com/maps/search/?api=1&query=Royal+Mile+Edinburgh',
        kind: 'map',
      },
      {
        id: 'venue-map',
        labelKo: '공연장 지도',
        labelEn: 'Venue map',
        href: 'https://www.edfringe.com/find-a-show/venues',
        kind: 'map',
      },
    ],
    mooniChips: [
      {
        id: 'free-shows',
        promptKo: 'Royal Mile 프리 공연은 어디서 볼 수 있어?',
        promptEn: 'Where can I catch free Fringe shows on Royal Mile?',
      },
      {
        id: 'three-shows',
        promptKo: '하루에 공연 3편 일정 짜줘',
        promptEn: 'Plan a day with three Fringe shows',
      },
      {
        id: 'opening-week',
        promptKo: '8월 첫 주 3박으로 추천 일정 알려줘',
        promptEn: 'Suggest a 3-night opening-week itinerary',
      },
    ],
    priority: 1,
  },
  {
    id: 'amsterdam-kings-day-2027',
    slug: 'amsterdam',
    hubId: 'amsterdam',
    type: 'festival',
    title: '킹스데이',
    titleEn: "King's Day",
    startDate: '2027-04-27',
    endDate: '2027-04-27',
    recurrence: 'annual',
    recurrenceNote: '4월 27일',
    recurrenceNoteEn: 'April 27',
    venue: { name: 'Amsterdam citywide' },
    source: 'official_url',
    sourceUrl: 'https://www.iamsterdam.com/en/whats-on/calendar/festivals-events/kings-day',
    bookingHints: '중심가·운하 근처는 당일 교통 통제 — 전날 체크인 권장',
    detailOverview:
      '4월 27일(킹스데이) 하루 동안 도시 전역이 오렌지색으로 물드는 국경일 축제입니다. 거리 플리마켓·운하·광장 파티가 이어지며, 당일 중심가 교통 통제가 많아 전날 밤 체크인을 권장합니다.',
    highlights: [
      'Vondelpark·Jordaan 일대 플리마켓·거리 공연',
      '운하·Dam Square 주변 — 보트·거리 파티(혼잡·교통 통제)',
      '전날(26일) 숙소 확보 · 당일 일부 구간 도보·자전거 이동',
    ],
    stayAreas: [
      {
        name: 'Jordaan',
        mrtKeyword: 'Amsterdam Jordaan',
        note: '플리마켓·카페 밀집 · Dam Square 도보 15~20분',
      },
      {
        name: 'De Pijp',
        mrtKeyword: 'Amsterdam De Pijp',
        note: '상대적으로 조용 · Museumplein·센터 트램 15분',
      },
    ],
    recommendedNights: 2,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Kings_Day_Amsterdam_2015_3.JPG/1280px-Kings_Day_Amsterdam_2015_3.JPG',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Kings_Day_Amsterdam_2015_3.JPG/1280px-Kings_Day_Amsterdam_2015_3.JPG',
        captionKo: '킹스데이 축제',
        captionEn: "King's Day festival",
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Amsterdam%27s_Canals.jpg',
        captionKo: '암스테르담 운하',
        captionEn: "Amsterdam canals",
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Amsterdam%2C_Vondelpark%2C_at_the_pond-2.jpg/1280px-Amsterdam%2C_Vondelpark%2C_at_the_pond-2.jpg',
        captionKo: '본델파크',
        captionEn: 'Vondelpark',
      },
    ],
    glossaryTerms: [
      {
        id: 'kings-day',
        termKo: '킹스데이',
        termEn: "King's Day",
        promptKo:
          '암스테르담 킹스데이(4월 27일)가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: "What is Amsterdam King's Day for travelers? 3 short sentences.",
        searchQueryKo: '암스테르담 킹스데이',
        searchQueryEn: "Amsterdam King's Day",
        referenceUrl: 'https://en.wikipedia.org/wiki/Koningsdag',
      },
      {
        id: 'jordaan',
        termKo: 'Jordaan',
        termEn: 'Jordaan',
        promptKo:
          '암스테르담 Jordaan 지역이 킹스데이에 왜 인기인지, 플리마켓·파티 팁을 3문장 이내로 설명해줘.',
        promptEn: "Why Jordaan is popular on King's Day in 3 short sentences.",
        searchQueryKo: '암스테르담 Jordaan 킹스데이',
        searchQueryEn: "Amsterdam Jordaan King's Day",
      },
      {
        id: 'vondelpark',
        termKo: 'Vondelpark',
        termEn: 'Vondelpark',
        promptKo:
          '킹스데이에 Vondelpark에서 무엇을 볼 수 있는지 3문장 이내로 설명해줘.',
        promptEn: "What happens at Vondelpark on King's Day? 3 short sentences.",
        searchQueryKo: '암스테르담 Vondelpark 킹스데이',
        searchQueryEn: "Amsterdam Vondelpark King's Day",
      },
      {
        id: 'orange-tradition',
        termKo: '오렌지색 전통',
        termEn: 'orange tradition',
        promptKo:
          '킹스데이에 오렌지색 옷·장식을 입는 전통의 의미를 3문장 이내로 설명해줘.',
        promptEn: "Why everyone wears orange on King's Day in 3 short sentences.",
        searchQueryKo: '킹스데이 오렌지색 의미',
        searchQueryEn: "King's Day orange tradition",
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'jordaan-map',
            labelKo: 'Jordaan 지도',
            labelEn: 'Jordaan map',
            kind: 'shop',
            searchQueryKo: '암스테르담 Jordaan',
            searchQueryEn: 'Amsterdam Jordaan',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'dam-square',
            labelKo: 'Dam Square 검색',
            labelEn: 'Dam Square search',
            kind: 'shop',
            searchQueryKo: '암스테르담 Dam Square 킹스데이',
            searchQueryEn: "Amsterdam Dam Square King's Day",
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '암스테르담 킹스데이',
    youtubeSearchQueryEn: "Amsterdam King's Day",
    mooniChips: [
      {
        id: 'what-to-wear',
        promptKo: '킹스데이에 무슨 옷 입어야 해?',
        promptEn: "What should I wear on King's Day?",
      },
      {
        id: 'best-areas',
        promptKo: '킹스데이 어디 구역이 좋아?',
        promptEn: "Best areas to celebrate King's Day?",
      },
      {
        id: 'checkin-timing',
        promptKo: '전날 체크인이 왜 중요해?',
        promptEn: 'Why check in the day before?',
      },
    ],
    priority: 1,
  },
  {
    id: 'tokyo-sakura-season-2027',
    slug: 'tokyo',
    hubId: 'tokyo',
    type: 'season',
    title: '도쿄 벚꽃 시즌',
    titleEn: 'Tokyo Cherry Blossom Season',
    startDate: '2027-03-25',
    endDate: '2027-04-10',
    recurrence: 'annual',
    recurrenceNote: '3월 말~4월 초 (개화 시기 변동)',
    recurrenceNoteEn: 'Late Mar–early Apr (bloom varies)',
    venue: { name: 'Ueno Park · Chidorigafuchi' },
    source: 'curated',
    sourceUrl: 'https://www.japan.travel/en/sg/see-and-do/cherry-blossom-viewing-spots-in-tokyo/',
    bookingHints: '우에노·신주쿠·야마노테선 접근 숙소 조기 마감',
    detailOverview:
      '3월 말~4월 초 도쿄 전역에서 벚꽃(사쿠라) 개화·낙화 시기가 해마다 달라지는 시즌 행사입니다. 개화 예보(1~2주 전)를 확인한 뒤 만개 전후 3~5박을 잡는 방문이 일반적이며, 우에노·치도리가후치 등 명소는 주말·야간 라이트업에 혼잡합니다.',
    highlights: [
      '우에노 공원·신주쿠 교엔 — 대규모 벚나무·피크닉(하나미) 명소',
      '치도리가후치·메구로강 — 야간 라이트업·산책 코스(혼잡·사전 숙소 권장)',
      '개화 예보(JMA·현지 뉴스) 확인 후 항공·숙소 — 만개 전후 1주 버퍼',
    ],
    stayAreas: [
      {
        name: '우에노 · Ueno',
        mrtKeyword: 'Tokyo Ueno',
        note: '우에노 공원·아메요코 도보 · 야마노테선 환승',
      },
      {
        name: '신주쿠 · Shinjuku',
        mrtKeyword: 'Tokyo Shinjuku',
        note: '신주쿠 교엔·도심 접근 · 야마노테선·지하철',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sakura_Tokyo_2026.jpg/1280px-Sakura_Tokyo_2026.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Sakura_Tokyo_2026.jpg/1280px-Sakura_Tokyo_2026.jpg',
        captionKo: '도쿄 벚꽃',
        captionEn: 'Tokyo cherry blossoms',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Cherry_blossom_at_Ueno_park%2C_near_JR_entrance.jpg/1280px-Cherry_blossom_at_Ueno_park%2C_near_JR_entrance.jpg',
        captionKo: '우에노 공원 벚꽃',
        captionEn: 'Ueno Park cherry blossoms',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Cherry_blossoms_and_boat_at_Chidorigafuchi.jpg/1280px-Cherry_blossoms_and_boat_at_Chidorigafuchi.jpg',
        captionKo: '치도리가후치 야간 라이트업',
        captionEn: 'Chidorigafuchi night lights',
      },
    ],
    glossaryTerms: [
      {
        id: 'sakura',
        termKo: '사쿠라',
        termEn: 'sakura',
        promptKo:
          '도쿄 벚꽃 시즌에서 사쿠라(벚꽃) 개화·만개가 여행 일정에 왜 중요한지 3문장 이내로 설명해줘.',
        promptEn: 'Why sakura bloom timing matters for Tokyo cherry blossom trips in 3 short sentences.',
        searchQueryKo: '도쿄 벚꽃 시즌 개화',
        searchQueryEn: 'Tokyo cherry blossom season bloom',
        referenceUrl: 'https://en.wikipedia.org/wiki/Cherry_blossom',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/벚꽃',
      },
      {
        id: 'hanami',
        termKo: '하나미',
        termEn: 'hanami',
        promptKo:
          '도쿄 하나미(벚꽃 피크닉)가 무엇인지, 여행자가 알아야 할 예절·팁을 3문장 이내로 설명해줘.',
        promptEn: 'What is hanami cherry blossom viewing in Tokyo? 3 short sentences for travelers.',
        searchQueryKo: '도쿄 하나미 벚꽃 피크닉',
        searchQueryEn: 'Tokyo hanami cherry blossom picnic',
      },
      {
        id: 'ueno-park',
        termKo: '우에노 공원',
        termEn: 'Ueno Park',
        promptKo:
          '도쿄 우에노 공원이 벚꽃 시즌 방문에 왜 인기인지 3문장 이내로 설명해줘.',
        promptEn: 'Why Ueno Park is popular for cherry blossoms in 3 short sentences.',
        searchQueryKo: '도쿄 우에노 공원 벚꽃',
        searchQueryEn: 'Tokyo Ueno Park cherry blossoms',
        referenceUrl: 'https://en.wikipedia.org/wiki/Ueno_Park',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/우에노_공원',
      },
      {
        id: 'chidorigafuchi',
        termKo: '치도리가후치',
        termEn: 'Chidorigafuchi',
        promptKo:
          '치도리가후치 벚꽃·야간 라이트업 코스의 특징과 혼잡 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Chidorigafuchi cherry blossom walk and night lights in 3 short sentences.',
        searchQueryKo: '도쿄 치도리가후치 벚꽃',
        searchQueryEn: 'Tokyo Chidorigafuchi cherry blossoms',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'ueno-hanami',
            labelKo: '우에노 하나미 검색',
            labelEn: 'Search Ueno hanami',
            kind: 'shop',
            searchQueryKo: '도쿄 우에노 공원 벚꽃 하나미',
            searchQueryEn: 'Tokyo Ueno Park hanami',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'bloom-forecast',
            labelKo: '개화 예보 검색',
            labelEn: 'Bloom forecast search',
            kind: 'shop',
            searchQueryKo: '도쿄 벚꽃 개화 예보 2027',
            searchQueryEn: 'Tokyo cherry blossom forecast 2027',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '도쿄 벚꽃 시즌',
    youtubeSearchQueryEn: 'Tokyo cherry blossom season',
    mooniChips: [
      {
        id: 'bloom-timing',
        promptKo: '만개 전후 4박 일정은 언제 잡는 게 좋아?',
        promptEn: 'When to book a 4-night trip around peak bloom?',
      },
      {
        id: 'ueno-vs-shinjuku',
        promptKo: '우에노랑 신주쿠 숙소 어디가 나아?',
        promptEn: 'Ueno vs Shinjuku for cherry blossom stay?',
      },
      {
        id: 'night-lights',
        promptKo: '야간 라이트업 볼 만한 곳 알려줘',
        promptEn: 'Best spots for cherry blossom night lights?',
      },
    ],
    priority: 1,
  },
  {
    id: 'kyoto-gion-matsuri-2027',
    slug: 'kyoto',
    hubId: 'kyoto',
    type: 'festival',
    title: '기온마츠리',
    titleEn: 'Gion Matsuri',
    startDate: '2027-07-01',
    endDate: '2027-07-31',
    recurrence: 'annual',
    recurrenceNote: '7월 전체 · 요이야마 7/16~17',
    recurrenceNoteEn: 'All July · Yoiyama Jul 16–17',
    venue: { name: 'Gion · Kawaramachi' },
    source: 'official_url',
    sourceUrl: 'https://www.yasaka-jinja.or.jp/en/',
    bookingHints: '기온·사가노·교토역 숙소는 7월 성수기',
    detailOverview:
      '7월 한 달간 이어지는 교토 대표 축제로, 7/16~17 요이야마(전야제·본행)가 절정입니다. 한 달 전체 숙박보다 요이야마 전후 2~3박으로 산마이(거리 행렬)·야마보코(마을 축)를 중심으로 보는 일정이 일반적입니다.',
    highlights: [
      '7/16~17 요이야마 — 야마보코·야마하oko 거리 행렬(교토 중심 교통 통제)',
      '7/17 본행(本行) — 시조·카라스마 일대 최대 혼잡 · 전날 밤 체크인 권장',
      '기온·사가노 — 축제 전후 전통 거리·야사카 신사 접근',
    ],
    stayAreas: [
      {
        name: '기온 · Gion',
        mrtKeyword: 'Kyoto Gion',
        note: '야사카 신사·시조 도보 · 요이야마 거리 접근',
      },
      {
        name: '교토역 · Kawaramachi',
        mrtKeyword: 'Kyoto Station',
        note: 'JR·지하철 허브 · 기온 버스 15~20분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Kyoto_Gion_Matsuri_20100716_2544.jpg/1280px-Kyoto_Gion_Matsuri_20100716_2544.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Kyoto_Gion_Matsuri_20100716_2544.jpg/1280px-Kyoto_Gion_Matsuri_20100716_2544.jpg',
        captionKo: '기온마츠리 행렬',
        captionEn: 'Gion Matsuri procession',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Gion-matsuri_in_Kyoto%3B_July_2010_%2804%29.jpg/1280px-Gion-matsuri_in_Kyoto%3B_July_2010_%2804%29.jpg',
        captionKo: '야마보코 산마이',
        captionEn: 'Gion Matsuri yamaboko float',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Nishiromon_Gate%2C_Yasaka_Shrine%2C_Kyoto%2C_20240820_1721_5183.jpg/1280px-Nishiromon_Gate%2C_Yasaka_Shrine%2C_Kyoto%2C_20240820_1721_5183.jpg',
        captionKo: '야사카 신사',
        captionEn: 'Yasaka Shrine',
      },
    ],
    glossaryTerms: [
      {
        id: 'yoi-yama',
        termKo: '요이야마',
        termEn: 'Yoiyama',
        promptKo:
          '기온마츠리 요이야마(7/16~17 전야제)가 무엇인지 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'What is Gion Matsuri Yoiyama for travelers? 3 short sentences.',
        searchQueryKo: '교토 기온마츠리 요이야마',
        searchQueryEn: 'Kyoto Gion Matsuri Yoiyama',
        referenceUrl: 'https://en.wikipedia.org/wiki/Gion_Matsuri',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/기온_마쓰리',
      },
      {
        id: 'yamaboko',
        termKo: '야마보코',
        termEn: 'yamaboko',
        promptKo:
          '기온마츠리 야마보코(산마이·거리 행렬)가 무엇인지 3문장 이내로 설명해줘.',
        promptEn: 'What are Gion Matsuri yamaboko floats? 3 short sentences.',
        searchQueryKo: '기온마츠리 야마보코 산마이',
        searchQueryEn: 'Gion Matsuri yamaboko floats',
      },
      {
        id: 'gion',
        termKo: '기온',
        termEn: 'Gion',
        promptKo:
          '교토 기온 지역이 기온마츠리 방문에 왜 중심인지 3문장 이내로 설명해줘.',
        promptEn: 'Why Gion district matters for Gion Matsuri visitors in 3 short sentences.',
        searchQueryKo: '교토 기온마츠리 기온 숙소',
        searchQueryEn: 'Kyoto Gion Matsuri Gion stay',
        referenceUrl: 'https://en.wikipedia.org/wiki/Gion',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/기온',
      },
      {
        id: 'yasaka-jinja',
        termKo: '야사카 신사',
        termEn: 'Yasaka Shrine',
        promptKo:
          '야사카 신사가 기온마츠리와 어떤 관계인지 3문장 이내로 설명해줘.',
        promptEn: 'Yasaka Shrine and Gion Matsuri connection in 3 short sentences.',
        searchQueryKo: '교토 야사카 신사 기온마츠리',
        searchQueryEn: 'Yasaka Shrine Gion Matsuri',
        referenceUrl: 'https://en.wikipedia.org/wiki/Yasaka_Shrine',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/야사카_신사',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'yoiyama-guide',
            labelKo: '요이야마 일정 검색',
            labelEn: 'Yoiyama schedule search',
            kind: 'shop',
            searchQueryKo: '기온마츠리 요이야마 7월 16 17',
            searchQueryEn: 'Gion Matsuri Yoiyama July 16 17',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'yasaka-official',
            labelKo: '야사카 신사 공식',
            labelEn: 'Yasaka Shrine official',
            kind: 'tour',
            href: 'https://www.yasaka-jinja.or.jp/en/',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '교토 기온마츠리',
    youtubeSearchQueryEn: 'Kyoto Gion Matsuri',
    mooniChips: [
      {
        id: 'yoiyama-nights',
        promptKo: '요이야마 7/16·17 중 어느 날이 더 좋아?',
        promptEn: 'Which Yoiyama night is better, July 16 or 17?',
      },
      {
        id: 'gion-stay',
        promptKo: '기온 숙소 잡을 때 주의할 점 알려줘',
        promptEn: 'Tips for booking a Gion stay during the festival?',
      },
      {
        id: 'traffic-tips',
        promptKo: '행렬 날 교통 통제 어떻게 대비해?',
        promptEn: 'How to deal with parade-day traffic controls?',
      },
    ],
    priority: 1,
  },
  {
    id: 'bangkok-songkran-2027',
    slug: 'bangkok',
    hubId: 'bangkok',
    type: 'festival',
    title: '송크란',
    titleEn: 'Songkran Festival',
    startDate: '2027-04-13',
    endDate: '2027-04-15',
    recurrence: 'annual',
    recurrenceNote: '4월 13~15일',
    recurrenceNoteEn: 'Apr 13–15',
    venue: { name: 'Silom · Khao San · citywide' },
    source: 'curated',
    sourceUrl: 'https://www.tourismthailand.org/Articles/songkran-festival',
    bookingHints: '실롬·카오산 근처 — 방수 가방·의류 준비',
    detailOverview:
      '4월 13~15일 태국 설(송크란)로, 방콕 전역에서 물 축제·거리 파티가 이어집니다. 실롬·카오산 등 핵심 구역은 교통 통제·전면 젖음을 전제로 하며, 2~3박 일정으로 핵심 날짜를 커버하는 방문이 일반적입니다.',
    highlights: [
      '실롬(Silom) — BTS 실롬·Sathorn 로드 물놀이·파티(혼잡·교통 통제)',
      '카오산(Khao San) — 배낭여행가 거리 중심 축제(방수 가방·휴대폰 보호 필수)',
      '4/13~15 공휴일 연속 — 항공·숙소 조기 마감 · 당일 이동은 BTS·MRT·보트 혼잡',
    ],
    stayAreas: [
      {
        name: '실롬 · Silom',
        mrtKeyword: 'Bangkok Silom',
        note: 'BTS 실롬·MRT 실롬 — 송크란 핵심 구역 도보',
      },
      {
        name: '카오산 · Khao San',
        mrtKeyword: 'Bangkok Khao San',
        note: '배낭여행가 거리 · 실롬 택시·보트 20~30분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/14_April_2025_-_Songkran_on_Si_Lom_Road%2C_Bangkok_-_img_02.jpg/1280px-14_April_2025_-_Songkran_on_Si_Lom_Road%2C_Bangkok_-_img_02.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/14_April_2025_-_Songkran_on_Si_Lom_Road%2C_Bangkok_-_img_02.jpg/1280px-14_April_2025_-_Songkran_on_Si_Lom_Road%2C_Bangkok_-_img_02.jpg',
        captionKo: '실롬 송크란',
        captionEn: 'Songkran on Silom Road',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Le_Songkran%2CSilom_road_%2C_Bang_Rak%2C_Bangkok%2C_Th%C3%A1i_Lan_-_panoramio.jpg/1280px-Le_Songkran%2CSilom_road_%2C_Bang_Rak%2C_Bangkok%2C_Th%C3%A1i_Lan_-_panoramio.jpg',
        captionKo: '실롬 물 축제',
        captionEn: 'Silom water festival',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/2016_Bangkok%2C_Dystrykt_Phra_Nakhon%2C_Ulica_Khaosan_%2808%29.jpg/1280px-2016_Bangkok%2C_Dystrykt_Phra_Nakhon%2C_Ulica_Khaosan_%2808%29.jpg',
        captionKo: '카오산 로드',
        captionEn: 'Khao San Road',
      },
    ],
    glossaryTerms: [
      {
        id: 'songkran',
        termKo: '송크란',
        termEn: 'Songkran',
        promptKo:
          '방콕 송크란(태국 설·물 축제)이 무엇인지 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is Bangkok Songkran for travelers? 3 short sentences.',
        searchQueryKo: '방콕 송크란 축제',
        searchQueryEn: 'Bangkok Songkran festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Songkran',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/송크란',
      },
      {
        id: 'silom',
        termKo: '실롬',
        termEn: 'Silom',
        promptKo:
          '방콕 실롬 일대 송크란 축제 구역의 특징과 준비물을 3문장 이내로 설명해줘.',
        promptEn: 'Silom Songkran zone highlights and prep tips in 3 short sentences.',
        searchQueryKo: '방콕 실롬 송크란',
        searchQueryEn: 'Bangkok Silom Songkran',
      },
      {
        id: 'khao-san',
        termKo: '카오산',
        termEn: 'Khao San',
        promptKo:
          '카오산 로드 송크란이 실롬과 어떻게 다른지 3문장 이내로 설명해줘.',
        promptEn: 'Khao San vs Silom Songkran for travelers in 3 short sentences.',
        searchQueryKo: '방콕 카오산 송크란',
        searchQueryEn: 'Bangkok Khao San Songkran',
        referenceUrl: 'https://en.wikipedia.org/wiki/Khaosan_Road',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/카오산_로드',
      },
      {
        id: 'water-proof',
        termKo: '방수 준비',
        termEn: 'water-proof gear',
        promptKo:
          '송크란 방문 시 방수 가방·휴대폰 보호 등 준비물을 3문장 이내로 설명해줘.',
        promptEn: 'Essential waterproof gear for Songkran in 3 short sentences.',
        searchQueryKo: '송크란 방수 가방 휴대폰',
        searchQueryEn: 'Songkran waterproof bag phone',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'silom-songkran',
            labelKo: '실롬 송크란 검색',
            labelEn: 'Search Silom Songkran',
            kind: 'shop',
            searchQueryKo: '방콕 실롬 송크란',
            searchQueryEn: 'Bangkok Silom Songkran',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'waterproof-bag',
            labelKo: '방수 가방 검색',
            labelEn: 'Waterproof bag search',
            kind: 'shop',
            searchQueryKo: '송크란 방수 가방',
            searchQueryEn: 'Songkran waterproof bag',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '방콕 송크란',
    youtubeSearchQueryEn: 'Bangkok Songkran',
    mooniChips: [
      {
        id: 'silom-vs-khaosan',
        promptKo: '실롬과 카오산 중 어디가 나아?',
        promptEn: 'Silom or Khao San for Songkran?',
      },
      {
        id: 'waterproof-tips',
        promptKo: '휴대폰·지갑 방수 어떻게 해?',
        promptEn: 'How to waterproof phone and wallet?',
      },
      {
        id: 'three-day-plan',
        promptKo: '4/13~15 3박 일정 짜줘',
        promptEn: 'Plan a 3-night trip for April 13-15?',
      },
    ],
    priority: 1,
  },
  {
    id: 'bali-galungan-season-2026',
    slug: 'bali',
    hubId: 'bali',
    type: 'season',
    title: '갈룽안·사원 축제 시즌',
    titleEn: 'Galungan & Temple Festival Season',
    startDate: '2026-09-16',
    endDate: '2026-09-26',
    recurrence: 'annual',
    recurrenceNote: '210일 주기 · 갈룽안·쿠닝안',
    recurrenceNoteEn: '210-day cycle · Galungan & Kuningan',
    venue: { name: 'Bali islandwide temples' },
    source: 'curated',
    sourceUrl: 'https://en.wikipedia.org/wiki/Galungan',
    bookingHints: '우붓·스미냑 — 사원 방문 시 사례 복장 준비',
    detailOverview:
      '발리 힌두력 210일 주기 축제로, 9월 16일(수) 갈룽안에 시즌이 열리고 9월 26일(토) 쿠닝안(갈룽안 10일 후)에 마무리됩니다. 이 10일 사이 펜져 장식·사원 제례가 섬 전역에서 이어지며, 방문 일정은 보통 「갈룽안 전후」「쿠닝안 전후」「둘 다 커버」 중 하나를 기준으로 잡습니다.',
    detailOverviewEn:
      "Bali's Galungan season follows the 210-day Balinese calendar, opening on Wed 16 Sep 2026 and closing with Kuningan ten days later on Sat 26 Sep. Penjor decorations and temple ceremonies ripple across the island — plan around Galungan, Kuningan, or a trip that covers both.",
    highlights: [
      '9/16(수) 갈룽안 — 조상을 맞이하는 날 · 사원·가옥 펜져·제례 절정(사례 복장 필수)',
      '9/26(토) 쿠닝안 — 갈룽안 10일 후 마무리 제례 · 사원 방문·지역 행사 재피크',
      '우붓(사원·마을) + 스미냑(해변) 분할 숙박 — 시즌 중 이동 1~1.5시간 · 렌터카·드라이버 권장',
    ],
    highlightsEn: [
      'Wed 16 Sep Galungan — ancestors return home; penjor poles and temple offerings peak (modest temple dress required)',
      'Sat 26 Sep Kuningan — closing ceremonies ten days after Galungan; temple visits and village events pick up again',
      'Split stays in Ubud (temples, villages) and Seminyak (beach) — 1–1.5 hr drives in season; car or driver recommended',
    ],
    stayAreas: [
      {
        name: '우붓 · Ubud',
        nameEn: 'Ubud',
        mrtKeyword: 'Ubud Bali',
        note: '사원·전통 마을 · 갈룽안 제례 밀집',
        noteEn: 'Temples & villages · dense Galungan ceremonies',
      },
      {
        name: '스미냑 · Seminyak',
        nameEn: 'Seminyak',
        mrtKeyword: 'Seminyak Bali',
        note: '해변·레스토랑 · 우붓 당일 투어 1~1.5시간',
        noteEn: 'Beach & dining · 1–1.5 hr day trip to Ubud',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Offering-Bali.jpg/1280px-Offering-Bali.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Offering-Bali.jpg/1280px-Offering-Bali.jpg',
        captionKo: '발리 제례 공양',
        captionEn: 'Balinese temple offerings',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Penjor_Galungan_Ubud_Bali_20120906a.jpg/1280px-Penjor_Galungan_Ubud_Bali_20120906a.jpg',
        captionKo: '갈룽안 펜져 장식',
        captionEn: 'Galungan penjor decorations',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Penjor_Galungan_Ubud_Bali_20120906b.jpg/1280px-Penjor_Galungan_Ubud_Bali_20120906b.jpg',
        captionKo: '갈룽안 시즌 사원 장식',
        captionEn: 'Galungan season temple decor',
      },
    ],
    glossaryTerms: [
      {
        id: 'galungan',
        termKo: '갈룽안',
        termEn: 'Galungan',
        promptKo: '발리 갈룽안 축제가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'Explain Galungan for Bali travelers in 3 short sentences.',
        searchQueryKo: '발리 갈룽안 축제',
        searchQueryEn: 'Bali Galungan festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Galungan',
      },
      {
        id: 'kuningan',
        termKo: '쿠닝안',
        termEn: 'Kuningan',
        promptKo: '발리 쿠닝안이 갈룽안과 어떤 관계인지, 여행 일정에 왜 중요한지 3문장 이내로 설명해줘.',
        promptEn: 'Explain Kuningan and its relation to Galungan for travelers in 3 short sentences.',
        searchQueryKo: '발리 쿠닝안 축제',
        searchQueryEn: 'Bali Kuningan festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Kuningan',
      },
      {
        id: 'penjor',
        termKo: '펜져',
        termEn: 'penjor',
        promptKo: '발리 갈룽안 시즌 펜져 장식이 무엇인지, 어디서 볼 수 있는지 3문장 이내로 설명해줘.',
        promptEn: 'What are Galungan penjor decorations and where to see them? 3 short sentences.',
        searchQueryKo: '발리 갈룽안 펜져 장식',
        searchQueryEn: 'Bali Galungan penjor decoration',
      },
      {
        id: 'ceremonial-dress',
        termKo: '사례 복장',
        termEn: 'ceremonial dress',
        promptKo: '발리 사원 방문 시 사례 복장(사롱·셀endang) 규정을 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'Temple dress code (sarong, sash) for Bali visitors in 3 short sentences.',
        searchQueryKo: '발리 사원 사례 복장 사롱',
        searchQueryEn: 'Bali temple dress code sarong',
      },
      {
        id: 'sarong',
        termKo: '사롱',
        termEn: 'sarong',
        promptKo: '발리 사원 방문용 사롱이 무엇인지, 대여·구매 팁을 3문장 이내로 설명해줘.',
        promptEn: 'What is a sarong for Bali temples and how to get one? 3 short sentences.',
        searchQueryKo: '발리 사롱 대여 우붓',
        searchQueryEn: 'Bali sarong rental Ubud',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'sarong-rental',
            labelKo: '사롱·복장 대여',
            labelEn: 'Sarong & temple dress rental',
            kind: 'shop',
            searchQueryKo: '발리 사원 사례 복장 사롱',
            searchQueryEn: 'Bali temple dress code sarong',
            searchTarget: 'google',
          },
          {
            id: 'sarong-klook',
            labelKo: '사롱 Klook 검색',
            labelEn: 'Sarong on Klook',
            kind: 'shop',
            searchQueryKo: '발리 사롱 대여',
            searchQueryEn: 'Bali sarong rental',
            searchTarget: 'klook',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'bali-rental',
            labelKo: '발리 렌터카',
            labelEn: 'Bali car rental',
            kind: 'rental',
          },
          {
            id: 'bali-driver-tour',
            labelKo: '기사 포함 투어',
            labelEn: 'Private driver tour',
            kind: 'tour',
          },
        ],
      },
    ],
    youtubeVideos: [
      {
        id: 'AJhPk93ksso',
        titleKo: '갈룽안 축제 영상',
        titleEn: 'Galungan festival film',
      },
      {
        id: '8ix-YkhHl_E',
        titleKo: '발리 갈룽안·우붓 체험',
        titleEn: 'Galungan in Ubud',
      },
    ],
    youtubeSearchQueryKo: '발리 갈룽안 축제',
    youtubeSearchQueryEn: 'Bali Galungan festival',
    actionChips: [
      {
        id: 'galungan-guide',
        labelKo: '갈룽안 안내',
        labelEn: 'Galungan guide',
        href: 'https://en.wikipedia.org/wiki/Galungan',
        kind: 'official',
      },
      {
        id: 'ubud-temples-map',
        labelKo: '우붓 사원 지도',
        labelEn: 'Ubud temples map',
        href: 'https://www.google.com/maps/search/?api=1&query=Ubud+temples+Bali',
        kind: 'map',
      },
      {
        id: 'penjor-search',
        labelKo: '펜져 장식 검색',
        labelEn: 'Penjor decorations',
        href: 'https://www.google.com/search?q=Bali+Galungan+penjor+decoration+Ubud&hl=en',
        kind: 'search',
      },
      {
        id: 'sarong-rental',
        labelKo: '사롱·복장 대여',
        labelEn: 'Sarong & temple dress rental',
        href: 'https://www.google.com/search?q=%EB%B0%9C%EB%A6%AC+%EC%82%AC%EC%9B%90+%EC%82%AC%EB%A1%80+%EB%B3%B5%EC%9E%A5+%EC%82%AC%EB%A1%B1&hl=ko',
        kind: 'shop',
      },
      {
        id: 'sarong-klook',
        labelKo: '사롱 Klook 검색',
        labelEn: 'Sarong on Klook',
        href: 'https://www.klook.com/ko/search/result/?query=%EB%B0%9C%EB%A6%AC+%EC%82%AC%EB%A1%B1+%EB%8C%80%EC%97%AC',
        kind: 'shop',
      },
    ],
    mooniChips: [
      {
        id: 'temple-etiquette',
        promptKo: '갈룽안 때 사원 방문 예절 알려줘',
        promptEn: 'Temple etiquette during Galungan?',
      },
      {
        id: 'ubud-itinerary',
        promptKo: '우붓 기준 4박 일정 짜줘',
        promptEn: 'Plan a 4-night Ubud-based Galungan itinerary',
      },
      {
        id: 'penjor-spots',
        promptKo: '펜져 장식 볼 수 있는 곳은?',
        promptEn: 'Where can I see penjor decorations?',
      },
    ],
    priority: 1,
  },
  {
    id: 'rio-carnival-2027',
    slug: 'rio-de-janeiro',
    hubId: 'rio-de-janeiro',
    type: 'festival',
    title: '리우 카니발',
    titleEn: 'Rio Carnival',
    startDate: '2027-02-12',
    endDate: '2027-02-17',
    recurrence: 'annual',
    recurrenceNote: '2월 사순절 전 주',
    recurrenceNoteEn: 'Week before Lent',
    venue: { name: 'Sambadrome · Copacabana' },
    source: 'official_url',
    sourceUrl: 'https://www.rio-carnival.net/',
    bookingHints: '코파카바나·이파네마 — 삼바드롬 셔틀·의상 대여 사전 예약',
    detailOverview:
      '브라질 최대 카니발로, 삼바드롬 퍼레이드와 블로코(거리 삼바)가 리우 전역에서 열립니다. 전체 시즌 숙박보다 퍼레이드 전후 3~5박으로 코파카바나·이파네마 기점을 잡는 방문이 일반적입니다.',
    highlights: [
      '삼바드롬(Sambadrome) 공식 퍼레이드 — 티켓·셔틀 사전 예약',
      '블로코(Bloco) 거리 삼바 — 오전·오후 시간대별 이동',
      '코파카바나·이파네마 해변 숙소 — 셔틀·지하철 접근',
    ],
    stayAreas: [
      {
        name: '코파카바나 · Copacabana',
        mrtKeyword: 'Copacabana Rio de Janeiro',
        note: '해변·삼바드롬 셔틀 · 성수기 조기 마감',
      },
      {
        name: '이파네마 · Ipanema',
        mrtKeyword: 'Ipanema Rio de Janeiro',
        note: '조용한 해변 · 코파카바나 버스 10분',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Clube_de_Frevo_Carnavalesco_P%C3%A1s_Douradas%2C_Carnaval_do_Rio_de_Janeiro%2C_1967.jpg/1280px-Clube_de_Frevo_Carnavalesco_P%C3%A1s_Douradas%2C_Carnaval_do_Rio_de_Janeiro%2C_1967.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Clube_de_Frevo_Carnavalesco_P%C3%A1s_Douradas%2C_Carnaval_do_Rio_de_Janeiro%2C_1967.jpg/1280px-Clube_de_Frevo_Carnavalesco_P%C3%A1s_Douradas%2C_Carnaval_do_Rio_de_Janeiro%2C_1967.jpg',
        captionKo: '리우 카니발 퍼레이드',
        captionEn: 'Rio Carnival parade',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Carnival_in_Sambadrome_Rio_09s.jpg/1280px-Carnival_in_Sambadrome_Rio_09s.jpg',
        captionKo: '삼바드롬 퍼레이드',
        captionEn: 'Sambadrome parade',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Copacabana%2C_Rio_de_Janeiro.jpg/1280px-Copacabana%2C_Rio_de_Janeiro.jpg',
        captionKo: '코파카바나 해변',
        captionEn: 'Copacabana Beach',
      },
    ],
    glossaryTerms: [
      {
        id: 'sambadrome',
        termKo: '삼바드롬',
        termEn: 'Sambadrome',
        promptKo:
          '리우 카니발 삼바드롬(Sambadrome) 퍼레이드가 무엇인지, 티켓·셔틀 팁을 3문장 이내로 설명해줘.',
        promptEn: 'What is the Rio Carnival Sambadrome parade for travelers? 3 short sentences.',
        searchQueryKo: '리우 카니발 삼바드롬 티켓',
        searchQueryEn: 'Rio Carnival Sambadrome tickets',
        referenceUrl: 'https://en.wikipedia.org/wiki/Sambadrome_Marqu%C3%AAs_de_Sapuca%C3%AD',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/삼바드롬',
      },
      {
        id: 'bloco',
        termKo: '블로코',
        termEn: 'bloco',
        promptKo:
          '리우 카니발 블로코(거리 삼바 파티)가 삼바드롬과 어떻게 다른지 3문장 이내로 설명해줘.',
        promptEn: 'Rio Carnival bloco street parties vs Sambadrome in 3 short sentences.',
        searchQueryKo: '리우 카니발 블로코 거리 삼바',
        searchQueryEn: 'Rio Carnival bloco street party',
      },
      {
        id: 'samba-school',
        termKo: '삼바스쿨라',
        termEn: 'samba school',
        promptKo:
          '리우 카니발 삼바스쿨라(escola de samba)가 퍼레이드에서 어떤 역할인지 3문장 이내로 설명해줘.',
        promptEn: 'What are Rio samba schools in the Carnival parade? 3 short sentences.',
        searchQueryKo: '리우 삼바스쿨라 카니발',
        searchQueryEn: 'Rio samba school carnival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Samba_school',
      },
      {
        id: 'copacabana',
        termKo: '코파카바나',
        termEn: 'Copacabana',
        promptKo:
          '카니발 시즌 코파카바나·이파네마 숙소를 잡을 때 알아둘 점을 3문장 이내로 설명해줘.',
        promptEn: 'Staying in Copacabana or Ipanema during Rio Carnival in 3 short sentences.',
        searchQueryKo: '리우 코파카바나 카니발 숙소',
        searchQueryEn: 'Copacabana Rio Carnival stay',
        referenceUrl: 'https://en.wikipedia.org/wiki/Copacabana,_Rio_de_Janeiro',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/코파카바나_(리우데자네이루)',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'sambadrome-tickets',
            labelKo: '삼바드롬 티켓',
            labelEn: 'Sambadrome tickets',
            kind: 'tour',
            href: 'https://www.rio-carnival.net/',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'copacabana-map',
            labelKo: '코파카바나 지도',
            labelEn: 'Copacabana map',
            kind: 'shop',
            searchQueryKo: '리우 코파카바나 해변',
            searchQueryEn: 'Copacabana Beach Rio',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '리우 카니발 삼바드롬',
    youtubeSearchQueryEn: 'Rio Carnival Sambadrome',
    mooniChips: [
      {
        id: 'sambadrome-nights',
        promptKo: '삼바드롬 퍼레이드 전후 4박 일정 짜줘',
        promptEn: 'Plan a 4-night Rio Carnival trip around Sambadrome nights',
      },
      {
        id: 'bloco-vs-sambadrome',
        promptKo: '블로코랑 삼바드롬 중 뭐부터 볼까?',
        promptEn: 'Should I prioritize blocos or the Sambadrome parade?',
      },
      {
        id: 'costume-rental',
        promptKo: '카니발 의상 대여는 어디서 해?',
        promptEn: 'Where to rent Carnival costumes in Rio?',
      },
    ],
    priority: 1,
  },
  {
    id: 'new-york-thanksgiving-season-2026',
    slug: 'new-york',
    hubId: 'new-york',
    type: 'season',
    title: '추수감사절·홀리데이 시즌',
    titleEn: 'Thanksgiving & Holiday Season',
    startDate: '2026-11-20',
    endDate: '2026-11-30',
    recurrence: 'annual',
    recurrenceNote: '11월 넷째 목요일 전후',
    recurrenceNoteEn: 'Around Thanksgiving (4th Thu in Nov)',
    venue: { name: 'Macy\'s Parade route · Midtown' },
    source: 'curated',
    sourceUrl: 'https://www.macys.com/social/parade/',
    bookingHints: '맨해튼 미드타운·헤럴드스퀘어 — 퍼레이드 뷰 숙소 조기 마감',
    detailOverview:
      '메이시스 추수감사절 퍼레이드와 블랙 프라이데이·홀리데이 시즌이 겹치는 11월 말 뉴욕 방문 시즌입니다. 퍼레이드 당일 전후 2~4박으로 미드타운·헤럴드스퀘어 기점을 잡는 것이 일반적입니다.',
    highlights: [
      'Macy\'s Thanksgiving Day Parade — 6th Ave·34th St 루트',
      '블랙 프라이데이·홀리데이 마켓 — 미드타운·브라이언트 파크',
      '타임스퀘어·록펠러 센터 트리 라이팅 시즌',
    ],
    stayAreas: [
      {
        name: '미드타운 · Midtown',
        mrtKeyword: 'Midtown Manhattan',
        note: '퍼레이드 루트·타임스퀘어 도보권',
      },
      {
        name: '헤럴드스퀘어 · Herald Square',
        mrtKeyword: 'Herald Square New York',
        note: 'Macy\'s·34th St 역 인근',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Macy%27s_parade_balloon_inflation_%2811678%29.jpg/1280px-Macy%27s_parade_balloon_inflation_%2811678%29.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Macy%27s_parade_balloon_inflation_%2811678%29.jpg/1280px-Macy%27s_parade_balloon_inflation_%2811678%29.jpg',
        captionKo: '퍼레이드 풍선 준비',
        captionEn: 'Parade balloon inflation',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Macy%27s_Thanksgiving_Day_Parade_2012_Jennette_McCurdy_03.jpg',
        captionKo: '메이시스 추수감사절 퍼레이드',
        captionEn: "Macy's Thanksgiving Day Parade",
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/2011_Rockefeller_Center_Christmas_tree_Manhattan_NYC.jpg/1280px-2011_Rockefeller_Center_Christmas_tree_Manhattan_NYC.jpg',
        captionKo: '록펠러 센터 크리스마스 트리',
        captionEn: 'Rockefeller Center Christmas tree',
      },
    ],
    glossaryTerms: [
      {
        id: 'macys-parade',
        termKo: '메이시스 퍼레이드',
        termEn: "Macy's Parade",
        promptKo:
          '뉴욕 메이시스 추수감사절 퍼레이드가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: "What is Macy's Thanksgiving Day Parade for NYC visitors? 3 short sentences.",
        searchQueryKo: '뉴욕 메이시스 추수감사절 퍼레이드',
        searchQueryEn: "Macy's Thanksgiving Day Parade New York",
        referenceUrl: "https://en.wikipedia.org/wiki/Macy's_Thanksgiving_Day_Parade",
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/메이시스_추수감사절_퍼레이드',
      },
      {
        id: 'thanksgiving',
        termKo: '추수감사절',
        termEn: 'Thanksgiving',
        promptKo:
          '미국 추수감사절(Thanksgiving)이 뉴욕 방문 일정에 어떤 영향을 주는지 3문장 이내로 설명해줘.',
        promptEn: 'How Thanksgiving affects a New York trip in 3 short sentences.',
        searchQueryKo: '뉴욕 추수감사절 여행',
        searchQueryEn: 'New York Thanksgiving travel',
        referenceUrl: 'https://en.wikipedia.org/wiki/Thanksgiving_(United_States)',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/추수감사절',
      },
      {
        id: 'black-friday',
        termKo: '블랙 프라이데이',
        termEn: 'Black Friday',
        promptKo:
          '추수감사절 다음 날 블랙 프라이데이 쇼핑 시즌을 뉴욕에서 즐길 때 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Black Friday shopping tips in NYC in 3 short sentences.',
        searchQueryKo: '뉴욕 블랙 프라이데이 쇼핑',
        searchQueryEn: 'New York Black Friday shopping',
        referenceUrl: 'https://en.wikipedia.org/wiki/Black_Friday_(shopping)',
      },
      {
        id: 'herald-square',
        termKo: '헤럴드스퀘어',
        termEn: 'Herald Square',
        promptKo:
          '헤럴드스퀘어·34th St가 퍼레이드 뷰 숙소로 인기인 이유를 3문장 이내로 설명해줘.',
        promptEn: 'Why Herald Square is popular for parade-view stays in 3 short sentences.',
        searchQueryKo: '뉴욕 헤럴드스퀘어 퍼레이드 숙소',
        searchQueryEn: 'Herald Square Macy parade view hotel',
        referenceUrl: 'https://en.wikipedia.org/wiki/Herald_Square',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'macys-official',
            labelKo: '메이시스 퍼레이드 공식',
            labelEn: 'Macy\'s Parade official',
            kind: 'tour',
            href: 'https://www.macys.com/social/parade/',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'rockefeller-tree',
            labelKo: '록펠러 트리 검색',
            labelEn: 'Rockefeller tree search',
            kind: 'shop',
            searchQueryKo: '뉴욕 록펠러 센터 크리스마스 트리',
            searchQueryEn: 'Rockefeller Center Christmas tree NYC',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '뉴욕 메이시스 추수감사절 퍼레이드',
    youtubeSearchQueryEn: "Macy's Thanksgiving Day Parade New York",
    mooniChips: [
      {
        id: 'parade-view',
        promptKo: '퍼레이드 잘 보이는 미드타운 숙소 구역 알려줘',
        promptEn: 'Best Midtown areas for parade views?',
      },
      {
        id: 'thanksgiving-weekend',
        promptKo: '추수감사절 주말 3박 일정 짜줘',
        promptEn: 'Plan a 3-night Thanksgiving weekend in NYC',
      },
      {
        id: 'black-friday-tips',
        promptKo: '블랙 프라이데이 쇼핑 동선 추천해줘',
        promptEn: 'Black Friday shopping route in Manhattan?',
      },
    ],
    priority: 1,
  },
  {
    id: 'iceland-midnight-sun-2027',
    slug: 'iceland',
    type: 'season',
    title: '미드나잇 선·시크릿 솔스티스',
    titleEn: 'Midnight Sun & Secret Solstice',
    startDate: '2027-06-01',
    endDate: '2027-07-31',
    recurrence: 'annual',
    recurrenceNote: '6~7월 백야 · 솔스티스 페스티벌 6월 중순',
    recurrenceNoteEn: 'Jun–Jul midnight sun · Solstice festival mid-Jun',
    venue: { name: 'Reykjavík · Laugardalur' },
    source: 'official_url',
    sourceUrl: 'https://secretsolstice.is/',
    bookingHints: '레이캬비크 기점 골든서클·남부 투어 — 렌터카·숙소 성수기',
    detailOverview:
      '6~7월 백야(미드나잇 선) 시즌과 시크릿 솔스티스 페스티벌이 겹치는 아이슬란드 여름입니다. 전체 여름 숙박보다 솔스티스 전후 3~5박으로 레이캬비크 기점 투어를 계획하는 방문이 일반적입니다.',
    highlights: [
      'Secret Solstice — 6월 중순 레이캬비크 페스티벌',
      '백야 드라이브 — 골든서클·남부 해안 일출 없는 하루',
      '레이캬비크 구시가·하파 콘서트홀 — 도보·버스 기점',
    ],
    stayAreas: [
      {
        name: '레이캬비크 · Reykjavík',
        mrtKeyword: 'Reykjavik',
        note: '시크릿 솔스티스·시내 투어 기점',
      },
      {
        name: '라우가르달루르 · Laugardalur',
        mrtKeyword: 'Laugardalur Reykjavik',
        note: '페스티벌장 인근 · 버스 접근',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Midnight_Sun_on_the_Rocks.jpg/1280px-Midnight_Sun_on_the_Rocks.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Midnight_Sun_on_the_Rocks.jpg/1280px-Midnight_Sun_on_the_Rocks.jpg',
        captionKo: '아이슬란드 백야',
        captionEn: 'Iceland midnight sun',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/View_of_Reykjav%C3%ADk_from_Hallgr%C3%ADmskirkja%2C_20230507_1227_5715.jpg/1280px-View_of_Reykjav%C3%ADk_from_Hallgr%C3%ADmskirkja%2C_20230507_1227_5715.jpg',
        captionKo: '레이캬비크 전경',
        captionEn: 'Reykjavík skyline',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Gullfoss%2C_Iceland.jpg/1280px-Gullfoss%2C_Iceland.jpg',
        captionKo: '굴포스 폭포',
        captionEn: 'Gullfoss waterfall',
      },
    ],
    glossaryTerms: [
      {
        id: 'midnight-sun',
        termKo: '미드나잇 선',
        termEn: 'midnight sun',
        promptKo:
          '아이슬란드 여름 백야(미드나잇 선)가 여행 일정에 어떤 영향을 주는지 3문장 이내로 설명해줘.',
        promptEn: 'How Iceland midnight sun affects summer travel in 3 short sentences.',
        searchQueryKo: '아이슬란드 백야 미드나잇 선',
        searchQueryEn: 'Iceland midnight sun summer',
        referenceUrl: 'https://en.wikipedia.org/wiki/Midnight_sun',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/백야',
      },
      {
        id: 'secret-solstice',
        termKo: '시크릿 솔스티스',
        termEn: 'Secret Solstice',
        promptKo:
          '레이캬비크 시크릿 솔스티스 페스티벌이 무엇인지 3문장 이내로 설명해줘.',
        promptEn: 'What is Reykjavík Secret Solstice festival? 3 short sentences.',
        searchQueryKo: '아이슬란드 시크릿 솔스티스 페스티벌',
        searchQueryEn: 'Iceland Secret Solstice festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Secret_Solstice',
      },
      {
        id: 'golden-circle',
        termKo: '골든서클',
        termEn: 'Golden Circle',
        promptKo:
          '아이슬란드 골든서클 투어가 백야 시즌에 인기인 이유를 3문장 이내로 설명해줘.',
        promptEn: 'Why Golden Circle tours are popular in midnight sun season in 3 short sentences.',
        searchQueryKo: '아이슬란드 골든서클 투어',
        searchQueryEn: 'Iceland Golden Circle tour',
        referenceUrl: 'https://en.wikipedia.org/wiki/Golden_Circle_(Iceland)',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/골든_서클',
      },
      {
        id: 'reykjavik',
        termKo: '레이캬비크',
        termEn: 'Reykjavík',
        promptKo:
          '백야 시즌 레이캬비크를 기점으로 숙소·투어를 잡을 때 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Tips for basing midnight sun trips in Reykjavík in 3 short sentences.',
        searchQueryKo: '레이캬비크 여름 숙소',
        searchQueryEn: 'Reykjavik summer stay',
        referenceUrl: 'https://en.wikipedia.org/wiki/Reykjav%C3%ADk',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/레이캬비크',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'secret-solstice-official',
            labelKo: '시크릿 솔스티스 공식',
            labelEn: 'Secret Solstice official',
            kind: 'tour',
            href: 'https://secretsolstice.is/',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'golden-circle-rental',
            labelKo: '골든서클 렌터카',
            labelEn: 'Golden Circle car rental',
            kind: 'rental',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '아이슬란드 백야 골든서클',
    youtubeSearchQueryEn: 'Iceland midnight sun Golden Circle',
    mooniChips: [
      {
        id: 'solstice-timing',
        promptKo: '솔스티스 전후 4박 일정은 언제 잡는 게 좋아?',
        promptEn: 'When to book a 4-night trip around summer solstice?',
      },
      {
        id: 'golden-circle-drive',
        promptKo: '백야에 골든서클 자가운전 일정 짜줘',
        promptEn: 'Plan a midnight sun Golden Circle self-drive day',
      },
      {
        id: 'reykjavik-base',
        promptKo: '레이캬비크 기점 숙소 구역 추천해줘',
        promptEn: 'Best Reykjavík base areas for summer festivals?',
      },
    ],
    priority: 1,
  },
  {
    id: 'sydney-vivid-2027',
    slug: 'sydney',
    hubId: 'sydney',
    type: 'festival',
    title: '비비드 시드니',
    titleEn: 'Vivid Sydney',
    startDate: '2027-05-22',
    endDate: '2027-06-14',
    recurrence: 'annual',
    recurrenceNote: '5월 말~6월 중순',
    recurrenceNoteEn: 'Late May–mid Jun',
    venue: { name: 'Sydney Harbour · Circular Quay' },
    source: 'official_url',
    sourceUrl: 'https://www.vividsydney.com/',
    bookingHints: '서큘러 키·더 록스 — 항구 뷰 숙소·페리 예약',
    detailOverview:
      '시드니 하버·오페라 하우스 일대를 조명으로 물드는 겨울 빛 축제입니다. 개막 주말·중순 주말 2~4박으로 서큘러 키·더 록스 기점을 잡아 야간 설치·라이트쇼를 둘러보는 방문이 일반적입니다.',
    highlights: [
      'Circular Quay·Opera House 조명 설치',
      'Darling Harbour 라이트쇼·식당가',
      '페리·트램으로 항구 구역 이동',
    ],
    stayAreas: [
      {
        name: '서큘러 키 · Circular Quay',
        mrtKeyword: 'Circular Quay Sydney',
        note: '오페라 하우스·페리 터미널 도보',
      },
      {
        name: '더 록스 · The Rocks',
        mrtKeyword: 'The Rocks Sydney',
        note: '항구 뷰 · 서큘러 키 도보 10분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Vivid_Lights_Sydney_%2818358343820%29.jpg/1280px-Vivid_Lights_Sydney_%2818358343820%29.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Vivid_Lights_Sydney_%2818358343820%29.jpg/1280px-Vivid_Lights_Sydney_%2818358343820%29.jpg',
        captionKo: '비비드 시드니 조명',
        captionEn: 'Vivid Sydney lights',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Sydney_Opera_House_-_Vivid_2025.jpg/1280px-Sydney_Opera_House_-_Vivid_2025.jpg',
        captionKo: '오페라 하우스 라이트쇼',
        captionEn: 'Opera House light show',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Vivid_sydney_2014_Darling_Harbour_%2814549756665%29.jpg/1280px-Vivid_sydney_2014_Darling_Harbour_%2814549756665%29.jpg',
        captionKo: '달링 하버',
        captionEn: 'Darling Harbour',
      },
    ],
    glossaryTerms: [
      {
        id: 'vivid-sydney',
        termKo: '비비드 시드니',
        termEn: 'Vivid Sydney',
        promptKo:
          '시드니 비비드(Vivid Sydney) 빛 축제가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is Vivid Sydney for travelers? 3 short sentences.',
        searchQueryKo: '시드니 비비드 축제',
        searchQueryEn: 'Vivid Sydney festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Vivid_Sydney',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/비비드_시드니',
      },
      {
        id: 'circular-quay',
        termKo: '서큘러 키',
        termEn: 'Circular Quay',
        promptKo:
          '비비드 시즌 서큘러 키가 숙소·이동 기점으로 인기인 이유를 3문장 이내로 설명해줘.',
        promptEn: 'Why Circular Quay is a Vivid Sydney base in 3 short sentences.',
        searchQueryKo: '시드니 서큘러 키 비비드',
        searchQueryEn: 'Circular Quay Vivid Sydney',
        referenceUrl: 'https://en.wikipedia.org/wiki/Circular_Quay',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/서큘러_키',
      },
      {
        id: 'opera-house',
        termKo: '오페라 하우스',
        termEn: 'Opera House',
        promptKo:
          '비비드 시즌 시드니 오페라 하우스 조명 설치를 볼 때 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Tips for seeing Vivid lights on the Sydney Opera House in 3 short sentences.',
        searchQueryKo: '시드니 오페라 하우스 비비드',
        searchQueryEn: 'Sydney Opera House Vivid lights',
        referenceUrl: 'https://en.wikipedia.org/wiki/Sydney_Opera_House',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/시드니_오페라_하우스',
      },
      {
        id: 'darling-harbour',
        termKo: '달링 하버',
        termEn: 'Darling Harbour',
        promptKo:
          '비비드 시즌 달링 하버 라이트쇼·식당가를 즐길 때 알아둘 점을 3문장 이내로 설명해줘.',
        promptEn: 'Darling Harbour during Vivid Sydney in 3 short sentences.',
        searchQueryKo: '시드니 달링 하버 비비드',
        searchQueryEn: 'Darling Harbour Vivid Sydney',
        referenceUrl: 'https://en.wikipedia.org/wiki/Darling_Harbour',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'vivid-official',
            labelKo: '비비드 공식',
            labelEn: 'Vivid official',
            kind: 'tour',
            href: 'https://www.vividsydney.com/',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'darling-harbour-search',
            labelKo: '달링 하버 검색',
            labelEn: 'Search Darling Harbour',
            kind: 'shop',
            searchQueryKo: '시드니 달링 하버 비비드',
            searchQueryEn: 'Darling Harbour Vivid Sydney',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'sydney-ferry-official',
            labelKo: '페리 공식',
            labelEn: 'Official ferry',
            kind: 'tour',
            href: 'https://transportnsw.info/routes/details/sydney-ferries-network/f1/090f1',
          },
          {
            id: 'sydney-tram-pass',
            labelKo: '트램 교통 패스',
            labelEn: 'Tram transport pass',
            kind: 'shop',
            searchQueryKo: '시드니 교통 패스',
            searchQueryEn: 'Sydney transport pass',
            searchTarget: 'klook',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '시드니 비비드 오페라 하우스',
    youtubeSearchQueryEn: 'Vivid Sydney Opera House lights',
    mooniChips: [
      {
        id: 'opening-weekend',
        promptKo: '비비드 개막 주말 3박 일정 짜줘',
        promptEn: 'Plan a 3-night Vivid opening weekend',
      },
      {
        id: 'harbour-walk',
        promptKo: '항구 야간 라이트 산책 코스 추천해줘',
        promptEn: 'Best harbour walk for Vivid light installations?',
      },
      {
        id: 'ferry-tips',
        promptKo: '비비드 때 페리·트램 이용 팁 알려줘',
        promptEn: 'Ferry and tram tips during Vivid Sydney?',
      },
    ],
    priority: 1,
  },
  {
    id: 'prague-spring-festival-2027',
    slug: 'prague',
    hubId: 'prague',
    type: 'season',
    title: '프라하 봄 축제 시즌',
    titleEn: 'Prague Spring Festival Season',
    startDate: '2027-04-15',
    endDate: '2027-05-15',
    recurrence: 'annual',
    recurrenceNote: '4~5월 클래식·봄 축제',
    recurrenceNoteEn: 'Apr–May classical & spring festivals',
    venue: { name: 'Rudolfinum · Old Town' },
    source: 'official_url',
    sourceUrl: 'https://www.festival.cz/en',
    bookingHints: '구시가·말라 스트라나 — 루돌피눔 도보권',
    detailOverview:
      '4~5월 프라하 봄 축제(Prague Spring)와 클래식·봄 시즌 행사가 겹치는 문화 방문 시즌입니다. 한 달 전체 숙박보다 개막 주·중순 주말 2~4박으로 루돌피눔·구시가 기점 공연·산책 일정을 잡는 방문이 일반적입니다.',
    highlights: [
      'Prague Spring Festival — 루돌피눔·공연장 중심 클래식·오케스트라',
      '구시가(Old Town) — 카를교·광장 산책 · 트램·지하철 허브',
      '말라 스트라나(Malá Strana) — 언덕 골목·성 지구 접근',
    ],
    stayAreas: [
      {
        name: '구시가 · Old Town',
        mrtKeyword: 'Prague Old Town',
        note: '루돌피눔·카를교 도보 · 트램 허브',
      },
      {
        name: '말라 스트라나 · Malá Strana',
        mrtKeyword: 'Prague Malá Strana',
        note: '성 지구·언덕 골목 · 구시가 도보 10분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/G_N_Rozhdestvensky_at_Prague_Spring_Festival_2007.jpg/1280px-G_N_Rozhdestvensky_at_Prague_Spring_Festival_2007.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/G_N_Rozhdestvensky_at_Prague_Spring_Festival_2007.jpg/1280px-G_N_Rozhdestvensky_at_Prague_Spring_Festival_2007.jpg',
        captionKo: '프라하 봄 축제',
        captionEn: 'Prague Spring Festival',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Praha_Rudolfinum_front.jpg/1280px-Praha_Rudolfinum_front.jpg',
        captionKo: '루돌피눔',
        captionEn: 'Rudolfinum',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Prague_Old_Town_Square%2C_Czech_Republic_-_Oct_2010.jpg/1280px-Prague_Old_Town_Square%2C_Czech_Republic_-_Oct_2010.jpg',
        captionKo: '프라하 구시가',
        captionEn: 'Prague Old Town',
      },
    ],
    glossaryTerms: [
      {
        id: 'prague-spring',
        termKo: '프라하 봄 축제',
        termEn: 'Prague Spring',
        promptKo:
          '프라하 봄 축제(Prague Spring)가 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is the Prague Spring Festival for travelers? 3 short sentences.',
        searchQueryKo: '프라하 봄 축제',
        searchQueryEn: 'Prague Spring Festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/Prague_Spring_International_Music_Festival',
      },
      {
        id: 'rudolfinum',
        termKo: '루돌피눔',
        termEn: 'Rudolfinum',
        promptKo:
          '프라하 루돌피눔이 봄 축제에서 어떤 역할을 하는지 3문장 이내로 설명해줘.',
        promptEn: 'Why Rudolfinum matters for Prague Spring in 3 short sentences.',
        searchQueryKo: '프라하 루돌피눔 공연',
        searchQueryEn: 'Prague Rudolfinum concerts',
        referenceUrl: 'https://en.wikipedia.org/wiki/Rudolfinum',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/루돌피눔',
      },
      {
        id: 'old-town',
        termKo: '구시가',
        termEn: 'Old Town',
        promptKo:
          '프라하 구시가(Old Town)가 봄 축제 방문에 왜 좋은 기점인지 3문장 이내로 설명해줘.',
        promptEn: 'Why Prague Old Town is a good base for Spring Festival in 3 short sentences.',
        searchQueryKo: '프라하 구시가 숙소',
        searchQueryEn: 'Prague Old Town stay',
      },
      {
        id: 'mala-strana',
        termKo: '말라 스트라나',
        termEn: 'Malá Strana',
        promptKo:
          '프라하 말라 스트라나(Malá Strana) 숙소의 장단점을 봄 축제 방문 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'Malá Strana pros and cons for Prague Spring visitors in 3 short sentences.',
        searchQueryKo: '프라하 말라 스트라나 숙소',
        searchQueryEn: 'Prague Malá Strana hotel',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'festival-tickets',
            labelKo: '공식 축제 사이트',
            labelEn: 'Official festival site',
            kind: 'tour',
            href: 'https://www.festival.cz/en',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'old-town-map',
            labelKo: '구시가 검색',
            labelEn: 'Old Town search',
            kind: 'shop',
            searchQueryKo: '프라하 구시가 카를교',
            searchQueryEn: 'Prague Old Town Charles Bridge',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '프라하 봄 축제',
    youtubeSearchQueryEn: 'Prague Spring Festival',
    mooniChips: [
      {
        id: 'opening-week',
        promptKo: '개막 주에 가면 뭐가 좋아?',
        promptEn: 'Why visit during opening week?',
      },
      {
        id: 'rudolfinum-tips',
        promptKo: '루돌피눔 공연 예매 팁 알려줘',
        promptEn: 'Tips for booking Rudolfinum shows?',
      },
      {
        id: 'old-town-stay',
        promptKo: '구시가 vs 말라 스트라나 숙소 비교해줘',
        promptEn: 'Old Town vs Malá Strana for stays?',
      },
    ],
    priority: 1,
  },
  {
    id: 'marrakech-rose-festival-2027',
    slug: 'marrakech',
    hubId: 'marrakech',
    type: 'festival',
    title: '로즈 페스티벌',
    titleEn: 'Rose Festival (Festival des Roses)',
    startDate: '2027-05-08',
    endDate: '2027-05-10',
    recurrence: 'annual',
    recurrenceNote: "5월 초 · 켈라at M'Gouna",
    recurrenceNoteEn: "Early May · Kelaat M'Gouna",
    venue: { name: 'Kelaat M\'Gouna · Dades Valley' },
    source: 'curated',
    sourceUrl: 'https://www.visitmorocco.com/en/travel/festivals',
    bookingHints: '마라케시 기점 당일·1박 투어 — 계곡 숙소는 소수',
    detailOverview:
      '모로코 다데스 계곡 켈라at M\'Gouna에서 열리는 장미 수확 축제로, 마라케시에서 당일·1박 투어로 방문하는 경우가 많습니다. 페스티벌 전날 체크인 2박으로 메디나 기점 투어를 잡는 일정이 일반적입니다.',
    highlights: [
      'Kelaat M\'Gouna — 장미 수확·시장·지역 행사(마라케시 당일 투어 3~4시간)',
      '메디나(Medina) — 자마 엘 프나 광장·리야드 숙소',
      '5월 초 성수기 — 투어·차량 예약 조기 마감',
    ],
    stayAreas: [
      {
        name: '메디나 · Medina',
        mrtKeyword: 'Marrakech Medina',
        note: '자마 엘 프나·리야드 · 투어 픽업',
      },
      {
        name: '구엘리즈 · Gueliz',
        mrtKeyword: 'Marrakech Gueliz',
        note: '신도시·카페 · 메디나 택시 10분',
      },
    ],
    recommendedNights: 2,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/At_fountain_of_Morocco_Royal_rose_garden_in_Flower_festival_commemorative_park._%288131033157%29.jpg/1280px-At_fountain_of_Morocco_Royal_rose_garden_in_Flower_festival_commemorative_park._%288131033157%29.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/At_fountain_of_Morocco_Royal_rose_garden_in_Flower_festival_commemorative_park._%288131033157%29.jpg/1280px-At_fountain_of_Morocco_Royal_rose_garden_in_Flower_festival_commemorative_park._%288131033157%29.jpg',
        captionKo: '로즈 페스티벌',
        captionEn: 'Rose Festival',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Pavillon_Menarag%C3%A4rten.jpg',
        captionKo: '마라케시 메나라 정원',
        captionEn: 'Marrakesh Menara gardens',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Djemaa_el_Fna.jpg/1280px-Djemaa_el_Fna.jpg',
        captionKo: '자마 엘 프나 광장',
        captionEn: 'Jemaa el-Fnaa square',
      },
    ],
    glossaryTerms: [
      {
        id: 'rose-festival',
        termKo: '로즈 페스티벌',
        termEn: 'Rose Festival',
        promptKo:
          '마라케시 로즈 페스티벌(Festival des Roses)이 무엇인지, 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is the Marrakech Rose Festival for travelers? 3 short sentences.',
        searchQueryKo: '마라케시 로즈 페스티벌',
        searchQueryEn: 'Marrakech Rose Festival',
      },
      {
        id: 'kelaat-mgouna',
        termKo: 'Kelaat M\'Gouna',
        termEn: "Kelaat M'Gouna",
        promptKo:
          '로즈 페스티벌이 열리는 Kelaat M\'Gouna가 마라케시에서 어떻게 방문하는지 3문장 이내로 설명해줘.',
        promptEn: "How to visit Kelaat M'Gouna from Marrakech in 3 short sentences.",
        searchQueryKo: 'Kelaat M\'Gouna 로즈 페스티벌 투어',
        searchQueryEn: "Kelaat M'Gouna rose festival tour",
      },
      {
        id: 'medina',
        termKo: '메디나',
        termEn: 'Medina',
        promptKo:
          '마라케시 메디나(Medina)가 로즈 페스티벌 방문 기점으로 왜 좋은지 3문장 이내로 설명해줘.',
        promptEn: 'Why Marrakech Medina is a good base for the Rose Festival in 3 short sentences.',
        searchQueryKo: '마라케시 메디나 리야드',
        searchQueryEn: 'Marrakech Medina riad',
      },
      {
        id: 'jemaa-el-fnaa',
        termKo: '자마 엘 프나',
        termEn: 'Jemaa el-Fnaa',
        promptKo:
          '자마 엘 프나(Jemaa el-Fnaa) 광장이 마라케시 방문에서 어떤 역할을 하는지 3문장 이내로 설명해줘.',
        promptEn: 'What is Jemaa el-Fnaa square for Marrakech visitors in 3 short sentences.',
        searchQueryKo: '마라케시 자마 엘 프나',
        searchQueryEn: 'Marrakech Jemaa el-Fnaa',
        referenceUrl: 'https://en.wikipedia.org/wiki/Jemaa_el-Fnaa',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/자마엘프나',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'rose-tour',
            labelKo: '로즈 페스티벌 투어',
            labelEn: 'Rose Festival tour',
            kind: 'shop',
            searchQueryKo: 'Kelaat M\'Gouna 로즈 페스티벌 당일 투어',
            searchQueryEn: "Kelaat M'Gouna rose festival day tour",
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'medina-riad',
            labelKo: '메디나 리야드 검색',
            labelEn: 'Medina riad search',
            kind: 'shop',
            searchQueryKo: '마라케시 메디나 리야드',
            searchQueryEn: 'Marrakech Medina riad',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '마라케시 로즈 페스티벌',
    youtubeSearchQueryEn: 'Marrakech Rose Festival',
    mooniChips: [
      {
        id: 'day-tour',
        promptKo: '로즈 페스티벌 당일 투어 일정 알려줘',
        promptEn: 'Day tour schedule for Rose Festival?',
      },
      {
        id: 'medina-stay',
        promptKo: '메디나 리야드 고르는 팁 알려줘',
        promptEn: 'Tips for picking a Medina riad?',
      },
      {
        id: 'festival-dates',
        promptKo: '5월 초 페스티벌 날짜 확인 방법 알려줘',
        promptEn: 'How to confirm festival dates in May?',
      },
    ],
    priority: 1,
  },
  {
    id: 'hanoi-tet-2027',
    slug: 'hanoi',
    hubId: 'hanoi',
    type: 'season',
    title: '뗏(Tết) 연휴 윈도',
    titleEn: 'Tet Holiday Window',
    startDate: '2027-01-28',
    endDate: '2027-02-03',
    recurrence: 'annual',
    recurrenceNote: '음력 설 연휴 (연도별 변동)',
    recurrenceNoteEn: 'Lunar New Year (Tet) — dates vary yearly',
    venue: { name: 'Hoan Kiem · Old Quarter' },
    source: 'official_url',
    sourceUrl: 'https://www.vietnam.travel/',
    bookingHints: '올드쿼터·호안끼엠 — 연휴 전후 항공·기차 조기 마감',
    detailOverview:
      '베트남 음력 설(뗏) 연휴로, 하노이 올드쿼터·호안끼엠 일대 꽃 시장·제례·불꽃놀이가 이어집니다. 연휴 전후 3~4박으로 올드쿼터 기점을 잡아 설 분위기와 현지 행사를 둘러보는 방문이 일반적입니다.',
    highlights: [
      '올드쿼터(Old Quarter) — 꽃 시장·거리 음식 · 연휴 전 최대 혼잡',
      '호안끼엠 호수(Hoan Kiem) — 불꽃놀이·산책 · 도보 접근',
      '연휴 기간 — 일부 상점·관광 휴무 · 항공·기차 조기 마감',
    ],
    stayAreas: [
      {
        name: '올드쿼터 · Old Quarter',
        mrtKeyword: 'Hanoi Old Quarter',
        note: '꽃 시장·거리 음식 · 호안끼엠 도보',
      },
      {
        name: '호안끼엠 · Hoan Kiem',
        mrtKeyword: 'Hoan Kiem Hanoi',
        note: '호수 산책·불꽃놀이 뷰 · 올드쿼터 인접',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Hansers_tim_hieu_Tet_Nguyen_Dan_16-02-2026_1771376540207.jpg/1280px-Hansers_tim_hieu_Tet_Nguyen_Dan_16-02-2026_1771376540207.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Hansers_tim_hieu_Tet_Nguyen_Dan_16-02-2026_1771376540207.jpg/1280px-Hansers_tim_hieu_Tet_Nguyen_Dan_16-02-2026_1771376540207.jpg',
        captionKo: '뗏(설) 분위기',
        captionEn: 'Tet holiday atmosphere',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Hanoi_Old_Quarter_%2825397128097%29.jpg/1280px-Hanoi_Old_Quarter_%2825397128097%29.jpg',
        captionKo: '하노이 올드쿼터',
        captionEn: 'Hanoi Old Quarter',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Hoan_Kiem_Lake_4123.jpg/1280px-Hoan_Kiem_Lake_4123.jpg',
        captionKo: '호안끼엠 호수',
        captionEn: 'Hoan Kiem Lake',
      },
    ],
    glossaryTerms: [
      {
        id: 'tet',
        termKo: '뗏',
        termEn: 'Tet',
        promptKo:
          '베트남 음력 설(뗏·Tết)이 무엇인지, 하노이 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'What is Vietnamese Tet (Tết) for Hanoi travelers? 3 short sentences.',
        searchQueryKo: '베트남 뗏 설 연휴',
        searchQueryEn: 'Vietnam Tet holiday',
        referenceUrl: 'https://en.wikipedia.org/wiki/Tết',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/뗏',
      },
      {
        id: 'old-quarter',
        termKo: '올드쿼터',
        termEn: 'Old Quarter',
        promptKo:
          '하노이 올드쿼터(Old Quarter)가 뗏 시즌 방문에서 왜 중심인지 3문장 이내로 설명해줘.',
        promptEn: 'Why Hanoi Old Quarter matters during Tet in 3 short sentences.',
        searchQueryKo: '하노이 올드쿼터 뗏 꽃 시장',
        searchQueryEn: 'Hanoi Old Quarter Tet flower market',
        referenceUrl: 'https://en.wikipedia.org/wiki/Old_Quarter,_Hanoi',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/하노이_올드쿼터',
      },
      {
        id: 'hoan-kiem',
        termKo: '호안끼엠',
        termEn: 'Hoan Kiem',
        promptKo:
          '호안끼엠 호(Hoan Kiem Lake)가 뗏 연휴 하노이 일정에서 어떤 역할을 하는지 3문장 이내로 설명해줘.',
        promptEn: 'Hoan Kiem Lake role during Hanoi Tet holidays in 3 short sentences.',
        searchQueryKo: '하노이 호안끼엠 호수 뗏',
        searchQueryEn: 'Hoan Kiem Lake Hanoi Tet',
        referenceUrl: 'https://en.wikipedia.org/wiki/Hoàn_Kiếm_Lake',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/호안끼엠_호',
      },
      {
        id: 'flower-market',
        termKo: '꽃 시장',
        termEn: 'flower market',
        promptKo:
          '뗏 전 하노이 꽃 시장(연휴 준비)의 특징과 방문 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Hanoi Tet flower markets before the holiday in 3 short sentences.',
        searchQueryKo: '하노이 뗏 꽃 시장',
        searchQueryEn: 'Hanoi Tet flower market',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'tet-flower-market',
            labelKo: '꽃 시장·올드쿼터 검색',
            labelEn: 'Flower market & Old Quarter search',
            kind: 'shop',
            searchQueryKo: '하노이 올드쿼터 뗏 꽃 시장',
            searchQueryEn: 'Hanoi Old Quarter Tet flower market',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'tet-travel-guide',
            labelKo: '뗏 연휴 여행 안내',
            labelEn: 'Tet holiday travel guide',
            kind: 'tour',
            href: 'https://www.vietnam.travel/',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '하노이 뗏 설 연휴',
    youtubeSearchQueryEn: 'Hanoi Tet holiday',
    mooniChips: [
      {
        id: 'tet-timing',
        promptKo: '뗏 연휴 전후 4박 일정은 언제 잡는 게 좋아?',
        promptEn: 'When to book a 4-night trip around Tet in Hanoi?',
      },
      {
        id: 'old-quarter-stay',
        promptKo: '올드쿼터랑 호안끼엠 숙소 어디가 나아?',
        promptEn: 'Old Quarter vs Hoan Kiem for Tet stay?',
      },
      {
        id: 'holiday-closures',
        promptKo: '연휴 기간 상점·교통 휴무 어떻게 대비해?',
        promptEn: 'How to plan around Tet shop and transport closures?',
      },
    ],
    priority: 1,
  },
  {
    id: 'singapore-gp-2026',
    slug: 'singapore',
    hubId: 'singapore',
    type: 'festival',
    title: '싱가포르 그랑프리',
    titleEn: 'Singapore Grand Prix',
    startDate: '2026-10-09',
    endDate: '2026-10-11',
    recurrence: 'annual',
    recurrenceNote: '10월 첫째 주말 전후',
    recurrenceNoteEn: 'Around the first weekend in Oct',
    venue: { name: 'Marina Bay Street Circuit' },
    source: 'official_url',
    sourceUrl: 'https://singaporegp.sg/en/',
    bookingHints: '마리나 베이·버기스·시티홀 — 레이스 주말 3~6개월 전 숙소·티켓 조기 마감',
    detailOverview:
      '마리나 베이 스트리트 서킷에서 열리는 F1 나이트 레이스로, 금~일 3일간 레이스·콘서트·축제가 이어집니다. 전체 시즌 숙박보다 레이스 주말 전후 2~3박으로 마리나 베이·시티홀 기점을 잡아 야간 레이스와 주변 행사를 둘러보는 방문이 일반적입니다.',
    highlights: [
      'Marina Bay Street Circuit — 세계 유일의 F1 나이트 스트리트 레이스 · Padang 콘서트·불꽃',
      'Bayfront·Promenade·Esplanade MRT — 서킷 도보·셔틀 접근 · 레이스 당일 교통 통제',
      '그랜드스탠드·Zone 4 패스 — 공식 티켓 조기 매진 · 호텔 패키지·재판매 주의',
    ],
    stayAreas: [
      {
        name: '마리나 베이 · Marina Bay',
        mrtKeyword: 'Marina Bay Singapore',
        note: '서킷·MBS 도보 · 레이스 주말 최고가',
      },
      {
        name: '버기스 · Bugis',
        mrtKeyword: 'Bugis Singapore',
        note: 'MRT 2~3정거장 · 상대적 가성비',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Formula_One_Grand_Prix_Singapore_2013_-_Ferrari_3.jpg/1280px-Formula_One_Grand_Prix_Singapore_2013_-_Ferrari_3.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Formula_One_Grand_Prix_Singapore_2013_-_Ferrari_3.jpg/1280px-Formula_One_Grand_Prix_Singapore_2013_-_Ferrari_3.jpg',
        captionKo: '싱가포르 GP 나이트 레이스',
        captionEn: 'Singapore GP night race',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Valtteri_Bottas_on_track%2C_Singapore_Grand_Prix_2024.jpg/1280px-Valtteri_Bottas_on_track%2C_Singapore_Grand_Prix_2024.jpg',
        captionKo: '마리나 베이 서킷',
        captionEn: 'Marina Bay circuit',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Singapore_Marina_Bay_Dusk_2018-02-27.jpg/1280px-Singapore_Marina_Bay_Dusk_2018-02-27.jpg',
        captionKo: '마리나 베이 스카이라인',
        captionEn: 'Marina Bay skyline',
      },
    ],
    glossaryTerms: [
      {
        id: 'marina-bay-circuit',
        termKo: '마리나 베이 서킷',
        termEn: 'Marina Bay Street Circuit',
        promptKo:
          '싱가포르 그랑프리 마리나 베이 스트리트 서킷의 특징과 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn:
          'Marina Bay Street Circuit and Singapore GP basics for travelers in 3 short sentences.',
        searchQueryKo: '싱가포르 그랑프리 마리나 베이 서킷',
        searchQueryEn: 'Singapore Grand Prix Marina Bay circuit',
        referenceUrl: 'https://en.wikipedia.org/wiki/Marina_Bay_Street_Circuit',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/마리나_베이_시가지_서킷',
      },
      {
        id: 'night-race',
        termKo: '나이트 레이스',
        termEn: 'night race',
        promptKo: 'F1 나이트 레이스가 싱가포르 GP에서 왜 특별한지 3문장 이내로 설명해줘.',
        promptEn: 'Why the Singapore GP night race is special for visitors in 3 short sentences.',
        searchQueryKo: '싱가포르 그랑프리 나이트 레이스',
        searchQueryEn: 'Singapore Grand Prix night race',
      },
      {
        id: 'grandstand',
        termKo: '그랜드스탠드',
        termEn: 'grandstand',
        promptKo:
          '싱가포르 GP 그랜드스탠드·Zone 티켓 종류와 예매 팁을 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'Singapore GP grandstand and zone tickets for travelers in 3 short sentences.',
        searchQueryKo: '싱가포르 그랑프리 티켓 예매',
        searchQueryEn: 'Singapore Grand Prix tickets',
      },
      {
        id: 'padang',
        termKo: 'Padang',
        termEn: 'Padang',
        promptKo:
          '싱가포르 GP Padang 콘서트·축제 구역이 레이스 주말에 어떤 역할을 하는지 3문장 이내로 설명해줘.',
        promptEn: 'Padang concerts during Singapore GP race weekend in 3 short sentences.',
        searchQueryKo: '싱가포르 그랑프리 Padang 콘서트',
        searchQueryEn: 'Singapore GP Padang concerts',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'gp-tickets',
            labelKo: '공식 티켓 검색',
            labelEn: 'Official tickets',
            kind: 'shop',
            searchQueryKo: '싱가포르 그랑프리 티켓',
            searchQueryEn: 'Singapore Grand Prix tickets',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'marina-bay-mrt',
            labelKo: 'Marina Bay MRT',
            labelEn: 'Marina Bay MRT',
            kind: 'shop',
            searchQueryKo: '싱가포르 마리나 베이 MRT 그랑프리',
            searchQueryEn: 'Marina Bay MRT Singapore Grand Prix',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '싱가포르 그랑프리',
    youtubeSearchQueryEn: 'Singapore Grand Prix',
    mooniChips: [
      {
        id: 'ticket-types',
        promptKo: '그랜드스탠드랑 Zone 패스 차이 알려줘',
        promptEn: 'What is the difference between grandstand and zone passes?',
      },
      {
        id: 'best-days',
        promptKo: '레이스 주말 중 언제 가는 게 좋아?',
        promptEn: 'Which day of race weekend is best to visit?',
      },
      {
        id: 'marina-bay-stay',
        promptKo: '마리나 베이 근처 숙소 추천 기준 알려줘',
        promptEn: 'How to pick a hotel near Marina Bay for the GP?',
      },
    ],
    priority: 1,
  },
  {
    id: 'dubai-fitness-challenge-2026',
    slug: 'dubai',
    hubId: 'dubai',
    type: 'festival',
    title: '두바이 피트니스 챌린지',
    titleEn: 'Dubai Fitness Challenge',
    startDate: '2026-10-31',
    endDate: '2026-11-29',
    recurrence: 'annual',
    recurrenceNote: '10월 말~11월 · 30×30',
    recurrenceNoteEn: 'Late Oct–Nov · 30×30 challenge',
    venue: { name: 'Citywide · Zabeel Park · Sheikh Zayed Road' },
    source: 'official_url',
    sourceUrl: 'https://www.dubaifitnesschallenge.com/en/',
    bookingHints: '다운타운·마리나·JBR — Dubai Run·Ride 전후 2~4박',
    detailOverview:
      '두바이 전역에서 「하루 30분 운동 × 30일」을 목표로 하는 도시형 피트니스 페스티벌입니다. 10월 31일 개막부터 11월 29일까지 Fitness Village·허브·무료 클래스가 이어지며, Dubai Ride·Dubai Run 등 플래그십 일정 전후 3~4박 방문이 일반적입니다.',
    highlights: [
      'Dubai Ride(11/1) — 셰이크 자ayed 로드 자전거 · 4km·12km 코스 · 사전 등록',
      'Dubai Run(11/22) — 셰이크 자ayed 로드 러닝 · 5km·10km · 새벽 출발',
      'Fitness Village(Zabeel Park) — 클래스·부스 · Dubai Yoga(11/29) 피날레',
    ],
    stayAreas: [
      {
        name: '다운타운 · Downtown',
        mrtKeyword: 'Downtown Dubai',
        note: 'Dubai Ride·Run 셰이크 자ayed 접근 · 메트로',
      },
      {
        name: '마리나 · Dubai Marina',
        mrtKeyword: 'Dubai Marina',
        note: 'JBR·해변 러닝 · 다운타운 택시 15~20분',
      },
    ],
    recommendedNights: 4,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
        captionKo: '두바이 마리나 스카이라인',
        captionEn: 'Dubai Marina skyline',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dubai_Marina_Skyline_93.jpg/1280px-Dubai_Marina_Skyline_93.jpg',
        captionKo: '두바이 야경',
        captionEn: 'Dubai skyline at night',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Burj_Khalifa_Dubai%2C_UAE_at_Sunset_001_by_Eric_Chamchoum.jpg/1280px-Burj_Khalifa_Dubai%2C_UAE_at_Sunset_001_by_Eric_Chamchoum.jpg',
        captionKo: '부르즈 할리파 일대',
        captionEn: 'Burj Khalifa area',
      },
    ],
    glossaryTerms: [
      {
        id: '30x30',
        termKo: '30×30',
        termEn: '30x30',
        promptKo:
          '두바이 피트니스 챌린지 30×30(30분×30일)이 무엇인지 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'What is Dubai Fitness Challenge 30x30 for visitors in 3 short sentences.',
        searchQueryKo: '두바이 피트니스 챌린지 30x30',
        searchQueryEn: 'Dubai Fitness Challenge 30x30',
        referenceUrl: 'https://www.dubaifitnesschallenge.com/en/',
        referenceUrlKo: 'https://www.dubaifitnesschallenge.com/',
      },
      {
        id: 'dubai-run',
        termKo: 'Dubai Run',
        termEn: 'Dubai Run',
        promptKo:
          'Dubai Run 일정·코스·등록 방법을 여행자가 알아야 할 핵심만 3문장 이내로 설명해줘.',
        promptEn: 'Dubai Run schedule, routes and registration for travelers in 3 short sentences.',
        searchQueryKo: 'Dubai Run 2026 등록',
        searchQueryEn: 'Dubai Run 2026 registration',
      },
      {
        id: 'dubai-ride',
        termKo: 'Dubai Ride',
        termEn: 'Dubai Ride',
        promptKo:
          'Dubai Ride가 셰이크 자ayed 로드에서 어떻게 진행되는지 3문장 이내로 설명해줘.',
        promptEn: 'How Dubai Ride works on Sheikh Zayed Road in 3 short sentences.',
        searchQueryKo: 'Dubai Ride 2026',
        searchQueryEn: 'Dubai Ride 2026',
      },
      {
        id: 'fitness-village',
        termKo: 'Fitness Village',
        termEn: 'Fitness Village',
        promptKo:
          '두바이 피트니스 챌린지 Fitness Village(Zabeel Park)에서 무엇을 할 수 있는지 3문장 이내로 설명해줘.',
        promptEn: 'What to do at Dubai Fitness Challenge Fitness Village in 3 short sentences.',
        searchQueryKo: 'Dubai Fitness Challenge Zabeel Park',
        searchQueryEn: 'Dubai Fitness Challenge Fitness Village',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'dubai-ride-register',
            labelKo: 'Dubai Ride 등록',
            labelEn: 'Dubai Ride registration',
            kind: 'shop',
            searchQueryKo: 'Dubai Ride 2026 등록',
            searchQueryEn: 'Dubai Ride 2026 register',
            searchTarget: 'google',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'dubai-run-register',
            labelKo: 'Dubai Run 등록',
            labelEn: 'Dubai Run registration',
            kind: 'shop',
            searchQueryKo: 'Dubai Run 2026 등록',
            searchQueryEn: 'Dubai Run 2026 register',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '두바이 피트니스 챌린지',
    youtubeSearchQueryEn: 'Dubai Fitness Challenge',
    mooniChips: [
      {
        id: 'register-flagship',
        promptKo: 'Dubai Run·Ride 등록은 어떻게 해?',
        promptEn: 'How do I register for Dubai Run and Ride?',
      },
      {
        id: 'best-week',
        promptKo: '11월 중 어느 주에 가는 게 좋아?',
        promptEn: 'Which week in November is best to visit?',
      },
      {
        id: 'where-stay',
        promptKo: '다운타운이랑 마리나 중 어디 숙소가 나아?',
        promptEn: 'Downtown or Marina — where should I stay?',
      },
    ],
    priority: 1,
  },
  {
    id: 'barcelona-la-merce-2026',
    slug: 'barcelona',
    hubId: 'barcelona',
    type: 'festival',
    title: '라 메르세',
    titleEn: 'La Mercè',
    startDate: '2026-09-18',
    endDate: '2026-09-24',
    recurrence: 'annual',
    recurrenceNote: '9월 셋째 주 · 수호성인의 날 9/24',
    recurrenceNoteEn: 'Third week of Sep · feast day Sep 24',
    venue: { name: 'Barcelona citywide · Plaça de Sant Jaume' },
    source: 'official_url',
    sourceUrl: 'https://www.barcelona.cat/capdesetmana/en/merce',
    bookingHints: '고딕 지구·엘 본·그라시아 — 축제 주간 2~4박 · 9/24 전후 교통 통제',
    detailOverview:
      '바르셀로나 수호성인 메르세(Mercè)를 기념하는 도시 축제로, 9월 셋째 주 전후 약 일주일간 거리 공연·카스텔레르스(인탑)·코레포크(불꽃 퍼레이드)가 이어집니다. 전체 시즌 숙박보다 9/22~24 절정 전후 2~3박으로 고딕 지구·엘 본 기점을 잡아 야간 행사와 메트로 이동을 묶는 방문이 일반적입니다.',
    highlights: [
      'Plaça de Sant Jaume — 개막·폐막·공식 행사 중심 · 고딕 지구 도보권',
      'Castellers(인탑) — 광장·거리 공연 · 혼잡 구간 조기 도착 권장',
      'Correfoc·불꽃·콘서트 — 야간 행사 다수 · 9/24 전후 교통·지하철 운행 변경',
    ],
    stayAreas: [
      {
        name: '고딕 지구 · El Born',
        mrtKeyword: 'Barcelona Gothic Quarter',
        note: '산트 자우메·엘 본 도보 · 축제 행사 밀집',
      },
      {
        name: '그라시아 · Gràcia',
        mrtKeyword: 'Barcelona Gracia',
        note: '현지 분위기 · L3·L4 환승으로 중심가 15분',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Merc%C3%A8_2016_-_Castellers_a_la_Pla%C3%A7a_de_Sant_Jaume_01.jpg/1280px-Merc%C3%A8_2016_-_Castellers_a_la_Pla%C3%A7a_de_Sant_Jaume_01.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Merc%C3%A8_2016_-_Castellers_a_la_Pla%C3%A7a_de_Sant_Jaume_01.jpg/1280px-Merc%C3%A8_2016_-_Castellers_a_la_Pla%C3%A7a_de_Sant_Jaume_01.jpg',
        captionKo: '라 메르세 카스텔레르스',
        captionEn: 'La Mercè castellers',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Sagrada_Familia_March_2015-19bw.jpg/1280px-Sagrada_Familia_March_2015-19bw.jpg',
        captionKo: '사그라다 파밀리아',
        captionEn: 'Sagrada Família',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/La_Merc%C3%A8_2024_-_Diada_castellera_de_la_Merc%C3%A8_-_20240924_152106.jpg/1280px-La_Merc%C3%A8_2024_-_Diada_castellera_de_la_Merc%C3%A8_-_20240924_152106.jpg',
        captionKo: '라 메르세 2024 인탑 행사',
        captionEn: 'La Mercè 2024 castell diada',
      },
    ],
    glossaryTerms: [
      {
        id: 'la-merce',
        termKo: '라 메르세',
        termEn: 'La Mercè',
        promptKo:
          '바르셀로나 라 메르세(La Mercè) 축제가 무엇인지 여행자 관점에서 3문장 이내로 설명해줘.',
        promptEn: 'What is La Mercè festival in Barcelona for travelers in 3 short sentences.',
        searchQueryKo: '바르셀로나 라 메르세 축제',
        searchQueryEn: 'Barcelona La Mercè festival',
        referenceUrl: 'https://en.wikipedia.org/wiki/La_Merc%C3%A8',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/%EB%9D%BC_%EB%A9%94%EB%A5%B4%EC%84%B8',
      },
      {
        id: 'castellers',
        termKo: '카스텔레르스',
        termEn: 'castellers',
        promptKo:
          '카스텔레르스(인탑)가 라 메르세에서 왜 중요한지 3문장 이내로 설명해줘.',
        promptEn: 'Why castellers matter at La Mercè in 3 short sentences.',
        searchQueryKo: '바르셀로나 카스텔레르스 인탑',
        searchQueryEn: 'Barcelona castellers human towers',
        referenceUrl: 'https://en.wikipedia.org/wiki/Castell',
      },
      {
        id: 'correfoc',
        termKo: '코레포크',
        termEn: 'correfoc',
        promptKo:
          '라 메르세 코레포크(불꽃 퍼레이드)가 무엇인지 안전·관람 팁을 3문장 이내로 설명해줘.',
        promptEn: 'What is correfoc at La Mercè and how to watch safely in 3 short sentences.',
        searchQueryKo: '바르셀로나 코레포크 라 메르세',
        searchQueryEn: 'Barcelona correfoc La Mercè',
      },
      {
        id: 'sant-jaume',
        termKo: '산트 자우메 광장',
        termEn: 'Plaça de Sant Jaume',
        promptKo:
          '산트 자우메 광장이 라 메르세 공식 행사의 중심인 이유를 3문장 이내로 설명해줘.',
        promptEn: 'Why Plaça de Sant Jaume is the hub of La Mercè in 3 short sentences.',
        searchQueryKo: '바르셀로나 산트 자우메 광장',
        searchQueryEn: 'Plaça de Sant Jaume Barcelona',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'merce-official',
            labelKo: '공식 일정',
            labelEn: 'Official programme',
            kind: 'shop',
            href: 'https://www.barcelona.cat/capdesetmana/en/merce',
          },
        ],
      },
      {
        highlightIndex: 2,
        links: [
          {
            id: 'correfoc-guide',
            labelKo: '코레포크 안내',
            labelEn: 'Correfoc guide',
            kind: 'shop',
            searchQueryKo: '바르셀로나 코레포크 라 메르세',
            searchQueryEn: 'Barcelona correfoc La Mercè',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '바르셀로나 라 메르세',
    youtubeSearchQueryEn: 'Barcelona La Mercè',
    mooniChips: [
      {
        id: 'best-nights',
        promptKo: '9월 중 어느 박이 라 메르세 보기 좋아?',
        promptEn: 'Which nights in September are best for La Mercè?',
      },
      {
        id: 'castellers-spots',
        promptKo: '카스텔레르스 보기 좋은 장소 알려줘',
        promptEn: 'Where is best to watch castellers?',
      },
      {
        id: 'stay-area',
        promptKo: '고딕 지구랑 그라시아 중 어디 숙소가 나아?',
        promptEn: 'Gothic Quarter or Gràcia — where should I stay?',
      },
    ],
    priority: 1,
  },
  {
    id: 'istanbul-marathon-2026',
    slug: 'istanbul',
    hubId: 'istanbul',
    type: 'festival',
    title: '이스탄불 마라톤',
    titleEn: 'Istanbul Marathon',
    startDate: '2026-11-01',
    endDate: '2026-11-01',
    recurrence: 'annual',
    recurrenceNote: '11월 첫째 일요일',
    recurrenceNoteEn: 'First Sunday in November',
    venue: { name: 'Asian side start · Bosphorus Bridge · European finish' },
    source: 'official_url',
    sourceUrl: 'https://maraton.istanbul/en/',
    bookingHints: '카드키쾌·베식타스·술탄아흐메트 — 레이스 전후 2~3박 · 보스포루스 교통 통제',
    detailOverview:
      '아시아와 유럽을 잇는 보스포루스 대교를 넘는 세계 유일의 대륙횡단 마라톤입니다. 11월 첫째 일요일 새벽 출발로 풀·하프·15K·10K·8K 코스가 운영되며, 레이스 전후 2~3박으로 카드키쾌·베식타스 기점 숙소를 잡아 등록·교통 통제·관람을 묶는 방문이 일반적입니다.',
    highlights: [
      'Bosphorus Bridge — 풀코스 유일 구간 · 대륙횡단 상징 · 당일 교통 통제',
      '15K·하프·풀 — 사전 등록·피니셔 패키지 · 출발(아시아)·도착(유럽) 시간대 확인',
      'Sultanahmet·Beşiktaş 일대 — 레이스 후 관광·트램·페리 이동 · 주말 혼잡',
    ],
    stayAreas: [
      {
        name: '카드키쾌 · Kadıköy',
        mrtKeyword: 'Istanbul Kadikoy',
        note: '아시아 측 · 페리·메트로 · 레이스 전 숙소',
      },
      {
        name: '베식타스 · Beşiktaş',
        mrtKeyword: 'Istanbul Besiktas',
        note: '유럽 측 · 보스포루스·트램 · 피니시 인근',
      },
    ],
    recommendedNights: 3,
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/28thIntercontinentalIstanbulEurasiaMarathon.jpg/1280px-28thIntercontinentalIstanbulEurasiaMarathon.jpg',
    heroImages: [
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/28thIntercontinentalIstanbulEurasiaMarathon.jpg/1280px-28thIntercontinentalIstanbulEurasiaMarathon.jpg',
        captionKo: '이스탄불 대륙횡단 마라톤',
        captionEn: 'Intercontinental Istanbul Marathon',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/2021_11_07_09_56_IMG_3460.jpg/1280px-2021_11_07_09_56_IMG_3460.jpg',
        captionKo: '마라톤 당일 보스포루스',
        captionEn: 'Marathon day on the Bosphorus',
      },
      {
        url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/1280px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg',
        captionKo: '이스탄불 스카이라인',
        captionEn: 'Istanbul skyline',
      },
    ],
    glossaryTerms: [
      {
        id: 'continental-marathon',
        termKo: '대륙횡단 마라톤',
        termEn: 'continental marathon',
        promptKo:
          '이스탄불 마라톤이 아시아-유럽 대륙횡단으로 유명한 이유를 3문장 이내로 설명해줘.',
        promptEn: 'Why Istanbul Marathon is famous as a continental race in 3 short sentences.',
        searchQueryKo: '이스탄불 마라톤 대륙횡단',
        searchQueryEn: 'Istanbul Marathon Asia Europe',
        referenceUrl: 'https://en.wikipedia.org/wiki/Istanbul_Marathon',
        referenceUrlKo: 'https://ko.wikipedia.org/wiki/%EC%9D%B4%EC%8A%A4%ED%83%84%EB%B6%88_%EB%A7%88%EB%9D%BC%ED%86%A4',
      },
      {
        id: 'bosphorus-bridge',
        termKo: '보스포루스 대교',
        termEn: 'Bosphorus Bridge',
        promptKo:
          '마라톤 당일 보스포루스 대교 구간이 여행자에게 왜 특별한지 3문장 이내로 설명해줘.',
        promptEn: 'Why the Bosphorus Bridge leg matters on race day in 3 short sentences.',
        searchQueryKo: '이스탄불 마라톤 보스포루스 대교',
        searchQueryEn: 'Istanbul Marathon Bosphorus Bridge',
        referenceUrl: 'https://en.wikipedia.org/wiki/15_July_Martyrs_Bridge',
      },
      {
        id: 'race-categories',
        termKo: '15K·하프·풀',
        termEn: '15K half full',
        promptKo:
          '이스탄불 마라톤 15K·하프·풀 코스 차이와 등록 팁을 3문장 이내로 설명해줘.',
        promptEn: 'Istanbul Marathon 15K, half and full course differences in 3 short sentences.',
        searchQueryKo: '이스탄불 마라톤 등록 15K 하프',
        searchQueryEn: 'Istanbul Marathon registration 15K half full',
      },
      {
        id: 'kadikoy-besiktas',
        termKo: '카드키쾌·베식타스',
        termEn: 'Kadıköy Beşiktaş',
        promptKo:
          '레이스 전후 카드키쾌(아시아)와 베식타스(유럽) 숙소를 고를 때 기준을 3문장 이내로 설명해줘.',
        promptEn: 'How to choose Kadıköy vs Beşiktaş stays for race weekend in 3 short sentences.',
        searchQueryKo: '이스탄불 마라톤 숙소 카드키쾌 베식타스',
        searchQueryEn: 'Istanbul Marathon hotel Kadıköy Beşiktaş',
      },
    ],
    highlightContextLinks: [
      {
        highlightIndex: 0,
        links: [
          {
            id: 'marathon-register',
            labelKo: '공식 등록',
            labelEn: 'Official registration',
            kind: 'shop',
            href: 'https://maraton.istanbul/en/',
          },
        ],
      },
      {
        highlightIndex: 1,
        links: [
          {
            id: 'course-map',
            labelKo: '코스 지도',
            labelEn: 'Course map',
            kind: 'shop',
            searchQueryKo: '이스탄불 마라톤 코스 지도',
            searchQueryEn: 'Istanbul Marathon course map',
            searchTarget: 'google',
          },
        ],
      },
    ],
    youtubeSearchQueryKo: '이스탄불 마라톤',
    youtubeSearchQueryEn: 'Istanbul Marathon',
    mooniChips: [
      {
        id: 'register-deadline',
        promptKo: '마라톤 등록은 언제까지 해?',
        promptEn: 'When is Istanbul Marathon registration deadline?',
      },
      {
        id: 'spectator-spots',
        promptKo: '관람하기 좋은 구간 알려줘',
        promptEn: 'Best spots to watch the marathon?',
      },
      {
        id: 'bridge-closure',
        promptKo: '레이스 당일 보스포루스 교통 통제 어떻게 돼?',
        promptEn: 'How does Bosphorus traffic work on race day?',
      },
    ],
    priority: 1,
  },
];
