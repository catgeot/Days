/** S2 최소 시드 — S3b area↔hub SSOT 전 임시. hubId = cityAttractionHubs.hubId */
export const DEFAULT_HUB_SEEDS = [
  'seoul',
  'busan',
  'jeju',
  'gangneung',
  'gyeongju',
  'jeonju',
  'sokcho',
  'yeosu',
];

/** TourAPI areaCode → hubId[] (내 주변 역매핑·가로 레일) */
export const HUB_SEEDS_BY_AREA = {
  1: ['seoul'],
  2: ['incheon'],
  3: ['daejeon'],
  4: ['daegu'],
  5: ['gwangju'],
  6: ['busan'],
  7: ['ulsan'],
  8: [],
  31: ['suwon', 'gapyeong'],
  32: ['gangneung', 'sokcho', 'chuncheon', 'pyeongchang', 'yangyang'],
  33: ['cheongju'],
  34: ['daejeon', 'boryeong', 'gongju', 'taean'],
  35: ['gyeongju', 'daegu', 'andong', 'pohang'],
  36: ['busan', 'tongyeong', 'jinju', 'geoje', 'namhae'],
  37: ['jeonju', 'gunsan'],
  38: ['yeosu', 'gwangju', 'suncheon', 'mokpo', 'damyang'],
  39: ['jeju', 'seogwipo'],
};

export function hubIdsForArea(areaCode) {
  if (areaCode == null || areaCode === '' || areaCode === 'all') {
    return DEFAULT_HUB_SEEDS;
  }
  const key = String(areaCode);
  const ids = HUB_SEEDS_BY_AREA[key] || HUB_SEEDS_BY_AREA[Number(key)];
  return Array.isArray(ids) && ids.length > 0 ? ids : DEFAULT_HUB_SEEDS;
}

/** hubId → TourAPI areaCode (시드 역매핑 · S3b 전). 첫 매칭 우선. */
const HUB_TO_AREA = (() => {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const [area, hubs] of Object.entries(HUB_SEEDS_BY_AREA)) {
    if (!Array.isArray(hubs)) continue;
    for (const hubId of hubs) {
      const key = String(hubId || '').toLowerCase();
      if (key && !map.has(key)) map.set(key, String(area));
    }
  }
  return map;
})();

/**
 * @param {string} hubId
 * @returns {string | null}
 */
export function areaCodeForHubId(hubId) {
  const key = String(hubId || '').toLowerCase();
  if (!key) return null;
  return HUB_TO_AREA.get(key) || null;
}
