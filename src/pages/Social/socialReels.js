import catalog from './data/socialReels.json';
import { orderSocialCards, socialTargetHref } from './socialLinksView.js';

const KINDS = new Set(['mp4']);

/** Public R2 dev host. `VITE_GATEO_REELS_BASE_URL` replaces it (for example media.gateo.kr). */
export const DEFAULT_SOCIAL_REELS_BASE_URL = 'https://pub-aa06dc289a4b4c5a9d8d91c32bd81619.r2.dev';

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
      placeLabel: socialReelPlaceLabel(card),
      creditText: formatSocialReelCredit(reel.credit),
    });
  }
  return playlist;
}
