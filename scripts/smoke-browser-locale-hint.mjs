#!/usr/bin/env node
/**
 * 브라우저 언어 locale 추론 (#23). 네트워크 없음.
 * Usage: node scripts/smoke-browser-locale-hint.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const { inferLocaleFromBrowserLanguages, resolveInitialLocale } = await import(
  pathToFileURL(join(root, 'src/i18n/browserLocaleHint.js')).href
);

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

assert(inferLocaleFromBrowserLanguages(['en-US', 'en']) === 'en', 'en browser → en');
assert(inferLocaleFromBrowserLanguages(['ja-JP', 'en']) === 'en', 'ja browser → en');
assert(inferLocaleFromBrowserLanguages(['ko-KR', 'en-US']) === 'ko', 'ko primary → ko');
assert(inferLocaleFromBrowserLanguages(['en-US', 'ko-KR']) === 'ko', 'ko in list → ko');
assert(inferLocaleFromBrowserLanguages([]) === 'ko', 'empty → default ko');

assert(
  resolveInitialLocale({ urlLang: 'en', storedLocale: 'ko', languages: ['ko-KR'] }) === 'en',
  'url lang wins',
);
assert(
  resolveInitialLocale({ storedLocale: 'ko', languages: ['en-US'] }) === 'ko',
  'stored locale wins over browser',
);
assert(
  resolveInitialLocale({ languages: ['en-GB'] }) === 'en',
  'no url/storage → browser en',
);
assert(
  resolveInitialLocale({ languages: ['ko-KR'] }) === 'ko',
  'no url/storage → browser ko',
);

console.log('smoke-browser-locale-hint: PASS');
