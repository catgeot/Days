import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVENT_STRIP_MOBILE_ROW_WIDTH_PX,
  eventStripCardPeekMetrics,
  eventStripCardShellClass,
} from '../../src/pages/WorldEvents/eventStripCardLayout.js';

test('eventStripCardShellClass includes mobile peek calc and desktop fixed widths', () => {
  assert.match(eventStripCardShellClass(), /calc\(\(100%-0\.5rem\)\/2\.13\)/);
  assert.match(eventStripCardShellClass(), /sm:w-\[168px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /calc\(\(100%-0\.5rem\)\/1\.55\)/);
  assert.match(eventStripCardShellClass({ large: true }), /sm:w-\[252px\]/);
});

test('default strip peek at 390px festival row (~322px) is between 15% and 20%', () => {
  const rowWidth = EVENT_STRIP_MOBILE_ROW_WIDTH_PX;
  const { peekPercent, cardWidth } = eventStripCardPeekMetrics(rowWidth);
  assert.ok(cardWidth > 140 && cardWidth < 148, `cardWidth ${cardWidth}`);
  assert.ok(
    peekPercent >= 15 && peekPercent <= 20,
    `peek ${peekPercent.toFixed(1)}% of card (row ${rowWidth}px)`,
  );
});
