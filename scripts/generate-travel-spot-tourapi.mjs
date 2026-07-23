/**
 * TourAPI slug↔contentId SSOT → travelSpotTourApi.json
 *
 *   npm run generate:tourapi
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TOURAPI_CONTENT_ID_OVERRIDES } from './data/tourapi-content-id-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotTourApi.json');

function assertValidOverrides(spots) {
  const seenAliases = new Map();
  for (const [slug, entry] of Object.entries(spots)) {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`[tourapi] ${slug}: entry must be object`);
    }
    const kw = String(entry.photoKeyword || '').trim();
    if (!kw || kw.length > 80) {
      throw new Error(`[tourapi] ${slug}: photoKeyword required (1–80)`);
    }
    if (entry.contentId != null && entry.contentId !== '') {
      const id = String(entry.contentId).trim();
      if (!/^\d{1,32}$/.test(id)) {
        throw new Error(`[tourapi] ${slug}: contentId must be numeric`);
      }
    }
    const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];
    for (const a of aliases) {
      const key = String(a || '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      if (seenAliases.has(key) && seenAliases.get(key) !== slug) {
        throw new Error(
          `[tourapi] alias "${a}" collision: ${seenAliases.get(key)} vs ${slug}`,
        );
      }
      seenAliases.set(key, slug);
    }
  }
}

function main() {
  const spots = { ...TOURAPI_CONTENT_ID_OVERRIDES };
  assertValidOverrides(spots);

  const byName = {};
  for (const [slug, entry] of Object.entries(spots)) {
    const names = new Set([
      entry.title,
      entry.photoKeyword,
      ...(Array.isArray(entry.aliases) ? entry.aliases : []),
    ]);
    for (const n of names) {
      const key = String(n || '').trim();
      if (!key) continue;
      if (!byName[key]) byName[key] = slug;
    }
  }

  const withContentId = Object.values(spots).filter(
    (e) => e.contentId != null && String(e.contentId).trim() !== '',
  ).length;

  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      spotCount: Object.keys(spots).length,
      contentIdCount: withContentId,
      source: 'scripts/data/tourapi-content-id-overrides.mjs',
    },
    spots,
    byName,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `Wrote ${OUTPUT_PATH} (${payload.meta.spotCount} spots, ${payload.meta.contentIdCount} with contentId)`,
  );
}

main();
