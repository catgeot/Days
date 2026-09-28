/** 검색 결과 페이지 표준(구글·네이버 10건) */
export const SEARCH_DISAMBIGUATION_PAGE_SIZE = 10;

/** hub+팔경 Enter 카드는 한 화면에 묶음(대전 8경+명소 분할 방지) */
export const SEARCH_DISAMBIGUATION_PALGYEONG_PAGE_SIZE = 24;

export function resolveSearchDisambiguationPageSize(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  if (list.some((item) => item?.source === 'localScenicList')) {
    return SEARCH_DISAMBIGUATION_PALGYEONG_PAGE_SIZE;
  }
  return SEARCH_DISAMBIGUATION_PAGE_SIZE;
}

export function searchDisambiguationPageCount(
  length,
  pageSize = SEARCH_DISAMBIGUATION_PAGE_SIZE,
) {
  const n = Number(length) || 0;
  const size = Math.max(1, Number(pageSize) || SEARCH_DISAMBIGUATION_PAGE_SIZE);
  if (n <= 0) return 1;
  return Math.max(1, Math.ceil(n / size));
}

export function sliceSearchDisambiguationPage(
  items,
  page,
  pageSize = SEARCH_DISAMBIGUATION_PAGE_SIZE,
) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(pageSize) || SEARCH_DISAMBIGUATION_PAGE_SIZE);
  const totalPages = searchDisambiguationPageCount(list.length, size);
  const p = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (p - 1) * size;
  return {
    page: p,
    totalPages,
    pageSize: size,
    startIndex: start,
    items: list.slice(start, start + size),
  };
}
