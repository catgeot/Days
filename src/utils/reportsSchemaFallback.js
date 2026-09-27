/**
 * PostgREST errors when SELECT lists columns that are not migrated yet.
 */
export function isReportsMissingColumnError(error) {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || error.details || '').toLowerCase();
  if (code === 'PGRST204') return true;
  if (msg.includes('schema cache') && msg.includes('column')) return true;
  if (msg.includes('does not exist') && msg.includes('column')) return true;
  return false;
}
