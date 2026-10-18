import { expect } from '@playwright/test';

export const EXTERNAL_RETURN_VIEWPORT = { width: 390, height: 844 };
export const EXTERNAL_RETURN_Z_MIN = 40;
export const EXTERNAL_RETURN_Z_MAX = 59;

export async function externalReturnShot(page, outDir, name) {
  await page.screenshot({
    path: `${outDir}/${name}.png`,
    clip: {
      x: 0,
      y: 0,
      width: EXTERNAL_RETURN_VIEWPORT.width,
      height: EXTERNAL_RETURN_VIEWPORT.height,
    },
  });
}

export async function openFestivalSheet(page, festivalId, openTimeoutMs) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: openTimeoutMs });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
    timeout: openTimeoutMs,
  });
  await expect(dialog.locator('[data-festival-official-home]')).toBeVisible({
    timeout: openTimeoutMs,
  });
  return dialog;
}

export async function dispatchPersistedReturn(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function hitTarget(locator) {
  await locator.scrollIntoViewIfNeeded();
  return locator.evaluate((target) => {
    const rect = target.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return Boolean(hit && (target === hit || target.contains(hit)));
  });
}

async function zBandBlockersOverDialog(dialog) {
  return dialog.evaluate(
    (node, bounds) => {
      const { zMin, zMax } = bounds;
      const rect = node.getBoundingClientRect();
      const probes = [
        [0.5, 0.25],
        [0.5, 0.4],
        [0.5, 0.55],
      ];
      for (const [rx, ry] of probes) {
        const x = rect.left + rect.width * rx;
        const y = rect.top + rect.height * ry;
        const hit = document.elementFromPoint(x, y);
        if (!hit || node.contains(hit)) continue;
        let el = hit;
        while (el && el !== document.body) {
          const style = window.getComputedStyle(el);
          const z = Number.parseInt(style.zIndex, 10);
          const fixed =
            style.position === 'fixed' ||
            style.position === 'sticky' ||
            style.position === 'absolute';
          if (
            fixed &&
            Number.isFinite(z) &&
            z >= zMin &&
            z <= zMax &&
            style.pointerEvents !== 'none' &&
            !el.closest('[role="dialog"]')
          ) {
            return true;
          }
          el = el.parentElement;
        }
      }
      return false;
    },
    { zMin: EXTERNAL_RETURN_Z_MIN, zMax: EXTERNAL_RETURN_Z_MAX },
  );
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} dialog
 * @param {{ homepagePattern?: RegExp, closeSheet?: boolean }} opts
 * @returns {Promise<Array<{ control: string, hit: string, effect: string, note?: string }>>}
 */
export async function probeFestivalSheetControls(page, dialog, opts = {}) {
  const { homepagePattern = /https?:\/\//i, closeSheet = false } = opts;
  const rows = [];

  const push = (control, hit, effect, note = '') => {
    rows.push({
      control,
      hit: hit ? 'PASS' : 'FAIL',
      effect: effect ? 'PASS' : 'FAIL',
      ...(note ? { note } : {}),
    });
  };

  const blockers = await zBandBlockersOverDialog(dialog);
  push('z40–59 투명 히트 차단 없음', !blockers, !blockers, blockers ? 'fixed overlay' : '');

  const infoTab = dialog.getByRole('tab', { name: /^안내$/ });
  const programTab = dialog.getByRole('tab', { name: /프로그램/ });
  const photosTab = dialog.getByRole('tab', { name: /^사진/ });

  let programHit = false;
  try {
    programHit = await hitTarget(programTab);
    if (programHit) await programTab.click();
  } catch {
    programHit = false;
  }
  const programSelected =
    programHit && (await programTab.getAttribute('aria-selected')) === 'true';
  push('탭 · 프로그램', programHit, programSelected);

  const backOverview = dialog.getByRole('button', { name: '안내로 돌아가기' });
  let backHit = false;
  let backOk = false;
  try {
    backHit = await hitTarget(backOverview);
    if (backHit) {
      await backOverview.click();
      backOk = (await infoTab.getAttribute('aria-selected')) === 'true';
    }
  } catch {
    backHit = false;
  }
  push('안내로 돌아가기', backHit, backOk);

  let photosHit = false;
  let photosOk = false;
  if (await photosTab.isVisible().catch(() => false)) {
    try {
      photosHit = await hitTarget(photosTab);
      if (photosHit) {
        await photosTab.click();
        photosOk = (await photosTab.getAttribute('aria-selected')) === 'true';
        if (photosOk) {
          const back2 = dialog.getByRole('button', { name: '안내로 돌아가기' });
          if (await back2.isVisible().catch(() => false)) await back2.click();
        }
      }
    } catch {
      photosHit = false;
    }
    push('탭 · 사진', photosHit, photosOk);
  }

  let scrollHit = false;
  let scrollOk = false;
  let scrollNote = '';
  try {
    const maxScroll = await dialog.evaluate(
      (el) => Math.max(0, el.scrollHeight - el.clientHeight),
    );
    if (maxScroll < 120) {
      scrollHit = true;
      scrollOk = true;
      scrollNote = '스크롤 여유 < 120px — FAB 미노출';
    } else {
      const scrollTopBtn = page.locator('button[aria-label="맨 위로"][class*="z-[45]"]');
      await expect
        .poll(
          async () => {
            await dialog.evaluate((el) => {
              el.scrollTop = el.scrollHeight;
            });
            const cls = (await scrollTopBtn.getAttribute('class')) || '';
            return cls.includes('pointer-events-auto');
          },
          { timeout: 15_000 },
        )
        .toBe(true);
      scrollHit = await hitTarget(scrollTopBtn);
      if (scrollHit) {
        const before = await dialog.evaluate((el) => el.scrollTop);
        await scrollTopBtn.click();
        await expect
          .poll(async () => dialog.evaluate((el) => el.scrollTop))
          .toBeLessThan(before);
        scrollOk = true;
      }
    }
  } catch {
    scrollHit = false;
    scrollOk = false;
  }
  push('맨 위로', scrollHit, scrollOk, scrollNote);

  const official = dialog.locator('[data-festival-official-home]');
  let officialHit = false;
  let officialOk = false;
  try {
    officialHit = await hitTarget(official);
    const href = await official.getAttribute('href');
    officialOk = officialHit && homepagePattern.test(href || '');
  } catch {
    officialHit = false;
  }
  push('공식 홈페이지', officialHit, officialOk);

  const thumb = dialog.locator('[data-festival-hero-thumbs] button').first();
  let thumbHit = false;
  let thumbOk = false;
  try {
    if (await thumb.isVisible({ timeout: 8_000 }).catch(() => false)) {
      thumbHit = await hitTarget(thumb);
      if (thumbHit) {
        await thumb.click();
        const lightboxClose = page.getByRole('button', { name: /^확대보기 닫기$/ });
        const opened = await lightboxClose.isVisible({ timeout: 3_000 }).catch(() => false);
        if (opened) {
          await lightboxClose.click();
          await expect(lightboxClose).toBeHidden({ timeout: 5_000 });
          thumbOk = true;
        } else {
          thumbOk = true;
        }
      }
    }
  } catch {
    thumbHit = false;
  }
  push('히어로 썸네일', thumbHit, thumbOk);

  const lightboxClose = page.getByRole('button', { name: /^확대보기 닫기$/ });
  if (await lightboxClose.isVisible().catch(() => false)) {
    await lightboxClose.click();
  }

  const closeBtn = page.locator('button.z-\\[60\\][aria-label="닫기"]');
  let closeHit = false;
  let closeOk = false;
  try {
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
    closeHit = await hitTarget(closeBtn);
    if (closeHit && closeSheet) {
      await closeBtn.click();
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 8_000 });
      closeOk = true;
    } else if (closeHit) {
      closeOk = true;
    }
  } catch {
    closeHit = false;
    closeOk = false;
  }
  push('닫기 (X)', closeHit, closeSheet ? closeOk : closeHit);

  return rows;
}

/** CI strict assertions (throws on failure). */
export async function assertSheetButtonsInteractive(page, dialog, opts = {}) {
  const rows = await probeFestivalSheetControls(page, dialog, opts);
  for (const row of rows) {
    expect(row.hit, row.control).toBe('PASS');
    expect(row.effect, row.control).toBe('PASS');
  }
}

export function markdownTable(rows) {
  const header = '| 컨트롤 | elementFromPoint | 동작/효과 | 비고 |\n| --- | --- | --- | --- |';
  const body = rows
    .map((r) => `| ${r.control} | ${r.hit} | ${r.effect} | ${r.note || ''} |`)
    .join('\n');
  return `${header}\n${body}`;
}
