/**
 * Commons `Special:FilePath` is an HTML redirect, not an image.
 * Card <img> tags stay on the grey frame until that chain finishes, and some
 * browsers never follow it. Build the direct /thumb/ JPEG from the filename.
 */

function add32(x, y) {
  const lx = x & 0x80000000;
  const ly = y & 0x80000000;
  const mx = x & 0x40000000;
  const my = y & 0x40000000;
  const sum = (x & 0x3fffffff) + (y & 0x3fffffff);
  if (mx & my) return (sum ^ 0x80000000 ^ lx ^ ly) | 0;
  if (mx | my) {
    if (sum & 0x40000000) return (sum ^ 0xc0000000 ^ lx ^ ly) | 0;
    return (sum ^ 0x40000000 ^ lx ^ ly) | 0;
  }
  return (sum ^ lx ^ ly) | 0;
}

function md5(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 4; i += 1) bytes.push((bitLen >>> (8 * i)) & 0xff);
  for (let i = 0; i < 4; i += 1) bytes.push(0);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const k = [];
  for (let i = 0; i < 64; i += 1) k.push((Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)) | 0);

  const rot = (x, n) => (x << n) | (x >>> (32 - n));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = new Array(16);
    for (let i = 0; i < 16; i += 1) {
      const j = offset + i * 4;
      w[i] = bytes[j] | (bytes[j + 1] << 8) | (bytes[j + 2] << 16) | (bytes[j + 3] << 24);
    }
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;
    for (let i = 0; i < 64; i += 1) {
      let f;
      let g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const next = add32(add32(a, f), add32(k[i], w[g]));
      a = d;
      d = c;
      c = b;
      b = add32(b, rot(next, s[i]));
    }
    a0 = add32(a0, a);
    b0 = add32(b0, b);
    c0 = add32(c0, c);
    d0 = add32(d0, d);
  }

  const hex = (n) => (n >>> 0).toString(16).padStart(8, '0');
  const le = (word) => hex(word).match(/../g).reverse().join('');
  return le(a0) + le(b0) + le(c0) + le(d0);
}

/** Widths upload.wikimedia.org actually serves. Any other `Npx-` name returns HTTP 400. */
export const COMMONS_THUMB_STEPS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];

/** Smallest allowed step that is at least `widthPx`. Null when the original file should be used. */
export function snapCommonsThumbWidth(widthPx) {
  const width = Math.round(Number(widthPx));
  if (!Number.isFinite(width) || width < 1) return null;
  for (const step of COMMONS_THUMB_STEPS) {
    if (step >= width) return step;
  }
  return null;
}

function commonsFileNameFromSrc(src) {
  const raw = String(src || '').trim();
  if (!raw) return '';
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return '';
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== 'commons.wikimedia.org' && !host.endsWith('.commons.wikimedia.org')) return '';
  const title = parsed.searchParams.get('title') || '';
  const fromTitle = title.match(/^Special:Redirect\/file\/(.+)$/i);
  const pathMatch = parsed.pathname.match(/\/wiki\/Special:FilePath\/([^/]+)$/i);
  const encoded = fromTitle?.[1] || pathMatch?.[1] || '';
  if (!encoded) return '';
  let name = encoded;
  try {
    name = decodeURIComponent(encoded);
  } catch {
    name = encoded;
  }
  return name.replace(/ /g, '_');
}

function commonsHashedFileUrl(name, { thumbWidth = null } = {}) {
  const hash = md5(name);
  const encoded = encodeURIComponent(name);
  const prefix = `${hash[0]}/${hash.slice(0, 2)}/${encoded}`;
  if (thumbWidth == null) {
    return `https://upload.wikimedia.org/wikipedia/commons/${prefix}`;
  }
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${prefix}/${thumbWidth}px-${encoded}`;
}

/** Full original file for a Special:FilePath URL, or null when `src` is not one. */
export function commonsOriginalFileUrl(src) {
  const name = commonsFileNameFromSrc(src);
  if (!name) return null;
  return commonsHashedFileUrl(name);
}

export function commonsSpecialFileThumbUrl(src, widthPx = 960) {
  const name = commonsFileNameFromSrc(src);
  if (!name || !Number.isFinite(widthPx) || widthPx < 1) return null;
  const snapped = snapCommonsThumbWidth(widthPx);
  if (snapped == null) return commonsHashedFileUrl(name);
  return commonsHashedFileUrl(name, { thumbWidth: snapped });
}

/** Original file behind a `/thumb/.../Npx-` URL this module built. Null for other srcs. */
export function commonsOriginalFromThumbUrl(src) {
  const raw = String(src || '').trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.hostname.toLowerCase() !== 'upload.wikimedia.org') return null;
  const match = parsed.pathname.match(
    /^\/wikipedia\/commons\/thumb\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)\/\d+px-\3$/i,
  );
  if (!match) return null;
  return `https://upload.wikimedia.org/wikipedia/commons/${match[1]}/${match[2]}/${match[3]}`;
}

/** Dead Commons user page for the Tsushima cover. The file page is the live credit. */
const TSUSHIMA_COVER_FILE_PAGE =
  'https://commons.wikimedia.org/wiki/File:Top-Mount-Shiroyama-and-Aso-Bay-Tsushima.jpg';

export function rewriteLogbookCreditHref(href) {
  const raw = String(href || '').trim();
  if (!raw) return raw;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return raw;
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== 'commons.wikimedia.org') return raw;
  const path = decodeURIComponent(parsed.pathname).replace(/\/+$/, '');
  if (path.toLowerCase() === '/wiki/user:irisgazer') return TSUSHIMA_COVER_FILE_PAGE;
  return raw;
}
