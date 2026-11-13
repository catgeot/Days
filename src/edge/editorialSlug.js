export function isEditorialSlugSafe(slug) {
  const value = String(slug || '').trim();
  if (!value || value.length > 120) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
