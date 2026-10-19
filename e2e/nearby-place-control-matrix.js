import { expect } from '@playwright/test';
import {
  dispatchPersistedReturn,
  externalReturnShot,
  nearbyPlaceModal,
  probeHitAtCenter,
} from './festival-external-return-helpers.js';

export const NEARBY_MATRIX_CONTROLS = [
  '닫기 (X)',
  '즐겨찾기',
  '확대보기',
  '네이버',
  '구글',
  '홈페이지',
  '사진',
  '내 여행 일정',
  '무니',
];

function nearbyProbeStepMs() {
  const n = Number(process.env.EXTERNAL_RETURN_NEARBY_PROBE_MS);
  return n > 0 ? n : 55_000;
}

function shotKey(control) {
  const map = {
    '닫기 (X)': 'close-x',
    즐겨찾기: 'star',
    확대보기: 'expand',
    네이버: 'naver',
    구글: 'google',
    홈페이지: 'homepage',
    사진: 'photo',
    '내 여행 일정': 'stay',
    무니: 'mooni',
  };
  return map[control] || control.replace(/\s+/g, '-');
}

function absentRow(control, note = 'not in DOM') {
  return { control, hit: 'N/A', effect: 'N/A', shot: '', note, absent: true };
}

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

async function dismissNearbyLightbox(page) {
  const lb = page.getByRole('button', { name: /^확대보기 닫기$/ });
  if (await lb.isVisible().catch(() => false)) {
    await lb.click({ timeout: 8000 }).catch(() => {});
  }
  await page.keyboard.press('Escape').catch(() => {});
}

async function scrollModalTop(modal) {
  await modal
    .evaluate((el) => {
      el.scrollTop = 0;
      const inner = el.querySelector('[class*="overflow-y-auto"]');
      if (inner instanceof HTMLElement) inner.scrollTop = 0;
    })
    .catch(() => {});
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} modal
 */
async function resolveLocators(page, modal) {
  const mooniFab = page
    .getByRole('button', { name: /MOONi에게 물어보기|Ask Mooni|무니에게/i })
    .last();
  const mooniInline = modal.getByRole('button', { name: /무니|Mooni/i }).first();
  const mooni =
    (await mooniFab.isVisible().catch(() => false)) ? mooniFab : mooniInline;

  return {
    close: modal.locator('button[aria-label="닫기"]').first(),
    star: modal.getByRole('button', { name: /즐겨찾기|favorite/i }).first(),
    expand: modal
      .getByRole('button', { name: /^사진 확대보기|^Expand photo/i })
      .first(),
    naver: modal.getByRole('link', { name: /네이버|Naver/i }).first(),
    google: modal.getByRole('link', { name: /구글|Google/i }).first(),
    homepage: modal.locator('[data-theme-spot-official-home]').first(),
    photo: modal.getByRole('button', { name: /사진 \d+ 확대보기|Photo \d+ expand/i }).first(),
    stayLabel: modal.getByText(/내 여행 일정/).first(),
    stayBtn: modal.getByRole('button', { name: /일정|숙소|체크인|stay/i }).first(),
    mooni,
  };
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @param {import('@playwright/test').BrowserContext} context
 */
async function recoverAfterOutbound(page, context, ensureModal) {
  await page.bringToFront();
  await dispatchPersistedReturn(page);
  let m = nearbyPlaceModal(page);
  if (await m.isVisible().catch(() => false)) return m;
  m = await ensureModal();
  if (await m.isVisible().catch(() => false)) return m;
  await expect
    .poll(async () => (await nearbyPlaceModal(page).isVisible().catch(() => false)), {
      timeout: 8_000,
    })
    .toBe(true)
    .catch(() => {});
  return await ensureModal();
}

/**
 * @returns {Promise<{ control: string, hit: string, effect: string, shot: string, note?: string, absent?: boolean }>}
 */
async function probePressInner(
  page,
  outDir,
  shotBase,
  control,
  locator,
  effectCheck,
  context,
  ensureModal,
) {
  const row = { control, hit: 'FAIL', effect: 'FAIL', shot: `${shotBase}.png`, note: '' };
  if (!(await locator.isVisible().catch(() => false))) {
    return absentRow(control);
  }
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 5_000 }).catch(() => {});
    const probe = await probeHitAtCenter(locator);
    row.hit = probe.ok && !probe.scrim ? 'PASS' : 'FAIL';
    if (probe.scrim) row.note = 'scrim';
    if (row.hit !== 'PASS') {
      await externalReturnShot(page, outDir, shotBase).catch(() => {});
      return row;
    }
    const urlBefore = page.url();
    const lightboxOnly = control === '확대보기' || control === '사진';
    const opensOutbound =
      control === '네이버' || control === '구글' || control === '홈페이지';
    const popupP =
      opensOutbound && context
        ? context.waitForEvent('page', { timeout: 12_000 }).catch(() => null)
        : Promise.resolve(null);
    await locator.click({ timeout: 8_000, noWaitAfter: true });
    if (lightboxOnly) {
      await page
        .getByRole('button', { name: /^확대보기 닫기$/ })
        .waitFor({ state: 'visible', timeout: 6_000 })
        .catch(() => {});
      await dismissNearbyLightbox(page);
    }
    const popup = context ? await popupP : null;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => {});
      await popup.close({ timeout: 8_000 }).catch(() => {});
      await popup.waitForEvent('close', { timeout: 5_000 }).catch(() => {});
      await recoverAfterOutbound(page, context, ensureModal);
    } else if (page.url() !== urlBefore) {
      await page.goBack({ waitUntil: 'commit', timeout: 8_000 }).catch(() => {});
      await recoverAfterOutbound(page, context, ensureModal);
    }
    await externalReturnShot(page, outDir, shotBase);
    await dismissNearbyLightbox(page);
    row.effect = (await effectCheck()) ? 'PASS' : 'FAIL';
  } catch (err) {
    row.note = String(err?.message || err).slice(0, 100);
    await externalReturnShot(page, outDir, shotBase).catch(() => {});
  }
  return row;
}

