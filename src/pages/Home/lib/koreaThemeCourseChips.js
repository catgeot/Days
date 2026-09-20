/** 이 건수 이상이면 시도 칩을 단독 표시 */
export const COURSE_CHIP_STANDALONE_MIN = 3;

/** 소량 코스 권역을 묶는 칩 id */
export const COURSE_OTHER_CHIP_ID = 'other';

/**
 * @typedef {{
 *   areaCode: string,
 *   name: string,
 *   count: number,
 * }} CourseAreaCount
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   areaCodes: string[],
 *   areaNames: string[],
 *   count: number,
 * }} CourseAreaChip
 */

/**
 * 코스 0건 권역은 제외 · 소량(미만)은 「기타」 한 칩 · 그 외는 단독 칩.
 * @param {CourseAreaCount[]} areaCounts
 * @param {{ standaloneMin?: number }} [opts]
 * @returns {CourseAreaChip[]}
 */
export function buildCourseAreaChips(areaCounts, opts = {}) {
  const standaloneMin = Number(opts.standaloneMin) > 0
    ? Number(opts.standaloneMin)
    : COURSE_CHIP_STANDALONE_MIN;

  /** @type {CourseAreaCount[]} */
  const standalone = [];
  /** @type {CourseAreaCount[]} */
  const sparse = [];

  for (const raw of areaCounts || []) {
    const areaCode = String(raw?.areaCode || '').trim();
    const name = String(raw?.name || areaCode).trim();
    const count = Number(raw?.count);
    if (!areaCode || !Number.isFinite(count) || count <= 0) continue;
    const row = { areaCode, name, count };
    if (count >= standaloneMin) standalone.push(row);
    else sparse.push(row);
  }

  standalone.sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'),
  );
  sparse.sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'),
  );

  /** @type {CourseAreaChip[]} */
  const chips = standalone.map((a) => ({
    id: a.areaCode,
    label: a.name,
    areaCodes: [a.areaCode],
    areaNames: [a.name],
    count: a.count,
  }));

  if (sparse.length > 0) {
    const otherLabel =
      typeof opts.otherLabel === 'string' && opts.otherLabel.trim()
        ? opts.otherLabel.trim()
        : '기타';
    chips.push({
      id: COURSE_OTHER_CHIP_ID,
      label: otherLabel,
      areaCodes: sparse.map((a) => a.areaCode),
      areaNames: sparse.map((a) => a.name),
      count: sparse.reduce((sum, a) => sum + a.count, 0),
    });
  }

  return chips;
}
