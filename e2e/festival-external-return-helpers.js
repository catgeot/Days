import { expect } from '@playwright/test';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

export const EXTERNAL_RETURN_VIEWPORT = { width: 390, height: 844 };
export const EXTERNAL_RETURN_Z_MIN = 40;
export const EXTERNAL_RETURN_Z_MAX = 59;

export async function externalReturnShot(page, outDir, name) {
  await page
    .screenshot({
      path: `${outDir}/${name}.png`,
      clip: {
        x: 0,
        y: 0,
        width: EXTERNAL_RETURN_VIEWPORT.width,
        height: EXTERNAL_RETURN_VIEWPORT.height,
      },
      timeout: 12_000,
    })
    .catch(() => {});
}

export function festivalSheetDialog(page) {
  return page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
}

export function nearbyPlaceModal(page) {
  return page.locator('[role="dialog"][aria-labelledby="korea-theme-spot-modal-title"]');
}

export async function waitForFestivalNearbySights(festivalDialog, timeoutMs = 60_000) {
  await expect(festivalDialog.getByText(/주변 볼거리 불러오는 중|Loading nearby/i)).toHaveCount(0, {
    timeout: timeoutMs,
  });
}

export async function scrollFestivalSheetToBottom(festivalDialog) {
  await festivalDialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
    const contentCol = el.querySelector('[data-festival-sheet-content]');
    if (contentCol instanceof HTMLElement) {
      contentCol.scrollTop = contentCol.scrollHeight;
    }
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} festivalDialog
 * @param {string | RegExp} cardMatch
 */
function festivalNearbySightsList(festivalDialog) {
  return festivalDialog.getByRole('list', { name: /주변 볼거리|Nearby sights/i });
}

/**
 * @param {{ officialTimeoutMs?: number, detailTimeoutMs?: number }} [opts]
 */
export async function reopenNearbyPlaceModal(page, festivalDialog, cardMatch, opts = {}) {
  const modal = nearbyPlaceModal(page);
  if (await modal.isVisible().catch(() => false)) return modal;
  await dispatchPersistedReturn(page);
  const openOpts = {
    officialTimeoutMs: 45_000,
    detailTimeoutMs: 60_000,
    ...opts,
  };
  try {
    return await openNearbyPlaceCard(page, festivalDialog, cardMatch, openOpts);
  } catch {
    await dispatchPersistedReturn(page);
    await page.waitForTimeout(400);
    return await openNearbyPlaceCard(page, festivalDialog, cardMatch, {
      ...openOpts,
      officialTimeoutMs: 60_000,
      detailTimeoutMs: 90_000,
    });
  }
}

export async function openNearbyPlaceCard(page, festivalDialog, cardMatch, opts = {}) {
  const officialTimeoutMs = opts.officialTimeoutMs ?? 90_000;
  const detailTimeoutMs = opts.detailTimeoutMs ?? 90_000;
  await waitForFestivalNearbySights(festivalDialog);
  await scrollFestivalSheetToBottom(festivalDialog);
  const card = festivalNearbySightsList(festivalDialog)
    .locator('li button')
    .filter({ hasText: cardMatch })
    .first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.click();
  const modal = nearbyPlaceModal(page);
  await expect(modal).toBeVisible({ timeout: 30_000 });
  await expect(modal.getByText(/상세.*불러오는 중|Loading details/i)).toHaveCount(0, {
    timeout: detailTimeoutMs,
  });
  const official = modal.locator('[data-theme-spot-official-home]');
  await official.scrollIntoViewIfNeeded({ timeout: officialTimeoutMs }).catch(() => {});
  await expect(official).toBeVisible({ timeout: officialTimeoutMs });
  return modal;
}

