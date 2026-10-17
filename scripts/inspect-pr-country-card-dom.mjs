/**
 * DOM inspection for free-search place cards (390 WebKit).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const OUT_MD = join(process.cwd(), 'docs/qa/pr-country-default/COMPONENT-FINDINGS.md');
const BASE_URL = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173/').replace(/\/?$/, '/');

const CASES = [
  { slug: 'romblon', queries: ['롬블론', 'Romblon'], pick: /롬블론|Romblon/i },
  { slug: 'pamir', queries: ['파미르 고원', '파미르', 'Pamir'], pick: /파미르|Pamir/i },
  {
    slug: 'sao-tome-and-principe',
    queries: ['상투메 프린시페', '상투메', 'Sao Tome'],
    pick: /상투메|프린시페|Sao\s*Tome/i,
  },
  { slug: 'tinian', queries: ['티니안', 'Tinian'], pick: /티니안|Tinian|San\s*Jose/i },
];

async function openAndSelect(page, caseRow) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 60_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  let row = null;
  for (const query of caseRow.queries) {
    await input.fill(query);
    const candidate = page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ hasText: caseRow.pick })
      .first();
    try {
      await candidate.waitFor({ state: 'visible', timeout: 12_000 });
      row = candidate;
      break;
    } catch {
      // next query
    }
  }
  if (!row) throw new Error(`no row for ${caseRow.slug}`);
  await row.click();
  await page.waitForTimeout(1500);
}

async function inspectDom(page) {
  return page.evaluate(() => {
    const summary = document.querySelector('.place-summary-card');
    const summaryChrome = document.querySelector('[data-summary-chrome]');
    const expanded = document.querySelector('[data-place-chrome-hit]');
    const youtubeTab = [...document.querySelectorAll('button, a, [role="tab"]')].find((el) =>
      /유튜브\s*영상|YouTube/i.test(el.textContent || ''),
    );
    const searchPopover = document.querySelector('[data-search-popover]');
    return {
      hasPlaceSummaryCard: Boolean(summary),
      hasDataSummaryChrome: Boolean(summaryChrome),
      hasPlaceCardExpandedChrome: Boolean(expanded),
      hasYoutubeSecondaryTab: Boolean(youtubeTab),
      summaryClassSample: summary?.className?.slice(0, 120) || null,
      visiblePlaceName: summaryChrome?.textContent?.trim()?.slice(0, 80) || null,
      countryLine: document.querySelector('.place-summary-card .text-blue-300')?.textContent?.trim() || null,
      searchPopoverAttr: searchPopover?.getAttribute('data-search-popover') ?? (searchPopover ? 'present' : null),
      routePath: window.location.pathname,
    };
  });
}

async function main() {
  await mkdir(join(process.cwd(), 'docs/qa/pr-country-default'), { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const rows = [];

  for (const c of CASES) {
    await openAndSelect(page, c);
    const dom = await inspectDom(page);
    rows.push({ slug: c.slug, queries: c.queries, ...dom });
  }
  await browser.close();

  const lines = [
    '# Free-search / globe-label simple card — component findings',
    '',
    `Captured against \`${BASE_URL}\` (390px WebKit).`,
    '',
    '## Summary',
    '',
    'Overseas free-search / explore picks open the **home overlay** (`HomePlaceCardSummary` → `PlaceCardSummary`), not the `/place/:slug` route shell.',
    '',
    '- **Component path**: `src/pages/Home/components/HomePlaceCardSummary.jsx` renders `src/components/PlaceCard/modes/PlaceCardSummary.jsx`.',
    '- **DOM hooks**: `.place-summary-card`, `[data-summary-chrome]` on the summary chrome row.',
    '- **`PlaceCardExpanded` / `PlaceMobileSecondaryNav`**: **not mounted** on this path (no `유튜브 영상` secondary tab). Those appear on `/place/...` via `src/components/PlaceCard/index.jsx` → `PlaceCardExpanded` → `PlaceMediaPanel` / `PlaceChatPanel`.',
    '- **Search popover**: `SearchSuggestionList` inside explore UI; list rows live under `[data-search-popover]`.',
    '',
    '## Per-place DOM snapshot',
    '',
    '| slug | route | summary card | data-summary-chrome | PlaceCardExpanded chrome | 유튜브 영상 tab | country line |',
    '|------|-------|--------------|---------------------|--------------------------|-----------------|--------------|',
  ];

  for (const r of rows) {
    lines.push(
      `| ${r.slug} | ${r.routePath} | ${r.hasPlaceSummaryCard} | ${r.hasDataSummaryChrome} | ${r.hasPlaceCardExpandedChrome} | ${r.hasYoutubeSecondaryTab} | ${r.countryLine || '—'} |`,
    );
  }

  lines.push('', '## Raw JSON', '', '```json', JSON.stringify(rows, null, 2), '```', '');
  await writeFile(OUT_MD, lines.join('\n'), 'utf8');
  console.log(`wrote ${OUT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
