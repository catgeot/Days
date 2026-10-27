import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVENT_STRIP_MOBILE_CARD_DIVISOR,
  EVENT_STRIP_MOBILE_ROW_WIDTH_PX,
  EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX,
  eventStripCardPeekMetrics,
  eventStripCardShellClass,
  eventStripCardWidthPx,
  EVENT_STRIP_SCROLL_ROW_CLASS,
  eventStripThirdCardPeekPercent,
} from '../../src/pages/WorldEvents/eventStripCardLayout.js';

test('scroll row matches main (no snap / scrollbar hiding)', () => {
  assert.equal(EVENT_STRIP_SCROLL_ROW_CLASS, '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1');
});

test('mobile card width CSS and metrics share viewport offset and divisor', () => {
  assert.match(
    eventStripCardShellClass(),
    new RegExp(
      `calc\\(\\(100vw-${EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX}px\\)/${EVENT_STRIP_MOBILE_CARD_DIVISOR}\\)`,
    ),
  );
  const viewport = 390;
  assert.equal(
    eventStripCardWidthPx(viewport),
    (viewport - EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX) / EVENT_STRIP_MOBILE_CARD_DIVISOR,
  );
});

test('desktop and large widths match main', () => {
  assert.match(eventStripCardShellClass(), /sm:w-\[168px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /w-\[220px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /sm:w-\[252px\]/);
  assert.doesNotMatch(eventStripCardShellClass(), /snap-start/);
});

test('third-card peek uses row.right minus padding-right', () => {
  const pr = 4;
  const row = { left: 0, right: 322 };
  const card3 = { left: 298, right: 438, width: 140 };
  const visibleRight = 322 - pr;
  const pct = eventStripThirdCardPeekPercent(row, card3, pr);
  assert.ok(Math.abs(pct - ((visibleRight - 298) / 140) * 100) < 0.01);
});

test('peek at 390px row is between 15% and 20%', () => {
  const { peekPercent, cardWidth } = eventStripCardPeekMetrics(EVENT_STRIP_MOBILE_ROW_WIDTH_PX);
  assert.ok(cardWidth > 135 && cardWidth < 140, `cardWidth ${cardWidth}`);
  assert.ok(
    peekPercent >= 15 && peekPercent <= 20,
    `peek ${peekPercent.toFixed(1)}%`,
  );
});
