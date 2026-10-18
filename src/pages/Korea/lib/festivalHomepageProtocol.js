/** @param {unknown} url */
export function isHttpOnlyHomepage(url) {
  const s = String(url || '').trim();
  return /^http:\/\//i.test(s);
}
