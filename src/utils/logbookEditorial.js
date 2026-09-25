export const LOGBOOK_EDITORIAL_DISCLOSURE_KO =
  'GATEO 에디터 · AI 보조 · 실제 방문기 아님';

export const LOGBOOK_EDITORIAL_PUBLISH_STATUSES = ['draft', 'published', 'archived'];

export function isEditorialLogbook(report) {
  return Boolean(report?.is_editorial);
}

export function isEditorialLogbookPublished(report) {
  return isEditorialLogbook(report) && String(report?.status || '').toLowerCase() === 'published';
}

export function editorialLogbookDisclosure(report) {
  const custom = String(report?.disclosure_badge || '').trim();
  return custom || LOGBOOK_EDITORIAL_DISCLOSURE_KO;
}

export function sortLogbookFeedRows(rows) {
  const list = Array.isArray(rows) ? [...rows] : [];
  list.sort((a, b) => {
    const ta = new Date(a.published_at || a.date || a.created_at || 0).getTime();
    const tb = new Date(b.published_at || b.date || b.created_at || 0).getTime();
    return tb - ta;
  });
  return list;
}

export function publicLogbookDetailPath(report) {
  if (!report) return '/blog';
  if (isEditorialLogbook(report) && report.slug) {
    return `/blog/e/${report.slug}`;
  }
  return `/p/${report.id}`;
}
