const PLACEHOLDER_HOST_RE =
  /^(?:.*\.)?example\.(?:com|org|net)$|^localhost$|.*\.(?:example|test|invalid)$/i;

/**
 * @param {string} url
 */
export function isMooniPlaceholderUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return true;
  try {
    const parsed = new URL(raw, 'https://www.gateo.kr');
    const host = parsed.hostname.toLowerCase();
    return PLACEHOLDER_HOST_RE.test(host);
  } catch {
    return true;
  }
}

/**
 * Strip markdown links that point at placeholder / example hosts (keep link text).
 *
 * @param {string} markdown
 */
export function stripMooniPlaceholderMarkdownLinks(markdown) {
  let s = String(markdown ?? '');
  if (!s) return s;
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, label, href) =>
    isMooniPlaceholderUrl(href) ? label : full,
  );
  return s;
}
