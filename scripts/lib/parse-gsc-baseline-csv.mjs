/**
 * Parse GSC baseline CSV (8 columns, no quoted commas in template).
 */
const REQUIRED_COLS = [
  'url',
  'slug',
  'intent',
  'tab',
  'checked_at',
  'gsc_index_status',
  'gsc_last_crawl',
  'notes',
];

export const GSC_BASELINE_HEADER = REQUIRED_COLS.join(',');

export function parseGscBaselineCsv(raw) {
  const lines = raw.trim().split('\n');
  if (!lines.length) {
    throw new Error('empty CSV');
  }

  const header = lines[0].trim();
  if (header !== GSC_BASELINE_HEADER) {
    throw new Error(`unexpected header: ${header}`);
  }

  const rows = lines.slice(1).map((line, idx) => {
    const parts = line.split(',');
    if (parts.length < 8) {
      throw new Error(`line ${idx + 2}: expected 8 columns, got ${parts.length}`);
    }
    const [url, slug, intent, tab, checked_at, gsc_index_status, gsc_last_crawl, ...noteParts] =
      parts;
    return {
      url,
      slug,
      intent,
      tab,
      checked_at: checked_at ?? '',
      gsc_index_status: gsc_index_status ?? '',
      gsc_last_crawl: gsc_last_crawl ?? '',
      notes: noteParts.join(','),
    };
  });

  return rows;
}

export function indexGscBaselineByUrl(rows) {
  const map = new Map();
  for (const row of rows) {
    if (map.has(row.url)) {
      throw new Error(`duplicate url in CSV: ${row.url}`);
    }
    map.set(row.url, row);
  }
  return map;
}
