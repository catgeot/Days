import {
  LOGBOOK_EDITORIAL_DISCLOSURE_KO,
  LOGBOOK_EDITORIAL_PUBLISH_STATUSES,
} from '../../src/utils/logbookEditorial.js';

export function validateEditorialLogbookPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['payload must be a JSON object'] };
  }

  const title = String(payload.title || '').trim();
  const slug = String(payload.slug || '').trim().toLowerCase();
  const content = String(payload.content || '').trim();
  const placeSlug = String(payload.place_slug || payload.placeSlug || '').trim().toLowerCase();
  const status = String(payload.status || 'draft').trim().toLowerCase();

  if (!title) errors.push('title is required');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push('slug is required (lowercase kebab-case)');
  }
  if (!content) errors.push('content is required');
  if (!placeSlug) errors.push('place_slug is required');
  if (!LOGBOOK_EDITORIAL_PUBLISH_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${LOGBOOK_EDITORIAL_PUBLISH_STATUSES.join(', ')}`);
  }

  const images = Array.isArray(payload.images) ? payload.images : [];
  if (status === 'published' && images.length === 0) {
    errors.push('published posts should include at least one image with attribution');
  }

  const location = String(payload.location || payload.place_name || placeSlug).trim();
  const date =
    payload.date ||
    (payload.published_at ? String(payload.published_at).slice(0, 10) : null) ||
    new Date().toISOString().slice(0, 10);

  const normalized = {
    title,
    slug,
    content,
    place_slug: placeSlug,
    place_id: payload.place_id ? String(payload.place_id).trim() : null,
    location,
    date,
    status,
    is_editorial: true,
    is_public: status === 'published',
    is_deleted: false,
    disclosure_badge: String(payload.disclosure_badge || '').trim() || LOGBOOK_EDITORIAL_DISCLOSURE_KO,
    series: payload.series ? String(payload.series).trim() : null,
    locale: String(payload.locale || 'ko').trim() || 'ko',
    canonical_url: payload.canonical_url ? String(payload.canonical_url).trim() : null,
    images,
    content_blocks: payload.content_blocks ?? null,
    published_at:
      status === 'published'
        ? payload.published_at || new Date().toISOString()
        : payload.published_at || null,
    user_id: null,
    weather: payload.weather ? String(payload.weather) : 'GATEO',
  };

  if (status === 'published' && !normalized.canonical_url) {
    normalized.canonical_url = `https://www.gateo.kr/blog/e/${slug}`;
  }

  return { ok: errors.length === 0, errors, data: normalized };
}
