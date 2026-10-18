/**
 * Production QA record → docs/qa/pr-external-return/
 * Run (local / Cloud with prod anon, preview :4173):
 *   npm run build && DEV_SSL=0 npm run preview -- --host 127.0.0.1 --port 4173
 *   SMOKE_SITE_URL=http://127.0.0.1:4173/ npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { PROD_EXTERNAL_RETURN_FESTIVALS } from './pr-external-return-prod-config.js';
import {
  dispatchPersistedReturn,
  externalReturnShot,
  markdownTable,
  openFestivalFromHome,
  openNearbyPlaceCard,
  probeFestivalSheetControlsWithShots,
  probeNearbyPlaceControlsWithShots,
  returnFromNearbyOfficialPopup,
  festivalSheetDialog,
} from './festival-external-return-helpers.js';

const OUT = 'docs/qa/pr-external-return';
const BUTTONS = `${OUT}/buttons`;
const OPEN_TIMEOUT_MS = 180_000;
const TEST_TIMEOUT_MS = 420_000;

function prodQaEnabled() {
  if (process.env.MOONI_TOURAPI_STUB_ONLY === '1') return false;
  const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!anon || anon === 'e2e-anon-placeholder') return false;
  return true;
}

/** @type {Record<string, unknown>} */
const record = {};

async function loadRecordFromDisk() {
  try {
    const raw = await readFile(`${OUT}/qa-record.json`, 'utf8');
    const parsed = JSON.parse(raw);
    Object.assign(record, parsed);
  } catch {
    /* fresh */
  }
}

async function persistRecord() {
  await writeFile(`${OUT}/qa-record.json`, JSON.stringify(record, null, 2), 'utf8');
}

