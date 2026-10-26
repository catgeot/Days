import assert from 'node:assert/strict';
import test from 'node:test';
import {
  eventStripCardPeekMetrics,
  eventStripCardShellClass,
} from '../../src/pages/WorldEvents/eventStripCardLayout.js';

test('eventStripCardShellClass includes mobile peek calc and desktop fixed widths', () => {
  assert.match(eventStripCardShellClass(), /calc\(\(100%-0\.5rem\)\/2\.18\)/);
  assert.match(eventStripCardShellClass(), /sm:w-\[168px\]/);
  assert.match(eventStripCardShellClass({ large: true }), /calc\(\(100%-0\.5rem\)\/1\.55\)/);
  assert.match(eventStripCardShellClass({ large: true }), /sm:w-\[252px\]/);
});

test('default strip peek at ~326px row is between 15% and 20%', () => {
  const { peekPercent, cardWidth } = eventStripCardPeekMetrics(326);
  assert.ok(cardWidth > 130 && cardWidth < 155, `cardWidth ${cardWidth}`);
  assert.ok(
    peekPercent >= 15 && peekPercent <= 20.5,
    `peek ${peekPercent.toFixed(1)}%`,
  );
});
