/**
 * QA record for docs/qa/pr-external-return/ (3 regions × popup + goBack).
 * Run: SMOKE_SITE_URL=https://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import {
  EXTERNAL_RETURN_FESTIVALS,
  installFestivalExternalReturnFixtures,
} from './festival-external-return-fixture.js';
import {
  dispatchPersistedReturn,
  externalReturnShot,
  markdownTable,
  openFestivalSheet,
  probeFestivalSheetControls,
} from './festival-external-return-helpers.js';

const OUT = 'docs/qa/pr-external-return';
const OPEN_TIMEOUT_MS = 120_000;
const TEST_TIMEOUT_MS = 600_000;

/** @type {Record<string, { popup: unknown[], goBack: unknown[] }>} */
const record = {};

function homepagePatternFor(homepage) {
  try {
    const host = new URL(homepage).hostname.replace(/\./g, '\\.');
    return new RegExp(host, 'i');
  } catch {
    return /https?:\/\//i;
  }
}

test.describe('PR external return — QA record WebKit 390', () => {
  test.describe.configure({ timeout: TEST_TIMEOUT_MS, mode: 'serial' });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context, page }) => {
    await installFestivalExternalReturnFixtures(context);
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
  });

  for (const festival of EXTERNAL_RETURN_FESTIVALS) {
    const homepagePattern = homepagePatternFor(festival.homepage);

    test(`${festival.slug} · popup close`, async ({ page, context }) => {
      const dialog = await openFestivalSheet(page, festival.id, OPEN_TIMEOUT_MS);
      if (festival.homepage.startsWith('http://')) {
        await expect(dialog.locator('[data-festival-official-home-http-notice]')).toBeVisible();
        await externalReturnShot(page, OUT, `${festival.slug}-http-label`);
      }

      const official = dialog.locator('[data-festival-official-home]');
      const popupPromise = context.waitForEvent('page');
      await official.click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      await popup.close();
      await page.bringToFront();
      await dispatchPersistedReturn(page);

      await externalReturnShot(page, OUT, `${festival.slug}-popup-after-return`);
      const rows = await probeFestivalSheetControls(page, dialog, {
        homepagePattern,
        closeSheet: false,
      });
      record[festival.slug] = record[festival.slug] || { popup: [], goBack: [] };
      record[festival.slug].popup = rows;
    });

    test(`${festival.slug} · goBack`, async ({ page, context }) => {
      const dialog = await openFestivalSheet(page, festival.id, OPEN_TIMEOUT_MS);
      const official = dialog.locator('[data-festival-official-home]');
      const popupPromise = context.waitForEvent('page');
      await official.click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      await popup.close();
      await page.bringToFront();

      await page.evaluate(() => {
        window.location.assign('https://example.com/');
      });
      await page.waitForURL(/example\.com/i, { timeout: 15_000 });
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
      const dialogAfter = page.getByRole('dialog');
      await dispatchPersistedReturn(page);

      await externalReturnShot(page, OUT, `${festival.slug}-goback-after-return`);
      const rows = await probeFestivalSheetControls(page, dialogAfter, {
        homepagePattern,
        closeSheet: false,
      });
      record[festival.slug] = record[festival.slug] || { popup: [], goBack: [] };
      record[festival.slug].goBack = rows;
    });
  }

  test('write README QA record', async () => {
    const generatedAt = new Date().toISOString().slice(0, 10);
    const sections = EXTERNAL_RETURN_FESTIVALS.map((f) => {
      const data = record[f.slug] || { popup: [], goBack: [] };
      return `## ${f.region} — ${f.title} (\`${f.id}\`)

공식 홈: \`${f.homepage}\`

### 복귀 경로 A — 공식 홈 팝업 닫기

스크린샷: [\`${f.slug}-popup-after-return.png\`](./${f.slug}-popup-after-return.png)

${markdownTable(data.popup)}

### 복귀 경로 B — 공식 홈 팝업 닫기 → example.com → \`goBack()\`

스크린샷: [\`${f.slug}-goback-after-return.png\`](./${f.slug}-goback-after-return.png)

${markdownTable(data.goBack)}
`;
    });

    const yangguLabel = EXTERNAL_RETURN_FESTIVALS[0].homepage.startsWith('http://')
      ? `\nHTTP 라벨 스크린샷: [\`yanggu-http-http-label.png\`](./yanggu-http-http-label.png) · [\`http-official-label.png\`](./http-official-label.png)\n`
      : '';

    const readme = `# Festival sheet — external link return QA (WebKit 390)

생성일: ${generatedAt} · Playwright \`webkit-external-return-qa-record\` · 뷰포트 390×844

권역 3건(양구 HTTP 공식 홈, 강릉, 마산)에서 **시트 열기 → 공식 홈페이지 → 복귀** 후 시트 컨트롤별 **elementFromPoint(hit)** · **클릭 효과**를 표로 기록합니다.

${yangguLabel}

## 재현

\`\`\`bash
npm run build
npx vite --host 127.0.0.1 --port 5173 --strictPort &
SMOKE_SITE_URL=https://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
SMOKE_SITE_URL=https://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/korea-festival-external-return.spec.js --project=webkit-festival-external-return
\`\`\`

## 요약 (3권역 × 2복귀경로)

| 권역 | 축제 ID | popup 닫기 | goBack 경로 |
| --- | --- | --- | --- |
${EXTERNAL_RETURN_FESTIVALS.map((f) => {
  const p = record[f.slug]?.popup?.every((r) => r.hit === 'PASS' && r.effect === 'PASS');
  const g = record[f.slug]?.goBack?.every((r) => r.hit === 'PASS' && r.effect === 'PASS');
  return `| ${f.region} | \`${f.id}\` | ${p ? '**PASS**' : 'FAIL'} | ${g ? '**PASS**' : 'FAIL'} |`;
}).join('\n')}

${sections.join('\n')}
`;

    await writeFile(`${OUT}/README.md`, readme, 'utf8');
    await writeFile(`${OUT}/qa-record.json`, JSON.stringify(record, null, 2), 'utf8');

    const allPass = EXTERNAL_RETURN_FESTIVALS.every((f) => {
      const data = record[f.slug];
      if (!data) return false;
      return [...data.popup, ...data.goBack].every(
        (r) => r.hit === 'PASS' && r.effect === 'PASS',
      );
    });
    expect(allPass).toBe(true);
  });
});
