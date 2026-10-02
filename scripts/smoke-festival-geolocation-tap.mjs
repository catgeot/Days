import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../src/pages/Korea/index.jsx', import.meta.url), 'utf8');
assert.equal((home.match(/getCurrentPosition/g) || []).length, 1);
assert.equal(home.includes('watchPosition'), false);
assert.equal(home.includes('permissions'), false);
assert.equal(home.includes('koreaFestivalLocationBooted'), false);
assert.match(home, /data-near-me-hint/);
assert.match(home, /locOffPickRegion/);

const ko = JSON.parse(readFileSync(new URL('../src/i18n/locales/ko.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../src/i18n/locales/en.json', import.meta.url), 'utf8'));
assert.equal(
  ko.korea.common.locOffPickRegion,
  '위치 권한이 꺼져 있어요. 지역을 직접 골라 주세요.',
);
assert.equal(en.korea.common.locOffPickRegion, 'Location is off. Pick a region yourself.');

console.log('smoke-festival-geolocation-tap: OK');
