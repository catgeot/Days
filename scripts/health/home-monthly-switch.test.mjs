import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoHomeMonthlySwitchEnabled,
  isHomeMonthlySwitchQueryEnabled,
} from '../../src/shared/gateoFeatureFlags.js';
import {
  HOME_MONTHLY_PREVIEW_START_DAY,
  HOME_WATCH_CARD_LAYOUT,
  buildHomeWatchSlots,
  homeMonthlySwitchState,
  layoutHomeMonthlyCard,
  mooniFabHintExtraMarginBottom,
  mooniFabHintMarginBottom,
  rectsOverlap,
  resolveHomeMonthlyPreviewStartDay,
} from '../../src/pages/Home/lib/homeWatchCardModel.js';

test('home monthly switch defaults off unless env or query enables it', () => {
  const key = GATEO_ENV_FLAG_NAMES.HOME_MONTHLY_SWITCH;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    globalThis.__VITE_ENV__[key] = '';
    assert.equal(isGateoHomeMonthlySwitchEnabled(''), false);
    assert.equal(isHomeMonthlySwitchQueryEnabled('?home_monthly_switch=1'), true);
    assert.equal(isHomeMonthlySwitchQueryEnabled('?home_monthly_switch=0'), false);
    assert.equal(isGateoHomeMonthlySwitchEnabled('?home_monthly_switch=1'), true);
    globalThis.__VITE_ENV__[key] = '1';
    assert.equal(isGateoHomeMonthlySwitchEnabled(''), true);
    globalThis.__VITE_ENV__[key] = '0';
    assert.equal(isGateoHomeMonthlySwitchEnabled(''), false);
    assert.equal(isGateoHomeMonthlySwitchEnabled('?home_monthly_switch=1'), true);
  } finally {
    globalThis.__VITE_ENV__[key] = prev;
  }
});

test('home monthly preview window follows KST month boundaries', () => {
  assert.equal(HOME_MONTHLY_PREVIEW_START_DAY, 1);
  assert.equal(resolveHomeMonthlyPreviewStartDay(''), 1);
  assert.equal(resolveHomeMonthlyPreviewStartDay('?home_monthly_preview_start=20'), 20);
  assert.equal(resolveHomeMonthlyPreviewStartDay('?home_monthly_preview_start=0'), 1);
  assert.equal(resolveHomeMonthlyPreviewStartDay('?home_monthly_preview_start=29'), 1);

  const octEnd = homeMonthlySwitchState(new Date('2026-10-31T14:59:59.000Z'), 1);
  assert.equal(octEnd.currentMonthKey, '2026-10');
  assert.equal(octEnd.day, 31);
  assert.equal(octEnd.nextMonthKey, '2026-11');
  assert.equal(octEnd.windowOpen, true);

  const novStart = homeMonthlySwitchState(new Date('2026-10-31T15:00:00.000Z'), 1);
  assert.equal(novStart.currentMonthKey, '2026-11');
  assert.equal(novStart.day, 1);
  assert.equal(novStart.month, 11);
  assert.equal(novStart.nextMonth, 12);
  assert.equal(novStart.nextMonthKey, '2026-12');
  assert.equal(novStart.previewOpen, true);

  const beforeDay = homeMonthlySwitchState(new Date('2026-11-19T14:59:59.000Z'), 20);
  assert.equal(beforeDay.day, 19);
  assert.equal(beforeDay.windowOpen, false);
  assert.equal(beforeDay.previewOpen, false);

  const onDay = homeMonthlySwitchState(new Date('2026-11-19T15:00:00.000Z'), 20);
  assert.equal(onDay.day, 20);
  assert.equal(onDay.windowOpen, true);
  assert.equal(onDay.previewOpen, true);

  const decEnd = homeMonthlySwitchState(new Date('2026-12-31T14:59:59.000Z'), 1);
  assert.equal(decEnd.currentMonthKey, '2026-12');
  assert.equal(decEnd.nextMonthKey, '2027-01');
  assert.equal(decEnd.windowOpen, true);
  assert.equal(decEnd.previewOpen, false);

  const janStart = homeMonthlySwitchState(new Date('2026-12-31T15:00:00.000Z'), 1);
  assert.equal(janStart.currentMonthKey, '2027-01');
  assert.equal(janStart.day, 1);
  assert.equal(janStart.nextMonthKey, '2027-02');
  assert.equal(janStart.previewOpen, false);

  const missingNext = homeMonthlySwitchState(new Date('2026-11-25T03:00:00.000Z'), 1, {
    '2026-11': [{ slug: 'kyoto' }],
  });
  assert.equal(missingNext.windowOpen, true);
  assert.equal(missingNext.previewOpen, false);
});

