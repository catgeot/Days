import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUp,
  Bike,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Expand,
  ExternalLink,
  Landmark,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Route,
  Sparkles,
  Star,
  Utensils,
  X,
  Youtube,
} from 'lucide-react';
import {
  getThemeMembership,
  resolveThemeCrossLinks,
  resolveThemeSpotAreaCode,
  scenicHomePathForHubId,
} from '../Home/lib/koreaThemeCrossLinks';
import {
  buildThemeModulePath,
  pushThemeNavBack,
  themeNavBackEntryForSpot,
} from '../Home/lib/koreaThemeNavBack';
import { buildMooniBoundSpotFromLocation } from '../Home/lib/placeChatIntro';
import MooniBoundChatHost from '../Home/components/MooniBoundChatHost';
import { useLightboxPinchTransform } from '../../components/PlaceCard/common/useLightboxPinchTransform';
import { resetIosZoomAfterInput } from '../../shared/lib/mobileViewport';
import { fetchTourApiAttractionDetail } from '../../utils/fetchTourApiAttractionDetail';
import { fetchNearbyTourAttractions } from '../../utils/fetchNearbyTourAttractions';
import {
  fetchNearbyTourRestaurants,
  RESTAURANT_CONTENT_TYPE_ID,
} from '../../utils/fetchNearbyTourRestaurants';
import {
  CULTURE_CONTENT_TYPE_ID,
  fetchNearbyTourCulture,
  fetchNearbyTourLeports,
  LEPORTS_CONTENT_TYPE_ID,
} from '../../utils/fetchNearbyTourLeisureCulture';
import {
  fetchScenicSpotVideos,
  SCENIC_VIDEOS_MAX,
  SCENIC_VIDEOS_PAGE,
} from '../../utils/fetchScenicSpotVideos';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import { buildMrtTnaSearchMoreUrl } from '../../utils/fetchMrtTnas';
import { resolveTourAreaForHub } from '../Home/lib/koreaSigunguByHub';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import { useLocale } from '../../i18n/LocaleProvider';
import { scenicSpotMapTitle } from '../Home/lib/scenicSpotPlaceLabel.js';
import { localizedHubLabel } from '../../i18n/koreaRegionLabels';
import { fetchNearbyFestivals } from '../../utils/fetchNearbyFestivals';
import { detectSidoCode } from '../Korea/festivalRegionTags';

/** 본문·확대보기 — 가로 스와이프 vs 세로 스크롤·탭 */
const PHOTO_SWIPE_THRESHOLD_PX = 48;
const PHOTO_SWIPE_DIRECTION_RATIO = 1.25;

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function appendLocaleQuery(path, locale) {
  const raw = String(path || '').trim();
  if (!raw || !String(locale || '').startsWith('en')) return raw;
  const qIdx = raw.indexOf('?');
  const pathname = qIdx >= 0 ? raw.slice(0, qIdx) : raw;
  const params = new URLSearchParams(qIdx >= 0 ? raw.slice(qIdx + 1) : '');
  if (!params.has('lang')) params.set('lang', 'en');
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
function youtubeThumb(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

const MODULE_CHIP = {
  scenic: { path: '/korea/theme/scenic' },
};

const ACTIVE_MODULE_CHIPS = new Set(['scenic']);

function membershipDeepPath(moduleId, membership) {
  if (!membership) return MODULE_CHIP[moduleId]?.path || '/korea/theme/scenic';
  if (moduleId === 'scenic' && membership.scenic?.id) {
    return buildThemeModulePath('/korea/theme/scenic', {
      spotId: membership.scenic.id,
    });
  }
  return MODULE_CHIP[moduleId]?.path || '/korea/theme/scenic';
}

function CrossRailSection({ title, children }) {
  if (!children) return null;
  return (
    <section className="space-y-2 border-t border-stone-200/80 pt-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CrossChipButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:border-amber-300/80 hover:bg-amber-50"
    >
      {children}
    </button>
  );
}

function CrossTextButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-xl border border-stone-200/90 bg-white px-3 py-2 text-left text-sm font-semibold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50/50"
    >
      {children}
    </button>
  );
}

/**
 * §2.5.4 모달 하단 크로스 레일 — 매처는 koreaThemeCrossLinks만 사용.
 * 맛집·레포츠·문화 본문에서는 hub「인근 여행지」대신 DB 주변 관광지로 크로스.
 */
