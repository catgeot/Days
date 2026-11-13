import editorialPublished from './logbookEditorialPublished.json' with { type: 'json' };
import { localInfoRegistry } from './placeVerifiedFacts/index.js';

/** 사람 검수·팩트·에디토리얼 기행문 연결 장소 — 무니 intro가 정적 요약을 덮지 않음 */
const EXPLICIT_LOCK_SLUGS = ['cairo', 'khao-lak', 'paris'];

function collectEditorialPlaceSlugs() {
  const slugs = [];
  for (const row of editorialPublished) {
    const slug = String(row?.place_slug || '').trim().toLowerCase();
    if (slug) slugs.push(slug);
  }
  return slugs;
}

const PLACE_INTRO_LOCKED_SLUG_SET = new Set([
  ...EXPLICIT_LOCK_SLUGS,
  ...Object.keys(localInfoRegistry),
  ...collectEditorialPlaceSlugs(),
]);

/** @type {readonly string[]} */
export const PLACE_INTRO_LOCKED_SLUGS = Object.freeze([...PLACE_INTRO_LOCKED_SLUG_SET].sort());

/** @param {string} slug */
export function isPlaceIntroLockedSlug(slug) {
  const normalized = String(slug ?? '').trim().toLowerCase();
  return Boolean(normalized && PLACE_INTRO_LOCKED_SLUG_SET.has(normalized));
}
