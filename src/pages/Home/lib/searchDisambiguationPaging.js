/** 검색 결과 페이지 표준(구글·네이버 10건) */
export const SEARCH_DISAMBIGUATION_PAGE_SIZE = 10;

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
