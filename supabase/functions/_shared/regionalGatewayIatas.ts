/**
 * 광역·원정지 slug — SSOT 중심 좌표와 관문 공항 거리가 멀 수 있음.
 * `scripts/data/travel-spot-airport-overrides.mjs` curated high와 동기화.
 */
export const REGIONAL_GATEWAY_IATAS_BY_SLUG: Record<string, readonly string[]> = {
  patagonia: ['BRC', 'EZE'],
  ushuaia: ['USH'],
  'torres-del-paine': ['PUQ'],
  borneo: ['BKI', 'KCH', 'KUL'],
  alaska: ['ANC'],
  'amazon-rainforest': ['MAO'],
  'sahara-desert': ['RAK'],
  antarctica: ['USH'],
  serengeti: ['JRO', 'NBO'],
  kilimanjaro: ['JRO', 'NBO'],
  'carstensz-pyramid': ['TIM', 'CGK', 'DPS'],
  'midway-atoll': ['HNL'],
  'kerguelen-islands': ['RUN'],
  'st-helena': ['HLE', 'JNB'],
  'christmas-island': ['XCH', 'PER'],
  'diego-garcia': ['MLE'],
  galapagos: ['GPS', 'GYE'],
  lalibela: ['ADD', 'LLI'],
};

export function isRegionalGatewayIata(slug: string | null | undefined, iata: string): boolean {
  const key = String(slug ?? '').trim().toLowerCase();
  if (!key) return false;
  const code = String(iata).trim().toUpperCase();
  const list = REGIONAL_GATEWAY_IATAS_BY_SLUG[key];
  return list?.includes(code) ?? false;
}
