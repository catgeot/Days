/** 갤러리 이미지 제공처 — Unsplash / Pexels / TourAPI(한국관광) */
export function getGalleryImageSource(image) {
  if (!image) return 'unknown';
  if (image.source === 'tourapi') return 'tourapi';
  if (String(image.id ?? '').startsWith('tourapi')) return 'tourapi';
  if (image.source === 'pexels') return 'pexels';
  if (String(image.id ?? '').startsWith('pexels')) return 'pexels';
  if (String(image.id ?? '').startsWith('fallback')) return 'default';
  return 'unsplash';
}

/** Photo by {author} on {provider} — 링크·title·라벨 */
export function getGalleryImageAttribution(image) {
  const source = getGalleryImageSource(image);
  const authorName = image?.user?.name || 'Unknown';

  if (source === 'tourapi') {
    const href = image?.links?.html || 'https://www.visitkorea.or.kr/';
    return {
      source,
      authorName,
      providerName: '한국관광공사',
      href,
      photographerHref: href,
      providerHref: 'https://www.visitkorea.or.kr/',
      title: `Photo by ${authorName} · 한국관광공사`,
      providerLabel: '· 한국관광공사',
    };
  }

  if (source === 'pexels') {
    const href = image?.links?.html || 'https://www.pexels.com/photo/';
    return {
      source,
      authorName,
      providerName: 'Pexels',
      href,
      photographerHref: href,
      providerHref: 'https://www.pexels.com/',
      title: `Photo by ${authorName} on Pexels`,
      providerLabel: 'on Pexels',
    };
  }

  const baseHref =
    image?.user?.links?.html || image?.links?.html || 'https://unsplash.com';
  const separator = baseHref.includes('?') ? '&' : '?';
  const photographerHref = `${baseHref}${separator}utm_source=Project_Days&utm_medium=referral`;
  const providerHref = 'https://unsplash.com/?utm_source=Project_Days&utm_medium=referral';

  return {
    source,
    authorName,
    providerName: 'Unsplash',
    href: photographerHref,
    photographerHref,
    providerHref,
    title: `Photo by ${authorName} on Unsplash`,
    providerLabel: 'on Unsplash',
  };
}
