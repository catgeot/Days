/** Job log 전용 — public 이슈·Summary에는 사용 금지 */

const PRESERVE_RE =
  /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z|\bat \d{1,2}:\d{2}:\d{2}(?:\s+[A-Z]{2,5})?\b|\b\d{1,2}:\d{2}:\d{2}\b|[\w.-]+\.(?:js|mjs|cjs|jsx|ts|tsx):\d+:\d+)/g;

function preserveNonIpTokens(text) {
  const slots = [];
  const out = text.replace(PRESERVE_RE, (match) => {
    const i = slots.length;
    slots.push(match);
    return `\x00PH${i}\x00`;
  });
  return { out, slots };
}

function restorePreserved(text, slots) {
  let s = text;
  for (let i = 0; i < slots.length; i += 1) {
    s = s.replace(`\x00PH${i}\x00`, slots[i]);
  }
  return s;
}

export function maskPrivate(text) {
  let s = String(text ?? '');
  s = s.replace(/\u001b\[[0-9;]*m/g, '');

  const { out: preserved, slots } = preserveNonIpTokens(s);
  s = preserved;

  s = s.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]');
  s = s.replace(/eyJ[\w-]+\.[\w-]+/g, '[redacted]');
  s = s.replace(/\bBearer\s+[\w.-]+/gi, 'Bearer [redacted]');
  s = s.replace(/apikey=[^\s'"]+/gi, 'apikey=[redacted]');
  s = s.replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9]+\b/g, '[redacted]');

  s = s.replace(/::ffff:(?:\d{1,3}\.){3}\d{1,3}/gi, '[redacted-ip]');
  s = s.replace(/(?:^|[\s(])::1(?=[\s),.]|$)/g, (_m, lead) => `${lead}[redacted-ip]`);
  s = s.replace(/\b(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\b/gi, '[redacted-ip]');
  s = s.replace(
    /\b[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){0,6}::(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4}){0,6})?\b/gi,
    '[redacted-ip]',
  );

  s = s.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[redacted-ip]');

  s = s.replace(/₩[\d,]+(?:\.\d+)?/g, '[redacted-cost]');
  s = s.replace(/\bKRW\s*[\d,]+(?:\.\d+)?/gi, '[redacted-cost]');
  s = s.replace(/\b[\d,]+(?:\.\d+)?\s*KRW\b/gi, '[redacted-cost]');
  s = s.replace(/\$\d+(?:\.\d+)?/g, '[redacted-cost]');

  s = s.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*u\b/gi, '[redacted-usage]');
  s = s.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*units\b/gi, '[redacted-usage]');
  s = s.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*credits\b/gi, '[redacted-usage]');
  s = s.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:tokens?|GB|MB|KiB)\b/gi, '[redacted-usage]');
  s = s.replace(/remaining=\d+/gi, 'remaining=[redacted]');

  s = s.replace(/\{\s*"quota"\s*:\s*\{[^}]+\}\s*\}/gi, '[redacted-quota]');
  s = s.replace(/\{\s*"usage"\s*:\s*\{[^}]+\}\s*\}/gi, '[redacted-quota]');

  s = s.replace(/page_ip_limited/g, '[redacted-rate-limit]');
  s = s.replace(/\b429\b/g, '[redacted]');

  s = restorePreserved(s, slots);
  return s.replace(/\s+/g, ' ').trim();
}
