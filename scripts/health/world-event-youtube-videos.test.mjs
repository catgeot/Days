import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  getWorldEventYoutubeVideos,
  worldEventYoutubeVideoDisplayTitle,
} from '../../src/utils/worldEventMedia.js';
import { getWorldEventById } from '../../src/utils/worldEvents.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('getWorldEventYoutubeVideos returns id-only seed without titles', () => {
  const bali = getWorldEventById('bali-galungan-season-2026');
  assert.ok(bali?.youtubeVideos?.length >= 2);
  const videos = getWorldEventYoutubeVideos(bali);
  assert.equal(videos.length, bali.youtubeVideos.length);
  assert.deepEqual(videos[0], { id: bali.youtubeVideos[0].id, title: '' });
});

test('worldEventYoutubeVideoDisplayTitle uses fallback when title missing', () => {
  assert.equal(worldEventYoutubeVideoDisplayTitle({ title: '  ' }, 'YouTube 영상'), 'YouTube 영상');
  assert.equal(worldEventYoutubeVideoDisplayTitle({ title: 'Live' }, 'YouTube video'), 'Live');
  assert.equal(worldEventYoutubeVideoDisplayTitle({ title: 'A &amp; B' }, 'x'), 'A &amp; B');
});

test('worldEvents.json youtubeVideos have no static title fields', () => {
  const json = JSON.parse(readFileSync(join(root, 'src/pages/Home/data/worldEvents.json'), 'utf8'));
  const events = Array.isArray(json.events) ? json.events : [];
  for (const event of events) {
    if (!Array.isArray(event.youtubeVideos)) continue;
    for (const video of event.youtubeVideos) {
      assert.equal(video.titleKo, undefined, `${event.id} titleKo`);
      assert.equal(video.titleEn, undefined, `${event.id} titleEn`);
    }
  }
});
