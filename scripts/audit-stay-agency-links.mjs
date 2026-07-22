import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { STAY_AGENCY_LINK_OVERRIDES } from './data/stay-agency-link-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIST_PATH = join(__dirname, '../src/pages/Home/data/travelSpots-list.json');
const JSON_PATH = join(__dirname, '../src/pages/Home/data/travelSpotStayAgencyLinks.json');

const KIND_SET = new Set(['tourism-board', 'local-dmc', 'kr-specialist']);
const MAX_AGE_DAYS = 183; // ~6 months

function daysSince(isoDate) {
  const t = Date.parse(`${isoDate}T00:00:00Z`);
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function main() {
  const list = JSON.parse(readFileSync(LIST_PATH, 'utf8'));
  const slugSet = new Set(
    (Array.isArray(list) ? list : list?.spots || [])
      .map((row) => String(row?.slug || '').trim().toLowerCase())
      .filter(Boolean),
  );

  let generated = null;
  try {
    generated = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
  } catch {
    console.error(`[audit:stay-agencies] missing generated JSON — run npm run generate:stay-agencies`);
    process.exitCode = 1;
    return;
  }

  const overrideSlugs = Object.keys(STAY_AGENCY_LINK_OVERRIDES).sort();
  const generatedSlugs = Object.keys(generated?.spots || {}).sort();
  const errors = [];
  const warnings = [];

  if (overrideSlugs.join(',') !== generatedSlugs.join(',')) {
    errors.push('overrides vs generated JSON slug set drift — re-run generate:stay-agencies');
  }

  for (const slug of overrideSlugs) {
    if (!slugSet.has(slug)) {
      errors.push(`${slug}: not in travelSpots-list.json`);
    }
    const entry = STAY_AGENCY_LINK_OVERRIDES[slug];
    if (!entry?.links?.length) {
      errors.push(`${slug}: empty links`);
      continue;
    }
    if (entry.links.length > 3) {
      errors.push(`${slug}: more than 3 links`);
    }
    if (!String(entry.note || '').trim()) {
      errors.push(`${slug}: missing note`);
    }
    for (const [i, link] of entry.links.entries()) {
      const href = String(link?.href || '').trim();
      if (!/^https:\/\//i.test(href)) {
        errors.push(`${slug}[${i}]: href must be https (${href})`);
      }
      if (!KIND_SET.has(link.kind)) {
        errors.push(`${slug}[${i}]: invalid kind`);
      }
      if (!String(link.name || '').trim()) {
        errors.push(`${slug}[${i}]: missing name`);
      }
      if (!String(link.evidence || '').trim()) {
        errors.push(`${slug}[${i}]: missing evidence`);
      }
      const verifiedAt = String(link.verifiedAt || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(verifiedAt)) {
        errors.push(`${slug}[${i}]: verifiedAt must be YYYY-MM-DD`);
      } else if (daysSince(verifiedAt) > MAX_AGE_DAYS) {
        warnings.push(`${slug}[${i}] ${link.name}: verifiedAt older than ~6 months — re-check`);
      }
    }
  }

  console.log(`[audit:stay-agencies] spots=${overrideSlugs.length}`);
  for (const w of warnings) console.warn(`  warn: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  error: ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log('  ok');
}

main();
