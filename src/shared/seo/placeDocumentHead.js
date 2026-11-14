/** Home stays mounted on /place/*. A second <SEO> duplicates title, og, and canonical under React 19. */
export function placeRouteOwnsDocumentHead(pathname = '') {
  const path = String(pathname || '').split('?')[0].split('#')[0];
  return /^\/place\/[^/]+/.test(path);
}
