/**
 * Site home audit fixes — Trip packages CTA · chip contrast tokens.
 *   node scripts/smoke-site-home-audit-fixes.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { areMetroCoterminalAirports } from '../src/pages/Home/lib/flightOriginMetroGateways.js';
import { KOREA_FILTER_CHIP_ACTIVE } from '../src/pages/Korea/koreaHubFilterChipStyles.js';

function shouldShowTripcomPackageFlightHotelLink(departureIata, arrivalIata) {
  const depart = String(departureIata ?? '').trim().toUpperCase();
  const arrive = String(arrivalIata ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(depart) || !/^[A-Z]{3}$/.test(arrive)) return false;
  if (areMetroCoterminalAirports(depart, arrive)) return false;
  return true;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function relativeLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [n >> 16, (n >> 8) & 0xff, n & 0xff].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const partnerNav = read('src/components/PlaceCard/common/partnerNavigation.js');
assert.match(partnerNav, /export function getTripcomPackageLinkRel\(\)/);
assert.match(partnerNav, /return 'sponsored noopener noreferrer'/);
assert.match(partnerNav, /shouldShowTripcomPackageFlightHotelLink/);

assert.equal(shouldShowTripcomPackageFlightHotelLink('ICN', 'ICN'), false);
assert.equal(shouldShowTripcomPackageFlightHotelLink('ICN', 'GMP'), false);
assert.equal(shouldShowTripcomPackageFlightHotelLink('ICN', null), false);
assert.equal(shouldShowTripcomPackageFlightHotelLink('ICN', 'NRT'), true);

const affiliate = read('src/utils/affiliate.js');
assert.match(affiliate, /return `\$\{packagesOrigin\}\/packages\/list\?\$\{params\.toString\(\)\}`;/);
assert.match(affiliate, /Allianceid: TRIPCOM_KR_PARTNER\.allianceId/);

const stayStrip = read('src/pages/WorldEvents/EventStayStrip.jsx');
assert.match(stayStrip, /getTripcomPackageLinkRel/);
assert.match(stayStrip, /shouldShowTripcomPackageFlightHotelLink/);
assert.doesNotMatch(stayStrip, /getTripcomLinkRel\(linkTarget\)/, 'packages CTA uses package rel');

const festivalIndex = read('src/pages/Korea/index.jsx');
assert.match(festivalIndex, /koreaHubFilterChipStyles/);
assert.doesNotMatch(
  festivalIndex,
  /bg-amber-500 text-white border-amber-500 font-bold shadow-sm/,
  'festival active chip not amber-500 fill',
);

const scenic = read('src/pages/KoreaTheme/ScenicPage.jsx');
assert.match(scenic, /KOREA_NEAR_ME_FILLED_ACTIVE/);
assert.doesNotMatch(
  scenic,
  /bg-amber-500 text-white hover:bg-amber-600/,
  'scenic near-me not amber-500 fill',
);

const oldRatio = contrastRatio('#ffffff', '#f59e0b');
const newRatio = contrastRatio('#ffffff', '#b45309');
assert.ok(oldRatio < 3, `before ratio ~2.14 (got ${oldRatio.toFixed(2)})`);
assert.ok(newRatio >= 4.5, `after ratio AA (got ${newRatio.toFixed(2)})`);
assert.match(KOREA_FILTER_CHIP_ACTIVE, /amber-700/);

console.log('smoke:site-home-audit-fixes PASS');
