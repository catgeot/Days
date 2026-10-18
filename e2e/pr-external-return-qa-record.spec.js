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
  openNearbyPlaceCard,
  probeFestivalSheetControls,
  returnFromNearbyOfficialPopup,
  returnFromNearbyOfficialSameTab,
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
    const nearbyPattern = homepagePatternFor(festival.nearby.homepage);

    test(`${festival.slug} · nearby popup close`, async ({ page, context }) => {
      const dialog = await openFestivalSheet(page, festival.id, OPEN_TIMEOUT_MS);
      const nearbyModal = await openNearbyPlaceCard(page, dialog, festival.nearby.cardMatch);
      if (festival.nearby.homepage.startsWith('http://')) {
        await externalReturnShot(page, OUT, `${festival.slug}-nearby-http-label`);
      }

      await returnFromNearbyOfficialPopup(page, context, nearbyModal);
      await externalReturnShot(page, OUT, `${festival.slug}-popup-after-return`);

      const rows = await probeFestivalSheetControls(page, dialog, {
        homepagePattern: /haean\.kr|gangneung|masan|e2e-static/i,
        closeSheet: false,
      });
      record[festival.slug] = record[festival.slug] || { popup: [], goBack: [] };
      record[festival.slug].popup = rows;
      expect(rows.every((r) => r.hit === 'PASS' && r.effect === 'PASS')).toBe(true);
    });

    test(`${festival.slug} · nearby same-tab goBack`, async ({ page }) => {
      const dialog = await openFestivalSheet(page, festival.id, OPEN_TIMEOUT_MS);
      const nearbyModal = await openNearbyPlaceCard(page, dialog, festival.nearby.cardMatch);
      await returnFromNearbyOfficialSameTab(page, nearbyModal);
      await dispatchPersistedReturn(page);

      await externalReturnShot(page, OUT, `${festival.slug}-goback-after-return`);
      const rows = await probeFestivalSheetControls(page, dialog, {
        homepagePattern: /haean\.kr|gangneung|masan|e2e-static/i,
        closeSheet: false,
      });
      record[festival.slug] = record[festival.slug] || { popup: [], goBack: [] };
      record[festival.slug].goBack = rows;
      expect(rows.every((r) => r.hit === 'PASS' && r.effect === 'PASS')).toBe(true);
    });
  }

  test('write README QA record', async () => {
    const generatedAt = new Date().toISOString().slice(0, 10);
    const sections = EXTERNAL_RETURN_FESTIVALS.map((f) => {
      const data = record[f.slug] || { popup: [], goBack: [] };
      return `## ${f.region} — ${f.title} (\`${f.id}\`)

주변 명소: **${f.nearby.title}** (\`${f.nearby.contentId}\`) · 공식 홈 \`${f.nearby.homepage}\`

### 복귀 경로 A — 주변 명소 상세 → 공식 홈 팝업 닫기 → 뒤로(시트)

스크린샷: [\`${f.slug}-popup-after-return.png\`](./${f.slug}-popup-after-return.png)

${markdownTable(data.popup)}

### 복귀 경로 B — 주변 명소 상세 → 공식 홈 동일 탭 \`goBack\` + \`pageshow\` persisted

스크린샷: [\`${f.slug}-goback-after-return.png\`](./${f.slug}-goback-after-return.png)

${markdownTable(data.goBack)}
`;
    });

    const yangguLabel = EXTERNAL_RETURN_FESTIVALS[0].nearby.homepage.startsWith('http://')
      ? `\n양구 주변 HTTP 라벨: [\`yanggu-http-nearby-http-label.png\`](./yanggu-http-nearby-http-label.png) · 축제 요약 HTTP: [\`http-official-label.png\`](./http-official-label.png)\n`
      : '';

    const readme = `# Festival sheet — external link return QA (WebKit 390)

생성일: ${generatedAt} · Playwright \`webkit-external-return-qa-record\` · 뷰포트 390×844

**Owner repro (Safari 탭):** 축제 시트 → **주변 볼거리 카드** → 중첩 명소 상세 → **공식 홈(HTTP)** → 비보안 경고 → 뒤로 → 뒤로 → 축제 시트 버튼 dead-tap.

권역 3건에서 위 경로 후 시트 컨트롤별 **elementFromPoint(hit)** · **클릭 효과**를 표로 기록합니다.

## 근본 원인 (수정)

중첩 \`ThemeSpotDetailModal\`(\`z-[55]\`)도 축제 시트와 같이 **전체 화면 flex 오버레이 + backdrop-blur**가 히트를 가로채 Safari bfcache 복귀 후 명소·시트 버튼이 dead-tap. Mooni FAB는 모달 내부 \`fixed\`로 상대적으로 살아남. \`document.body.style.overflow = hidden\` 이 cleanup 없이 남는 경우도 방어.

| | 파일·위치 |
| --- | --- |
| **중첩 모달 (주 원인)** | \`src/pages/KoreaTheme/ThemeSpotDetailModal.jsx\` — L47–51 스크림 상수, L1810–1825 \`data-theme-spot-modal-scrim\` + \`pointer-events-none\` 래퍼 |
| **축제 시트** | \`FestivalDetailSheet.jsx\` L148–151, L1930–1947 |
| **방어 훅** | \`useFestivalSheetInteractionRestore.js\` + \`lib/festivalSheetInteractionRestore.js\` (sessionStorage는 \`FestivalDetailSheet\` → 중첩 모달 공식 홈 클릭 시 \`markFestivalSheetExternalReturn\`) |

## Safari 주소창이 안 보이는 이유

축제 시트·중첩 명소 모달 모두 **body 스크롤 없이** 내부 스크롤 컨테이너만 사용 → iOS Safari URL bar 축소/숨김.

${yangguLabel}

## 재현

\`\`\`bash
npm run build
npx vite --host 127.0.0.1 --port 5173 --strictPort &
SMOKE_SITE_URL=http://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/pr-external-return-qa-record.spec.js --project=webkit-external-return-qa-record
SMOKE_SITE_URL=http://127.0.0.1:5173 MOONI_TOURAPI_STUB_ONLY=1 npx playwright test e2e/korea-festival-external-return.spec.js --project=webkit-festival-external-return
\`\`\`

## 요약 (3권역 × 2복귀경로 · 주변 명소 공식 홈)

| 권역 | 축제 ID | 주변 명소 | popup 닫기 | same-tab goBack |
| --- | --- | --- | --- | --- |
${EXTERNAL_RETURN_FESTIVALS.map((f) => {
  const p = record[f.slug]?.popup?.every((r) => r.hit === 'PASS' && r.effect === 'PASS');
  const g = record[f.slug]?.goBack?.every((r) => r.hit === 'PASS' && r.effect === 'PASS');
  return `| ${f.region} | \`${f.id}\` | ${f.nearby.title} | ${p ? '**PASS**' : 'FAIL'} | ${g ? '**PASS**' : 'FAIL'} |`;
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
