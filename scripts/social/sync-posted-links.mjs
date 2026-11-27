/**
 * data/social/posted-links.md → src/pages/Social/data/socialLinks.generated.json
 * Missing input writes an empty card list. Does not read posted-log.md.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSocialLinkCards, enrichSocialCards, parsePostedLinksMarkdown } from './postedLinksModel.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_POSTED_LINKS_INPUT = join(repoRoot, 'data/social/posted-links.md');
export const DEFAULT_SOCIAL_LINKS_OUTPUT = join(
  repoRoot,
  'src/pages/Social/data/socialLinks.generated.json',
);

function emptyPayload() {
  return {
    source: 'data/social/posted-links.md',
    missingSource: true,
    cards: [],
  };
}

function writeJsonIfChanged(outputPath, payload) {
  const next = `${JSON.stringify(payload, null, 2)}\n`;
  if (existsSync(outputPath)) {
    const current = readFileSync(outputPath, 'utf8');
    if (current === next) return false;
  }
  writeFileSync(outputPath, next);
  return true;
}

export function loadSocialPlaceCatalog(root = repoRoot) {
  const scenic = JSON.parse(
    readFileSync(join(root, 'src/pages/Home/data/koreaScenicSpots.json'), 'utf8'),
  );
  const places = new Map();
  const remember = (key, record) => {
    const id = String(key || '').trim().toLowerCase();
    if (!id || places.has(id)) return;
    places.set(id, record);
  };
  for (const spot of scenic.spots || []) {
    const record = {
      name: String(spot.name || spot.attractionName || '').trim(),
      imageUrl: String(spot.imageUrl || '').trim() || null,
      region: String(spot.region || '').trim(),
    };
    remember(spot.placeSlug, record);
    remember(spot.id, record);
    if (spot.contentId) remember(`tour-${spot.contentId}`, record);
  }

  const listPath = join(root, 'src/pages/Home/data/travelSpots-list.json');
  if (existsSync(listPath)) {
    const list = JSON.parse(readFileSync(listPath, 'utf8'));
    for (const spot of list) {
      remember(spot.slug, {
        name: String(spot.name || '').trim(),
        imageUrl: null,
        region: '',
      });
    }
  }

  const festivals = new Map();
  const manual = JSON.parse(
    readFileSync(join(root, 'src/pages/Korea/data/manualFestivalEntries.json'), 'utf8'),
  );
  for (const [id, entry] of Object.entries(manual)) {
    const image = Array.isArray(entry.images) ? entry.images[0] : null;
    festivals.set(String(id), {
      title: String(entry.title || '').trim(),
      eventStartDate: String(entry.eventStartDate || '').trim(),
      eventEndDate: String(entry.eventEndDate || '').trim(),
      imageUrl: image?.url ? String(image.url) : null,
      imageCredit: image?.credit ? String(image.credit) : null,
    });
  }
  return { places, festivals };
}

/**
 * @param {{ inputPath?: string, outputPath?: string, catalog?: { places: Map<string, object>, festivals: Map<string, object> } | null }} [options]
 */
export function syncPostedLinks({
  inputPath = DEFAULT_POSTED_LINKS_INPUT,
  outputPath = DEFAULT_SOCIAL_LINKS_OUTPUT,
  catalog = undefined,
} = {}) {
  if (!existsSync(inputPath)) {
    writeJsonIfChanged(outputPath, emptyPayload());
    return { ok: true, missingSource: true, cards: [], skipped: [], excluded: [] };
  }

  const parsed = parsePostedLinksMarkdown(readFileSync(inputPath, 'utf8'));
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, missingSource: false, cards: [], skipped: [], excluded: [] };
  }
  const built = buildSocialLinkCards(parsed.rows);
  if (!built.ok) {
    return {
      ok: false,
      error: built.error,
      missingSource: false,
      cards: [],
      skipped: built.skipped,
      excluded: built.excluded,
    };
  }

  const resolvedCatalog = catalog === undefined ? loadSocialPlaceCatalog() : catalog;
  const cards = enrichSocialCards(built.cards, resolvedCatalog || { places: new Map(), festivals: new Map() });
  writeJsonIfChanged(outputPath, {
    source: 'data/social/posted-links.md',
    missingSource: false,
    cards,
  });
  return {
    ok: true,
    missingSource: false,
    cards,
    skipped: built.skipped,
    excluded: built.excluded,
  };
}

function printResult(result) {
  if (!result.ok) {
    console.error(result.error);
    return;
  }
  if (result.missingSource) {
    console.log('posted-links.md 없음 → 카드 0장');
    return;
  }
  const skipped = result.skipped || [];
  if (skipped.length) {
    console.log(
      `카드 못 만든 행 ${skipped.length}개: ${skipped.map((row) => `${row.line} ${row.reason}`).join(', ')}`,
    );
  }
  const excluded = result.excluded || [];
  if (excluded.length) {
    console.log(`제외 ${excluded.length}행 (X·deleted·unconfirmed)`);
  }
  console.log(`소셜 카드 ${result.cards.length}장`);
}

function main() {
  const inputPath = process.argv[2] || DEFAULT_POSTED_LINKS_INPUT;
  const outputPath = process.argv[3] || DEFAULT_SOCIAL_LINKS_OUTPUT;
  const result = syncPostedLinks({ inputPath, outputPath });
  printResult(result);
  if (!result.ok) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}