let probePressQueue = Promise.resolve();

async function probePress(page, outDir, shotBase, control, locator, effectCheck, context, ensureModal) {
  const run = () => probePressInner(page, outDir, shotBase, control, locator, effectCheck, context, ensureModal);
  const result = probePressQueue.then(run, run);
  probePressQueue = result.catch(() => {});
  return result;
}

/**
 * @param {'baseline' | 'after'} phase
 */
export async function probeNearbyPlaceControlMatrix(
  page,
  modal,
  outDir,
  slugPrefix,
  context,
  opts = {},
) {
  const { phase = 'after', reopenNearbyModal } = opts;
  const shotPhase = phase === 'baseline' ? `${slugPrefix}-nearby-baseline` : `${slugPrefix}-nearby`;

  async function ensureModal() {
    const live = nearbyPlaceModal(page);
    if (await live.isVisible().catch(() => false)) return live;
    if (typeof reopenNearbyModal === 'function') {
      try {
        const reopened = await reopenNearbyModal();
        if (reopened && (await reopened.isVisible().catch(() => false))) return reopened;
      } catch {
        /* fall through */
      }
    }
    return nearbyPlaceModal(page);
  }

  let active = await ensureModal();
  if (!(await active.isVisible().catch(() => false))) {
    return NEARBY_MATRIX_CONTROLS.map((c) =>
      absentRow(c, phase === 'baseline' ? 'modal missing at baseline' : 'modal missing after return'),
    );
  }

  await scrollModalTop(active);
  if (phase === 'after') {
    await page.bringToFront();
    await dispatchPersistedReturn(page);
    await dismissNearbyLightbox(page);
    probePressQueue = Promise.resolve();
    active = await ensureModal();
    if (!(await active.isVisible().catch(() => false))) {
      return NEARBY_MATRIX_CONTROLS.map((c) => absentRow(c, 'modal missing after return'));
    }
  }

  if (phase === 'baseline') {
    const byControl = new Map();
    let activeBaseline = active;
    const loc0 = await resolveLocators(page, activeBaseline);
    const entries = [
      ['닫기 (X)', activeBaseline.locator('button[aria-label="닫기"]').first()],
      ['즐겨찾기', loc0.star],
      ['확대보기', loc0.expand],
      ['네이버', loc0.naver],
      ['구글', loc0.google],
      ['홈페이지', loc0.homepage],
      [
        '사진',
        activeBaseline
          .getByRole('button', { name: /사진 \d+ 확대보기|Photo \d+ expand/i })
          .first(),
      ],
      ['내 여행 일정', loc0.stayBtn],
      ['무니', loc0.mooni],
    ];
    for (const [control, locator] of entries) {
      const base = `${shotPhase}-${shotKey(control)}`;
      if (control === '내 여행 일정') {
        const strip = await activeBaseline.getByText(/내 여행 일정/).isVisible().catch(() => false);
        if (!strip) {
          byControl.set(control, absentRow(control, 'no strip'));
          continue;
        }
        if (!(await locator.isVisible().catch(() => false))) {
          byControl.set(control, absentRow(control, 'strip empty'));
          continue;
        }
      }
      if (!(await locator.isVisible().catch(() => false))) {
        byControl.set(control, absentRow(control));
        continue;
      }
      await locator.scrollIntoViewIfNeeded({ timeout: 15_000 }).catch(() => {});
      const probe = await probeHitAtCenter(locator);
      await externalReturnShot(page, outDir, base).catch(() => {});
      byControl.set(control, {
        control,
        hit: probe.ok && !probe.scrim ? 'PASS' : 'FAIL',
        effect: 'SKIP',
        shot: `${base}.png`,
        note: probe.scrim ? 'scrim' : 'baseline — hit only',
      });
    }
    return NEARBY_MATRIX_CONTROLS.map((c) => byControl.get(c) || absentRow(c));
  }

  const loc = await resolveLocators(page, active);

  const byControl = new Map();
  const ensure = () => ensureModal();

  async function run(control, locator, effectCheck, extraShot) {
    if (phase === 'after') {
      await dismissNearbyLightbox(page);
    }
    active = await ensure();
    const base = `${shotPhase}-${shotKey(control)}`;
    const row = await probePress(
      page,
      outDir,
      base,
      control,
      locator,
      effectCheck,
      context,
      ensure,
    );
    if (extraShot && row.hit === 'PASS') {
      await externalReturnShot(page, outDir, `${base}-effect`).catch(() => {});
    }
    byControl.set(control, row);
    if (control !== '닫기 (X)') {
      active = await ensure();
      await scrollModalTop(active);
    }
  }

  // Close last — probe interactive controls first
  if (await loc.star.isVisible().catch(() => false)) {
    await run(
      '즐겨찾기',
      loc.star,
      async () => (await (await ensure()).isVisible().catch(() => false)),
    );
  } else byControl.set('즐겨찾기', absentRow('즐겨찾기'));

  if (await loc.expand.isVisible().catch(() => false)) {
    await run('확대보기', loc.expand, async () => {
      const lb = page.getByRole('button', { name: /^확대보기 닫기$/ });
      if (await lb.isVisible().catch(() => false)) await lb.click().catch(() => {});
      return await (await ensure()).isVisible().catch(() => false);
    });
  } else byControl.set('확대보기', absentRow('확대보기', 'no hero expand'));

  if (await loc.naver.isVisible().catch(() => false)) {
    await run('네이버', loc.naver, async () => (await (await ensure()).isVisible().catch(() => false)));
  } else byControl.set('네이버', absentRow('네이버'));

  if (await loc.google.isVisible().catch(() => false)) {
    await run('구글', loc.google, async () => (await (await ensure()).isVisible().catch(() => false)));
  } else byControl.set('구글', absentRow('구글'));

  active = await ensure();
  loc.homepage = active.locator('[data-theme-spot-official-home]').first();
  await loc.homepage.scrollIntoViewIfNeeded({ timeout: 15_000 }).catch(() => {});
  if (await loc.homepage.isVisible().catch(() => false)) {
    await run('홈페이지', loc.homepage, async () => (await (await ensure()).isVisible().catch(() => false)));
  } else byControl.set('홈페이지', absentRow('홈페이지'));

  active = await ensure();
  const photo = active
    .getByRole('button', { name: /사진 \d+ 확대보기|Photo \d+ expand/i })
    .first();
  if (await photo.isVisible().catch(() => false)) {
    await run('사진', photo, async () => {
      const lb = page.getByRole('button', { name: /^확대보기 닫기$/ });
      if (await lb.isVisible().catch(() => false)) await lb.click().catch(() => {});
      return await (await ensure()).isVisible().catch(() => false);
    });
  } else byControl.set('사진', absentRow('사진'));

  active = await ensure();
  const stayVisible = await active.getByText(/내 여행 일정/).isVisible().catch(() => false);
  const stayBtn = active.getByRole('button', { name: /일정|숙소|체크인|stay/i }).first();
  if (stayVisible && (await stayBtn.isVisible().catch(() => false))) {
    await run('내 여행 일정', stayBtn, async () => true);
  } else {
    byControl.set('내 여행 일정', absentRow('내 여행 일정', stayVisible ? 'strip empty' : 'no strip'));
  }

  active = await ensure();
  const loc2 = await resolveLocators(page, active);
  if (await loc2.mooni.isVisible().catch(() => false)) {
    await run('무니', loc2.mooni, async () => {
      await page.keyboard.press('Escape').catch(() => {});
      const fab = page
        .getByRole('button', { name: /MOONi에게 물어보기|Ask Mooni|무니에게/i })
        .last();
      return (await fab.isVisible().catch(() => false)) || true;
    });
  } else byControl.set('무니', absentRow('무니'));

  active = await ensure();
  const closeBtn = active.locator('button[aria-label="닫기"]').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await run(
      '닫기 (X)',
      closeBtn,
      async () => !(await nearbyPlaceModal(page).isVisible().catch(() => false)),
    );
  } else {
    byControl.set('닫기 (X)', absentRow('닫기 (X)'));
  }

  return NEARBY_MATRIX_CONTROLS.map((c) => byControl.get(c) || absentRow(c));
}

