import aliases from './galleryPlaceAliases.json' with { type: 'json' };

/** Unsplash search/photos pages kept for a place gallery. Later pages stay unrequested. */
export const GALLERY_UNSPLASH_MAX_PAGE = 2;

/**
 * Region mismatches are dropped from the candidate list at save time.
 * Stored place_stats rows are not rewritten by this flag.
 */
export const GALLERY_PURGE_STORED_PHOTOS = false;

const PLACEHOLDER_COUNTRY = new Set([
  '',
  'explore',
  'global',
  'ocean',
  '바다',
  '대륙',
  'searching',
]);

const SHORT_LATIN_ALIASES = new Set(['usa', 'uae', 'uk', 'nyc', 'rio']);

export function foldPlaceText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHangulOrNonLatin(foldedAlias) {
  return /[^a-z0-9 ]/.test(foldedAlias);
}

export function galleryAliasHit(foldedText, alias) {
  const needle = foldPlaceText(alias);
  if (!foldedText || !needle) return false;
  if (isHangulOrNonLatin(needle)) {
    return needle.length >= 2 && foldedText.includes(needle);
  }
  const compact = needle.replace(/ /g, '');
  if (compact.length < 4 && !SHORT_LATIN_ALIASES.has(needle)) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(foldedText);
}

export function findGalleryAliasEntry(placeKey) {
  const key = foldPlaceText(placeKey);
  if (!key) return null;
  return aliases.find((entry) =>
    foldPlaceText(entry.id) === key
    || entry.city.some((alias) => foldPlaceText(alias) === key),
  ) || null;
}

function pushUnique(list, value) {
  const raw = String(value || '').trim();
  if (!raw) return;
  const key = foldPlaceText(raw);
  if (!key || list.some((item) => foldPlaceText(item) === key)) return;
  list.push(raw);
}

export function resolveGallerySaveTarget(spot, placeId) {
  const record = spot && typeof spot === 'object' ? spot : { name: spot || '' };
  let entry = null;
  for (const key of [placeId, record.slug, record.id, record.name_en, record.name]) {
    entry = findGalleryAliasEntry(key);
    if (entry) break;
  }
  const city = [];
  const country = [];
  if (entry) {
    for (const alias of entry.city) pushUnique(city, alias);
  }
  pushUnique(city, record.name_en);
  pushUnique(city, record.name);
  for (const value of [record.country_en, record.country]) {
    if (PLACEHOLDER_COUNTRY.has(foldPlaceText(value))) continue;
    pushUnique(country, value);
  }
  if (entry) {
    for (const alias of entry.country) pushUnique(country, alias);
  }
  const id = entry?.id
    || foldPlaceText(placeId || record.slug || record.name_en || record.name).replace(/ /g, '-');
  return { id, city, country };
}

export function galleryUnsplashSearchQuery(query, target) {
  const base = String(query || '').trim();
  if (!base) return '';
  const country = (target?.country || [])
    .map((name) => String(name || '').trim())
    .find((name) => /^[A-Za-z]/.test(name) && foldPlaceText(name).replace(/ /g, '').length >= 4);
  if (!country) return base;
  const foldedBase = foldPlaceText(base);
  const foldedCountry = foldPlaceText(country);
  if (!foldedCountry || foldedBase === foldedCountry || foldedBase.includes(foldedCountry)) return base;
  return `${base} ${country}`;
}

export function unsplashGallerySearchPage(page) {
  const n = Math.floor(Number(page));
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > GALLERY_UNSPLASH_MAX_PAGE) return null;
  return n;
}

export function galleryPhotoPlaceText(photo) {
  if (!photo || typeof photo !== 'object') return '';
  const location = photo.location && typeof photo.location === 'object' ? photo.location : {};
  return [
    photo.description,
    photo.alt_description,
    photo.alt,
    location.name,
    location.city,
    location.country,
    location.title,
  ].filter((value) => typeof value === 'string' && value.trim()).join(' ');
}

function sameCountry(target, entry) {
  const targetCountries = new Set((target?.country || []).map((alias) => foldPlaceText(alias)).filter(Boolean));
  return (entry.country || []).some((alias) => targetCountries.has(foldPlaceText(alias)));
}

export function galleryPhotoConflictsWithTarget(photo, target) {
  if (!target?.city?.length) return false;
  const folded = foldPlaceText(galleryPhotoPlaceText(photo));
  if (!folded) return false;
  if (target.city.some((alias) => galleryAliasHit(folded, alias))) return false;
  for (const entry of aliases) {
    if (entry.id === target.id) continue;
    if (entry.city.some((alias) => galleryAliasHit(folded, alias))) return true;
    if (!sameCountry(target, entry) && entry.country.some((alias) => galleryAliasHit(folded, alias))) {
      return true;
    }
  }
  return false;
}

export function filterGalleryIncomingForSave(images, target, excludedIds) {
  const excluded = excludedIds instanceof Set
    ? excludedIds
    : new Set((excludedIds || []).map((id) => String(id)));
  const list = Array.isArray(images) ? images : [];
  return list.filter((img) => {
    if (!img || typeof img !== 'object') return false;
    if (img.id != null && excluded.has(String(img.id))) return false;
    return !galleryPhotoConflictsWithTarget(img, target);
  });
}

export function galleryCandidatesForSave({ stored, incoming, target, excludedIds } = {}) {
  const keptStored = Array.isArray(stored) ? stored : [];
  const nextIncoming = filterGalleryIncomingForSave(incoming, target, excludedIds);
  if (GALLERY_PURGE_STORED_PHOTOS) {
    return filterGalleryIncomingForSave([...keptStored, ...nextIncoming], target, excludedIds);
  }
  return { stored: keptStored, incoming: nextIncoming };
}
