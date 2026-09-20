/**
 * KorService2 축제 목록 + EngService2 festivalWindow title 병합.
 * contentId는 ko/en 불일치가 많아 Eng 제목의 괄호 안 한글 힌트로 매칭한다.
 */

/**
 * @param {string | null | undefined} title
 * @returns {{ en: string, koHint: string }}
 */
export function parseEngFestivalTitle(title) {
  const raw = String(title || '').trim();
  if (!raw) return { en: '', koHint: '' };
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { en: raw, koHint: '' };
  return { en: m[1].trim(), koHint: m[2].trim() };
}

/**
 * @param {object[]} enItems
 */
export function buildFestivalEnTitleIndex(enItems) {
  /** @type {Map<string, string>} */
  const byContentId = new Map();
  /** @type {Map<string, string>} */
  const byKoTitle = new Map();
  /** @type {Map<string, string>} */
  const byDateKoTitle = new Map();

  for (const item of enItems || []) {
    const parsed = parseEngFestivalTitle(item?.title);
    const en = String(parsed.en || '').trim();
    if (!en) continue;

    const id = String(item?.contentId || '').trim();
    if (id) byContentId.set(id, en);

    const koHint = String(parsed.koHint || '').trim();
    if (!koHint) continue;

    byKoTitle.set(koHint, en);
    const date = String(item?.eventStartDate || '').trim();
    if (date) byDateKoTitle.set(`${date}|${koHint}`, en);
  }

  return { byContentId, byKoTitle, byDateKoTitle };
}

/**
 * @param {object | null | undefined} koItem
 * @param {ReturnType<typeof buildFestivalEnTitleIndex>} index
 * @returns {string}
 */
export function resolveFestivalTitleEn(koItem, index) {
  if (!koItem || !index) return '';

  const id = String(koItem?.contentId || '').trim();
  if (id && index.byContentId.has(id)) {
    return index.byContentId.get(id) || '';
  }

  const koTitle = String(koItem?.title || '').trim();
  if (!koTitle) return '';

  if (index.byKoTitle.has(koTitle)) {
    return index.byKoTitle.get(koTitle) || '';
  }

  const date = String(koItem?.eventStartDate || '').trim();
  if (date && index.byDateKoTitle.has(`${date}|${koTitle}`)) {
    return index.byDateKoTitle.get(`${date}|${koTitle}`) || '';
  }

  return '';
}

/**
 * @param {object[]} koItems
 * @param {object[]} enItems
 */
export function mergeFestivalTitleEn(koItems, enItems) {
  if (!Array.isArray(koItems) || !koItems.length) return koItems || [];
  if (!Array.isArray(enItems) || !enItems.length) return koItems;

  const index = buildFestivalEnTitleIndex(enItems);
  return koItems.map((item) => {
    const titleEn = resolveFestivalTitleEn(item, index);
    if (!titleEn || titleEn === String(item?.title || '').trim()) return item;
    return { ...item, titleEn };
  });
}
