import { isEditorialLogbook } from '../../../utils/logbookEditorial';

/** Same rule as `/blog/:id` Detail — session user id must match report.user_id. */
export function isLogbookReportOwner(sessionUserId, report) {
  if (!sessionUserId || !report?.user_id) return false;
  if (isEditorialLogbook(report)) return false;
  return sessionUserId === report.user_id;
}
