/**
 * Nominatim zoom=14 often names a ward or district (Khu phố, phường, khwaeng).
 * Coordinate place titles need the city when the hit is only a sub-city unit.
 */

const SUBCITY_TYPES = new Set([
  'neighbourhood',
  'neighborhood',
  'suburb',
  'quarter',
  'city_district',
  'borough',
  'residential',
  'city_block',
  'allotments',
]);

const SUBCITY_ADDRESS_KEYS = [
  'neighbourhood',
  'suburb',
  'quarter',
  'city_district',
  'borough',
  'residential',
];

export function osmSettlementName(address) {
  if (!address) return '';
  for (const key of ['city', 'town', 'municipality', 'village']) {
    const value = address[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function isSubcityOsmFeature(featureType, featureName, address) {
  if (SUBCITY_TYPES.has(String(featureType || '').trim())) return true;
  const name = String(featureName || '').trim();
  if (!name || !address) return false;
  return SUBCITY_ADDRESS_KEYS.some((key) => String(address[key] || '').trim() === name);
}

/**
 * Ward/district feature names lose to city/town/municipality.
 * POI and natural names stay when they are not a sub-city unit.
 */
export function preferOsmCityTitle(featureType, featureName, address) {
  const feature = String(featureName || '').trim();
  const city = osmSettlementName(address);
  if (city && isSubcityOsmFeature(featureType, feature, address)) return city;
  return feature || city;
}
