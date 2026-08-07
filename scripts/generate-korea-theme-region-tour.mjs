/**
 * 방방곡곡 Tour contentId SSOT → koreaThemeRegionTour.json
 *
 *   npm run generate:korea-theme-region-tour
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_THEME_REGION_TOUR_OVERRIDES } from './data/korea-theme-region-tour-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaThemeRegionTour.json',
);

function normalize() {
  const raw = KOREA_THEME_REGION_TOUR_OVERRIDES?.byAttractionId || {};
  /** @type {Record<string, { contentId: string, tourTitle: string | null }>} */
  const byAttractionId = {};
  for (const [key, entry] of Object.entries(raw)) {
    const id = String(key || '').trim();
    const contentId = String(entry?.contentId ?? '').trim();
    if (!id || !/^\d{1,32}$/.test(contentId)) continue;
    byAttractionId[id] = {
      contentId,
      tourTitle:
        entry?.tourTitle != null && String(entry.tourTitle).trim()
          ? String(entry.tourTitle).trim()
          : null,
    };
  }
  return {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      count: Object.keys(byAttractionId).length,
      source: 'scripts/data/korea-theme-region-tour-overrides.mjs',
    },
    byAttractionId,
  };
}

const out = normalize();
writeFileSync(OUTPUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(
  `[generate:korea-theme-region-tour] wrote ${out.meta.count} → ${OUTPUT_PATH}`,
);
