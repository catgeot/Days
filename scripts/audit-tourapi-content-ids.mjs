/**
 * TourAPI SSOT audit — schema / contentId / alias uniqueness.
 *
 *   npm run audit:tourapi
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/travelSpotTourApi.json');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

function main() {
  const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  const spots = data.spots || {};
  const byName = data.byName || {};
  const slugs = Object.keys(spots);

  assert(slugs.length >= 1, `spotCount ≥1 (got ${slugs.length})`);
  assert(data.meta?.version === 1, 'meta.version === 1');

  let contentIdCount = 0;
  const aliasMap = new Map();

  for (const [slug, entry] of Object.entries(spots)) {
    const kw = String(entry?.photoKeyword || '').trim();
    assert(Boolean(kw) && kw.length <= 80, `${slug}: photoKeyword`);
    if (entry?.contentId != null && String(entry.contentId).trim() !== '') {
      const id = String(entry.contentId).trim();
      assert(/^\d{1,32}$/.test(id), `${slug}: contentId numeric (${id})`);
      contentIdCount += 1;
    }
    for (const a of entry?.aliases || []) {
      const key = String(a || '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      if (aliasMap.has(key) && aliasMap.get(key) !== slug) {
        assert(false, `alias collision "${a}": ${aliasMap.get(key)} vs ${slug}`);
      }
      aliasMap.set(key, slug);
    }
  }

  assert(contentIdCount >= 1, `contentIdCount ≥1 (got ${contentIdCount})`);

  // Seed landmarks
  assert(spots.gyeongbokgung?.contentId === '126508', 'gyeongbokgung → 126508');
  assert(byName['경복궁'] === 'gyeongbokgung', 'byName 경복궁 → gyeongbokgung');
  assert(spots.seoul?.photoKeyword === '서울', 'seoul photoKeyword 서울');

  if (failed) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(
    `\nTourAPI audit PASS — ${slugs.length} spots, ${contentIdCount} contentIds`,
  );
}

main();
