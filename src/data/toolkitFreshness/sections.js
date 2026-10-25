/** place_toolkit essential_guide.categories keys covered by freshness UI. */
export const TOOLKIT_FRESHNESS_SECTIONS = [
  'safety',
  'accommodation',
  'apps',
  'map_poi',
  'flight',
  'visa',
  'airport_transfer',
  'transport',
  'ferry_booking',
  'pre_travel',
  'connectivity',
];

/** @param {string} section */
export function isToolkitFreshnessSection(section) {
  return TOOLKIT_FRESHNESS_SECTIONS.includes(String(section || ''));
}
