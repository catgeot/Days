/**
 * 여행지 slug별 검증된 페리 노선·예약 URL (수동 SSOT).
 * `npm run generate:ferries` 시 travelSpotFerries.json에 병합됩니다.
 *
 * provider: direct | direct_ferries | twelve_go | klook_ferry
 * direct_ferries / klook_ferry URL은 런타임에서 affiliate 헬퍼로 resolve.
 *
 * @type {Record<string, {
 *   tier: 'required'|'common'|'cruise_only'|'none',
 *   summary?: string,
 *   routes?: Array<{ id: string, label: string, duration?: string, directFerries?: boolean, tips?: string[], bookings: Array<{ provider: string, name: string, url?: string }> }>,
 *   fallbacks?: string[],
 *   dfRecommendations?: string[],
 *   confidence?: string,
 *   rationale?: string
 * }>}
 */
export const TRAVEL_SPOT_FERRY_OVERRIDES = {
  // ── 한일 · 동아시아 ──
  tsushima: {
    tier: 'required',
    summary: '한국→대마도(쓰시마)는 부산국제여객터미널→히타카츠항 쾌속페리가 주 경로입니다.',
    routes: [
      {
        id: 'busan-hitakatsu',
        label: '부산국제여객터미널 → 히타카츠항',
        duration: '약 1시간',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'JR Beetle', url: 'https://www.jrbeetle.co.jp/' },
          { provider: 'direct', name: '캠ellia 라인', url: 'https://www.camellia-line.co.jp/' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'high',
    rationale: 'Direct Ferries 취항 없음 — 운항사 직접 예약',
  },
  fukuoka: {
    tier: 'common',
    summary: '후쿠오카↔부산 국제 페리(JR Beetle) 노선이 있습니다.',
    routes: [
      {
        id: 'hakata-busan',
        label: '하카타(후쿠오카) ↔ 부산',
        duration: '약 3시간',
        directFerries: true,
        bookings: [
          { provider: 'direct', name: 'JR Beetle', url: 'https://www.jrbeetle.co.jp/' },
          { provider: 'direct_ferries', name: 'Direct Ferries' },
        ],
      },
    ],
    dfRecommendations: [
      '하카타(Hakata, 후쿠오카) - 부산(Busan) (약 3시간)',
      '※ JR Beetle 운항',
    ],
    confidence: 'high',
  },

  // ── 필리핀 ──
  boracay: {
    tier: 'required',
    summary: '보라카이는 칼리보(KLO) 또는 카틱란(MPH) 도착 후 버스·페리 환승이 일반적입니다.',
    routes: [
      {
        id: 'caticlan-boracay',
        label: '카틱란(Caticlan) → 카길라항 → 보라카이',
        duration: '약 15~20분',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/caticlan/boracay' },
          { provider: 'direct', name: '2GO Travel', url: 'https://travel.2go.com.ph/' },
        ],
      },
      {
        id: 'kalibo-boracay',
        label: '칼리보(Kalibo) 공항 → 항구 → 보라카이',
        duration: '약 2시간(버스+페리)',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/kalibo/boracay' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'high',
  },
  cebu: {
    tier: 'common',
    summary: '세부에서 보홀·시키호르 등 섬으로 페리가 흔합니다.',
    routes: [
      {
        id: 'cebu-bohol',
        label: '세부 → 타그빌라란(보홀)',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/cebu/tagbilaran' },
          { provider: 'direct', name: 'OceanJet', url: 'https://www.oceanjet.net/' },
        ],
      },
    ],
    dfRecommendations: [
      '세부(Cebu) - 타그빌라란(Tagbilaran, 보홀) (약 2시간)',
      '세부(Cebu) - 시키호르(Siquijor) (약 5시간)',
    ],
    confidence: 'high',
  },
  bohol: {
    tier: 'common',
    summary: '보홀은 타그빌라란(TAG) 직항 또는 세부(CEB) 페리로 들어옵니다.',
    routes: [
      {
        id: 'tagbilaran-cebu',
        label: '타그빌라란(보홀) ↔ 세부',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/tagbilaran/cebu' },
          { provider: 'direct', name: 'OceanJet', url: 'https://www.oceanjet.net/' },
        ],
      },
    ],
    dfRecommendations: [
      '타그빌라란(Tagbilaran, 보홀) - 세부(Cebu) (약 2시간)',
      '타그빌라란(Tagbilaran) - 시키호르(Siquijor) (약 1.5시간)',
    ],
    confidence: 'high',
  },
  palawan: {
    tier: 'common',
    summary: '팔라완 일부 구간(엘니도·코론 등)은 보트·페리 이동이 흔합니다.',
    routes: [
      {
        id: 'puerto-el-nido',
        label: '푸에르토 프린세사 → 엘니도',
        duration: '약 5~6시간',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/puerto-princesa/el-nido' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  'el-nido': {
    tier: 'common',
    summary: '엘니도는 팔awan 본토에서 보트·페리로 접근하는 일정이 많습니다.',
    routes: [
      {
        id: 'coron-el-nido',
        label: '코론 ↔ 엘니도 (속도선)',
        duration: '약 3~4시간',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/coron/el-nido' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },

  // ── 인도네시아 ──
  'gili-meno': {
    tier: 'required',
    summary: '길리 메노는 롬복·발리에서 페리(쾌속선)로만 접근합니다.',
    routes: [
      {
        id: 'bali-gili',
        label: '발리(사누르/파당바이) → 길리 제도',
        duration: '약 2~3시간',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'Eka Jaya', url: 'https://ekajayafastboat.com/' },
          { provider: 'direct', name: 'BlueWater Express', url: 'https://www.bluewaterexpress.com/' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/bali/gili-trawangan' },
        ],
      },
      {
        id: 'lombok-gili',
        label: '롬복(방살) → 길리 제도',
        duration: '약 15~30분',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/lombok/gili-trawangan' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'high',
  },
  lombok: {
    tier: 'common',
    summary: '롬복↔발리 페리 및 길리 제도 연결 노선이 있습니다.',
    routes: [
      {
        id: 'padangbai-lembar',
        label: '발리(파당바이) ↔ 롬복(렘바르)',
        duration: '약 1.5~4시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/bali/lombok' },
        ],
      },
      {
        id: 'lombok-gili',
        label: '롬복 → 길리 제도',
        duration: '약 30분',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/lombok/gili-trawangan' },
        ],
      },
    ],
    dfRecommendations: [
      '렘바르(Lembar, 롬복) - 파당 바이(Padang Bai, 발리) (약 1.5-4시간)',
      '롬복(Lombok) - 길리 제도(Gili Islands) (약 30분)',
    ],
    confidence: 'high',
  },
  bali: {
    tier: 'common',
    summary: '발리에서 롬복·길리·누사페니다 등으로 페리·쾌속선이 흔합니다.',
    routes: [
      {
        id: 'padangbai-lembar',
        label: '파당바이 → 롬복(렘바르)',
        duration: '약 1.5~4시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/bali/lombok' },
        ],
      },
      {
        id: 'sanur-gili',
        label: '사누르 → 길리 제도',
        duration: '약 2시간',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'Eka Jaya', url: 'https://ekajayafastboat.com/' },
          { provider: 'direct', name: 'BlueWater Express', url: 'https://www.bluewaterexpress.com/' },
        ],
      },
      {
        id: 'sanur-nusa-penida',
        label: '사누르 → 누사 페니다',
        duration: '약 45분',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/bali/nusa-penida' },
        ],
      },
    ],
    dfRecommendations: [
      '파당 바이(Padang Bai, 발리) - 렘바르(Lembar, 롬복) (약 1.5-4시간)',
      '사누르(Sanur, 발리) - 길리 제도(Gili Islands) (약 2시간)',
      '사누르(Sanur, 발리) - 누사 페니다(Nusa Penida) (약 45분)',
    ],
    confidence: 'high',
  },

  // ── 태국 ──
  phuket: {
    tier: 'common',
    summary: '푸켓에서 피피·크라비·코란타 등 섬으로 페리·스피드보트가 흔합니다.',
    routes: [
      {
        id: 'phuket-phi-phi',
        label: '푸켓 → 피피 제도',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/phuket/phi-phi' },
        ],
      },
      {
        id: 'phuket-krabi',
        label: '푸켓 → 크라비',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/phuket/krabi' },
        ],
      },
    ],
    dfRecommendations: [
      '푸켓(Phuket) - 피피 제도(Phi Phi Islands) (약 2시간)',
      '푸켓(Phuket) - 크라비(Krabi) (약 2시간)',
      '푸켓(Phuket) - 코 란타(Koh Lanta) (약 3시간)',
    ],
    confidence: 'high',
  },
  krabi: {
    tier: 'common',
    summary: '크라비에서 코란타·피피 등으로 페리가 흔합니다.',
    routes: [
      {
        id: 'krabi-koh-lanta',
        label: '크라비 → 코 란타',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/krabi/koh-lanta' },
        ],
      },
      {
        id: 'krabi-phi-phi',
        label: '크라비 → 피피 제도',
        duration: '약 1.5시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/krabi/phi-phi' },
        ],
      },
    ],
    dfRecommendations: [
      '크라비(Krabi) - 코 란타(Koh Lanta) (약 2시간)',
      '크라비(Krabi) - 피피 제도(Phi Phi Islands) (약 1.5시간)',
    ],
    confidence: 'high',
  },
  'koh-samui': {
    tier: 'common',
    summary: '코사무이는 서랏타니·춤폰 등 본토 항구에서 페리로 접근합니다.',
    routes: [
      {
        id: 'suratthani-koh-samui',
        label: '서랏타니/돈삭 → 코사무이',
        duration: '약 1.5~2.5시간',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/surat-thani/koh-samui' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'high',
  },
  langkawi: {
    tier: 'common',
    summary: '랑카위는 쿠ala페라투스·페낭 등에서 페리로 접근 가능합니다.',
    routes: [
      {
        id: 'kuala-perlis-langkawi',
        label: '쿠알라페라투스 → 랑카위',
        duration: '약 1시간 15분',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/kuala-perlis/langkawi' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  'phu-quoc': {
    tier: 'common',
    summary: '푸꾸옥은 하티엔·라ach Gia 등에서 페리·고속선으로 접근합니다.',
    routes: [
      {
        id: 'rach-gia-phu-quoc',
        label: '라ach Gia (Rach Gia) → 푸꾸옥',
        duration: '약 2.5~3시간',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/rach-gia/phu-quoc' },
        ],
      },
      {
        id: 'ha-tien-phu-quoc',
        label: '하티엔 → 푸꾸옥',
        duration: '약 1.5시간',
        directFerries: false,
        bookings: [
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/ha-tien/phu-quoc' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },

  // ── 지중해 · 유럽 ──
  dubrovnik: {
    tier: 'common',
    summary: '두브로브니크에서 스플리트·흐바르 등 아드리아해 섬으로 페리가 흔합니다.',
    routes: [
      {
        id: 'dubrovnik-split',
        label: '두브로브니크 → 스플리트',
        duration: '약 2시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '두브로브니크(Dubrovnik) - 스플리트(Split) (약 2시간)',
      '두브로브니크(Dubrovnik) - 스타리 그라드(Stari Grad, 흐바르섬) (약 4시간)',
    ],
    confidence: 'high',
  },
  hvar: {
    tier: 'common',
    summary: '흐바르는 스플리트·두브로브니크에서 페리로 접근합니다.',
    routes: [
      {
        id: 'split-hvar',
        label: '스플리트 → 스타리 그라드(흐바르)',
        duration: '약 1시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '스타리 그라드(Stari Grad, 흐바르섬) - 스플리트(Split) (약 1시간)',
      '스타리 그라드(Stari Grad) - 두브로브니크(Dubrovnik) (약 4시간)',
    ],
    confidence: 'high',
  },
  santorini: {
    tier: 'common',
    summary: '산토리니는 피레우스(아테네) 또는 다른 키클라데스 섬에서 페리로 접근합니다.',
    routes: [
      {
        id: 'piraeus-santorini',
        label: '피레우스(아테네) → 산토리니',
        duration: '약 5~8시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '피레우스(Piraeus, 아테네) - 티라(산토리니:Santorini/Thira) (약 5-8시간)',
      '티라(산토리니:Santorini/Thira) - 미코노스(Mykonos) (약 2-3시간)',
    ],
    confidence: 'high',
  },
  athens: {
    tier: 'common',
    summary: '아테네 피레우스 항에서 그리스 섬으로 페리가 출발합니다.',
    routes: [
      {
        id: 'piraeus-islands',
        label: '피레우스 → 키클라데스·크레타',
        duration: '섬별 상이',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '피레우스(Piraeus, 아테네) - 티라(산토리니:Santorini/Thira) (약 5-8시간)',
      '피레우스(Piraeus, 아테네) - 미코노스(Mykonos) (약 2.5-5시간)',
    ],
    confidence: 'high',
  },
  crete: {
    tier: 'common',
    summary: '크레타는 피레우스·산토리니 등에서 페리 연결됩니다.',
    routes: [
      {
        id: 'piraeus-heraklion',
        label: '피레우스 → 이라클리온(크레타)',
        duration: '약 9시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '이라클리오(Heraklion, 크레타) - 티라(산토리니:Santorini/Thira) (약 2시간)',
    ],
    confidence: 'high',
  },
  barcelona: {
    tier: 'common',
    summary: '바르셀로나에서 이비자·마요르카 등 발렌ares 제도로 페리가 운항합니다.',
    routes: [
      {
        id: 'barcelona-ibiza',
        label: '바르셀로나 → 이비자',
        duration: '약 8~9시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '바르셀로나(Barcelona) - 이비자(Ibiza) (약 8-9시간)',
      '바르셀로나(Barcelona) - 팔마(Palma, 마요르카) (약 7-8시간)',
    ],
    confidence: 'high',
  },
  ibiza: {
    tier: 'common',
    summary: '이비자↔포르멘테라·마요르카 등 페리 노선이 있습니다.',
    routes: [
      {
        id: 'ibiza-formentera',
        label: '이비자 → 포르멘테라',
        duration: '약 30분',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: [
      '이비자(Ibiza) - 포르멘테라(Formentera) (약 30분)',
      '이비자(Ibiza) - 팔마(Palma, 마요르카) (약 2시간)',
    ],
    confidence: 'high',
  },
  malta: {
    tier: 'common',
    summary: '몰타 본토와 고zo·코mino 섬 간 페리가 흔합니다.',
    routes: [
      {
        id: 'malta-gozo',
        label: '몰타 → 고zo',
        duration: '약 45분',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: ['몰타(Malta) - 고zo(Gozo) (약 45분)'],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  sicily: {
    tier: 'common',
    summary: '시칠리아는 본토 이탈리아·튀nis 등과 페리로 연결됩니다.',
    routes: [
      {
        id: 'naples-sicily',
        label: '나폴리/빌라 san Giovanni → 시칠리아',
        duration: '약 10~20시간',
        directFerries: true,
        bookings: [{ provider: 'direct_ferries', name: 'Direct Ferries' }],
      },
    ],
    dfRecommendations: ['나폴리(Naples) - 팔레르모(Palermo, 시칠리아)'],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  zanzibar: {
    tier: 'common',
    summary: '잔지바르는 다르에스살람 등 본토에서 페리로 접근하는 일정이 흔합니다.',
    routes: [
      {
        id: 'dar-zanzibar',
        label: '다르에스살람 → 잔지바르',
        duration: '약 2시간',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'Azam Marine', url: 'https://www.azammarine.com/' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  fiji: {
    tier: 'common',
    summary: '피지는 비ti 레vu 등 허브에서 다른 섬으로 페리·쾌속선이 연결됩니다.',
    routes: [
      {
        id: 'denarau-islands',
        label: 'Denarau → 마마누카/야사와 제도',
        duration: '섬별 상이',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'South Sea Cruises', url: 'https://www.southseacruisesfiji.com/' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },

  // ── 남태평양 · 오지 ──
  tahiti: {
    tier: 'common',
    summary: '타히티와 주변 섬(모orea 등) 간 페리·항공 연결이 있습니다.',
    routes: [
      {
        id: 'papeete-moorea',
        label: '파페ete → Moorea',
        duration: '약 30~45분',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'Aremiti Ferry', url: 'https://www.aremiti.pf/' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'medium',
  },
  'pitcairn-islands': {
    tier: 'required',
    summary: '핏케언은 상용 직항 없이 타히티 등 관문 후 페리·전용선으로 접근합니다.',
    routes: [
      {
        id: 'tahiti-pitcairn',
        label: '타히티(PPT) → 핏케언 (전용선)',
        duration: '약 32시간',
        directFerries: false,
        bookings: [
          { provider: 'direct', name: 'Pitcairn Island Tourism', url: 'https://www.visitpitcairn.pn/' },
        ],
      },
    ],
    fallbacks: ['klook_ferry'],
    confidence: 'high',
  },

  'phi-phi-islands': {
    tier: 'common',
    summary: '피피 섬은 푸켓·크라비에서 페리·스피드보트가 흔합니다.',
    routes: [
      {
        id: 'phuket-phi-phi',
        label: '푸켓 → 피피 제도',
        duration: '약 2시간',
        directFerries: true,
        bookings: [
          { provider: 'direct_ferries', name: 'Direct Ferries' },
          { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/en/travel/phuket/phi-phi' },
        ],
      },
    ],
    dfRecommendations: ['푸켓(Phuket) - 피피 제도(Phi Phi Islands) (약 2시간)'],
    confidence: 'high',
  },
  'komodo-island': {
    tier: 'cruise_only',
    summary: '코모도 일대는 리브어보드·보트 투어(크루즈형)가 흔합니다.',
    confidence: 'medium',
    rationale: 'Trip.com 크루즈·현지 보트 투어',
  },
  'halong-bay': {
    tier: 'cruise_only',
    summary: '하롱베이는 관광 크루즈(유람선)가 주 이동 수단입니다.',
    confidence: 'high',
    rationale: 'Trip.com 크루즈 — 여정 플래너 키워드 매핑',
  },
  ushuaia: {
    tier: 'cruise_only',
    summary: '우수아이아는 남극·파타고니아 크루즈의 관문입니다.',
    confidence: 'high',
  },
  miami: {
    tier: 'cruise_only',
    summary: '마이애미는 카리브 크루즈의 주요 기항지입니다.',
    confidence: 'medium',
  },
};

/** slug 별칭 (travelSpots slug ≠ overrides key) */
export const FERRY_SLUG_ALIASES = {};
