import assert from 'node:assert/strict';
import test from 'node:test';
import {
  courseMunicipalityLabel,
  replaceDashWrappedPlaceholders,
} from '../../src/pages/KoreaTheme/coursePlaceholderText.js';

test('dash-wrapped 지자체 becomes the municipality', () => {
  const addr = '강원특별자치도 춘천시 중앙로 1';
  assert.equal(courseMunicipalityLabel(addr), '춘천시');
  assert.equal(replaceDashWrappedPlaceholders('----지자체-----', '춘천시'), '춘천시');
  assert.equal(
    replaceDashWrappedPlaceholders('테마 ----지자체----- 산책', '춘천시'),
    '테마 춘천시 산책',
  );
});

test('dash-wrapped placeholder is hidden when no municipality exists', () => {
  assert.equal(replaceDashWrappedPlaceholders('----지자체-----', ''), '');
  assert.equal(replaceDashWrappedPlaceholders('-----', ''), '');
  assert.equal(replaceDashWrappedPlaceholders('----시군구-----', ''), '');
  assert.equal(courseMunicipalityLabel('----지자체-----'), '');
});

test('real course copy is left alone', () => {
  assert.equal(replaceDashWrappedPlaceholders('호수 산책 4시간', '춘천시'), '호수 산책 4시간');
  assert.equal(replaceDashWrappedPlaceholders('12km', '춘천시'), '12km');
});