test('mooni fab hint margin clears the monthly card at default and dragged FAB positions', () => {
  const card = { left: 12, right: 270, top: 571, bottom: 656, width: 258, height: 85 };
  const hintHeight = 58;
  const hintWidth = 198;
  const positions = [
    { label: 'right', fab: { left: 294, right: 374, top: 680, bottom: 812, width: 80, height: 132 } },
    { label: 'center', fab: { left: 155, right: 235, top: 700, bottom: 832, width: 80, height: 132 } },
    { label: 'left', fab: { left: 16, right: 96, top: 720, bottom: 852, width: 80, height: 132 } },
  ];
  for (const { label, fab } of positions) {
    const hintOnRight = fab.left < 198 + 8;
    const marginBottom = mooniFabHintMarginBottom({
      fabRect: fab,
      hintWidth,
      hintHeight,
      hintOnRight,
      obstacles: [card],
    });
    assert.ok(marginBottom > 8, `${label}: expected extra clearance above base gap`);
    const hintLeft = hintOnRight ? fab.left : fab.right - hintWidth;
    const hint = {
      left: hintLeft,
      right: hintLeft + hintWidth,
      top: fab.top - marginBottom - hintHeight,
      bottom: fab.top - marginBottom,
    };
    assert.equal(rectsOverlap(hint, card), false, `${label}: hint still overlaps monthly card`);
    const extra = mooniFabHintExtraMarginBottom({
      fabRect: fab,
      hintWidth,
      hintHeight,
      hintOnRight,
      obstacles: [card],
    });
    assert.equal(extra + 8, marginBottom);
  }
});

test('monthly card layout clears the about row and the MOONi button', () => {
  const about = { left: 8, right: 240, top: 742, bottom: 770, width: 232, height: 28 };
  const nav = { left: 8, right: 300, top: 784, bottom: 836, width: 292, height: 52 };
  const mooni = { left: 294, right: 374, top: 680, bottom: 812, width: 80, height: 132 };
  const placed = layoutHomeMonthlyCard({
    viewportWidth: 390,
    viewportHeight: 844,
    safeBottom: 34,
    mooni,
    obstacles: [about, nav],
  });
  assert.equal(placed.height, HOME_WATCH_CARD_LAYOUT.mobile.height);
  const card = {
    left: placed.left,
    right: 390 - placed.right,
    top: placed.top,
    bottom: placed.top + placed.height,
  };
  assert.ok(card.bottom <= about.top);
  assert.ok(about.top - card.bottom <= 16);
  assert.ok(card.right > mooni.left, 'mobile bar spans the full viewport width');
  assert.ok(card.bottom <= nav.top);
});

test('monthly card width stays fixed when MOONi moves', () => {
  const about = { left: 8, right: 240, top: 742, bottom: 770, width: 232, height: 28 };
  const docked = layoutHomeMonthlyCard({
    viewportWidth: 390,
    viewportHeight: 844,
    safeBottom: 34,
    mooni: { left: 294, right: 374, top: 680, bottom: 812, width: 80, height: 132 },
    obstacles: [about],
  });
  const dragged = layoutHomeMonthlyCard({
    viewportWidth: 390,
    viewportHeight: 844,
    safeBottom: 34,
    mooni: { left: 48, right: 128, top: 360, bottom: 492, width: 80, height: 132 },
    obstacles: [about],
  });
  assert.equal(docked.left, dragged.left);
  assert.equal(docked.right, dragged.right);
  assert.equal(docked.right, HOME_WATCH_CARD_LAYOUT.mobile.side);
  assert.equal(390 - docked.right, 378);
});

test('monthly mode keeps every destination tile in the scroller', () => {
  const destinations = ['sapporo', 'vienna', 'hong-kong', 'seoul'].map((slug) => ({
    slug,
    name: slug,
    href: `/place/${slug}`,
  }));
  const all = buildHomeWatchSlots({
    destinations,
    slotCount: 3,
    limitDestinations: false,
  });
  assert.equal(all.length, 4);
  assert.deepEqual(all.map((slot) => slot.slug), ['sapporo', 'vienna', 'hong-kong', 'seoul']);
  const limited = buildHomeWatchSlots({ destinations, slotCount: 3 });
  assert.equal(limited.length, 3);
});
