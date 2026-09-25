const ISO_DATE_PREFIX_RE = /^\d{4}-\d{2}-\d{2}/;

function parseLogbookTimestamp(reportOrValue) {
  if (reportOrValue == null) return null;

  if (typeof reportOrValue === 'object') {
    const raw =
      reportOrValue.published_at ||
      reportOrValue.date ||
      reportOrValue.created_at ||
      null;
    return parseLogbookTimestamp(raw);
  }

  if (typeof reportOrValue !== 'string') return null;
  const trimmed = reportOrValue.trim();
  if (!trimmed) return null;

  if (ISO_DATE_PREFIX_RE.test(trimmed) && !trimmed.includes('T')) {
    const d = new Date(`${trimmed}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Human-readable logbook date (Korean default for GATEO editorial).
 * @param {string|{ published_at?: string, date?: string, created_at?: string }|null|undefined} reportOrValue
 * @param {{ locale?: string }} [opts]
 */
export function formatLogbookDisplayDate(reportOrValue, opts = {}) {
  const d = parseLogbookTimestamp(reportOrValue);
  if (!d) {
    if (typeof reportOrValue === 'string') return reportOrValue.trim();
    return '';
  }

  const locale = opts.locale === 'en' ? 'en-US' : 'ko-KR';
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export { parseLogbookTimestamp };
