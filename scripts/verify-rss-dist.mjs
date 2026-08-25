#!/usr/bin/env node
/**
 * dist/rss.xml · dist/rss-en.xml must exist after vite public copy.
 *
 *   npm run build  (runs this after vite)
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://www.gateo.kr';

function checkRss(distRel, expectLang) {
  const distPath = join(root, distRel);
  if (!existsSync(distPath)) {
    console.error(`FAIL  ${distRel} missing`);
    process.exit(1);
  }

  const rss = readFileSync(distPath, 'utf8');
  if (!rss.includes(`<language>${expectLang}</language>`)) {
    console.error(`FAIL  ${distRel} wrong language`);
    process.exit(1);
  }

  const itemLinks = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);

  if (itemLinks.length < 50) {
    console.error(`FAIL  ${distRel} expected 50 item links, got ${itemLinks.length}`);
    process.exit(1);
  }

  const galleryOnly = itemLinks.every((href) => href.includes('/gallery'));
  if (!galleryOnly) {
    console.error(`FAIL  ${distRel} item links must use gallery canonical path`);
    process.exit(1);
  }

  console.log(`OK    ${distRel} (${itemLinks.length} gallery links, lang=${expectLang})`);
}

checkRss('dist/rss.xml', 'ko');
checkRss('dist/rss-en.xml', 'en');