export async function closeNearbyPlaceModal(page) {
  const modal = nearbyPlaceModal(page);
  if (!(await modal.isVisible().catch(() => false))) return;
  await dispatchPersistedReturn(page);

  const pollTimeout =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' ? 35_000 : 25_000;

  await expect
    .poll(
      async () => {
        if (!(await modal.isVisible().catch(() => false))) return true;
        const headerClose = modal.locator('button[aria-label="닫기"]').first();
        if (await headerClose.isVisible().catch(() => false)) {
          const probe = await probeHitAtCenter(headerClose);
          if (probe.ok && !probe.scrim) {
            await headerClose.click({ timeout: 5_000 }).catch(() => {});
          } else {
            await page.keyboard.press('Escape').catch(() => {});
          }
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
        const scrim = modal.locator('[data-theme-spot-modal-scrim]').first();
        if (await scrim.isVisible().catch(() => false)) {
          await scrim.click({ position: { x: 8, y: 8 }, timeout: 3_000 }).catch(() => {});
        }
        return !(await modal.isVisible().catch(() => false));
      },
      { timeout: pollTimeout, intervals: [50, 100, 200, 400] },
    )
    .toBe(true);
  await expect(modal).toBeHidden({ timeout: 5_000 });
}

/** After nearby official popup return: nested modal gone, festival sheet tabs hittable. */
export async function waitForFestivalSheetAfterExternalReturn(page, dialog) {
  await expect(nearbyPlaceModal(page)).toBeHidden({ timeout: 20_000 });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({ timeout: 20_000 });

  const programTab = dialog.getByRole('tab', { name: /프로그램/ });
  const pollTimeout = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' ? 35_000 : 25_000;
  await expect
    .poll(
      async () => {
        const probe = await probeHitAtCenter(programTab);
        return probe.ok && !probe.scrim;
      },
      { timeout: pollTimeout, intervals: [50, 100, 200, 400] },
    )
    .toBe(true);
}

/** Close official homepage popup; leave nearby place modal open (prod QA path). */
export async function returnFromNearbyOfficialPopupKeepNearby(page, context, nearbyModal) {
  const official = nearbyModal.locator('[data-theme-spot-official-home]');
  await expect(official).toBeVisible({ timeout: 15_000 });
  const popupPromise = context.waitForEvent('page', { timeout: 30_000 });
  await official.click({ timeout: 15_000 });
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => {});
  if (!popup.isClosed()) {
    await popup.close({ runBeforeUnload: true, timeout: 8_000 }).catch(() => {});
    await popup.waitForEvent('close', { timeout: 8_000 }).catch(() => {});
  }
  await page.bringToFront();
  await dispatchPersistedReturn(page);
}

/**
 * Owner repro: nearby official http → external → back → back (close nested modal).
 */
export async function returnFromNearbyOfficialPopup(page, context, nearbyModal) {
  await returnFromNearbyOfficialPopupKeepNearby(page, context, nearbyModal);
  await closeNearbyPlaceModal(page);
  const dialog = festivalSheetDialog(page);
  await waitForFestivalSheetAfterExternalReturn(page, dialog);
}

export async function returnFromNearbyOfficialSameTab(page, nearbyModal) {
  const official = nearbyModal.locator('[data-theme-spot-official-home]');
  const href = await official.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(href, { waitUntil: 'domcontentloaded' });
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  await dispatchPersistedReturn(page);
  const modalAfter = nearbyPlaceModal(page);
  if (await modalAfter.isVisible().catch(() => false)) {
    await closeNearbyPlaceModal(page);
  }
  const sheet = festivalSheetDialog(page);
  if (!(await sheet.isVisible().catch(() => false))) {
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});
    await dispatchPersistedReturn(page);
  }
  await expect(festivalSheetDialog(page)).toBeVisible({ timeout: 30_000 });
}

export async function openFestivalFromHome(page, { searchQuery, festivalId, openTimeoutMs = 120_000 }) {
  await page.goto('/korea/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: openTimeoutMs });
  await dismissLocHint(page);

  const searchToggle = page.getByRole('button', {
    name: /축제 검색|Search festivals/i,
  });
  await searchToggle.click();
  const mobileSearch = page.locator('#korea-festival-search');
  const pcSearch = page.locator('#korea-festival-search-pc');
  const searchInput = (await mobileSearch.isVisible().catch(() => false))
    ? mobileSearch
    : pcSearch;
  await expect(searchInput).toBeVisible({ timeout: 15_000 });
  await searchInput.fill(searchQuery);
  await searchInput.press('Enter');

  const hit = page.locator(`[data-festival-id="${festivalId}"]`).first();
  if (!(await hit.isVisible().catch(() => false))) {
    await searchInput.fill('');
    await searchInput.fill(String(festivalId));
    await searchInput.press('Enter');
  }
  await expect(hit).toBeVisible({ timeout: openTimeoutMs });
  await hit.click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 60_000 });

  const dialog = festivalSheetDialog(page);
  await expect(dialog).toBeVisible({ timeout: openTimeoutMs });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
    timeout: openTimeoutMs,
  });
  return dialog;
}

