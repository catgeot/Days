import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { STAY_AGENCY_LINK_OVERRIDES } from './data/stay-agency-link-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotStayAgencyLinks.json');

const KIND_SET = new Set(['tourism-board', 'local-dmc', 'kr-specialist']);
const MAX_LINKS = 3;

function assertValidOverrides(spots) {
  for (const [slug, entry] of Object.entries(spots)) {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`[stay-agencies] ${slug}: entry must be object`);
    }
    if (!Array.isArray(entry.links) || entry.links.length === 0) {
      throw new Error(`[stay-agencies] ${slug}: links must be non-empty array`);
    }
    if (entry.links.length > MAX_LINKS) {
      throw new Error(`[stay-agencies] ${slug}: max ${MAX_LINKS} links`);
    }
    if (!String(entry.note || '').trim()) {
      throw new Error(`[stay-agencies] ${slug}: note required`);
    }
    for (const [i, link] of entry.links.entries()) {
      const href = String(link?.href || '').trim();
      if (!/^https:\/\//i.test(href)) {
        throw new Error(`[stay-agencies] ${slug}[${i}]: href must be https`);
      }
      if (!KIND_SET.has(link.kind)) {
        throw new Error(`[stay-agencies] ${slug}[${i}]: invalid kind ${link.kind}`);
      }
      if (!String(link.name || '').trim()) {
        throw new Error(`[stay-agencies] ${slug}[${i}]: name required`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(link.verifiedAt || ''))) {
        throw new Error(`[stay-agencies] ${slug}[${i}]: verifiedAt YYYY-MM-DD`);
      }
      if (!String(link.evidence || '').trim()) {
        throw new Error(`[stay-agencies] ${slug}[${i}]: evidence required`);
      }
    }
  }
}

function main() {
  const spots = { ...STAY_AGENCY_LINK_OVERRIDES };
  assertValidOverrides(spots);

  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      spotCount: Object.keys(spots).length,
      source: 'scripts/data/stay-agency-link-overrides.mjs',
    },
    spots,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${payload.meta.spotCount} spots)`);
}

main();
