/**
 * 여행지 ↔ 해안/해역 SSOT — overrides → `npm run generate:travel-spot-coast`
 * travelSpots.js spots 직접 수정 금지 · seaPrimary는 SEA_BASINS_OVERRIDES.id
 */

/** @typedef {'island'|'archipelago'|'coastal-city'|'reef'|'peninsula'} CoastKind */

/**
 * @typedef {{
 *   coastKind: CoastKind,
 *   seaPrimary: string,
 *   seaIds?: string[],
 * }} CoastSpotOverride
 */

/** @type {Record<string, CoastSpotOverride>} */
export const TRAVEL_SPOT_COAST_OVERRIDES = {
  // --- 에게 · 지중 · 아드리아 · 티레니아 ---
  santorini: { coastKind: 'island', seaPrimary: 'aegean', seaIds: ['aegean', 'mediterranean'] },
  crete: { coastKind: 'island', seaPrimary: 'aegean', seaIds: ['aegean', 'mediterranean'] },
  bodrum: { coastKind: 'coastal-city', seaPrimary: 'aegean', seaIds: ['aegean', 'mediterranean'] },
  malta: { coastKind: 'archipelago', seaPrimary: 'mediterranean' },
  ibiza: { coastKind: 'island', seaPrimary: 'mediterranean' },
  'sant-joan': { coastKind: 'coastal-city', seaPrimary: 'mediterranean', seaIds: ['mediterranean'] },
  barcelona: { coastKind: 'coastal-city', seaPrimary: 'mediterranean' },
  corsica: { coastKind: 'island', seaPrimary: 'mediterranean', seaIds: ['mediterranean', 'tyrrhenian'] },
  sicily: { coastKind: 'island', seaPrimary: 'mediterranean', seaIds: ['mediterranean', 'tyrrhenian'] },
  'cinque-terre': { coastKind: 'coastal-city', seaPrimary: 'tyrrhenian', seaIds: ['tyrrhenian', 'mediterranean'] },
  'la-spezia': { coastKind: 'coastal-city', seaPrimary: 'tyrrhenian', seaIds: ['tyrrhenian', 'mediterranean'] },
  hvar: { coastKind: 'island', seaPrimary: 'adriatic', seaIds: ['adriatic', 'mediterranean'] },
  dubrovnik: { coastKind: 'coastal-city', seaPrimary: 'adriatic', seaIds: ['adriatic', 'mediterranean'] },
  kotor: { coastKind: 'coastal-city', seaPrimary: 'adriatic', seaIds: ['adriatic', 'mediterranean'] },

  // --- 카리브 · 멕시코만 ---
  cancun: { coastKind: 'coastal-city', seaPrimary: 'caribbean', seaIds: ['caribbean', 'gulf-of-mexico'] },
  bahamas: { coastKind: 'archipelago', seaPrimary: 'caribbean' },
  havana: { coastKind: 'coastal-city', seaPrimary: 'caribbean' },
  miami: { coastKind: 'coastal-city', seaPrimary: 'gulf-of-mexico', seaIds: ['gulf-of-mexico', 'caribbean'] },
  'costa-rica': { coastKind: 'peninsula', seaPrimary: 'caribbean', seaIds: ['caribbean'] },

  // --- 안다만 · 태국만 ---
  'andaman-islands': { coastKind: 'archipelago', seaPrimary: 'andaman' },
  phuket: { coastKind: 'island', seaPrimary: 'andaman', seaIds: ['andaman'] },
  'phi-phi-islands': { coastKind: 'archipelago', seaPrimary: 'andaman' },
  krabi: { coastKind: 'coastal-city', seaPrimary: 'andaman' },
  'similan-islands': { coastKind: 'archipelago', seaPrimary: 'andaman' },
  'koh-samui': { coastKind: 'island', seaPrimary: 'gulf-of-thailand' },
  'phu-quoc': { coastKind: 'island', seaPrimary: 'gulf-of-thailand' },

  // --- 남중국해 · 필리핀 · 셀레베스 ---
  palawan: { coastKind: 'island', seaPrimary: 'south-china-sea' },
  'el-nido': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  'halong-bay': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  'da-nang': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  'nha-trang': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  'hong-kong': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  macau: { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  'kota-kinabalu': { coastKind: 'coastal-city', seaPrimary: 'south-china-sea', seaIds: ['south-china-sea', 'celebes'] },
  brunei: { coastKind: 'coastal-city', seaPrimary: 'south-china-sea' },
  boracay: { coastKind: 'island', seaPrimary: 'philippine-sea', seaIds: ['philippine-sea', 'south-china-sea'] },
  cebu: { coastKind: 'island', seaPrimary: 'philippine-sea' },
  bohol: { coastKind: 'island', seaPrimary: 'philippine-sea' },
  langkawi: { coastKind: 'island', seaPrimary: 'andaman', seaIds: ['andaman', 'south-china-sea'] },

  // --- 동중국해 · 황해 · 동해 ---
  okinawa: { coastKind: 'archipelago', seaPrimary: 'east-china-sea' },
  miyakojima: { coastKind: 'island', seaPrimary: 'east-china-sea' },
  ishigaki: { coastKind: 'island', seaPrimary: 'east-china-sea' },
  jeju: { coastKind: 'island', seaPrimary: 'east-china-sea', seaIds: ['east-china-sea', 'yellow-sea'] },
  seogwipo: { coastKind: 'coastal-city', seaPrimary: 'east-china-sea', seaIds: ['east-china-sea'] },
  qingdao: { coastKind: 'coastal-city', seaPrimary: 'yellow-sea' },
  tsushima: { coastKind: 'island', seaPrimary: 'sea-of-japan', seaIds: ['sea-of-japan', 'east-china-sea'] },
  vladivostok: { coastKind: 'coastal-city', seaPrimary: 'sea-of-japan' },
  yokohama: { coastKind: 'coastal-city', seaPrimary: 'north-pacific', seaIds: ['north-pacific'] },
  kobe: { coastKind: 'coastal-city', seaPrimary: 'east-china-sea', seaIds: ['east-china-sea'] },

  // --- 자와 · 반다 · 산호 · 솔로몬 ---
  bali: { coastKind: 'island', seaPrimary: 'java-sea', seaIds: ['java-sea'] },
  'gili-meno': { coastKind: 'island', seaPrimary: 'java-sea' },
  lombok: { coastKind: 'island', seaPrimary: 'java-sea', seaIds: ['java-sea', 'banda'] },
  'komodo-island': { coastKind: 'island', seaPrimary: 'banda', seaIds: ['banda', 'java-sea'] },
  'raja-ampat': { coastKind: 'archipelago', seaPrimary: 'banda', seaIds: ['banda', 'celebes'] },
  'great-barrier-reef': { coastKind: 'reef', seaPrimary: 'coral-sea' },
  vanuatu: { coastKind: 'archipelago', seaPrimary: 'coral-sea', seaIds: ['coral-sea', 'solomon-sea'] },
  'solomon-islands': { coastKind: 'archipelago', seaPrimary: 'solomon-sea', seaIds: ['solomon-sea', 'coral-sea'] },
  brisbane: { coastKind: 'coastal-city', seaPrimary: 'coral-sea', seaIds: ['coral-sea', 'tasman'] },
  'gold-coast': { coastKind: 'coastal-city', seaPrimary: 'tasman', seaIds: ['tasman', 'coral-sea'] },

  // --- 타스만 · NZ ---
  sydney: { coastKind: 'coastal-city', seaPrimary: 'tasman' },
  auckland: { coastKind: 'coastal-city', seaPrimary: 'tasman' },
  fiordland: { coastKind: 'coastal-city', seaPrimary: 'tasman' },
  queenstown: { coastKind: 'coastal-city', seaPrimary: 'tasman' },

  // --- 남태평양 · 중부·북태평양 ---
  'bora-bora': { coastKind: 'island', seaPrimary: 'south-pacific' },
  rarotonga: { coastKind: 'island', seaPrimary: 'south-pacific' },
  aitutaki: { coastKind: 'island', seaPrimary: 'south-pacific' },
  tahiti: { coastKind: 'island', seaPrimary: 'south-pacific' },
  samoa: { coastKind: 'archipelago', seaPrimary: 'south-pacific' },
  fiji: { coastKind: 'archipelago', seaPrimary: 'south-pacific', seaIds: ['south-pacific', 'coral-sea'] },
  'easter-island': { coastKind: 'island', seaPrimary: 'south-pacific' },
  'pitcairn-islands': { coastKind: 'archipelago', seaPrimary: 'south-pacific' },
  hawaii: { coastKind: 'archipelago', seaPrimary: 'north-pacific' },
  honolulu: { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  'midway-atoll': { coastKind: 'island', seaPrimary: 'north-pacific' },
  guam: { coastKind: 'island', seaPrimary: 'philippine-sea', seaIds: ['philippine-sea', 'central-pacific'] },
  saipan: { coastKind: 'island', seaPrimary: 'philippine-sea', seaIds: ['philippine-sea', 'central-pacific'] },
  palau: { coastKind: 'archipelago', seaPrimary: 'philippine-sea', seaIds: ['philippine-sea', 'celebes'] },
  yap: { coastKind: 'island', seaPrimary: 'central-pacific' },
  chuuk: { coastKind: 'archipelago', seaPrimary: 'central-pacific' },
  kosrae: { coastKind: 'island', seaPrimary: 'central-pacific' },
  pohnpei: { coastKind: 'island', seaPrimary: 'central-pacific' },
  kiribati: { coastKind: 'archipelago', seaPrimary: 'central-pacific' },
  nauru: { coastKind: 'island', seaPrimary: 'central-pacific' },
  'los-angeles': { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  'san-francisco': { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  'san-diego': { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  vancouver: { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  seattle: { coastKind: 'coastal-city', seaPrimary: 'north-pacific' },
  galapagos: { coastKind: 'archipelago', seaPrimary: 'south-pacific', seaIds: ['south-pacific'] },

  // --- 서인도양 · 몰디브 ---
  maldives: { coastKind: 'archipelago', seaPrimary: 'maldives-sea', seaIds: ['maldives-sea', 'western-indian'] },
  seychelles: { coastKind: 'archipelago', seaPrimary: 'western-indian' },
  mauritius: { coastKind: 'island', seaPrimary: 'western-indian' },
  'la-reunion': { coastKind: 'island', seaPrimary: 'western-indian' },
  zanzibar: { coastKind: 'island', seaPrimary: 'western-indian' },
  madagascar: { coastKind: 'island', seaPrimary: 'western-indian' },
  'diego-garcia': { coastKind: 'island', seaPrimary: 'maldives-sea', seaIds: ['maldives-sea', 'western-indian'] },
  'christmas-island': { coastKind: 'island', seaPrimary: 'western-indian', seaIds: ['western-indian'] },
  'cocos-islands': { coastKind: 'archipelago', seaPrimary: 'western-indian' },
  'cape-town': { coastKind: 'coastal-city', seaPrimary: 'south-atlantic', seaIds: ['south-atlantic', 'western-indian'] },
  perth: { coastKind: 'coastal-city', seaPrimary: 'western-indian', seaIds: ['western-indian'] },

  // --- 대서양 ---
  bermuda: { coastKind: 'island', seaPrimary: 'north-atlantic' },
  azores: { coastKind: 'archipelago', seaPrimary: 'north-atlantic' },
  madeira: { coastKind: 'island', seaPrimary: 'north-atlantic' },
  'canary-islands': { coastKind: 'archipelago', seaPrimary: 'north-atlantic' },
  'cape-verde': { coastKind: 'archipelago', seaPrimary: 'north-atlantic' },
  'fernando-de-noronha': { coastKind: 'archipelago', seaPrimary: 'south-atlantic' },
  'st-helena': { coastKind: 'island', seaPrimary: 'south-atlantic' },
  'rio-de-janeiro': { coastKind: 'coastal-city', seaPrimary: 'south-atlantic' },
  'peninsula-valdes': { coastKind: 'peninsula', seaPrimary: 'south-atlantic' },
  'falkland-islands': { coastKind: 'archipelago', seaPrimary: 'south-atlantic' },
  iceland: { coastKind: 'island', seaPrimary: 'north-atlantic' },
  'faroe-islands': { coastKind: 'archipelago', seaPrimary: 'norwegian-sea', seaIds: ['norwegian-sea', 'north-atlantic'] },
  lofoten: { coastKind: 'archipelago', seaPrimary: 'norwegian-sea' },
  stockholm: { coastKind: 'coastal-city', seaPrimary: 'baltic' },
  helsinki: { coastKind: 'coastal-city', seaPrimary: 'baltic' },

  // --- 극지 (tier3 해역 연결 가능하나 칩 비대상) ---
  svalbard: { coastKind: 'archipelago', seaPrimary: 'barents', seaIds: ['barents'] },
  antarctica: { coastKind: 'peninsula', seaPrimary: 'southern-ocean' },
  greenland: { coastKind: 'island', seaPrimary: 'north-atlantic', seaIds: ['north-atlantic'] },
  'kerguelen-islands': { coastKind: 'archipelago', seaPrimary: 'southern-ocean', seaIds: ['southern-ocean', 'western-indian'] },
};
