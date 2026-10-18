import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  E2E_IMAGE_ORIGIN,
  buildLongProgramAppendix,
} from '../festival-back-overview-fixture.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const MANUAL_638576 = JSON.parse(
  readFileSync(join(__dir, '../../src/pages/Korea/data/manualFestivalEntries.json'), 'utf8'),
)['638576'];

const MANUAL_GALLERY_COUNT = 120;

function buildManualGalleryImages(seedImage, count) {
  const seed = seedImage || {
    url: `${E2E_IMAGE_ORIGIN}/festival-hero-638576.png`,
    credit: '출처: 한국관광공사(공공누리 제3유형)',
  };
  const images = [{ url: seed.url, credit: seed.credit }];
  for (let i = 1; i < count; i += 1) {
    images.push({
      url: `${E2E_IMAGE_ORIGIN}/manual-638576-gallery-${i}.png`,
      credit: seed.credit,
    });
  }
  return images;
}

/** E2E-only overlay for manual SSOT 638576 (Playwright init script). */
export function buildManual638576E2eOverlay() {
  return {
    ...MANUAL_638576,
    program: `${MANUAL_638576.program}\n\n${buildLongProgramAppendix()}`,
    images: buildManualGalleryImages(MANUAL_638576.images?.[0], MANUAL_GALLERY_COUNT),
  };
}
