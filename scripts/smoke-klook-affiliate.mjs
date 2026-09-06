#!/usr/bin/env node
/**
 * Klook 제휴 URL — klook.com 웹 직행, OneLink(klook://) 우회.
 *   npm run smoke:klook-affiliate
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KLOOK_AID,
  KLOOK_DEFAULT_AD_ID,
  buildKlookAffiliateUrl,
  isKlookConsumerHost,
} from '../src/utils/klookAffiliateUrl.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert.equal(isKlookConsumerHost('www.klook.com'), true);
assert.equal(isKlookConsumerHost('klook.com'), true);
assert.equal(isKlookConsumerHost('affiliate.klook.com'), false);
assert.equal(isKlookConsumerHost('klook.onelink.me'), false);

const pickup = buildKlookAffiliateUrl('https://www.klook.com/ko/airport-transfers/');
const pickupUrl = new URL(pickup);
assert.equal(pickupUrl.hostname, 'www.klook.com');
assert.equal(pickupUrl.pathname, '/ko/airport-transfers/');
assert.equal(pickupUrl.searchParams.get('aid'), KLOOK_AID);
assert.equal(pickupUrl.searchParams.get('aff_adid'), KLOOK_DEFAULT_AD_ID);
assert.equal(pickupUrl.searchParams.get('utm_medium'), 'affiliate-alwayson');
assert.equal(pickupUrl.searchParams.get('utm_source'), 'non-network');
assert.equal(pickupUrl.searchParams.get('utm_campaign'), KLOOK_AID);
assert.doesNotMatch(pickup, /onelink|affiliate\.klook\.com|klook:\/\//);

const customAd = buildKlookAffiliateUrl(
  'https://www.klook.com/ko/car-rentals/',
  '1277252',
);
assert.equal(new URL(customAd).searchParams.get('aff_adid'), '1277252');
assert.equal(new URL(customAd).searchParams.get('aid'), KLOOK_AID);

const search = buildKlookAffiliateUrl(
  'https://www.klook.com/ko/search/result/?query=%ED%9B%84%EC%BF%A0%EC%98%A4%EC%B9%B4%20%ED%88%AC%EC%96%B4',
);
const searchUrl = new URL(search);
assert.equal(searchUrl.searchParams.get('query'), '후쿠오카 투어');
assert.equal(searchUrl.searchParams.get('aid'), KLOOK_AID);
assert.doesNotMatch(search, /onelink|affiliate\.klook\.com/);

const wrapped = buildKlookAffiliateUrl('https://example.com/x');
assert.match(wrapped, /^https:\/\/affiliate\.klook\.com\/redirect\?/);
assert.ok(wrapped.includes(encodeURIComponent('https://example.com/x')));

assert.equal(buildKlookAffiliateUrl(''), '');
assert.equal(buildKlookAffiliateUrl(null), '');

const affiliateSrc = read('src/utils/affiliate.js');
assert.match(affiliateSrc, /buildKlookAffiliateUrl/, 'affiliate.js delegates to web builder');
assert.match(
  affiliateSrc,
  /getKlookAirportTransferUrl[\s\S]*KLOOK_AIRPORT_TRANSFER_TARGET/,
  'pickup SSOT still uses airport-transfers target',
);

const checklist = read(
  'src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx',
);
assert.match(checklist, /getKlookAirportTransferUrl/, 'planner pickup uses Klook SSOT');

const chat = read('src/utils/chatPrepBookingLinks.js');
assert.match(chat, /getKlookAffiliateUrl\(CHAT_KLOOK_AIRPORT_TRANSFER_URL\)/, 'chat pickup uses same SSOT');

console.log('OK    smoke:klook-affiliate');
