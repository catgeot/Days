import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  editorialLogbookSecondaryNotice,
  LOGBOOK_EDITORIAL_SECONDARY_EN,
  LOGBOOK_EDITORIAL_SECONDARY_KO,
  LOGBOOK_EDITORIAL_SECONDARY_LABEL_MAX,
  normalizeEditorialSecondaryLabelInput,
} from '../../src/utils/logbookEditorial.js';

test('missing editorial_secondary_label uses default (KO)', () => {
  assert.equal(editorialLogbookSecondaryNotice({ is_editorial: true }), LOGBOOK_EDITORIAL_SECONDARY_KO);
  assert.equal(editorialLogbookSecondaryNotice({ locale: 'ko' }), LOGBOOK_EDITORIAL_SECONDARY_KO);
});

test('custom editorial_secondary_label renders trimmed copy', () => {
  const custom = '대표의 실제 여행 기반 · 에디터 정리';
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'ko', editorial_secondary_label: custom }),
    custom,
  );
});

test('blank or non-string editorial_secondary_label falls back to default', () => {
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'ko', editorial_secondary_label: '   ' }),
    LOGBOOK_EDITORIAL_SECONDARY_KO,
  );
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'ko', editorial_secondary_label: null }),
    LOGBOOK_EDITORIAL_SECONDARY_KO,
  );
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'ko', editorial_secondary_label: 42 }),
    LOGBOOK_EDITORIAL_SECONDARY_KO,
  );
});

test('editorial_secondary_label_en used for English locale', () => {
  const enCustom = 'Based on a real GATEO trip · edited';
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'en', editorial_secondary_label_en: enCustom }),
    enCustom,
  );
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'en-US', editorial_secondary_label: '한국어 전용' }),
    LOGBOOK_EDITORIAL_SECONDARY_EN,
  );
});

test('secondary label input is capped at max length', () => {
  const long = '가'.repeat(LOGBOOK_EDITORIAL_SECONDARY_LABEL_MAX + 20);
  const capped = normalizeEditorialSecondaryLabelInput(long);
  assert.equal(capped?.length, LOGBOOK_EDITORIAL_SECONDARY_LABEL_MAX);
  assert.equal(
    editorialLogbookSecondaryNotice({ locale: 'ko', editorial_secondary_label: long }),
    '가'.repeat(LOGBOOK_EDITORIAL_SECONDARY_LABEL_MAX),
  );
});