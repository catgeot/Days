import { isEditorialLogbook, isEditorialLogbookPublished } from './logbookEditorial.js';

/** Public feed: user public posts + editorial rows that are truly published. */
export function filterPublicLogbookFeedRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => !isEditorialLogbook(row) || isEditorialLogbookPublished(row));
}