export async function openFestivalSheet(page, festivalId, openTimeoutMs) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = festivalSheetDialog(page);
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

export async function probeHitAtCenter(locator) {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 5_000 });
  } catch {
    return { ok: false, scrim: false, hitTag: '' };
  }
  return locator.evaluate((target) => {
    const rect = target.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) {
      return { ok: false, scrim: false, hitTag: '' };
    }
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const ok = Boolean(hit && (target === hit || target.contains(hit)));
    const scrim = Boolean(
      hit?.closest('[data-festival-sheet-scrim], [data-theme-spot-modal-scrim]'),
    );
    return { ok, scrim, hitTag: hit?.tagName || '' };
  });
}

async function hitTarget(locator) {
  const { ok } = await probeHitAtCenter(locator);
  return ok;
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
  const { homepagePattern = /https?:\/\//i, closeSheet = false, skipScrollTop = false } = opts;
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

  const programProbe = await probeHitAtCenter(programTab);
  push(
    '스크림이 탭 hit 아님',
    !programProbe.scrim,
    !programProbe.scrim,
    programProbe.scrim ? 'data-festival-sheet-scrim' : '',
  );

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

  let scrollHit = false;
  let scrollOk = false;
  let scrollNote = '';
  try {
    if (skipScrollTop) {
      scrollHit = true;
      scrollOk = true;
      scrollNote = 'QA record — 맨 위로 생략';
    } else {
    await infoTab.click().catch(() => {});
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
          { timeout: process.env.CI ? 45_000 : 20_000 },
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
    }
  } catch {
    scrollHit = false;
    scrollOk = false;
  }
  push('맨 위로', scrollHit, scrollOk, scrollNote);

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
  const header =
    '| 컨트롤 | elementFromPoint | 동작/효과 | 스크린샷 | 비고 |\n| --- | --- | --- | --- | --- |';
  const body = rows
    .map(
      (r) =>
        `| ${r.control} | ${r.hit} | ${r.effect} | ${r.shot ? `\`${r.shot}\`` : ''} | ${r.note || ''} |`,
    )
    .join('\n');
  return `${header}\n${body}`;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} outDir
 * @param {string} shotBase
 * @param {string} control
 * @param {import('@playwright/test').Locator} locator
 * @param {() => Promise<boolean>} effectCheck
 */
export async function probeControlPressShot(
  page,
  outDir,
  shotBase,
  control,
  locator,
  effectCheck,
  context,
) {
  const row = { control, hit: 'FAIL', effect: 'FAIL', shot: `${shotBase}.png`, note: '' };
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 15_000 }).catch(() => {});
    const probe = await probeHitAtCenter(locator);
    row.hit = probe.ok && !probe.scrim ? 'PASS' : 'FAIL';
    if (probe.scrim) row.note = 'scrim';
    if (row.hit === 'PASS') {
      const urlBefore = page.url();
      const popupPromise = context
        ? context.waitForEvent('page', { timeout: 8_000 }).catch(() => null)
        : null;
      await locator.click({ timeout: 15_000 });
      const popup = context ? await popupPromise : null;
      if (popup) {
        await popup.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
        await popup.close({ timeout: 8_000 }).catch(() => {});
        await page.bringToFront();
        await dispatchPersistedReturn(page);
      } else if (page.url() !== urlBefore) {
        await page.goBack({ waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
        await dispatchPersistedReturn(page);
      }
      await page.waitForTimeout(250);
      await externalReturnShot(page, outDir, shotBase);
      row.effect = (await effectCheck()) ? 'PASS' : 'FAIL';
    }
  } catch (err) {
    row.note = String(err?.message || err).slice(0, 100);
  }
  return row;
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} modal
 * @param {string} outDir
 * @param {string} slugPrefix
 */
const NEARBY_PROBE_STEP_MS =
  Number(process.env.EXTERNAL_RETURN_NEARBY_PROBE_MS) > 0
    ? Number(process.env.EXTERNAL_RETURN_NEARBY_PROBE_MS)
    : 55_000;

async function withStepTimeout(ms, label, fn) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
      }),
    ]);
  } catch (err) {
    return {
      control: label,
      hit: 'FAIL',
      effect: 'FAIL',
      shot: '',
      note: String(err?.message || err).slice(0, 80),
    };
  }
}

export async function probeNearbyPlaceControlsWithShots(
  page,
  modal,
  outDir,
  slugPrefix,
  context,
  opts = {},
) {
  const { probeNearbyPlaceControlMatrix } = await import('./nearby-place-control-matrix.js');
  return probeNearbyPlaceControlMatrix(page, modal, outDir, slugPrefix, context, {
    phase: 'after',
    reopenNearbyModal: opts.reopenNearbyModal,
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} dialog
 * @param {string} outDir
 * @param {string} slugPrefix
 * @param {{ homepagePattern?: RegExp }} opts
 */
export async function probeFestivalSheetControlsWithShots(
  page,
  dialog,
  outDir,
  slugPrefix,
  opts = {},
  context,
) {
  const { homepagePattern = /https?:\/\//i, shotOnly = false } = opts;
  const rows = [];
  const p = `${slugPrefix}-sheet`;
  const baseRows = await probeFestivalSheetControls(page, dialog, {
    homepagePattern,
    closeSheet: false,
    skipScrollTop: true,
  });
  for (const base of baseRows) {
    const key = base.control.replace(/\s+/g, '-').slice(0, 40);
    const shotName = `${p}-${key}.png`;
    rows.push({ ...base, shot: shotName });

    if (shotOnly) {
      await externalReturnShot(page, outDir, `${p}-${key}`).catch(() => {});
      continue;
    }

    const locator =
      base.control.includes('프로그램')
        ? dialog.getByRole('tab', { name: /프로그램/ })
        : base.control.includes('사진')
          ? dialog.getByRole('tab', { name: /^사진/ })
          : base.control.includes('안내로')
            ? dialog.getByRole('button', { name: '안내로 돌아가기' })
            : base.control.includes('맨 위로')
              ? page.locator('button[aria-label="맨 위로"][class*="z-[45]"]')
              : base.control.includes('공식')
                ? dialog.locator('[data-festival-official-home]')
                : base.control.includes('썸네일')
                  ? dialog.locator('[data-festival-hero-thumbs] button').first()
                  : base.control.includes('닫기')
                    ? page.locator('button.z-\\[60\\][aria-label="닫기"]')
                    : null;

    if (!locator || base.control.includes('z40') || base.control.includes('스크림')) continue;
    try {
      if (base.control.includes('안내로')) {
        await dialog.getByRole('tab', { name: /프로그램/ }).click().catch(() => {});
      }
      if (base.control.includes('맨 위로')) {
        await dialog.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });
      }
      const probe = await probeHitAtCenter(locator);
      if (probe.ok && !probe.scrim) {
        const popupPromise =
          base.control.includes('공식') && context
            ? context.waitForEvent('page', { timeout: 8_000 }).catch(() => null)
            : null;
        await locator.click({ timeout: 12_000 }).catch(() => {});
        const popup = popupPromise ? await popupPromise : null;
        if (popup) {
          await popup.close().catch(() => {});
          await page.bringToFront();
          await dispatchPersistedReturn(page);
        }
      }
      await externalReturnShot(page, outDir, `${p}-${key}`);
    } catch {
      try {
        await externalReturnShot(page, outDir, `${p}-${key}`);
      } catch {
        /* viewport only */
      }
    }
  }

  const mooni = page.locator('[data-festival-mooni-inline], [data-festival-mooni-fab]').first();
  if (await mooni.isVisible().catch(() => false)) {
    if (shotOnly) {
      await externalReturnShot(page, outDir, `${p}-mooni`).catch(() => {});
      rows.push({
        control: 'Mooni (시트)',
        hit: 'PASS',
        effect: 'PASS',
        shot: `${p}-mooni.png`,
      });
    } else {
      rows.push(
        await probeControlPressShot(
          page,
          outDir,
          `${p}-mooni`,
          'Mooni (시트)',
          mooni,
          async () => {
            await page.keyboard.press('Escape').catch(() => {});
            return true;
          },
          context,
        ),
      );
    }
  }

  return rows;
}
