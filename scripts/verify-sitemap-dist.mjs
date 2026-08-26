#!/usr/bin/env node
/**
 * dist/sitemap.xml must be the generate-sitemap.cjs SSOT (hreflang), not vite-plugin overwrite.
 *
 *   npm run build  (runs this after vite)
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distPath = join(root, 'dist/sitemap.xml');

if (!existsSync(distPath)) {
  console.error('FAIL  dist/sitemap.xml missing');
  process.exit(1);
}

const sitemap = readFileSync(distPath, 'utf8');
const hreflangCount = (sitemap.match(/xhtml:link/g) || []).length;
const urlCount = (sitemap.match(/<url>/g) || []).length;

if (hreflangCount === 0) {
  console.error(
    'FAIL  dist/sitemap.xml has no hreflang — vite-plugin-sitemap may have overwritten SSOT',
  );
  process.exit(1);
}

if (!sitemap.includes('explore?lang=en')) {
  console.error('FAIL  dist/sitemap.xml missing explore?lang=en hreflang');
  process.exit(1);
}

if (!sitemap.includes('/place/phuket/gallery?lang=en')) {
  console.error('FAIL  dist/sitemap.xml missing place tab hreflang');
  process.exit(1);
}

console.log(
  `OK    dist/sitemap.xml SSOT (${urlCount} urls, ${hreflangCount} hreflang links, explore+place en)`,
);