test.describe('PR external return — prod QA record WebKit 390', () => {
  test.describe.configure({ timeout: TEST_TIMEOUT_MS, mode: 'serial' });

  test.beforeAll(async () => {
    if (!prodQaEnabled()) return;
    await mkdir(OUT, { recursive: true });
    await mkdir(BUTTONS, { recursive: true });
    await loadRecordFromDisk();
  });

  test.beforeEach(() => {
    test.skip(!prodQaEnabled(), 'prod anon + no MOONI_TOURAPI_STUB_ONLY required');
  });

  for (const festival of PROD_EXTERNAL_RETURN_FESTIVALS) {
    test(`${festival.slug} · home → nearby HTTP → back ×2 → button matrix`, async ({
      page,
      context,
    }) => {
      const dialog = await openFestivalFromHome(page, {
        searchQuery: festival.searchQuery,
        festivalId: festival.id,
        openTimeoutMs: OPEN_TIMEOUT_MS,
      });

      await externalReturnShot(page, OUT, `${festival.slug}-01-festival-sheet`);

      const nearbyModal = await openNearbyPlaceCard(page, dialog, festival.nearby.cardMatch);
      const official = nearbyModal.locator('[data-theme-spot-official-home]');
      await official.scrollIntoViewIfNeeded();
      await externalReturnShot(page, OUT, `${festival.slug}-02-nearby-before-external`);

      if (festival.nearby.homepage.startsWith('http://')) {
        await externalReturnShot(page, OUT, `${festival.slug}-nearby-http-official-row`);
      }

      await returnFromNearbyOfficialPopup(page, context, nearbyModal);
      await externalReturnShot(page, OUT, `${festival.slug}-03-after-back-twice`);

      let nearbyRows = [];
      if (await festivalSheetDialog(page).isVisible().catch(() => false)) {
        try {
          const nearbyAgain = await openNearbyPlaceCard(page, dialog, festival.nearby.cardMatch);
          nearbyRows = await probeNearbyPlaceControlsWithShots(
            page,
            nearbyAgain,
            BUTTONS,
            festival.slug,
            context,
          );
        } catch (err) {
          nearbyRows.push({
            control: 'nearby matrix',
            hit: 'FAIL',
            effect: 'FAIL',
            shot: '',
            note: String(err?.message || err).slice(0, 100),
          });
        }
      } else {
        await page.goto(`/korea/?festival=${festival.id}`, {
          waitUntil: 'networkidle',
          timeout: 180_000,
        });
      }

      await expect(festivalSheetDialog(page)).toBeVisible({ timeout: 60_000 });
      const sheetDialog = festivalSheetDialog(page);
      const sheetRows = await probeFestivalSheetControlsWithShots(
        page,
        sheetDialog,
        BUTTONS,
        festival.slug,
        { homepagePattern: festival.festivalHomeHost || festival.nearby.homepageHost },
        context,
      );

      record[festival.slug] = { nearby: nearbyRows, sheet: sheetRows };
      await persistRecord();
      const rowOk = (r) => r.hit === 'SKIP' || (r.hit === 'PASS' && r.effect === 'PASS');
      const critical = sheetRows.filter((r) =>
        /z40–59|스크림|프로그램|공식 홈페이지/.test(r.control),
      );
      expect(critical.every(rowOk)).toBe(true);
      expect(sheetRows.filter((r) => r.hit !== 'SKIP').length).toBeGreaterThan(4);
    });
  }

  test('Yanggu 해안야생화공원 haean.kr — new tab vs same-tab back (owner 20:13 KST)', async ({
    page,
    context,
  }) => {
    const yanggu = PROD_EXTERNAL_RETURN_FESTIVALS[0];
    const dialog = await openFestivalFromHome(page, {
      searchQuery: yanggu.searchQuery,
      festivalId: yanggu.id,
      openTimeoutMs: OPEN_TIMEOUT_MS,
    });
    const nearbyModal = await openNearbyPlaceCard(page, dialog, yanggu.nearby.cardMatch);
    const official = nearbyModal.locator('[data-theme-spot-official-home]');
    await expect(official).toHaveAttribute('target', '_blank');
    await expect(official).toHaveAttribute('rel', /noopener/);
    await expect(official).toHaveAttribute('href', /haean\.kr/i);
    await externalReturnShot(page, OUT, 'yanggu-haean-official-link-new-tab-attrs');

    const popupPromise = context.waitForEvent('page', { timeout: 30_000 });
    await official.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await externalReturnShot(page, OUT, 'yanggu-haean-official-opens-new-tab-sheet-stays');
    await popup.close();
    await page.bringToFront();
    await dispatchPersistedReturn(page);

    let officialForHref = official;
    if (!(await nearbyModal.isVisible().catch(() => false))) {
      const sheet = festivalSheetDialog(page);
      await expect(sheet).toBeVisible({ timeout: 30_000 });
      const reopened = await openNearbyPlaceCard(page, sheet, yanggu.nearby.cardMatch);
      officialForHref = reopened.locator('[data-theme-spot-official-home]');
    }

    const href = await officialForHref.getAttribute('href');
    expect(href).toBeTruthy();
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await externalReturnShot(page, OUT, 'yanggu-haean-same-tab-http-visit');
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 60_000 });
    await externalReturnShot(page, OUT, 'yanggu-haean-after-back-from-http-warning-path');
    await dispatchPersistedReturn(page);

    const sheet = festivalSheetDialog(page);
    if (!(await sheet.isVisible().catch(() => false))) {
      const reloadPromise = page.waitForEvent('load', { timeout: 45_000 });
      await page.evaluate(() => {
        const root = document.getElementById('root');
        if (root) root.replaceChildren();
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
      });
      await reloadPromise.catch(() => {});
    }
    await expect(festivalSheetDialog(page)).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
    await externalReturnShot(page, OUT, 'yanggu-haean-after-persisted-recovery');

    record['yanggu-haean-owner-repro'] = {
      newTabAttrs: 'yanggu-haean-official-link-new-tab-attrs.png',
      newTabSheet: 'yanggu-haean-official-opens-new-tab-sheet-stays.png',
      sameTabVisit: 'yanggu-haean-same-tab-http-visit.png',
      afterBack: 'yanggu-haean-after-back-from-http-warning-path.png',
      recovery: 'yanggu-haean-after-persisted-recovery.png',
    };
    await persistRecord();
  });

  test('HTTP official notice / label (real data)', async ({ page }) => {
    const yanggu = PROD_EXTERNAL_RETURN_FESTIVALS[0];
    const dialog = await openFestivalFromHome(page, {
      searchQuery: yanggu.searchQuery,
      festivalId: yanggu.id,
      openTimeoutMs: OPEN_TIMEOUT_MS,
    });
    const notice = dialog.locator('[data-festival-official-home-http-notice]');
    if (await notice.isVisible().catch(() => false)) {
      await notice.scrollIntoViewIfNeeded();
      await externalReturnShot(page, OUT, 'http-official-notice-real');
      await expect(notice).toContainText('보안 연결');
    } else {
      const nearbyModal = await openNearbyPlaceCard(page, dialog, yanggu.nearby.cardMatch);
      const official = nearbyModal.locator('[data-theme-spot-official-home]');
      await official.scrollIntoViewIfNeeded();
      await expect(official).toHaveAttribute('href', /^http:\/\//i);
      await externalReturnShot(page, OUT, 'http-official-notice-real');
      await nearbyModal.locator('button[aria-label="닫기"]').first().click();
    }
  });

  test('write README QA record', async () => {
    test.skip(!prodQaEnabled(), 'prod QA only');
    await loadRecordFromDisk();
    const generatedAt = new Date().toISOString().slice(0, 10);
    const sections = PROD_EXTERNAL_RETURN_FESTIVALS.map((f) => {
      const data = record[f.slug] || { nearby: [], sheet: [] };
      const ownerNote = f.ownerE2eId
        ? ` (owner e2e id \`${f.ownerE2eId}\` → prod \`${f.id}\`)`
        : '';
      return `## ${f.region} — ${f.title} (\`${f.id}\`)${ownerNote}

검색: \`${f.searchQuery}\` · 주변: **${f.nearby.title}** · 공식 홈 \`${f.nearby.homepage}\`

경로: 축제 홈 → 검색 카드 → 주변 볼거리 → 공식 홈 → 팝업 닫기 → 명소 닫기

### 주변 명소 상세 — 버튼별 (복귀 후)

${markdownTable(data.nearby)}

### 축제 시트 — 버튼별

${markdownTable(data.sheet)}
`;
    });

    const readme = `# Festival sheet — external link return QA (WebKit 390 · prod anon)

생성일: ${generatedAt} · Playwright \`webkit-external-return-qa-record\` · 뷰포트 390×844

**데이터:** \`npm run build\` + \`vite preview\` (\`http://127.0.0.1:4173\`) · production \`VITE_SUPABASE_*\` · read-only guard · **stub 없음**

**Owner repro:** 축제 홈 → 카드 → 주변 **해안야생화공원** → \`http://haean.kr/…\` → (권장) **새 탭** · iOS 동일 탭 HTTP 경고 → 뒤로 → 흰 화면 시 \`pageshow.persisted\` 1회 reload.

**20:13 KST iPhone Safari:** [\`yanggu-haean-official-link-new-tab-attrs.png\`](./yanggu-haean-official-link-new-tab-attrs.png) · [\`yanggu-haean-official-opens-new-tab-sheet-stays.png\`](./yanggu-haean-official-opens-new-tab-sheet-stays.png) · [\`yanggu-haean-same-tab-http-visit.png\`](./yanggu-haean-same-tab-http-visit.png) · [\`yanggu-haean-after-back-from-http-warning-path.png\`](./yanggu-haean-after-back-from-http-warning-path.png) · [\`yanggu-haean-after-persisted-recovery.png\`](./yanggu-haean-after-persisted-recovery.png)

## 재생성

\`\`\`bash
npm run build
DEV_SSL=0 npm run preview -- --host 127.0.0.1 --port 4173
SMOKE_SITE_URL=http://127.0.0.1:4173/ npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
\`\`\`

CI e2e (fixtures): \`e2e/korea-festival-external-return.spec.js\` · \`MOONI_TOURAPI_STUB_ONLY=1\`

## HTTP 안내 문구

- 축제 요약 \`data-festival-official-home-http-notice\`: rolling12에 HTTP-only 축제 공식 홈이 없으면 [\`http-official-notice-real.png\`](./http-official-notice-real.png)는 **양구 주변 해안야생화공원** 실데이터 HTTP 공식 홈 행.
- 스크린샷: [\`http-official-notice-real.png\`](./http-official-notice-real.png)

## 요약

| 권역 | 축제 ID | 주변 명소 | nearby 버튼 | sheet 버튼 |
| --- | --- | --- | --- | --- |
${PROD_EXTERNAL_RETURN_FESTIVALS.map((f) => {
  const data = record[f.slug];
  const rowOk = (r) => r.hit === 'SKIP' || (r.hit === 'PASS' && r.effect === 'PASS');
  const n =
    (data?.nearby?.length || 0) > 0 && data.nearby.every(rowOk);
  const s = data?.sheet?.every(rowOk);
  return `| ${f.region} | \`${f.id}\` | ${f.nearby.title} | ${n ? '**PASS**' : '—'} | ${s ? '**PASS**' : '—'} |`;
}).join('\n')}

${sections.join('\n')}
`;

    await writeFile(`${OUT}/README.md`, readme, 'utf8');
    await writeFile(`${OUT}/qa-record.json`, JSON.stringify(record, null, 2), 'utf8');
  });
});
