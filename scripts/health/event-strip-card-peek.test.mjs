import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVENT_STRIP_INTER_CARD_GAP_PX,
  EVENT_STRIP_MOBILE_CARD_DIVISOR,
  EVENT_STRIP_MOBILE_ROW_WIDTH_PX,
  EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX,
  eventStripCardPeekMetrics,
  eventStripCardShellClass,
  eventStripCardWidthPx,
  EVENT_STRIP_SCROLL_ROW_CLASS,
  eventStripThirdCardPeekPercent,
  eventStripThirdCardPeekPx,
} from '../../src/pages/WorldEvents/eventStripCardLayout.js';

test('scroll row hides scrollbar on mobile only', () => {
  assert.match(EVENT_STRIP_SCROLL_ROW_CLASS, /max-sm:\[scrollbar-width:none\]/);
  assert.doesNotMatch(EVENT_STRIP_SCROLL_ROW_CLASS, /touch-pan-x/);
  assert.doesNotMatch(EVENT_STRIP_SCROLL_ROW_CLASS, /snap-mandatory/);
  assert.match(EVENT_STRIP_SCROLL_ROW_CLASS, /snap-proximity/);
});

test('eventStripCardShellClass matches shared divisor and desktop/large widths', () => {
  assert.match(eventStripCardShellClass(), /w-\[calc\(\(100vw-76px\)\/2\.24\)\]/);
  assert.match(eventStripCardShellClass(), /sm:w-\[168px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /w-\[220px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /sm:w-\[252px\]/);
});

test('card width matches CSS viewport calc (100vw - offset) / divisor', () => {
  const viewport = 390;
  const expected =
    (viewport - EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX) / EVENT_STRIP_MOBILE_CARD_DIVISOR;
  assert.equal(eventStripCardWidthPx(viewport), expected);
});

test('default strip peek at 390px viewport / ~314px row is between 15% and 20%', () => {
  const rowWidth = EVENT_STRIP_MOBILE_ROW_WIDTH_PX;
  const { peekPercent, cardWidth, peekPx } = eventStripCardPeekMetrics(rowWidth, {
    viewportWidthPx: 390,
  });
  assert.equal(
    peekPx,
    rowWidth - cardWidth * 2 - EVENT_STRIP_INTER_CARD_GAP_PX,
    'peek formula matches CSS layout',
  );
  assert.ok(cardWidth > 140 && cardWidth < 143, `cardWidth ${cardWidth}`);
  assert.ok(
    peekPercent >= 15 && peekPercent <= 20,
    `peek ${peekPercent.toFixed(1)}% of card (row ${rowWidth}px)`,
  );
});

test('third-card DOM peek helper matches row clip', () => {
  const row = { left: 10, right: 332 };
  const third = { left: 300, right: 445, width: 145 };
  const peekPx = eventStripThirdCardPeekPx(row, third);
  assert.equal(peekPx, 32);
  assert.ok(Math.abs(eventStripThirdCardPeekPercent(row, third) - (32 / 145) * 100) < 0.01);
});
