import aliases from './galleryPlaceAliases.json' with { type: 'json' };

/** Unsplash search/photos pages kept for a place gallery. Later pages stay unrequested. */
export const GALLERY_UNSPLASH_MAX_PAGE = 2;

/**
 * Region mismatches are dropped from the candidate list at save time.
 * Stored place_stats rows are not rewritten by this flag.
 */
export const GALLERY_PURGE_STORED_PHOTOS = false;

/** UI cap and the longest gallery_urls array this client will persist. */
export const GALLERY_MAX_IMAGES = 60;

const KR_COUNTRY_RE = /^(한국|대한민국|korea|south\s*korea|republic of korea)$/i;

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

function galleryTagText(photo) {
  const tags = photo?.tags;
  if (!tags) return '';
  if (typeof tags === 'string') return tags;
  if (!Array.isArray(tags)) return '';
  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag;
      if (tag && typeof tag === 'object') return tag.title || tag.name || '';
      return '';
    })
    .filter((value) => String(value || '').trim())
    .join(' ');
}

export function galleryPhotoPlaceText(photo) {
  if (!photo || typeof photo !== 'object') return '';
  const location = photo.location && typeof photo.location === 'object' ? photo.location : {};
  const locationText = typeof photo.location === 'string' ? photo.location : '';
  return [
    photo.description,
    photo.alt_description,
    photo.alt,
    locationText,
    location.name,
    location.city,
    location.country,
    location.title,
    galleryTagText(photo),
  ].filter((value) => typeof value === 'string' && value.trim()).join(' ');
}

/**
 * Stock captions use a different name than the catalog slug.
 * Parent regions are intentionally absent (Bali ≠ Ubud, Tahiti ≠ Bora Bora,
 * Andaman Sea ≠ the Andaman Islands, Christmas Island ≠ Kiribati).
 */
const GALLERY_POSITIVE_PLACE_ALIASES = {
  'aitutaki': ['One Foot Island'],
  'andaman-islands': ['Port Blair'],
  'carstensz-pyramid': ['Puncak Jaya', 'Jayawijaya'],
  'kiribati': ['Tarawa'],
  'kobe': ['神戸'],
  'koh-samui': ['Ko Samui'],
  'mayotte': ['Maore'],
};

/**
 * Positive match is token-based, not a raw substring.
 * A place token does not count when the next word is a product
 * ("Kobe beef", "Kobe gyu") or the previous word marks a title
 * ("the movie Madagascar"). "Kobe harbor" and "Kobe Port Tower" still count.
 * Hangul/CJK must sit on a token edge. A following particle (의, 에서, …) is fine;
 * a glued product syllable is not (고베규).
 */
const POSITIVE_MATCH_PRODUCT_NEXT = new Set([
  'beef', 'steak', 'wagyu', 'gyu', 'wine', 'cheese', 'ham', 'pork',
  'tea', 'coffee', 'chocolate', 'rum', 'silk', 'cotton', 'porcelain',
]);
const POSITIVE_MATCH_TITLE_PREV = new Set(['movie', 'film']);
const POSITIVE_MATCH_HANGUL_PRODUCT_NEXT = ['소고기', '비프', '규'].map((word) => foldPlaceText(word));
const POSITIVE_MATCH_HANGUL_PARTICLES = [
  '에서', '으로', '에게', '한테', '까지', '부터', '처럼', '보다',
  '의', '은', '는', '이', '가', '을', '를', '에', '로', '와', '과', '도', '만',
].map((word) => foldPlaceText(word));

function isCjkOrHangulChar(ch) {
  return /[\u1100-\u11ff\u3130-\u318f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7a3]/.test(ch || '');
}

function latinTokenBefore(foldedText, start) {
  const head = foldedText.slice(0, start);
  return head.match(/([a-z0-9]+)[^a-z0-9]*$/)?.[1] || '';
}

function latinTokenAfter(foldedText, end) {
  return foldedText.slice(end).match(/^[^a-z0-9]*([a-z0-9]+)/)?.[1] || '';
}

