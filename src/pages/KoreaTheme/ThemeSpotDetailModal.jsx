import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  Bike,
  Building2,
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
  Utensils,
  X,
  Youtube,
} from 'lucide-react';
import {
  getThemeMembership,
  resolveThemeCrossLinks,
  scenicHomePathForHubId,
} from '../Home/lib/koreaThemeCrossLinks';
import {
  buildThemeModulePath,
  pushThemeNavBack,
  themeModuleLabelForPath,
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

/** 본문·확대보기 — 가로 스와이프 vs 세로 스크롤·탭 */
const PHOTO_SWIPE_THRESHOLD_PX = 48;
const PHOTO_SWIPE_DIRECTION_RATIO = 1.25;

function youtubeThumb(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

const MODULE_CHIP = {
  scenic: { label: '명승지', path: '/korea/theme/scenic' },
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

  const backEntry = useMemo(() => {
    if (!spot || !returnTo) return null;
    const path = buildThemeModulePath(returnTo, {
      spotId: spot.id,
      areaCode: spot.areaCode,
    });
    return {
      path,
      label: spot.name,
      moduleLabel: themeModuleLabelForPath(returnTo),
    };
  }, [spot, returnTo]);

  const goThemePath = (to) => {
    if (!to) return;
    if (backEntry) {
      pushThemeNavBack(backEntry);
      navigate(to, { state: { themeBack: backEntry } });
      return;
    }
    navigate(to);
  };

  if (!spot || !cross) return null;

  const moduleChips = (cross.membership?.modules || [])
    .filter((id) => ACTIVE_MODULE_CHIPS.has(id))
    .map((id) => {
      const chip = MODULE_CHIP[id];
      if (!chip) return null;
      return {
        id,
        label: chip.label,
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
    <div className="space-y-4" aria-label="관련 테마·여행 연결">
      {moduleChips.length > 0 ? (
        <CrossRailSection title="이 장소가 속한 테마">
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
        <CrossRailSection title="같은 도시 명소">
          <ul className="space-y-1.5">
            {cross.sameHub.map((row) => (
              <li key={row.placeSlug}>
                <CrossTextButton
                  onClick={() => {
                    if (row.deepPath) {
                      goThemePath(row.deepPath);
                      return;
                    }
                    if (row.modalSpot) onOpenSameHub?.(row.modalSpot);
                  }}
                >
                  {row.name}
                </CrossTextButton>
              </li>
            ))}
          </ul>
        </CrossRailSection>
      ) : null}

      {showNearbyHubs ? (
        <CrossRailSection title="인근 여행지">
          <ul className="space-y-1.5">
            {cross.nearbyHubs.map((h) => (
              <li key={h.hubId}>
                <CrossTextButton onClick={() => openNearbyScenicHome(h)}>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-700" aria-hidden="true" />
                    {h.name}
                    <span className="text-[11px] font-medium text-stone-500">
                      명승지
                    </span>
                  </span>
                </CrossTextButton>
              </li>
            ))}
          </ul>
        </CrossRailSection>
      ) : null}

      {stayHref || tnaHref ? (
        <CrossRailSection title="숙소 · 투어">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
            {stayHref ? (
              <a
                href={stayHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 break-keep break-words"
              >
                숙소 · {cross.stay.keyword}
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
                투어 · {cross.tna.keyword}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </CrossRailSection>
      ) : null}

      <CrossRailSection title="축제 · 여행코스">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => goThemePath(cross.deepLinks.festivals)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
          >
            <Sparkles size={13} className="text-amber-700" aria-hidden="true" />
            이 지역 축제
          </button>
          <button
            type="button"
            onClick={() => goThemePath(cross.deepLinks.courses)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
          >
            <Route size={13} className="text-amber-700" aria-hidden="true" />
            이 지역 여행코스
          </button>
        </div>
      </CrossRailSection>

      {cross.packageCta?.url ? (
        <CrossRailSection title="패키지">
          <a
            href={cross.packageCta.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            {cross.packageCta.ctaLabel || '패키지 보기'}
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
 * 클릭용 짧은 라벨 — 긴 query URL을 그대로 노출하지 않음.
 * @param {string} href
 */
function homepageDisplayLabel(href) {
  const raw = String(href || '').trim();
  if (!raw) return '공식 홈페이지';
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
  if (!host) return '공식 홈페이지';
  if (host.endsWith('heritage.go.kr') || host.endsWith('cha.go.kr')) {
    return '국가유산청';
  }
  if (host.endsWith('visitkorea.or.kr')) return '대한민국 구석구석';
  if (host.endsWith('mcst.go.kr')) return '문화체육관광부';
  if (host.endsWith('korea.kr')) return '대한민국 정책브리핑';
  if (host.length > 40) return '공식 홈페이지';
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

const INTRO_FIELDS = [
  ['infocenter', '문의'],
  ['infocenterfood', '문의'],
  ['infocenterculture', '문의'],
  ['infocenterleports', '문의'],
  ['usetime', '이용 시간'],
  ['opentimefood', '영업 시간'],
  ['usetimeculture', '이용 시간'],
  ['usetimeleports', '이용 시간'],
  ['restdate', '휴무일'],
  ['restdatefood', '휴무일'],
  ['restdateculture', '휴무일'],
  ['restdateleports', '휴무일'],
  ['parking', '주차'],
  ['parkingfood', '주차'],
  ['parkingculture', '주차'],
  ['parkingleports', '주차'],
  ['usefee', '이용 요금'],
  ['usefeeleports', '이용 요금'],
  ['openperiod', '개장 기간'],
  ['reservation', '예약'],
  ['firstmenu', '대표 메뉴'],
  ['treatmenu', '취급 메뉴'],
  ['reservationfood', '예약'],
  ['packing', '포장'],
  ['scalefood', '규모'],
  ['seatingtype', '좌석'],
  ['smoking', '흡연'],
  ['kidsfacility', '놀이시설'],
  ['discountinfofood', '할인'],
  ['chkcreditcardfood', '신용카드'],
  ['useseason', '이용 시기'],
  ['opendate', '개장'],
  ['expguide', '체험 안내'],
  ['expagerange', '체험 연령'],
  ['accomcount', '수용'],
  ['chkbabycarriage', '유모차'],
  ['chkpet', '반려동물'],
  ['chkcreditcard', '신용카드'],
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
 * Tour 장소 → 네이버 검색(지역+이름). place id 딥링크는 TourAPI에 없어 검색으로 연결.
 * @param {{ name?: string, locality?: string, region?: string } | null} spot
 * @param {{ addr1?: string, addr2?: string } | null} [detail]
 */
function spotNaverSearchUrl(spot, detail) {
  const name = String(spot?.name || '').trim();
  if (!name) return '';
  const locality = String(spot?.locality || '').trim();
  const region = String(spot?.region || '').trim();
  const addrHint = String(detail?.addr1 || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
  const place = locality || addrHint || region;
  const q = [place, name].filter(Boolean).join(' ');
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
}

function NaverOutboundButton({ href }) {
  const url = String(href || '').trim();
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="네이버 상세정보 보기 · 새 탭에서 열기"
      className="inline-flex items-center gap-1.5 rounded-full border border-[#03C75A]/50 bg-[#E8F9EF] px-2.5 py-1.5 text-xs font-bold text-[#027A38] transition-colors hover:border-[#03C75A]/75 hover:bg-[#D9F5E5]"
    >
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[#03C75A] text-[9px] font-black leading-none text-white"
        aria-hidden="true"
      >
        N
      </span>
      네이버 상세정보 보기
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
 * }} props
 */
export default function ThemeSpotDetailModal({
  spot,
  eyebrow = '테마 상세',
  returnTo,
  onClose,
  overlayZClass = 'z-40',
}) {
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
          ? { label: '지정번호', text: `명승 제${spot.designationNo}호` }
          : null,
        spot.nameHanja ? { label: '한자명', text: String(spot.nameHanja) } : null,
        spot.designatedAt
          ? { label: '지정일', text: String(spot.designatedAt) }
          : null,
        spot.heritageType || spot.heritageKind || spot.category
          ? {
              label: '분류',
              text: [spot.heritageType, spot.heritageKind, spot.category, spot.subCategory]
                .filter(Boolean)
                .join(' · '),
            }
          : null,
        spot.quantity ? { label: '면적', text: String(spot.quantity) } : null,
        spot.owner ? { label: '소유', text: String(spot.owner) } : null,
        spot.manager ? { label: '관리', text: String(spot.manager) } : null,
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
      setDetail(null);
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
        setDetailError('Tour 상세 없음');
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

    let cancelled = false;
    setNearbyFoodStatus('loading');
    setNearbyLeportsStatus('loading');
    setNearbyCultureStatus('loading');
    fetchNearbyTourRestaurants({
      lat: useLat,
      lng: useLng,
      radiusKm: 3,
      limit: 6,
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
    spot?.contentTypeId,
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
    () => (isRestaurant ? spotNaverSearchUrl(spot, detail) : ''),
    [isRestaurant, spot, detail],
  );

  const tel = String(detail?.tel || '').trim();

  const introRows = useMemo(() => {
    const intro = detail?.intro;
    if (!intro) return [];
    return INTRO_FIELDS.map(([key, label]) => ({
      key,
      label,
      text: stripHtml(intro[key] || ''),
    })).filter((row) => row.text);
  }, [detail?.intro]);

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
        setVideosError('관련 영상을 찾지 못했습니다.');
        return;
      }
      const list = Array.isArray(result.videos)
        ? result.videos.slice(0, SCENIC_VIDEOS_MAX)
        : [];
      setVideos(list);
      if (!list.length) {
        setVideosError('관련 영상을 찾지 못했습니다.');
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
  ]);

  if (!spot) return null;

  const hasContentId = /^\d{1,32}$/.test(String(spot.contentId || '').trim());
  const hero = imageUrls[activeImage] || imageUrls[0] || '';
  const galleryList = imageUrls;

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
              {eyebrow}
            </p>
            <h2
              id="korea-theme-spot-modal-title"
              className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
            >
              {spot.name}
            </h2>
            {spot.subtitle ? (
              <p className="mt-1 text-xs text-stone-500 break-keep">
                {spot.subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
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
                  ? '사진 확대보기 · 좌우로 쓸어 넘기기'
                  : '사진 확대보기'
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
                확대보기
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
              <p className="text-sm font-semibold leading-relaxed text-amber-950/90 break-keep break-words">
                {spot.blurb}
              </p>
            ) : null}

            {detailLoading ? (
              <p className="text-xs text-stone-500">상세를 불러오는 중…</p>
            ) : null}

            {!detailLoading && hasContentId && detailError ? (
              <p className="text-xs text-stone-500 break-keep">{detailError}</p>
            ) : null}

            {!detailLoading && !hasContentId && spot.source !== 'cha' ? (
              <p className="text-xs text-stone-500 break-keep">
                Tour 상세 없음 — GATEO 안내와 아래 무니·영상으로 이어갈 수 있습니다.
              </p>
            ) : null}

            {!detailLoading && detail ? (
              <dl className="min-w-0 space-y-4">
                {overview ? <DetailRow label="개요">{overview}</DetailRow> : null}
                {Array.isArray(detail.heritageMeta)
                  ? detail.heritageMeta.map((row) => (
                      <DetailRow key={row.label} label={row.label}>
                        {row.text}
                      </DetailRow>
                    ))
                  : null}
                {address ? <DetailRow label="주소">{address}</DetailRow> : null}
                {tel ? (
                  <DetailRow label="전화">
                    <a
                      href={`tel:${tel.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {tel}
                    </a>
                  </DetailRow>
                ) : null}
                {naverSearchUrl ? (
                  <div className="min-w-0 pt-0.5">
                    <NaverOutboundButton href={naverSearchUrl} />
                  </div>
                ) : null}
                {homepage ? (
                  <DetailRow label="홈페이지">
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={homepage}
                      className="inline-flex max-w-full min-w-0 items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline break-keep break-words"
                    >
                      {homepageDisplayLabel(homepage)}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </DetailRow>
                ) : null}
                {introRows.map((row) => (
                  <DetailRow key={row.key} label={row.label}>
                    {row.text}
                  </DetailRow>
                ))}
                {infoSections.map((row, idx) => (
                  <DetailRow
                    key={`${row.name || 'info'}-${idx}`}
                    label={row.name || '안내'}
                  >
                    {row.text}
                  </DetailRow>
                ))}
              </dl>
            ) : null}

            {(detailLoading || !detail) && naverSearchUrl ? (
              <NaverOutboundButton href={naverSearchUrl} />
            ) : null}

            {galleryList.length > 0 ? (
              <div className="space-y-2" aria-label="명소 사진">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  사진 {galleryList.length}장
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {galleryList.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => openLightboxAt(index)}
                      className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                      aria-label={`사진 ${index + 1} 확대보기`}
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
                더 알아보기
              </h3>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={openMooni}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  무니에게 묻기
                </button>
                <button
                  type="button"
                  onClick={() => setVideosOpen(true)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-800 hover:border-amber-300/80 hover:bg-amber-50"
                >
                  <Youtube size={15} className="text-red-600" aria-hidden="true" />
                  유튜브 영상
                </button>
              </div>
            </section>

            {!isApiPoiCross &&
              nearbyFoodStatus !== 'idle' &&
              nearbyFoodStatus !== 'nocoords' && (
                <section className="space-y-2 border-t border-stone-200/80 pt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                    주변 맛집
                  </h3>
                  {nearbyFoodStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 맛집 불러오는 중…
                    </div>
                  )}
                  {nearbyFoodStatus === 'error' && nearbyFood.length === 0 && (
                    <p className="text-xs text-stone-500">
                      주변 맛집을 불러오지 못했습니다.
                    </p>
                  )}
                  {nearbyFoodStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 3km 안 TourAPI 맛집이 없습니다.
                    </p>
                  )}
                  {nearbyFood.length > 0 && (
                    <ul className="space-y-2" aria-label="주변 맛집">
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
                    주변 레포츠
                  </h3>
                  {nearbyLeportsStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 레포츠 불러오는 중…
                    </div>
                  )}
                  {nearbyLeportsStatus === 'error' &&
                    nearbyLeports.length === 0 && (
                      <p className="text-xs text-stone-500">
                        주변 레포츠를 불러오지 못했습니다.
                      </p>
                    )}
                  {nearbyLeportsStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 5km 안 TourAPI 레포츠가 없습니다.
                    </p>
                  )}
                  {nearbyLeports.length > 0 && (
                    <ul className="space-y-2" aria-label="주변 레포츠">
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
                    주변 문화
                  </h3>
                  {nearbyCultureStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 문화시설 불러오는 중…
                    </div>
                  )}
                  {nearbyCultureStatus === 'error' &&
                    nearbyCulture.length === 0 && (
                      <p className="text-xs text-stone-500">
                        주변 문화시설을 불러오지 못했습니다.
                      </p>
                    )}
                  {nearbyCultureStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 5km 안 TourAPI 문화시설이 없습니다.
                    </p>
                  )}
                  {nearbyCulture.length > 0 && (
                    <ul className="space-y-2" aria-label="주변 문화">
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
                    주변 관광지
                  </h3>
                  {nearbyAttractionsStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 관광지 불러오는 중…
                    </div>
                  )}
                  {nearbyAttractionsStatus === 'error' &&
                    nearbyAttractions.length === 0 && (
                      <p className="text-xs text-stone-500">
                        주변 관광지를 불러오지 못했습니다.
                      </p>
                    )}
                  {nearbyAttractionsStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 8km 안 등록된 관광지가 없습니다.
                    </p>
                  )}
                  {nearbyAttractions.length > 0 && (
                    <ul className="space-y-2" aria-label="주변 관광지">
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
            위로
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
      </div>

      {selectedFood ? (
        <ThemeSpotDetailModal
          spot={toFoodModalSpot(selectedFood)}
          eyebrow="주변 맛집"
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedFood(null)}
        />
      ) : null}
      {selectedLeports ? (
        <ThemeSpotDetailModal
          spot={toLeportsModalSpot(selectedLeports)}
          eyebrow="주변 레포츠"
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedLeports(null)}
        />
      ) : null}
      {selectedCulture ? (
        <ThemeSpotDetailModal
          spot={toCultureModalSpot(selectedCulture)}
          eyebrow="주변 문화"
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedCulture(null)}
        />
      ) : null}
      {selectedAttraction ? (
        <ThemeSpotDetailModal
          spot={toAttractionModalSpot(selectedAttraction)}
          eyebrow="주변 관광지"
          returnTo={returnTo}
          overlayZClass={nestedChildZ}
          onClose={() => setSelectedAttraction(null)}
        />
      ) : null}
      {selectedSameHub ? (
        <ThemeSpotDetailModal
          spot={selectedSameHub}
          eyebrow="같은 도시 명소"
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
            aria-label="사진 확대보기"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
              <p className="text-sm font-bold text-white/90 tabular-nums">
                {imageUrls.length > 1
                  ? `${activeImage + 1} / ${imageUrls.length}`
                  : '사진'}
              </p>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="확대보기 닫기"
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
                    aria-label="이전 사진"
                    className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-stone-900/55 text-white hover:bg-stone-900/75 md:left-2"
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    aria-label="다음 사진"
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
                  관련 영상
                </p>
                <h2
                  id="korea-theme-spot-videos-title"
                  className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
                >
                  {spot.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVideosOpen(false)}
                aria-label="닫기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5 custom-scrollbar">
              {videosLoading && (
                <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  영상 불러오는 중…
                </div>
              )}
              {!videosLoading && videosError && videos.length === 0 && (
                <p className="text-xs text-stone-500">{videosError}</p>
              )}
              {!videosLoading && videos.length > 0 && (
                <>
                  <ul className="space-y-2" aria-label="관련 유튜브 영상">
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
                              {video.title || 'YouTube 영상'}
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
                      동영상 더보기
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
