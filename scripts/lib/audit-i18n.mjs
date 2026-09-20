import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HANGUL = /[\uAC00-\uD7AF]/;
const USE_TRANSLATION = /\buseTranslation\b/;
const T_CALL = /\bt\s*\(\s*['"`]/;
const STRING_LITERAL = /(['"`])((?:\\.|(?!\1)[\s\S])*?\1)/g;

const SKIP_LINE =
  /^\s*(\*|\/\/|import\s|export\s.*from\s|\/\*|\*\/)|labelEn\s*:|name_en\s*:|country_en\s*:|overview_en\s*:|console\.(log|warn|error)/;

const SKIP_LITERAL =
  /^(ko-KR|ko_KR|KorService2|EngService2|gateo\.locale|lang=ko|lang="ko"|lang='ko')$/;

/**
 * @param {unknown} obj
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function flattenLocaleKeys(obj, prefix = '') {
  const keys = [];
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) return keys;
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenLocaleKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

/**
 * @param {string} root
 */
export function loadLocaleKeySets(root) {
  const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
  const koKeys = new Set(flattenLocaleKeys(ko));
  const enKeys = new Set(flattenLocaleKeys(en));
  const missingInEn = [...koKeys].filter((k) => !enKeys.has(k)).sort();
  const missingInKo = [...enKeys].filter((k) => !koKeys.has(k)).sort();
  return { koKeys, enKeys, missingInEn, missingInKo };
}

/**
 * @param {string} line
 */
function extractHangulLiterals(line) {
  if (SKIP_LINE.test(line) || T_CALL.test(line)) return [];
  const hits = [];
  for (const match of line.matchAll(STRING_LITERAL)) {
    const value = match[2];
    if (!HANGUL.test(value)) continue;
    if (SKIP_LITERAL.test(value.trim())) continue;
    hits.push(value.length > 48 ? `${value.slice(0, 45)}…` : value);
  }
  if (!T_CALL.test(line) && />[^<{]*[\uAC00-\uD7AF][^<{]*</.test(line)) {
    const text = line.match(/>([^<{]*[\uAC00-\uD7AF][^<{]*)</)?.[1]?.trim();
    if (text) hits.push(text.length > 48 ? `${text.slice(0, 45)}…` : text);
  }
  return hits;
}

/**
 * @param {string} root
 * @param {string} relPath
 */
export function scanFileForHangul(root, relPath) {
  const abs = join(root, relPath);
  if (!existsSync(abs)) {
    return { missing: true, usesTranslation: false, hangulLiterals: 0, lines: [], samples: [] };
  }
  const src = readFileSync(abs, 'utf8');
  const usesTranslation = USE_TRANSLATION.test(src);
  const lines = [];
  const samples = [];
  src.split('\n').forEach((line, idx) => {
    const hits = extractHangulLiterals(line);
    if (!hits.length) return;
    lines.push(idx + 1);
    for (const h of hits) {
      if (samples.length < 5) samples.push({ line: idx + 1, text: h });
    }
  });
  return {
    missing: false,
    usesTranslation,
    hangulLiterals: lines.length,
    lines,
    samples,
  };
}

/**
 * @param {string} root
 * @param {Array<{ tier: string, path: string, note?: string }>} entries
 */
export function auditP0Files(root, entries) {
  return entries.map(({ tier, path, note }) => {
    const scan = scanFileForHangul(root, path);
    return {
      tier,
      path,
      note,
      ...scan,
    };
  });
}

/**
 * @param {string} root
 * @param {Array<{ tier: string, path: string, note?: string }>} entries
 */
export function runI18nAudit(root, entries) {
  const localeKeys = loadLocaleKeySets(root);
  const files = auditP0Files(root, entries);
  const missingFiles = files.filter((f) => f.missing);
  const withHangul = files.filter((f) => !f.missing && f.hangulLiterals > 0);
  const tierTotals = {};
  for (const f of files) {
    tierTotals[f.tier] = tierTotals[f.tier] || { files: 0, hangulLines: 0 };
    tierTotals[f.tier].files += 1;
    tierTotals[f.tier].hangulLines += f.hangulLiterals;
  }
  return {
    generatedAt: new Date().toISOString(),
    localeKeys: {
      ko: localeKeys.koKeys.size,
      en: localeKeys.enKeys.size,
      missingInEn: localeKeys.missingInEn,
      missingInKo: localeKeys.missingInKo,
    },
    p0: {
      fileCount: files.length,
      missingFiles: missingFiles.map((f) => f.path),
      hangulLineTotal: withHangul.reduce((n, f) => n + f.hangulLiterals, 0),
      filesWithHangul: withHangul.length,
      tierTotals,
      files,
    },
  };
}
