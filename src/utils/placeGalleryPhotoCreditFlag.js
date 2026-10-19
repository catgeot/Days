/** Per-tile gallery photographer credit — `VITE_GATEO_PHOTO_CREDIT=1` at build time. */
export function isPlaceGalleryPhotoCreditEnabled() {
  const raw =
    import.meta.env?.VITE_GATEO_PHOTO_CREDIT ?? globalThis.__VITE_ENV__?.VITE_GATEO_PHOTO_CREDIT;
  return String(raw || '') === '1';
}
