export const FESTIVAL_QUERY_KEY = 'festival';

export function festivalIdFromSearchParams(searchParams) {
  return String(searchParams?.get(FESTIVAL_QUERY_KEY) || '').trim();
}

export function searchParamsWithoutFestival(searchParams) {
  const next = new URLSearchParams(searchParams);
  next.delete(FESTIVAL_QUERY_KEY);
  return next;
}

export function searchParamsWithFestival(searchParams, contentId) {
  const next = new URLSearchParams(searchParams);
  next.set(FESTIVAL_QUERY_KEY, String(contentId));
  return next;
}

export function pathnameWithSearch(pathname, searchParams) {
  const qs = searchParams.toString();
  return `${pathname || '/'}${qs ? `?${qs}` : ''}`;
}
