/** Job log 전용 — public 이슈·Summary에는 사용 금지 */

export function maskPrivate(text) {
  let s = String(text ?? '');
  s = s.replace(/\u001b\[[0-9;]*m/g, '');
  s = s.replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted]');
  s = s.replace(/\bBearer\s+[\w.-]+/gi, 'Bearer [redacted]');
  s = s.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[redacted-ip]');
  s = s.replace(/(?:\b|[:\/])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\b/gi, '[redacted-ip]');
  s = s.replace(/\$\d+(?:\.\d+)?/g, '[redacted-cost]');
  s = s.replace(/\b\d+(?:\.\d+)?\s*u\b/gi, '[redacted-usage]');
  s = s.replace(/\b\d+(?:\.\d+)?\s*(?:tokens?|GB|MB|KiB)\b/gi, '[redacted-usage]');
  s = s.replace(/\{"quota":\{[^}]+\}\}/g, '[redacted-quota]');
  s = s.replace(/page_ip_limited/g, '[redacted-rate-limit]');
  s = s.replace(/\b429\b/g, '[redacted]');
  return s.replace(/\s+/g, ' ').trim();
}