function ThemeSpotCrossRail({
  spot,
  detail,
  returnTo,
  onClose,
  onOpenSameHub,
  hideNearbyHubs = false,
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const crossSpot = useMemo(() => {
    if (!spot) return null;
    const fromDetailLat = Number(detail?.mapy);
    const fromDetailLng = Number(detail?.mapx);
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    const addr1 = String(detail?.addr1 || spot.addr1 || '').trim();
    const addr2 = String(detail?.addr2 || spot.addr2 || '').trim();
    return {
      hubId: spot.hubId,
      placeSlug: spot.placeSlug,
      name: spot.name,
      nameEn: spot.nameEn,
      region: spot.region,
      areaCode: spot.areaCode,
      areaLabel: spot.areaLabel,
      locality: spot.locality,
      addr1: addr1 || undefined,
      addr2: addr2 || undefined,
      lat: Number.isFinite(lat) ? lat : fromDetailLat,
      lng: Number.isFinite(lng) ? lng : fromDetailLng,
      mapx: detail?.mapx,
      mapy: detail?.mapy,
      contentId: spot.contentId,
    };
  }, [spot, detail]);

  const cross = useMemo(
    () => resolveThemeCrossLinks(crossSpot),
    [crossSpot],
  );

  const membership = useMemo(
    () => getThemeMembership(spot?.placeSlug),
    [spot?.placeSlug],
  );

  const backEntry = useMemo(
    () => themeNavBackEntryForSpot(spot, returnTo),
    [spot, returnTo],
  );

  const goThemePath = (to) => {
    if (!to) return;
    const dest = appendLocaleQuery(to, locale);
    // 축제 오버레이(`/korea`)에서 테마 모듈로 나갈 때만 시트 닫기.
    // 명승 홈에서는 closeModal이 spot query를 지워 deep-link와 경합할 수 있음.
    const leavingFestivalOverlay =
      String(returnTo || '').split('?')[0] === '/korea';
    if (backEntry) {
      pushThemeNavBack(backEntry);
      if (leavingFestivalOverlay) onClose?.();
      navigate(dest, { state: { themeBack: backEntry } });
      return;
    }
    if (leavingFestivalOverlay) onClose?.();
    navigate(dest);
  };

  const stayDisplayKeyword =
    localizedHubLabel(locale, { hubId: crossSpot?.hubId, name: cross.stay?.keyword }) ||
    cross.stay?.keyword ||
    '';
  const tnaDisplayKeyword =
    localizedHubLabel(locale, { hubId: crossSpot?.hubId, name: cross.tna?.keyword }) ||
    cross.tna?.keyword ||
    '';

  if (!spot || !cross) return null;

  const moduleChips = (cross.membership?.modules || [])
    .filter((id) => ACTIVE_MODULE_CHIPS.has(id))
    .map((id) => {
      const chip = MODULE_CHIP[id];
      if (!chip) return null;
      return {
        id,
        label: t('korea.theme.spotDetail.moduleScenic'),
        path: membershipDeepPath(id, membership),
      };
    })
    .filter(Boolean);

  const stayHref = cross.stay?.keyword
    ? getMrtAccommodationSearchUrl(cross.stay.keyword, { isDomestic: true })
    : '';
  const tnaHref = cross.tna?.keyword
    ? buildMrtTnaSearchMoreUrl(cross.tna.keyword)
    : '';

  const openNearbyScenicHome = (hub) => {
    const path =
      String(hub?.scenicPath || '').trim() ||
      scenicHomePathForHubId(hub?.hubId);
    if (!path) return;
    // 검색 모달이 열린 채 hub만 바뀌면 이전 검색어로 빈 결과가 남음
    const navState = { clearScenicSearch: true };
    if (backEntry) {
      pushThemeNavBack(backEntry);
      onClose?.();
      navigate(path, { state: { ...navState, themeBack: backEntry } });
      return;
    }
    onClose?.();
    navigate(path, { state: navState });
  };

  const showNearbyHubs = !hideNearbyHubs && cross.nearbyHubs.length > 0;

  const hasAny =
    moduleChips.length > 0 ||
    cross.sameHub.length > 0 ||
    showNearbyHubs ||
    stayHref ||
    tnaHref ||
    cross.deepLinks?.festivals ||
    cross.deepLinks?.courses ||
    cross.packageCta;

  if (!hasAny) return null;

  return (
    <div className="space-y-4" aria-label={t('korea.theme.spotDetail.crossRailAria')}>
      {moduleChips.length > 0 ? (
        <CrossRailSection title={t('korea.theme.spotDetail.crossThemeTitle')}>
          <div className="flex flex-wrap gap-1.5">
            {moduleChips.map((m) => (
              <CrossChipButton
                key={m.id + m.path}
                onClick={() => goThemePath(m.path)}
              >
                {m.label}
              </CrossChipButton>
            ))}
          </div>
        </CrossRailSection>
      ) : null}

      {cross.sameHub.length > 0 ? (
        <CrossRailSection title={t('korea.theme.spotDetail.crossSameHub')}>
          <ul className="space-y-1.5">
            {cross.sameHub.map((row) => (
              <li key={row.placeSlug}>
                <CrossTextButton
                  onClick={() => {
                    // 중첩 모달 우선 — 축제→명소 상세에서 deepPath로 명소홈 튕김 방지
                    if (row.modalSpot && onOpenSameHub) {
                      onOpenSameHub(row.modalSpot);
                      return;
                    }
                    if (row.deepPath) {
                      goThemePath(row.deepPath);
                      return;
                    }
                  }}
                >
                  {scenicSpotMapTitle(row.modalSpot || { name: row.name }, locale) ||
                    row.name}
                </CrossTextButton>
              </li>
            ))}
          </ul>
        </CrossRailSection>
      ) : null}

      {showNearbyHubs ? (
        <CrossRailSection title={t('korea.theme.spotDetail.crossNearbyHubs')}>
          <ul className="space-y-1.5">
            {cross.nearbyHubs.map((h) => (
              <li key={h.hubId}>
                <CrossTextButton onClick={() => openNearbyScenicHome(h)}>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-700" aria-hidden="true" />
                    {localizedHubLabel(locale, { hubId: h.hubId, name: h.name }) ||
                      h.name}
                    <span className="text-[11px] font-medium text-stone-500">
                      {t('korea.theme.spotDetail.scenicChip')}
                    </span>
                  </span>
                </CrossTextButton>
              </li>
            ))}
          </ul>
        </CrossRailSection>
      ) : null}

      {stayHref || tnaHref ? (
        <CrossRailSection title={t('korea.theme.spotDetail.crossStayTour')}>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {stayHref ? (
              <a
                href={stayHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 break-keep break-words"
              >
                {t('korea.theme.spotDetail.stayKeyword', {
                  keyword: stayDisplayKeyword,
                })}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
            {tnaHref ? (
              <a
                href={tnaHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100 break-keep break-words"
              >
                {t('korea.theme.spotDetail.tourKeyword', {
                  keyword: tnaDisplayKeyword,
                })}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </CrossRailSection>
      ) : null}

      <CrossRailSection title={t('korea.theme.spotDetail.crossFestivalsCourses')}>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => goThemePath(cross.deepLinks.festivals)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
          >
            <Sparkles size={13} className="text-amber-700" aria-hidden="true" />
            {t('korea.theme.spotDetail.festivalsInArea')}
          </button>
          <button
            type="button"
            onClick={() => goThemePath(cross.deepLinks.courses)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
          >
            <Route size={13} className="text-amber-700" aria-hidden="true" />
            {t('korea.theme.spotDetail.coursesInArea')}
          </button>
        </div>
      </CrossRailSection>

      {cross.packageCta?.url ? (
        <CrossRailSection title={t('korea.theme.spotDetail.crossPackages')}>
          <a
            href={cross.packageCta.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            {cross.packageCta.ctaLabel ||
              t('korea.theme.spotDetail.packageCtaFallback')}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </CrossRailSection>
      ) : null}
    </div>
  );
}

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** SSOT curated overview — TourAPI 부재 안내 문장은 사용자 본문에서 제거 */
function stripCuratedOverviewMeta(raw) {
  return String(raw || '')
    .replace(/[^.]*TourAPI[^.]*\./g, '')
    .replace(/[^.]*Tour\s*관광지[^.]*\./g, '')
    .replace(/[^.]*한국관광공사[^.]*상세가 없어[^.]*\./g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function cleanUrlCandidate(raw) {
  return String(raw || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .trim()
    .replace(/[),\];.'"”’]+$/g, '');
}

function normalizeHomepage(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';

  const href = s.match(/href=["']([^"']+)["']/i)?.[1];
  if (href) {
    const fromHref = cleanUrlCandidate(href);
    if (/^https?:\/\//i.test(fromHref)) return fromHref;
    if (/^[\w.-]+\.[\w.-]+/.test(fromHref)) return `https://${fromHref}`;
  }

  const urlInText = s.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (urlInText) return cleanUrlCandidate(urlInText);

  const candidate = cleanUrlCandidate(stripHtml(s));
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (/^[\w.-]+\.[\w.-]+(?:\/\S*)?$/.test(candidate)) {
    return `https://${candidate}`;
  }
  return '';
}

/**
 * @param {string} href
 * @param {import('i18next').TFunction} t
 */
function homepageDisplayLabel(href, t) {
  const raw = String(href || '').trim();
  if (!raw) return t('korea.theme.spotDetail.officialSite');
  let host = '';
  try {
    host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    host = raw
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .replace(/^www\./i, '')
      .toLowerCase();
  }
  if (!host) return t('korea.theme.spotDetail.officialSite');
  if (host.endsWith('heritage.go.kr') || host.endsWith('cha.go.kr')) {
    return t('korea.theme.spotDetail.officialHeritage');
  }
  if (host.endsWith('visitkorea.or.kr')) {
    return t('korea.theme.spotDetail.officialVisitKorea');
  }
  if (host.endsWith('mcst.go.kr')) return t('korea.theme.spotDetail.officialMcst');
  if (host.endsWith('korea.kr')) return t('korea.theme.spotDetail.officialKoreaKr');
  if (host.length > 40) return t('korea.theme.spotDetail.officialSite');
  return host;
}

function normalizeCompareText(raw) {
  return stripHtml(raw)
    .replace(/\s+/g, '')
    .toLowerCase();
}

function textsSimilarOrEqual(a, b) {
  const left = normalizeCompareText(a);
  const right = normalizeCompareText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 40 && right.includes(left)) return true;
  if (right.length >= 40 && left.includes(right)) return true;
  return false;
}

/** TourAPI 본문 — keep-all + 긴 URL·공백 없는 구간은 break-words로 가로 넘침 방지 */
const DETAIL_BODY_TEXT_CLASS =
  'min-w-0 max-w-full whitespace-pre-line leading-relaxed text-stone-700 break-keep break-words';

function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="min-w-0 space-y-1 text-sm">
      <dt className="text-[11px] font-bold tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className={DETAIL_BODY_TEXT_CLASS}>{children}</dd>
    </div>
  );
}

const INTRO_FIELD_KEYS = [
  'infocenter',
  'infocenterfood',
  'infocenterculture',
  'infocenterleports',
  'usetime',
  'opentimefood',
  'usetimeculture',
  'usetimeleports',
  'restdate',
  'restdatefood',
  'restdateculture',
  'restdateleports',
  'parking',
  'parkingfood',
  'parkingculture',
  'parkingleports',
  'usefee',
  'usefeeleports',
  'openperiod',
  'reservation',
  'firstmenu',
  'treatmenu',
  'reservationfood',
  'packing',
  'scalefood',
  'seatingtype',
  'smoking',
  'kidsfacility',
  'discountinfofood',
  'chkcreditcardfood',
  'useseason',
  'opendate',
  'expguide',
  'expagerange',
  'accomcount',
  'chkbabycarriage',
  'chkpet',
  'chkcreditcard',
];

function formatDistKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))}m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}

function foodPlaceLabel(spot) {
  return String(spot?.locality || spot?.region || '').trim();
}

/**
 * 네이버 검색 URL.
 * 맛집(동명 많음)만 지역+상호 · 관광지·명소·명승·레포츠·문화는 고유명만
 * (지역을 붙이면 본문/플레이스 직행이 깨지기 쉬움).
 * @param {{
 *   name?: string,
 *   locality?: string,
 *   region?: string,
 *   areaLabel?: string,
 *   contentTypeId?: string | null,
 * } | null} spot
 * @param {{ addr1?: string, addr2?: string } | null} [detail]
 */
function spotNaverSearchUrl(spot, detail) {
  const name = String(spot?.name || '').trim();
  if (!name) return '';
  const isFood =
    String(spot?.contentTypeId || '') === RESTAURANT_CONTENT_TYPE_ID;
  if (!isFood) {
    return `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`;
  }
  const locality = String(spot?.locality || '').trim();
  const areaLabel = String(spot?.areaLabel || '').trim();
  const region = String(spot?.region || '').trim();
  const addrHint = String(detail?.addr1 || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
  const place = locality || areaLabel || addrHint || region;
  const q = [place, name].filter(Boolean).join(' ');
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
}

function NaverOutboundButton({ href }) {
  const { t } = useTranslation();
  const url = String(href || '').trim();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('korea.theme.spotDetail.naverSearchAria')}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#03C75A]/50 bg-[#E8F9EF] px-2.5 py-1.5 text-xs font-bold text-[#027A38] transition-colors hover:border-[#03C75A]/75 hover:bg-[#D9F5E5]"
    >
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[#03C75A] text-[9px] font-black leading-none text-white"
        aria-hidden="true"
      >
        N
      </span>
      {t('korea.theme.spotDetail.naverSearch')}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

function toTypedModalSpot(spot, contentTypeId) {
  if (!spot) return null;
  const place = foodPlaceLabel(spot);
  return {
    id: spot.id || spot.contentId,
    name: spot.name,
    subtitle: [place, formatDistKm(spot.distKm)].filter(Boolean).join(' · '),
    blurb: spot.blurb,
    placeSlug: spot.placeSlug,
    contentId: spot.contentId,
    contentTypeId: contentTypeId || spot.contentTypeId || null,
    hubId: spot.hubId,
    region: spot.region,
    locality: spot.locality,
    areaLabel: spot.areaLabel,
    addr1: spot.addr1,
    addr2: spot.addr2,
    nameEn: spot.attractionNameEn || null,
    lat: spot.lat,
    lng: spot.lng,
    areaCode: spot.areaCode,
  };
}

function toFoodModalSpot(spot) {
  return toTypedModalSpot(spot, RESTAURANT_CONTENT_TYPE_ID);
}

function toAttractionModalSpot(spot) {
  return toTypedModalSpot(spot, '12');
}

function toLeportsModalSpot(spot) {
  return toTypedModalSpot(spot, LEPORTS_CONTENT_TYPE_ID);
}

function toCultureModalSpot(spot) {
  return toTypedModalSpot(spot, CULTURE_CONTENT_TYPE_ID);
}

/**
 * @param {{
 *   spot: {
 *     id: string,
 *     name: string,
 *     subtitle?: string,
 *     blurb?: string,
 *     placeSlug?: string | null,
 *     contentId?: string | null,
 *     contentTypeId?: string | null,
 *     hubId?: string | null,
 *     region?: string | null,
 *     areaCode?: string | number | null,
 *     nameEn?: string | null,
 *     lat?: number | null,
 *     lng?: number | null,
 *   } | null,
 *   eyebrow?: string,
 *   returnTo: string,
 *   onClose: () => void,
 *   overlayZClass?: string,
 *   favorited?: boolean,
 *   onToggleFavorite?: (spot: Record<string, unknown>) => void,
 * }} props
 */
export default function ThemeSpotDetailModal({
  spot,
  eyebrow,
  returnTo,
  onClose,
  overlayZClass = 'z-40',
  favorited = false,
  onToggleFavorite,
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const isEnglish = String(locale || '').startsWith('en');
  const koText = koreanApiTextProps(isEnglish);
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [nearbyFood, setNearbyFood] = useState([]);
  const [nearbyFoodStatus, setNearbyFoodStatus] = useState('idle');
  const [nearbyLeports, setNearbyLeports] = useState([]);
  const [nearbyLeportsStatus, setNearbyLeportsStatus] = useState('idle');
  const [nearbyCulture, setNearbyCulture] = useState([]);
  const [nearbyCultureStatus, setNearbyCultureStatus] = useState('idle');
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [nearbyAttractionsStatus, setNearbyAttractionsStatus] = useState('idle');
  const [nearbyFestivals, setNearbyFestivals] = useState([]);
  const [nearbyFestivalsStatus, setNearbyFestivalsStatus] = useState('idle');
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedLeports, setSelectedLeports] = useState(null);
  const [selectedCulture, setSelectedCulture] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [selectedSameHub, setSelectedSameHub] = useState(null);
  const [videosOpen, setVideosOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState('');
  const [videosLoadedFor, setVideosLoadedFor] = useState('');
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [mooniOpen, setMooniOpen] = useState(false);
  const [mooniBound, setMooniBound] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heroSwipeStartRef = useRef(null);
  const suppressHeroTapRef = useRef(false);
  const lightboxSwipeStartRef = useRef(null);

  const spotType = String(spot?.contentTypeId || '');
  const isRestaurant = spotType === RESTAURANT_CONTENT_TYPE_ID;
  const isLeports = spotType === LEPORTS_CONTENT_TYPE_ID;
  const isCulture = spotType === CULTURE_CONTENT_TYPE_ID;
  const isApiPoiCross = isRestaurant || isLeports || isCulture;
  const nestedChildZ =
    overlayZClass === 'z-50' || overlayZClass === 'z-[50]'
      ? 'z-[55]'
      : 'z-50';
  const lightboxZ =
    overlayZClass === 'z-50' || overlayZClass === 'z-[50]'
      ? 'z-[60]'
      : 'z-[55]';

  const imageUrls = useMemo(() => {
    const heroUrl = toHttps(detail?.imageUrl);
    const gallery = Array.isArray(detail?.galleryUrls)
      ? detail.galleryUrls.map(toHttps).filter(Boolean)
      : [];
    const out = [];
    const seen = new Set();
    for (const url of [heroUrl, ...gallery]) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  }, [detail]);

  const {
    transformStyle: lightboxTransformStyle,
    isZoomed: isLightboxZoomed,
    reset: resetLightboxPinch,
    onPinchTouchStart,
    onPinchTouchMove,
    onPinchTouchEnd,
    onPinchTouchCancel,
  } = useLightboxPinchTransform(activeImage);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    resetLightboxPinch();
    resetIosZoomAfterInput();
  }, [resetLightboxPinch]);

  const openLightboxAt = useCallback(
    (index) => {
      if (!imageUrls.length) return;
      const next = Math.max(0, Math.min(imageUrls.length - 1, Number(index) || 0));
      setActiveImage(next);
      setLightboxOpen(true);
    },
    [imageUrls.length],
  );

  const stepLightbox = useCallback(
    (delta) => {
      if (imageUrls.length < 2) return;
      setActiveImage((i) => (i + delta + imageUrls.length) % imageUrls.length);
    },
    [imageUrls.length],
  );

  const consumeHorizontalSwipe = useCallback(
    (start, endX, endY) => {
      if (!start || imageUrls.length < 2) return false;
      const dx = endX - start.x;
      const dy = endY - start.y;
      if (Math.abs(dx) < PHOTO_SWIPE_THRESHOLD_PX) return false;
      if (Math.abs(dx) < Math.abs(dy) * PHOTO_SWIPE_DIRECTION_RATIO) return false;
      stepLightbox(dx > 0 ? -1 : 1);
      return true;
    },
    [imageUrls.length, stepLightbox],
  );

  const onHeroTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    heroSwipeStartRef.current = { x: t.clientX, y: t.clientY };
    suppressHeroTapRef.current = false;
  }, []);

  const onHeroTouchEnd = useCallback(
    (e) => {
      const start = heroSwipeStartRef.current;
      heroSwipeStartRef.current = null;
      const t = e.changedTouches?.[0];
      if (!t) return;
      if (consumeHorizontalSwipe(start, t.clientX, t.clientY)) {
        suppressHeroTapRef.current = true;
      }
    },
    [consumeHorizontalSwipe],
  );

  const onHeroTouchCancel = useCallback(() => {
    heroSwipeStartRef.current = null;
  }, []);

  const onLightboxTouchStart = useCallback(
    (e) => {
      onPinchTouchStart(e);
      if (e.touches.length !== 1 || isLightboxZoomed()) {
        lightboxSwipeStartRef.current = null;
        return;
      }
      const t = e.touches[0];
      lightboxSwipeStartRef.current = { x: t.clientX, y: t.clientY };
    },
    [isLightboxZoomed, onPinchTouchStart],
  );

  const onLightboxTouchEnd = useCallback(
    (e) => {
      onPinchTouchEnd(e);
      const start = lightboxSwipeStartRef.current;
      lightboxSwipeStartRef.current = null;
      if (!start || isLightboxZoomed()) return;
      const t = e.changedTouches?.[0];
      if (!t) return;
      consumeHorizontalSwipe(start, t.clientX, t.clientY);
    },
    [consumeHorizontalSwipe, isLightboxZoomed, onPinchTouchEnd],
  );

  const onLightboxTouchCancel = useCallback(() => {
    onPinchTouchCancel();
    lightboxSwipeStartRef.current = null;
  }, [onPinchTouchCancel]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (mooniOpen) {
          setMooniOpen(false);
          setMooniBound(null);
          return;
        }
        if (lightboxOpen) {
          closeLightbox();
          return;
        }
        if (videosOpen) {
          setVideosOpen(false);
          return;
        }
        if (
          selectedFood ||
          selectedLeports ||
          selectedCulture ||
          selectedAttraction
        ) {
          return;
        }
        onClose();
        return;
      }
      if (!lightboxOpen || imageUrls.length < 2) return;
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      else if (event.key === 'ArrowRight') stepLightbox(1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [
    onClose,
    mooniOpen,
    lightboxOpen,
    closeLightbox,
    videosOpen,
    imageUrls.length,
    stepLightbox,
    selectedFood,
    selectedLeports,
    selectedCulture,
    selectedAttraction,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setVideosOpen(false);
    setVideos([]);
    setVideosError('');
    setVideosLoadedFor('');
    setVideosExpanded(false);
    setVideosLoading(false);
    setActiveImage(0);
    setLightboxOpen(false);
    resetLightboxPinch();
  }, [spot?.id, resetLightboxPinch]);

  useEffect(() => {
    if (activeImage >= imageUrls.length) {
      setActiveImage(0);
    }
  }, [activeImage, imageUrls.length]);

  useEffect(() => {
    if (!spot) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError('');
      return undefined;
    }

    if (spot.source === 'cha') {
      const overview = String(spot.content || spot.blurb || '').trim();
      const imageUrl = String(spot.imageUrl || '').trim() || null;
      const galleryFromSpot = Array.isArray(spot.galleryUrls)
        ? spot.galleryUrls.map((u) => String(u || '').trim()).filter(Boolean)
        : [];
      const galleryUrls = [...galleryFromSpot];
      if (imageUrl && !galleryUrls.includes(imageUrl)) galleryUrls.unshift(imageUrl);
      const addr1 = String(spot.addr1 || '').trim() || null;
      const homepage = String(spot.homepage || '').trim() || null;
      const heritageMeta = [
        spot.designationNo
          ? {
              labelKey: 'heritageDesignationNo',
              text: t('korea.theme.spotDetail.heritageDesignationNoValue', {
                no: spot.designationNo,
              }),
            }
          : null,
        spot.nameHanja
          ? { labelKey: 'heritageHanja', text: String(spot.nameHanja) }
          : null,
        spot.designatedAt
          ? { labelKey: 'heritageDesignatedAt', text: String(spot.designatedAt) }
          : null,
        spot.heritageType || spot.heritageKind || spot.category
          ? {
              labelKey: 'heritageCategory',
              text: [spot.heritageType, spot.heritageKind, spot.category, spot.subCategory]
                .filter(Boolean)
                .join(' · '),
            }
          : null,
        spot.quantity
          ? { labelKey: 'heritageArea', text: String(spot.quantity) }
          : null,
        spot.owner ? { labelKey: 'heritageOwner', text: String(spot.owner) } : null,
        spot.manager
          ? { labelKey: 'heritageManager', text: String(spot.manager) }
          : null,
      ].filter(Boolean);
      setDetail({
        title: spot.name,
        overview: overview || null,
        imageUrl: imageUrl || galleryUrls[0] || null,
        galleryUrls,
        addr1,
        addr2: null,
        homepage,
        tel: null,
        mapx: Number.isFinite(Number(spot.lng)) ? Number(spot.lng) : null,
        mapy: Number.isFinite(Number(spot.lat)) ? Number(spot.lat) : null,
        heritageMeta,
      });
      setDetailLoading(false);
      setDetailError('');
      return undefined;
    }

    const contentId = String(spot.contentId || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) {
      // Tour contentId 부재 — SSOT overview가 있으면 LIVE 대신 GATEO 안내 본문
      const curatedOverview = stripCuratedOverviewMeta(spot.overview);
      if (curatedOverview) {
        const imageUrl = String(spot.imageUrl || '').trim() || null;
        const galleryFromSpot = Array.isArray(spot.galleryUrls)
          ? spot.galleryUrls.map((u) => String(u || '').trim()).filter(Boolean)
          : [];
        const galleryUrls = [...galleryFromSpot];
        if (imageUrl && !galleryUrls.includes(imageUrl)) {
          galleryUrls.unshift(imageUrl);
        }
        setDetail({
          title: spot.name,
          overview: curatedOverview,
          imageUrl: imageUrl || galleryUrls[0] || null,
          galleryUrls,
          addr1: spot.addr1 || null,
          addr2: null,
          homepage: spot.homepage || null,
          tel: null,
          mapx: Number.isFinite(Number(spot.lng)) ? Number(spot.lng) : null,
          mapy: Number.isFinite(Number(spot.lat)) ? Number(spot.lat) : null,
          heritageMeta: null,
          intro: null,
          infoItems: [],
          curated: true,
        });
      } else {
        setDetail(null);
      }
      setDetailLoading(false);
      setDetailError('');
      return undefined;
    }

    let cancelled = false;
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);

    (async () => {
      const data = await fetchTourApiAttractionDetail({
        contentId,
        contentTypeId: spot.contentTypeId || undefined,
      });
      if (cancelled) return;
      setDetailLoading(false);
      if (!data) {
        setDetail(null);
        setDetailError(t('korea.theme.spotDetail.detailLoadError'));
        return;
      }
      setDetail(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    spot?.id,
    spot?.contentId,
    spot?.contentTypeId,
    spot?.source,
    spot?.content,
    spot?.blurb,
    spot?.overview,
    spot?.imageUrl,
    spot?.galleryUrls,
    spot?.addr1,
    spot?.homepage,
    spot?.lat,
    spot?.lng,
    spot?.name,
    spot?.nameHanja,
    spot?.designatedAt,
    spot?.designationNo,
    spot?.quantity,
    spot?.heritageType,
    spot?.heritageKind,
    spot?.category,
    spot?.subCategory,
    spot?.owner,
    spot?.manager,
    t,
  ]);

  useEffect(() => {
    setSelectedFood(null);
    setSelectedLeports(null);
    setSelectedCulture(null);
    setSelectedAttraction(null);
    setSelectedSameHub(null);
    if (!spot) {
      setNearbyFood([]);
      setNearbyFoodStatus('idle');
      setNearbyLeports([]);
      setNearbyLeportsStatus('idle');
      setNearbyCulture([]);
      setNearbyCultureStatus('idle');
      setNearbyAttractions([]);
      setNearbyAttractionsStatus('idle');
      setNearbyFestivals([]);
      setNearbyFestivalsStatus('idle');
      return undefined;
    }

    const fromDetailLat = Number(detail?.mapy);
    const fromDetailLng = Number(detail?.mapx);
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    const useLat = Number.isFinite(lat) ? lat : fromDetailLat;
    const useLng = Number.isFinite(lng) ? lng : fromDetailLng;

    if (isApiPoiCross) {
      setNearbyFood([]);
      setNearbyFoodStatus('idle');
      setNearbyLeports([]);
      setNearbyLeportsStatus('idle');
      setNearbyCulture([]);
      setNearbyCultureStatus('idle');
      if (!Number.isFinite(useLat) || !Number.isFinite(useLng)) {
        setNearbyAttractions([]);
        setNearbyAttractionsStatus(detailLoading ? 'idle' : 'nocoords');
        return undefined;
      }
      let cancelled = false;
      setNearbyAttractionsStatus('loading');
      fetchNearbyTourAttractions({
        lat: useLat,
        lng: useLng,
        radiusKm: 8,
        limit: 8,
      }).then((res) => {
        if (cancelled) return;
        const spots = Array.isArray(res?.spots) ? res.spots : [];
        setNearbyAttractions(spots);
        if (res?.error) setNearbyAttractionsStatus('error');
        else if (!spots.length) setNearbyAttractionsStatus('empty');
        else setNearbyAttractionsStatus('ok');
      });
      return () => {
        cancelled = true;
      };
    }

    setNearbyAttractions([]);
    setNearbyAttractionsStatus('idle');
    if (!Number.isFinite(useLat) || !Number.isFinite(useLng)) {
      setNearbyFood([]);
      setNearbyFoodStatus(detailLoading ? 'idle' : 'nocoords');
      setNearbyLeports([]);
      setNearbyLeportsStatus(detailLoading ? 'idle' : 'nocoords');
      setNearbyCulture([]);
      setNearbyCultureStatus(detailLoading ? 'idle' : 'nocoords');
      return undefined;
    }

    const tourArea = resolveTourAreaForHub(spot.hubId);
    const areaCode = tourArea?.areaCode || null;
    const sigunguCode = tourArea?.sigunguCode || null;

    let cancelled = false;
    setNearbyFoodStatus('loading');
    setNearbyLeportsStatus('loading');
    setNearbyCultureStatus('loading');
    fetchNearbyTourRestaurants({
      lat: useLat,
      lng: useLng,
      radiusKm: 3,
      limit: 6,
      areaCode,
      sigunguCode,
    }).then((res) => {
      if (cancelled) return;
      const spots = Array.isArray(res?.spots) ? res.spots : [];
      setNearbyFood(spots);
      if (res?.error) setNearbyFoodStatus('error');
      else if (!spots.length) setNearbyFoodStatus('empty');
      else setNearbyFoodStatus('ok');
    });
    fetchNearbyTourLeports({
      lat: useLat,
      lng: useLng,
      radiusKm: 5,
      limit: 5,
      areaCode,
      sigunguCode,
    }).then((res) => {
      if (cancelled) return;
      const spots = Array.isArray(res?.spots) ? res.spots : [];
      setNearbyLeports(spots);
      if (res?.error) setNearbyLeportsStatus('error');
      else if (!spots.length) setNearbyLeportsStatus('empty');
      else setNearbyLeportsStatus('ok');
    });
    fetchNearbyTourCulture({
      lat: useLat,
      lng: useLng,
      radiusKm: 5,
      limit: 5,
      areaCode,
      sigunguCode,
    }).then((res) => {
      if (cancelled) return;
      const spots = Array.isArray(res?.spots) ? res.spots : [];
      setNearbyCulture(spots);
      if (res?.error) setNearbyCultureStatus('error');
      else if (!spots.length) setNearbyCultureStatus('empty');
      else setNearbyCultureStatus('ok');
    });

    return () => {
      cancelled = true;
    };
  }, [
    spot?.id,
    spot?.lat,
    spot?.lng,
    spot?.hubId,
    spot?.contentTypeId,
    isApiPoiCross,
    detail?.mapx,
    detail?.mapy,
    detailLoading,
  ]);

  useEffect(() => {
    if (!spot || isApiPoiCross) {
      setNearbyFestivals([]);
      setNearbyFestivalsStatus('idle');
      return undefined;
    }

    const fromDetailLat = Number(detail?.mapy);
    const fromDetailLng = Number(detail?.mapx);
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    const useLat = Number.isFinite(lat) ? lat : fromDetailLat;
    const useLng = Number.isFinite(lng) ? lng : fromDetailLng;
    const areaCode = String(
      spot.areaCode || resolveThemeSpotAreaCode(spot) || detectSidoCode(spot.addr1) || '',
    ).trim();
    const hasCoords =
      Number.isFinite(useLat) &&
      Number.isFinite(useLng) &&
      !(useLat === 0 && useLng === 0);

    if (!areaCode && !hasCoords) {
      setNearbyFestivals([]);
      setNearbyFestivalsStatus(detailLoading ? 'idle' : 'nocoords');
      return undefined;
    }

    let cancelled = false;
    setNearbyFestivalsStatus('loading');
    fetchNearbyFestivals({
      lat: hasCoords ? useLat : undefined,
      lng: hasCoords ? useLng : undefined,
      areaCode: areaCode || undefined,
      radiusKm: 50,
      limit: 6,
    }).then((res) => {
      if (cancelled) return;
      const list = Array.isArray(res?.festivals) ? res.festivals : [];
      setNearbyFestivals(list);
      if (res?.error) setNearbyFestivalsStatus('error');
      else if (!list.length) setNearbyFestivalsStatus('empty');
      else setNearbyFestivalsStatus('ok');
    });

    return () => {
      cancelled = true;
    };
  }, [
    spot?.id,
    spot?.lat,
    spot?.lng,
    spot?.areaCode,
    spot?.addr1,
    spot?.hubId,
    isApiPoiCross,
    detail?.mapx,
    detail?.mapy,
    detailLoading,
  ]);

  const overview = useMemo(
    () => stripHtml(detail?.overview || ''),
    [detail?.overview],
  );

  const homepage = useMemo(
    () => normalizeHomepage(detail?.homepage),
    [detail?.homepage],
  );

  const address = useMemo(() => {
    const a1 = String(detail?.addr1 || '').trim();
    const a2 = String(detail?.addr2 || '').trim();
    return [a1, a2].filter(Boolean).join(' ');
  }, [detail?.addr1, detail?.addr2]);

  const naverSearchUrl = useMemo(
    () => spotNaverSearchUrl(spot, detail),
    [spot, detail],
  );

  const tel = String(detail?.tel || '').trim();

  const introRows = useMemo(() => {
    const intro = detail?.intro;
    if (!intro) return [];
    return INTRO_FIELD_KEYS.map((key) => ({
      key,
      label: t(`korea.theme.spotDetail.introFields.${key}`),
      text: stripHtml(intro[key] || ''),
    })).filter((row) => row.text);
  }, [detail?.intro, t]);

  const infoSections = useMemo(() => {
    const rows = (detail?.infoItems || [])
      .map((row) => ({
        name: stripHtml(row?.infoname || ''),
        text: stripHtml(row?.infotext || ''),
      }))
      .filter((row) => row.name || row.text);

    const out = [];
    for (const row of rows) {
      if (
        (row.name.includes('개요') || row.name.includes('소개')) &&
        overview &&
        textsSimilarOrEqual(row.text, overview)
      ) {
        continue;
      }
      out.push(row);
    }
    return out;
  }, [detail?.infoItems, overview]);

  useEffect(() => {
    if (!videosOpen || !spot?.name) return;
    const contentId = String(spot.contentId || '').trim();
    const cacheKey =
      String(spot.placeSlug || spot.hubId || spot.id || '').trim() || '';
    const loadKey = /^\d{1,32}$/.test(contentId) ? contentId : cacheKey;
    if (!loadKey || videosLoadedFor === loadKey) return;

    let cancelled = false;
    setVideosLoading(true);
    setVideosError('');

    (async () => {
      const result = await fetchScenicSpotVideos({
        contentId: /^\d{1,32}$/.test(contentId) ? contentId : null,
        title: String(spot.name),
        titleEn: spot.nameEn || null,
        cacheKey: cacheKey || null,
      });
      if (cancelled) return;
      setVideosLoadedFor(loadKey);
      setVideosLoading(false);
      setVideosExpanded(false);
      if (!result.ok) {
        setVideos([]);
        setVideosError(t('korea.theme.spotDetail.videosNotFound'));
        return;
      }
      const list = Array.isArray(result.videos)
        ? result.videos.slice(0, SCENIC_VIDEOS_MAX)
        : [];
      setVideos(list);
      if (!list.length) {
        setVideosError(t('korea.theme.spotDetail.videosNotFound'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    videosOpen,
    spot?.name,
    spot?.nameEn,
    spot?.contentId,
    spot?.placeSlug,
    spot?.hubId,
    spot?.id,
    videosLoadedFor,
    t,
  ]);

  if (!spot) return null;

  const modalEyebrow =
    eyebrow || t('korea.theme.spotDetail.eyebrowDefault');
  const displayTitle =
    scenicSpotMapTitle(spot, locale) ||
    t('korea.theme.spotDetail.fallbackTitle');
  const hasContentId = /^\d{1,32}$/.test(String(spot.contentId || '').trim());
  const hero = imageUrls[activeImage] || imageUrls[0] || '';
  const galleryList = imageUrls;

  const openFestival = (fest) => {
    const festId = String(fest?.contentId || '').trim();
    if (!festId) return;
    const areaCode = String(
      spot.areaCode || resolveThemeSpotAreaCode(spot) || '',
    ).trim();
    const params = new URLSearchParams();
    params.set('from', 'theme');
    if (areaCode) params.set('area', areaCode);
    params.set('festival', festId);
    if (isEnglish) params.set('lang', 'en');
    const backEntry = themeNavBackEntryForSpot(spot, returnTo);
    if (backEntry) pushThemeNavBack(backEntry);
    onClose?.();
    navigate(`/korea?${params.toString()}`);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMooni = () => {
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    const fromDetailLat = Number(detail?.mapy);
    const fromDetailLng = Number(detail?.mapx);
    const boundSpot = buildMooniBoundSpotFromLocation({
      name: spot.name,
      slug: spot.placeSlug || spot.hubId || null,
      name_en: spot.nameEn || null,
      country: '대한민국',
      country_en: 'South Korea',
      lat: Number.isFinite(lat)
        ? lat
        : Number.isFinite(fromDetailLat)
          ? fromDetailLat
          : null,
      lng: Number.isFinite(lng)
        ? lng
        : Number.isFinite(fromDetailLng)
          ? fromDetailLng
          : null,
    });
    if (!boundSpot?.name) return;
    setMooniBound(boundSpot);
    setMooniOpen(true);
  };

  const visibleVideos = videosExpanded
    ? videos
    : videos.slice(0, SCENIC_VIDEOS_PAGE);
  const canLoadMoreVideos =
    !videosLoading &&
    !videosExpanded &&
    videos.length > SCENIC_VIDEOS_PAGE;

  return (
    <div
      className={`fixed inset-0 ${overlayZClass} flex items-stretch justify-center bg-stone-900/40 backdrop-blur-[2px] p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] md:items-center md:p-5`}
      onClick={(e) => {
        e.stopPropagation();
        if (mooniOpen || videosOpen || lightboxOpen) return;
        onClose();
      }}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl md:h-auto md:max-h-[min(90dvh,52rem)] md:max-w-2xl md:rounded-3xl lg:max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="korea-theme-spot-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {modalEyebrow}
            </p>
            <h2
              id="korea-theme-spot-modal-title"
              className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
              {...koText}
            >
              {displayTitle}
            </h2>
            {spot.subtitle ? (
              <p className="mt-1 text-xs text-stone-500 break-keep" {...koText}>
                {spot.subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {onToggleFavorite ? (
              <button
                type="button"
                onClick={() => onToggleFavorite(spot)}
                aria-label={
                  favorited
                    ? t('korea.common.favoriteRemove')
                    : t('korea.common.favoriteAdd')
                }
                aria-pressed={favorited}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
              >
                <Star
                  size={16}
                  className={
                    favorited
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-stone-400'
                  }
                  aria-hidden="true"
                />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('korea.common.close')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar"
        >
          {hero ? (
            <button
              type="button"
              onClick={() => {
                if (suppressHeroTapRef.current) {
                  suppressHeroTapRef.current = false;
                  return;
                }
                openLightboxAt(activeImage);
              }}
              onTouchStart={onHeroTouchStart}
              onTouchEnd={onHeroTouchEnd}
              onTouchCancel={onHeroTouchCancel}
              className="group relative block w-full touch-pan-y text-left"
              aria-label={
                imageUrls.length > 1
                  ? t('korea.theme.spotDetail.heroExpandSwipe')
                  : t('korea.theme.spotDetail.heroExpand')
              }
            >
              <img
                src={hero}
                alt=""
                draggable={false}
                className="aspect-[16/9] w-full object-cover pointer-events-none select-none sm:aspect-[2/1]"
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-stone-900/55 px-2.5 py-1 text-[11px] font-bold text-white opacity-95 group-hover:bg-stone-900/70">
                <Expand size={13} aria-hidden="true" />
                {t('korea.theme.spotDetail.expandView')}
              </span>
              {imageUrls.length > 1 ? (
                <span className="absolute bottom-3 right-3 rounded-full bg-stone-900/55 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  {activeImage + 1}/{imageUrls.length}
                </span>
              ) : null}
            </button>
          ) : (
            <div
              className={`flex aspect-[16/9] w-full items-center justify-center sm:aspect-[2/1] ${
                isRestaurant
                  ? 'bg-orange-50 text-orange-800'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {isRestaurant ? (
                <Utensils size={28} aria-hidden="true" />
              ) : (
                <Landmark size={28} aria-hidden="true" />
              )}
            </div>
          )}

          <div className="min-w-0 space-y-4 px-4 py-4 sm:px-5">
            {spot.source !== 'cha' && spot.blurb ? (
              <p
                className="text-sm font-semibold leading-relaxed text-amber-950/90 break-keep break-words"
                {...koText}
              >
                {spot.blurb}
              </p>
            ) : null}

            {detailLoading ? (
              <p className="text-xs text-stone-500">
                {t('korea.theme.spotDetail.loadingDetail')}
              </p>
            ) : null}

            {!detailLoading && hasContentId && detailError ? (
              <p className="text-xs text-stone-500 break-keep">{detailError}</p>
            ) : null}

            {!detailLoading &&
            !hasContentId &&
            !detail &&
            spot.source !== 'cha' ? (
              <p className="text-xs text-stone-500 break-keep">
                {t('korea.theme.spotDetail.noTourDetailHint')}
              </p>
            ) : null}

            {!detailLoading && detail ? (
              <dl className="min-w-0 space-y-4">
                {overview ? (
                  <DetailRow label={t('korea.theme.spotDetail.labelOverview')}>
                    <span {...koText}>{overview}</span>
                  </DetailRow>
                ) : null}
                {naverSearchUrl ? (
                  <div className="min-w-0">
                    <NaverOutboundButton href={naverSearchUrl} />
                  </div>
                ) : null}
                {Array.isArray(detail.heritageMeta)
                  ? detail.heritageMeta.map((row) => (
                      <DetailRow
                        key={row.labelKey}
                        label={t(`korea.theme.spotDetail.${row.labelKey}`)}
                      >
                        <span {...koText}>{row.text}</span>
                      </DetailRow>
                    ))
                  : null}
                {address ? (
                  <DetailRow label={t('korea.theme.spotDetail.labelAddress')}>
                    <span {...koText}>{address}</span>
                  </DetailRow>
                ) : null}
                {tel ? (
                  <DetailRow label={t('korea.theme.spotDetail.labelPhone')}>
                    <a
                      href={`tel:${tel.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {tel}
                    </a>
                  </DetailRow>
                ) : null}
                {homepage ? (
                  <DetailRow label={t('korea.theme.spotDetail.labelHomepage')}>
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={homepage}
                      className="inline-flex max-w-full min-w-0 items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline break-keep break-words"
                    >
                      {homepageDisplayLabel(homepage, t)}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </DetailRow>
                ) : null}
                {introRows.map((row) => (
                  <DetailRow key={row.key} label={row.label}>
                    <span {...koText}>{row.text}</span>
                  </DetailRow>
                ))}
                {infoSections.map((row, idx) => (
                  <DetailRow
                    key={`${row.name || 'info'}-${idx}`}
                    label={row.name || t('korea.theme.spotDetail.labelInfoFallback')}
                  >
                    <span {...koText}>{row.text}</span>
                  </DetailRow>
                ))}
              </dl>
            ) : null}

            {(detailLoading || !detail) && naverSearchUrl ? (
              <NaverOutboundButton href={naverSearchUrl} />
            ) : null}

            {galleryList.length > 0 ? (
              <div className="space-y-2" aria-label={t('korea.theme.spotDetail.photosAria')}>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  {t('korea.theme.spotDetail.photosCount', {
                    count: galleryList.length,
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {galleryList.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => openLightboxAt(index)}
                      className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                      aria-label={t('korea.theme.spotDetail.photoExpandAria', {
                        index: index + 1,
                      })}
                    >
                      <img
                        src={url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <section className="space-y-2 border-t border-stone-200/80 pt-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                {t('korea.theme.spotDetail.readMore')}
              </h3>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={openMooni}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  {t('korea.theme.spotDetail.askMooni')}
                </button>
                <button
                  type="button"
                  onClick={() => setVideosOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
                >
                  <Youtube size={15} className="text-red-600" aria-hidden="true" />
                  {t('korea.theme.spotDetail.youtubeVideos')}
                </button>
              </div>
            </section>

            {!isApiPoiCross &&
              nearbyFoodStatus !== 'idle' &&
              nearbyFoodStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {t('korea.theme.spotDetail.nearFood')}
                  </h3>
                  {nearbyFoodStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.spotDetail.nearFoodLoading')}
                    </div>
                  )}
                  {nearbyFoodStatus === 'error' && nearbyFood.length === 0 && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearFoodError')}
                    </p>
                  )}
                  {nearbyFoodStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearFoodEmpty')}
                    </p>
                  )}
                  {nearbyFood.length > 0 && (
                    <ul className="space-y-2" aria-label={t('korea.theme.spotDetail.nearFoodAria')}>
                      {nearbyFood.map((food) => {
                        const thumb = toHttps(food.firstImage);
                        const dist = formatDistKm(food.distKm);
                        const place = foodPlaceLabel(food);
                        return (
                          <li key={food.contentId || food.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedFood(food)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800">
                                  <Utensils size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {food.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

            {!isApiPoiCross &&
              nearbyLeportsStatus !== 'idle' &&
              nearbyLeportsStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {t('korea.theme.spotDetail.nearLeports')}
                  </h3>
                  {nearbyLeportsStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.spotDetail.nearLeportsLoading')}
                    </div>
                  )}
                  {nearbyLeportsStatus === 'error' &&
                    nearbyLeports.length === 0 && (
                      <p className="text-xs text-stone-500">
                        {t('korea.theme.spotDetail.nearLeportsError')}
                      </p>
                    )}
                  {nearbyLeportsStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearLeportsEmpty')}
                    </p>
                  )}
                  {nearbyLeports.length > 0 && (
                    <ul className="space-y-2" aria-label={t('korea.theme.spotDetail.nearLeportsAria')}>
                      {nearbyLeports.map((row) => {
                        const thumb = toHttps(row.firstImage);
                        const dist = formatDistKm(row.distKm);
                        const place = foodPlaceLabel(row);
                        return (
                          <li key={row.contentId || row.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedLeports(row)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                                  <Bike size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {row.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

            {!isApiPoiCross &&
              nearbyCultureStatus !== 'idle' &&
              nearbyCultureStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {t('korea.theme.spotDetail.nearCulture')}
                  </h3>
                  {nearbyCultureStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.spotDetail.nearCultureLoading')}
                    </div>
                  )}
                  {nearbyCultureStatus === 'error' &&
                    nearbyCulture.length === 0 && (
                      <p className="text-xs text-stone-500">
                        {t('korea.theme.spotDetail.nearCultureError')}
                      </p>
                    )}
                  {nearbyCultureStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearCultureEmpty')}
                    </p>
                  )}
                  {nearbyCulture.length > 0 && (
                    <ul className="space-y-2" aria-label={t('korea.theme.spotDetail.nearCultureAria')}>
                      {nearbyCulture.map((row) => {
                        const thumb = toHttps(row.firstImage);
                        const dist = formatDistKm(row.distKm);
                        const place = foodPlaceLabel(row);
                        return (
                          <li key={row.contentId || row.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedCulture(row)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                                  <Building2 size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {row.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

            {isApiPoiCross &&
              nearbyAttractionsStatus !== 'idle' &&
              nearbyAttractionsStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {t('korea.theme.spotDetail.nearAttractions')}
                  </h3>
                  {nearbyAttractionsStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.spotDetail.nearAttractionsLoading')}
                    </div>
                  )}
                  {nearbyAttractionsStatus === 'error' &&
                    nearbyAttractions.length === 0 && (
                      <p className="text-xs text-stone-500">
                        {t('korea.theme.spotDetail.nearAttractionsError')}
                      </p>
                    )}
                  {nearbyAttractionsStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearAttractionsEmpty')}
                    </p>
                  )}
                  {nearbyAttractions.length > 0 && (
                    <ul
                      className="space-y-2"
                      aria-label={t('korea.theme.spotDetail.nearAttractionsAria')}
                    >
                      {nearbyAttractions.map((attr) => {
                        const thumb = toHttps(attr.firstImage);
                        const dist = formatDistKm(attr.distKm);
                        const place = foodPlaceLabel(attr);
                        return (
                          <li key={attr.contentId || attr.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedAttraction(attr)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                                  <Landmark size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {attr.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

            {!isApiPoiCross &&
              nearbyFestivalsStatus !== 'idle' &&
              nearbyFestivalsStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    {t('korea.theme.spotDetail.nearFestivals')}
                  </h3>
                  {nearbyFestivalsStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.spotDetail.nearFestivalsLoading')}
                    </div>
                  )}
                  {nearbyFestivalsStatus === 'error' && nearbyFestivals.length === 0 && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearFestivalsError')}
                    </p>
                  )}
                  {nearbyFestivalsStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.spotDetail.nearFestivalsEmpty')}
                    </p>
                  )}
                  {nearbyFestivals.length > 0 && (
                    <ul
                      className="space-y-2"
                      aria-label={t('korea.theme.spotDetail.nearFestivalsAria')}
                    >
                      {nearbyFestivals.map((fest) => {
                        const thumbFest = toHttps(fest.firstImage);
                        const dist = formatDistKm(fest.distKm);
                        const when = [
                          formatYmdLabel(fest.eventStartDate),
                          formatYmdLabel(fest.eventEndDate),
                        ]
                          .filter(Boolean)
                          .join('–');
                        const place = String(fest.locality || fest.region || '').trim();
                        return (
                          <li key={fest.contentId}>
                            <button
                              type="button"
                              onClick={() => openFestival(fest)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumbFest ? (
                                <img
                                  src={thumbFest}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
                                  <CalendarDays size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span
                                    className="text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep"
                                    {...koText}
                                  >
                                    {fest.title || fest.name}
                                  </span>
                                  {dist ? (
                                    <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-600">
                                      {dist}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 break-keep" {...koText}>
                                  {[place, when].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}

            <ThemeSpotCrossRail
              spot={spot}
              detail={detail}
              returnTo={returnTo}
              onClose={onClose}
              onOpenSameHub={setSelectedSameHub}
              hideNearbyHubs={isApiPoiCross}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-stone-200/80 bg-white px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-100"
          >
            <ArrowUp size={16} aria-hidden="true" />
            {t('korea.common.scrollToTop')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <X size={16} aria-hidden="true" />
            {t('korea.theme.spotDetail.close')}
          </button>
        </div>
      </div>

      {selectedFood ? (
        <ThemeSpotDetailModal
          spot={toFoodModalSpot(selectedFood)}
          eyebrow={t('korea.theme.spotDetail.nearEyebrowFood')}
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedFood(null)}
        />
      ) : null}
      {selectedLeports ? (
        <ThemeSpotDetailModal
          spot={toLeportsModalSpot(selectedLeports)}
          eyebrow={t('korea.theme.spotDetail.nearEyebrowLeports')}
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedLeports(null)}
        />
      ) : null}
      {selectedCulture ? (
        <ThemeSpotDetailModal
          spot={toCultureModalSpot(selectedCulture)}
          eyebrow={t('korea.theme.spotDetail.nearEyebrowCulture')}
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedCulture(null)}
        />
      ) : null}
      {selectedAttraction ? (
        <ThemeSpotDetailModal
          spot={toAttractionModalSpot(selectedAttraction)}
          eyebrow={t('korea.theme.spotDetail.nearEyebrowAttraction')}
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedAttraction(null)}
        />
      ) : null}
      {selectedSameHub ? (
        <ThemeSpotDetailModal
          spot={selectedSameHub}
          eyebrow={t('korea.theme.spotDetail.nearEyebrowSameHub')}
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedSameHub(null)}
        />
      ) : null}

      {lightboxOpen && hero ? (
        <div
          className={`fixed inset-0 ${lightboxZ} flex items-center justify-center bg-stone-950/90 p-3 md:p-8`}
          onClick={(e) => {
            e.stopPropagation();
            closeLightbox();
          }}
          role="presentation"
        >
          <div
            className="relative flex h-full w-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('korea.theme.spotDetail.lightboxAria')}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
              <p className="text-sm font-bold text-white/90 tabular-nums">
                {imageUrls.length > 1
                  ? `${activeImage + 1} / ${imageUrls.length}`
                  : t('korea.theme.spotDetail.lightboxPhoto')}
              </p>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label={t('korea.theme.spotDetail.lightboxClose')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <div
                className="flex h-full items-center justify-center touch-none"
                onTouchStart={onLightboxTouchStart}
                onTouchMove={onPinchTouchMove}
                onTouchEnd={onLightboxTouchEnd}
                onTouchCancel={onLightboxTouchCancel}
              >
                <img
                  src={hero}
                  alt=""
                  draggable={false}
                  style={lightboxTransformStyle}
                  className="max-h-full max-w-full object-contain select-none"
                />
              </div>
              {imageUrls.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightbox(-1)}
                    aria-label={t('korea.theme.spotDetail.lightboxPrev')}
                    className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-stone-900/55 text-white hover:bg-stone-900/75 md:left-2"
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    aria-label={t('korea.theme.spotDetail.lightboxNext')}
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-stone-900/55 text-white hover:bg-stone-900/75 md:right-2"
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {videosOpen ? (
        <div
          className={`fixed inset-0 ${nestedChildZ} flex items-stretch justify-center bg-stone-900/40 backdrop-blur-[2px] p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] md:items-center md:p-5`}
          onClick={(e) => {
            e.stopPropagation();
            setVideosOpen(false);
          }}
          role="presentation"
        >
          <div
            className="relative flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl md:h-auto md:max-h-[min(90dvh,40rem)] md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="korea-theme-spot-videos-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                  {t('korea.theme.spotDetail.relatedVideos')}
                </p>
                <h2
                  id="korea-theme-spot-videos-title"
                  className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
                >
                  {displayTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVideosOpen(false)}
                aria-label={t('korea.common.close')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5 custom-scrollbar">
              {videosLoading && (
                <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  {t('korea.theme.spotDetail.videosLoading')}
                </div>
              )}
              {!videosLoading && videosError && videos.length === 0 && (
                <p className="text-xs text-stone-500">{videosError}</p>
              )}
              {!videosLoading && videos.length > 0 && (
                <>
                  <ul
                    className="space-y-2"
                    aria-label={t('korea.theme.spotDetail.relatedVideos')}
                  >
                    {visibleVideos.map((video) => {
                      const id = String(video?.id || '').trim();
                      if (!id) return null;
                      const thumb = youtubeThumb(id);
                      const href = `https://www.youtube.com/watch?v=${id}`;
                      return (
                        <li key={id}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="h-16 w-28 shrink-0 rounded-xl object-cover bg-stone-200"
                              />
                            ) : (
                              <div className="h-16 w-28 shrink-0 rounded-xl bg-stone-200" />
                            )}
                            <span className="min-w-0 flex-1 text-sm font-bold text-stone-800 leading-snug line-clamp-3 break-keep">
                              {video.title || t('korea.theme.spotDetail.youtubeFallback')}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  {canLoadMoreVideos && (
                    <button
                      type="button"
                      onClick={() => setVideosExpanded(true)}
                      className="w-full py-2.5 rounded-2xl text-sm font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
                    >
                      {t('korea.theme.spotDetail.videosMore')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <MooniBoundChatHost
        isOpen={mooniOpen}
        boundSpot={mooniBound}
        onClose={() => {
          setMooniOpen(false);
          setMooniBound(null);
        }}
      />
    </div>
  );
}