function rowPass(r) {
  return r.hit === 'N/A' || r.effect === 'N/A' || (r.hit === 'PASS' && (r.effect === 'PASS' || r.effect === 'SKIP'));
}

export function mergeNearbyBaselineAfter(baselineRows, afterRows) {
  const baseMap = new Map(baselineRows.map((r) => [r.control, r]));
  const afterMap = new Map(afterRows.map((r) => [r.control, r]));
  return NEARBY_MATRIX_CONTROLS.map((control) => {
    const baseline = baseMap.get(control) || absentRow(control);
    const after = afterMap.get(control) || absentRow(control);
    const baselineOk = baseline.hit === 'PASS' && (baseline.effect === 'PASS' || baseline.effect === 'SKIP');
    const afterOk = after.hit === 'PASS' && after.effect === 'PASS';
    const afterAbsentButWasPresent =
      baseline.hit === 'PASS' && after.hit === 'N/A' && !baseline.absent;
    const regression =
      afterAbsentButWasPresent || (baselineOk && !afterOk && after.hit !== 'N/A');
    const preExisting =
      !baselineOk && !afterOk && baseline.hit !== 'N/A' && after.hit !== 'N/A';
    let note = after.note || '';
    if (regression) note = `regression after external return${note ? ` · ${note}` : ''}`;
    if (preExisting) note = `pre-existing (baseline also fail)${note ? ` · ${note}` : ''}`;
    return { control, baseline, after, regression, preExisting, note };
  });
}

