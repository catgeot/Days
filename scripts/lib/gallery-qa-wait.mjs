/**
 * Playwright helpers — wait until place gallery finished loading (no loading skeleton).
 * @param {import('playwright').Page} page
 */
export async function scrollToGallerySection(page) {
  await page.evaluate(() => {
    const hint = document.querySelector('[data-gallery-hint]');
    if (hint) hint.scrollIntoView({ block: 'center' });
    const section = document.querySelector('[data-gallery-section]');
    if (section) section.scrollIntoView({ block: 'start' });
    const scroller = document.querySelector('.custom-scrollbar-blue');
    if (scroller) scroller.scrollTop = 0;
  });
  await page.waitForTimeout(400);
}

const GALLERY_READY_FN = (min) => {
  const text = document.body.innerText || '';
  if (/사진을 불러오는 중/.test(text)) return false;
  if (text.includes('사진을 불러오지 못했습니다')) return false;
  const roots = [
    document.querySelector('[data-gallery-section]'),
    document.querySelector('.custom-scrollbar-blue'),
  ].filter(Boolean);
  const root = roots[0] || document.body;
  const imgs = [...root.querySelectorAll('img[src]')].filter((img) => {
    const src = String(img.getAttribute('src') || '');
    if (!src || src.startsWith('data:')) return false;
    if (src.includes('favicon') || src.includes('logo')) return false;
    const w = img.naturalWidth || 0;
    if (img.complete && w === 0) return false;
    return true;
  });
  return imgs.length >= min;
};

/**
 * @param {import('playwright').Page} page
 * @param {{ minImages?: number, timeoutMs?: number }} [opts]
 */
export async function waitForGalleryFullyLoaded(page, opts = {}) {
  const minImages = opts.minImages ?? 1;
  const timeoutMs = opts.timeoutMs ?? 120_000;

  const failed = page.getByText('사진을 불러오지 못했습니다');
  if (await failed.isVisible().catch(() => false)) {
    throw new Error('gallery network error UI visible');
  }

  await scrollToGallerySection(page);

  await page.waitForFunction(GALLERY_READY_FN, minImages, { timeout: timeoutMs });

  for (let i = 0; i < 5; i += 1) {
    await page.evaluate(() => {
      const scroller = document.querySelector('.custom-scrollbar-blue');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    });
    await page.waitForTimeout(300);
    try {
      await page.waitForFunction(GALLERY_READY_FN, minImages, { timeout: 5000 });
    } catch {
      break;
    }
  }
}

/**
 * @param {import('playwright').Page} page
 */
export async function auditGalleryImages(page) {
  return page.evaluate(() => {
    const roots = [
      document.querySelector('[data-gallery-section]'),
      document.querySelector('.custom-scrollbar-blue'),
    ].filter(Boolean);
    const root = roots[0] || document.body;
    const imgs = [...root.querySelectorAll('img[src]')].filter((img) => {
      const src = String(img.getAttribute('src') || '');
      return src && !src.startsWith('data:') && !src.includes('favicon');
    });
    const urls = imgs.map((img) => img.src);
    const farmRe = /herbnara|sheep|양|greenhouse|3376828|농원/i;
    const tourRe = /visitkorea|tong\.visitkorea/i;
    const stockRe = /unsplash|pexels/i;
    return {
      count: urls.length,
      urls,
      tourCount: urls.filter((u) => tourRe.test(u)).length,
      stockCount: urls.filter((u) => stockRe.test(u)).length,
      farmLike: urls.filter((u) => farmRe.test(u)),
      broken: imgs.filter((img) => img.complete && img.naturalWidth === 0).length,
    };
  });
}