function positiveLatinAliasHit(foldedText, needle) {
  const compact = needle.replace(/ /g, '');
  if (compact.length < 4 && !SHORT_LATIN_ALIASES.has(needle)) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[^a-z0-9])(${escaped})(?=$|[^a-z0-9])`, 'g');
  let found = re.exec(foldedText);
  while (found) {
    const start = found.index + found[1].length;
    const end = start + found[2].length;
    const next = latinTokenAfter(foldedText, end);
    const prev = latinTokenBefore(foldedText, start);
    if (!POSITIVE_MATCH_PRODUCT_NEXT.has(next) && !POSITIVE_MATCH_TITLE_PREV.has(prev)) {
      return true;
    }
    found = re.exec(foldedText);
  }
  return false;
}

function hangulTailIsPlaceBoundary(after) {
  if (!after || !isCjkOrHangulChar(after[0])) return true;
  const trimmed = after.trimStart();
  if (POSITIVE_MATCH_HANGUL_PRODUCT_NEXT.some((word) => trimmed.startsWith(word))) return false;
  for (const particle of POSITIVE_MATCH_HANGUL_PARTICLES) {
    if (!trimmed.startsWith(particle)) continue;
    const rest = trimmed.slice(particle.length);
    if (!rest || !isCjkOrHangulChar(rest[0])) return true;
  }
  return false;
}

function positiveNonLatinAliasHit(foldedText, needle) {
  if (needle.length < 2) return false;
  let from = 0;
  while (from < foldedText.length) {
    const at = foldedText.indexOf(needle, from);
    if (at < 0) return false;
    const before = at === 0 ? '' : foldedText[at - 1];
    const after = foldedText.slice(at + needle.length);
    const beforeOk = !before || !isCjkOrHangulChar(before);
    if (beforeOk && hangulTailIsPlaceBoundary(after)) return true;
    from = at + Math.max(needle.length, 1);
  }
  return false;
}

function positiveAliasHit(foldedText, alias) {
  const needle = foldPlaceText(alias);
  if (!foldedText || !needle) return false;
  if (isHangulOrNonLatin(needle)) return positiveNonLatinAliasHit(foldedText, needle);
  return positiveLatinAliasHit(foldedText, needle);
}

function positiveMatchNeedles(target) {
  const extra = GALLERY_POSITIVE_PLACE_ALIASES[target?.id] || [];
  return [...(target?.city || []), ...(target?.country || []), ...extra];
}

/** Overseas targets must mention the place or its country before a row is written. */
export function galleryTargetRequiresPositivePersist(target) {
  const countries = (target?.country || [])
    .map((name) => String(name || '').trim())
    .filter((name) => {
      const folded = foldPlaceText(name);
      return folded && !PLACEHOLDER_COUNTRY.has(folded);
    });
  if (!countries.length) return false;
  return countries.some((name) => !KR_COUNTRY_RE.test(name));
}

export function galleryPhotoPositivelyMatchesTarget(photo, target) {
  if (!target?.city?.length && !target?.country?.length && !GALLERY_POSITIVE_PLACE_ALIASES[target?.id]) {
    return false;
  }
  const folded = foldPlaceText(galleryPhotoPlaceText(photo));
  if (!folded) return false;
  return positiveMatchNeedles(target).some((alias) => positiveAliasHit(folded, alias));
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

/**
 * Session lists may keep unlabeled overseas hits. Persist lists may not.
 * Domestic targets stay on the negative conflict filter, including empty metadata.
 */
export function filterGalleryImagesForPersist(images, target, excludedIds) {
  const incoming = filterGalleryIncomingForSave(images, target, excludedIds);
  if (!galleryTargetRequiresPositivePersist(target)) return incoming;
  return incoming.filter((img) => galleryPhotoPositivelyMatchesTarget(img, target));
}

export function capPersistedGalleryImages(images, max = GALLERY_MAX_IMAGES) {
  const list = Array.isArray(images) ? images.filter((img) => img && typeof img === 'object') : [];
  const limit = Math.floor(Number(max));
  if (!Number.isFinite(limit) || limit < 0) return list;
  return list.length <= limit ? list : list.slice(0, limit);
}

/**
 * A 1–7 image overseas row is refetched. Add only positive new photos.
 * Stored rows stay on the server (merge), including a curated image with no caption.
 */
export function planThinStockGalleryPersist({ stored, incoming, target, max = GALLERY_MAX_IMAGES } = {}) {
  const kept = (Array.isArray(stored) ? stored : []).filter((img) => img && typeof img === 'object');
  if (!galleryTargetRequiresPositivePersist(target)) {
    return {
      overseas: false,
      mode: 'replace',
      images: capPersistedGalleryImages(incoming, max),
    };
  }
  const keptIds = new Set(kept.map((img) => String(img.id ?? '')).filter(Boolean));
  const additions = filterGalleryImagesForPersist(incoming, target).filter(
    (img) => img?.id != null && img.id !== '' && !keptIds.has(String(img.id)),
  );
  const room = Math.max(0, max - kept.length);
  const images = additions.slice(0, room);
  return {
    overseas: true,
    mode: images.length ? 'merge_keep_hero' : null,
    images,
  };
}

/** True when a replace payload drops something other than the over-cap tail or an unverified overseas hit. */
export function galleryReplaceOmitsOnlyAllowed(payloadImages, storage, target, max = GALLERY_MAX_IMAGES) {
  const payloadIds = new Set((payloadImages || []).map((img) => img?.id).filter((id) => id != null && id !== ''));
  const withinCap = new Set(
    capPersistedGalleryImages(storage, max).map((img) => img?.id).filter((id) => id != null && id !== ''),
  );
  const overseas = galleryTargetRequiresPositivePersist(target);
  for (const img of storage || []) {
    if (!img?.id || payloadIds.has(img.id)) continue;
    if (!withinCap.has(img.id)) continue;
    if (overseas && !galleryPhotoPositivelyMatchesTarget(img, target)) continue;
    return false;
  }
  return true;
}

export function galleryCandidatesForSave({ stored, incoming, target, excludedIds } = {}) {
  const keptStored = Array.isArray(stored) ? stored : [];
  const nextIncoming = filterGalleryIncomingForSave(incoming, target, excludedIds);
  if (GALLERY_PURGE_STORED_PHOTOS) {
    return filterGalleryIncomingForSave([...keptStored, ...nextIncoming], target, excludedIds);
  }
  return { stored: keptStored, incoming: nextIncoming };
}
