import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shouldShowFestivalMooniFab } from '../../src/pages/Korea/lib/festivalMooniFabVisibility.js';

test('disabled — no FAB', () => {
  assert.equal(shouldShowFestivalMooniFab({ enabled: false }), false);
});

test('pending inline anchor — hide FAB (default inlineVisible=true)', () => {
  assert.equal(
    shouldShowFestivalMooniFab({
      enabled: true,
      inlineAnchorExpected: true,
      inlineMounted: false,
      inlineVisible: true,
    }),
    false,
  );
});

test('inline visible in viewport — hide FAB', () => {
  assert.equal(
    shouldShowFestivalMooniFab({
      enabled: true,
      inlineAnchorExpected: true,
      inlineMounted: true,
      inlineVisible: true,
    }),
    false,
  );
});

test('inline scrolled away — show FAB', () => {
  assert.equal(
    shouldShowFestivalMooniFab({
      enabled: true,
      inlineAnchorExpected: true,
      inlineMounted: true,
      inlineVisible: false,
    }),
    true,
  );
});

test('enabled but no summary / inline anchor — show FAB', () => {
  assert.equal(
    shouldShowFestivalMooniFab({
      enabled: true,
      inlineAnchorExpected: false,
      inlineMounted: false,
      inlineVisible: true,
    }),
    true,
  );
});
