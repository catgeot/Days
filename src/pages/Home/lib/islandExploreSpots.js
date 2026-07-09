/**
 * 탐색「섬여행」가상 테마 SSOT — slug allowlist only (키워드 폴백 없음 → 관문 도시 오탐 방지).
 * 투어 시네마틱용 ISLAND_TOUR_SLUGS(globeTourResolve)와 역할 분리; 시드 40개는 공유, 탐색이 더 넓을 수 있음.
 */

/** @type {ReadonlySet<string>} */
export const ISLAND_EXPLORE_SLUGS = new Set([
  // --- ISLAND_TOUR_SLUGS seed (40) ---
  'maldives',
  'seychelles',
  'samoa',
  'zanzibar',
  'la-reunion',
  'rarotonga',
  'aitutaki',
  'boracay',
  'bora-bora',
  'mauritius',
  'tahiti',
  'langkawi',
  'ibiza',
  'cebu',
  'komodo-island',
  'andaman-islands',
  'jeju',
  'hvar',
  'sicily',
  'canary-islands',
  'cocos-islands',
  'falkland-islands',
  'faroe-islands',
  'christmas-island',
  'similan-islands',
  'phi-phi-islands',
  'bali',
  'santorini',
  'phuket',
  'madeira',
  'crete',
  'lombok',
  'hawaii',
  'palawan',
  'bohol',
  'gili-meno',
  'phu-quoc',
  'el-nido',
  'honolulu',
  'kiribati',
  'cape-verde',
  // --- explore extras (catalog-verified) ---
  'guam',
  'saipan',
  'ishigaki',
  'miyakojima',
  'tsushima',
  'seogwipo',
  'fiji',
  'palau',
  'galapagos',
  'iceland',
  'malta',
  'bahamas',
  'azores',
  'lofoten',
  'easter-island',
  'madagascar',
  'tonga',
  'vanuatu',
  'new-caledonia',
  'nauru',
  'midway-atoll',
  'yap',
  'chuuk',
  'kosrae',
  'pohnpei',
  'diego-garcia',
  'corsica',
  'bermuda',
  'fernando-de-noronha',
  'st-helena',
  'greenland',
  'borneo',
  'koh-samui',
  'svalbard',
  'solomon-islands',
  'pitcairn-islands',
  'kerguelen-islands',
  'sri-jayawardenapura',
]);

/**
 * @param {{ slug?: string } | null | undefined} spot
 * @returns {boolean}
 */
export function isIslandExploreSpot(spot) {
  const slug = (spot?.slug || '').toLowerCase();
  return Boolean(slug) && ISLAND_EXPLORE_SLUGS.has(slug);
}
