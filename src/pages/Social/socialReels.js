import catalog from './data/socialReels.json';
import { orderSocialCards, socialTargetHref } from './socialLinksView.js';

const KINDS = new Set(['mp4']);

/** Public reel host. `VITE_GATEO_REELS_BASE_URL` replaces it. */
export const DEFAULT_SOCIAL_REELS_BASE_URL = 'https://reels.findable.kr';

export function readSocialReelsBaseUrl() {
  const raw =
    import.meta.env?.VITE_GATEO_REELS_BASE_URL ?? globalThis.__VITE_ENV__?.VITE_GATEO_REELS_BASE_URL;
  const trimmed = String(raw ?? '').trim().replace(/\/+$/, '');
  return trimmed || DEFAULT_SOCIAL_REELS_BASE_URL;
}

export function resolveSocialReelUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = readSocialReelsBaseUrl().replace(/\/+$/, '');
  return `${base}/${value.replace(/^\/+/, '')}`;
}

/** @param {unknown} override */
export function readSocialReelCatalog(override) {
  if (Array.isArray(override)) return override;
  if (typeof window !== 'undefined' && Array.isArray(window.__GATEO_SOCIAL_REELS_FIXTURE__)) {
    return window.__GATEO_SOCIAL_REELS_FIXTURE__;
  }
  return Array.isArray(catalog?.reels) ? catalog.reels : [];
}

/** @param {unknown} entry */
export function normalizeSocialReel(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const campaignId = String(entry.campaignId || '').trim();
  const kind = String(entry.kind || '').trim();
  const src = String(entry.src || '').trim();
  if (!campaignId || !src || !KINDS.has(kind)) return null;
  const duration = Number(entry.durationSec);
  return {
    campaignId,
    kind,
    src: resolveSocialReelUrl(src),
    poster: resolveSocialReelUrl(entry.poster),
    durationSec: Number.isFinite(duration) && duration > 0 ? duration : null,
    credit: String(entry.credit || '').trim(),
  };
}

/** First valid row wins for a campaignId. */
export function indexSocialReels(entries) {
  const map = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const reel = normalizeSocialReel(entry);
    if (!reel || map.has(reel.campaignId)) continue;
    map.set(reel.campaignId, reel);
  }
  return map;
}

export function socialReelPlaceLabel(card) {
  return card?.targets?.[0]?.type === 'festival' ? '이 축제 보기' : '이 여행지 보기';
}

/** First target name, otherwise the card title (the place the reel is about). */
export function socialReelPlaceName(card) {
  const named = String(card?.targets?.[0]?.name || '').trim();
  if (named) return named;
  return String(card?.title || '').trim();
}

/** posted-links.md 상태 열이 live인 카드만 릴스에 넣어요. */
export function isLivePostedSocialCard(card) {
  return String(card?.status || '').trim().toLowerCase() === 'live';
}

export function formatSocialReelCredit(credit) {
  const text = String(credit || '').trim();
  if (!text) return '';
  if (text.startsWith('출처')) return text;
  return `출처: ${text}`;
}

const SOCIAL_REEL_LICENSE_INLINE_RE = /\(\s*공공누리\s*제\s*\d+\s*유형\s*\)/;

/**
 * KOGL attribution lines — 출처, 저작자, 라이선스, GATEO 편집. No ellipsis in the UI; each segment is its own block.
 * @returns {{ id: string, testId: string, text: string }[]}
 */
export function splitSocialReelCreditLines(credit) {
  const text = formatSocialReelCredit(credit);
  if (!text) return [];

  const lines = [];
  let remainder = text;
  const inlineLicense = remainder.match(SOCIAL_REEL_LICENSE_INLINE_RE);
  if (inlineLicense) {
    const licenseType = inlineLicense[0].replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    remainder = remainder.replace(inlineLicense[0], '').replace(/\s{2,}/g, ' ').trim();
    lines.push({
      id: 'license',
      testId: 'social-reel-credit-license',
      text: `라이선스: ${licenseType}`,
    });
  }

  for (const part of remainder.split(/\s*\|\s*/).map((chunk) => chunk.trim()).filter(Boolean)) {
    if (/^저작자:\s*/.test(part)) {
      lines.push({ id: 'author', testId: 'social-reel-credit-author', text: part });
    } else if (/^라이선스:\s*/.test(part)) {
      lines.push({ id: 'license', testId: 'social-reel-credit-license', text: part });
    } else if (/^GATEO\s*편집/.test(part)) {
      lines.push({ id: 'editorial', testId: 'social-reel-credit-editorial', text: part });
    } else {
      lines.push({ id: 'source', testId: 'social-reel-credit-source', text: part });
    }
  }

  const order = { source: 0, author: 1, license: 2, editorial: 3 };
  lines.sort((a, b) => order[a.id] - order[b.id]);
  return lines;
}

/** Card order (active, then ended). Unposted rows and reels without a live card are dropped. */
export function buildSocialReelPlaylist(cards, entries, now = new Date()) {
  const byId = indexSocialReels(entries);
  if (!byId.size) return [];
  const playlist = [];
  for (const card of orderSocialCards(cards, now)) {
    if (!isLivePostedSocialCard(card)) continue;
    const reel = byId.get(String(card?.campaignId || ''));
    if (!reel) continue;
    const target = card.targets?.[0];
    playlist.push({
      campaignId: reel.campaignId,
      reel,
      card,
      href: socialTargetHref(target),
      placeName: socialReelPlaceName(card),
      placeLabel: socialReelPlaceLabel(card),
      creditText: formatSocialReelCredit(reel.credit),
    });
  }
  return playlist;
}
