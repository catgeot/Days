import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('recommended nights strip duplicate stay phrasing from overview', async () => {
  const { getWorldEventById } = await import(pathToFileURL(join(root, 'src/utils/worldEvents.js')).href);
  const { refineWorldEventDetailOverview } = await import(
    pathToFileURL(join(root, 'src/utils/worldEventDetailCopy.js')).href,
  );
  const kyoto = getWorldEventById('kyoto-gion-matsuri-2027');
  const refined = refineWorldEventDetailOverview(kyoto, 'ko', { showRecommendedNights: true });
  assert.doesNotMatch(refined, /2~3박/);
});

test('booking hints omit stay area names when hideStayAreaListing', async () => {
  const { getWorldEventById } = await import(pathToFileURL(join(root, 'src/utils/worldEvents.js')).href);
  const { refineWorldEventBookingHints } = await import(
    pathToFileURL(join(root, 'src/utils/worldEventDetailCopy.js')).href,
  );
  const sapporo = getWorldEventById('sapporo-white-illumination-2026');
  const hints = refineWorldEventBookingHints(sapporo, 'ko', { hideStayAreaListing: true });
  assert.doesNotMatch(hints, /오도리/);
  assert.doesNotMatch(hints, /스스키노/);
});