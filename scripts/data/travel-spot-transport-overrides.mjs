/**
 * 12Go 일반 교통(기차·버스·밴) SSOT — 페리 SSOT와 분리.
 * URL은 12Go /travel/{from}/{to} 형식. generate:transport 후 JSON만 런타임 사용.
 */
export const TRAVEL_SPOT_TRANSPORT_OVERRIDES = {
  phuket: {
    summary: '방콕·크라비 등에서 푸켓으로 가는 버스·기차·밴',
    routes: [
      {
        id: 'bangkok-phuket',
        label: '방콕 → 푸켓',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/phuket',
        keywords: ['방콕', 'bangkok', '수완나품', 'suvarnabhumi'],
      },
      {
        id: 'phuket-krabi',
        label: '푸켓 → 크라비',
        twelveGoUrl: 'https://12go.asia/en/travel/phuket/krabi',
        keywords: ['크라비', 'krabi'],
      },
      {
        id: 'phuket-phi-phi',
        label: '푸켓 → 피피',
        twelveGoUrl: 'https://12go.asia/en/travel/phuket/phi-phi',
        keywords: ['피피', 'phi phi', 'phi-phi'],
      },
    ],
    confidence: 'high',
  },
  bangkok: {
    summary: '태국 주요 도시 ↔ 방콕 버스·기차',
    routes: [
      {
        id: 'bangkok-phuket',
        label: '방콕 → 푸켓',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/phuket',
        keywords: ['푸켓', 'phuket'],
      },
      {
        id: 'bangkok-chiang-mai',
        label: '방콕 → 치앙마이',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/chiang-mai',
        keywords: ['치앙마이', 'chiang mai', 'chiang-mai'],
      },
      {
        id: 'bangkok-krabi',
        label: '방콕 → 크라비',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/krabi',
        keywords: ['크라비', 'krabi'],
      },
    ],
    confidence: 'high',
  },
  'chiang-mai': {
    summary: '방콕·치앙라이 등 ↔ 치앙마이',
    routes: [
      {
        id: 'bangkok-chiang-mai',
        label: '방콕 → 치앙마이',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/chiang-mai',
        keywords: ['방콕', 'bangkok'],
      },
      {
        id: 'chiang-mai-chiang-rai',
        label: '치앙마이 → 치앙라이',
        twelveGoUrl: 'https://12go.asia/en/travel/chiang-mai/chiang-rai',
        keywords: ['치앙라이', 'chiang rai', 'chiang-rai'],
      },
    ],
    confidence: 'high',
  },
  krabi: {
    summary: '푸켓·방콕 ↔ 크라비',
    routes: [
      {
        id: 'phuket-krabi',
        label: '푸켓 → 크라비',
        twelveGoUrl: 'https://12go.asia/en/travel/phuket/krabi',
        keywords: ['푸켓', 'phuket'],
      },
      {
        id: 'bangkok-krabi',
        label: '방콕 → 크라비',
        twelveGoUrl: 'https://12go.asia/en/travel/bangkok/krabi',
        keywords: ['방콕', 'bangkok'],
      },
    ],
    confidence: 'high',
  },
  'ho-chi-minh-city': {
    summary: '베트남 주요 노선',
    routes: [
      {
        id: 'ho-chi-minh-phnom-penh',
        label: '호치민 → 프놈펜',
        twelveGoUrl: 'https://12go.asia/en/travel/ho-chi-minh/phnom-penh',
        keywords: ['프놈펜', 'phnom penh', '캄보디아'],
      },
      {
        id: 'ho-chi-minh-mui-ne',
        label: '호치민 → 무이네',
        twelveGoUrl: 'https://12go.asia/en/travel/ho-chi-minh/mui-ne',
        keywords: ['무이네', 'mui ne'],
      },
    ],
    confidence: 'high',
  },
  bali: {
    summary: '발리 ↔ 자카르타·롬복 등',
    routes: [
      {
        id: 'jakarta-bali',
        label: '자카르타 → 발리',
        twelveGoUrl: 'https://12go.asia/en/travel/jakarta/bali',
        keywords: ['자카르타', 'jakarta'],
      },
      {
        id: 'bali-lombok',
        label: '발리 → 롬복',
        twelveGoUrl: 'https://12go.asia/en/travel/bali/lombok',
        keywords: ['롬복', 'lombok', '길리'],
      },
    ],
    confidence: 'high',
  },
};
