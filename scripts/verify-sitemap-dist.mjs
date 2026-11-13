#!/usr/bin/env node
/**
 * dist/sitemap-core.xml must be the generate-sitemap.cjs SSOT (hreflang), not vite-plugin overwrite.
 *
 *   npm run build  (runs this after vite)
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const corePath = join(root, 'dist/sitemap-core.xml');
const indexPath = join(root, 'dist/sitemap.xml');

if (!existsSync(corePath)) {
  console.error('FAIL  dist/sitemap-core.xml missing');
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error('FAIL  dist/sitemap.xml (index) missing');
  process.exit(1);
}

const sitemap = readFileSync(corePath, 'utf8');
const index = readFileSync(indexPath, 'utf8');
const hreflangCount = (sitemap.match(/xhtml:link/g) || []).length;
const urlCount = (sitemap.match(/<url>/g) || []).length;

if (hreflangCount === 0) {
  console.error(
    'FAIL  dist/sitemap-core.xml has no hreflang — vite-plugin-sitemap may have overwritten SSOT',
  );
  process.exit(1);
}

if (!sitemap.includes('explore?lang=en')) {
  console.error('FAIL  dist/sitemap-core.xml missing explore?lang=en hreflang');
  process.exit(1);
}

if (!sitemap.includes('/place/phuket/gallery?lang=en')) {
  console.error('FAIL  dist/sitemap-core.xml missing place tab hreflang');
  process.exit(1);
}

if (!index.includes('<sitemapindex')) {
  console.error('FAIL  dist/sitemap.xml is not a sitemap index');
  process.exit(1);
}

if (!index.includes('/sitemap-core.xml') || !index.includes('/sitemap-blog.xml')) {
  console.error('FAIL  dist/sitemap.xml index missing child sitemap locs');
  process.exit(1);
}

console.log(
  `OK    dist/sitemap-core.xml SSOT (${urlCount} urls, ${hreflangCount} hreflang links, explore+place en); index → blog live`,
);