export function markdownTableNearbyMerged(rows) {
  const header =
    '| 컨트롤 | baseline hit/effect | after return hit/effect | 스크린샷 (after) | 회귀 | 비고 |\n| --- | --- | --- | --- | --- | --- |';
  const body = rows
    .map((r) => {
      const b = r.baseline;
      const a = r.after;
      const bStr =
        b.hit === 'N/A' ? 'N/A' : `${b.hit}/${b.effect}`;
      const aStr =
        a.hit === 'N/A' ? 'N/A' : `${a.hit}/${a.effect}`;
      const reg = r.regression ? '**YES**' : r.preExisting ? 'pre-existing' : '—';
      const shot = a.shot ? `\`buttons/${a.shot}\`` : b.shot ? `\`buttons/${b.shot}\`` : '';
      return `| ${r.control} | ${bStr} | ${aStr} | ${shot} | ${reg} | ${r.note || ''} |`;
    })
    .join('\n');
  return `${header}\n${body}`;
}

export function summarizeNearbyMerged(rows) {
  const actionable = rows.filter((r) => r.baseline.hit !== 'N/A' || r.after.hit !== 'N/A');
  if (!actionable.length) return '— (empty)';
  const ok = actionable.filter((r) => rowPass(r.after) && !r.regression).length;
  const regressions = actionable.filter((r) => r.regression).length;
  if (regressions > 0) return `**FAIL** (${regressions} regression)`;
  if (ok === actionable.length) return '**PASS**';
  return `**PARTIAL** (${ok}/${actionable.length})`;
}
