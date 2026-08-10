import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Landmark,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mountain,
  Search,
  Star,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import KoreaScenicMap from './KoreaScenicMap';
import {
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
} from './koreaScenicMapData';
import {
  buildCuratedMapDrill,
  buildHeritageMapDrill,
  drillDownHeritageMap,
  drillDownScenicMap,
  drillUpHeritageMap,
  drillUpScenicMap,
  EMPTY_HERITAGE_MAP_DRILL,
  EMPTY_SCENIC_MAP_DRILL,
  focusViewForMapDrill,
  normalizeHeritageMapDrill,
  normalizeScenicMapDrill,
} from './koreaScenicMapDrill';
import {
  buildTourMapDrill,
  drillDownTourMap,
  drillUpTourMap,
  EMPTY_TOUR_MAP_DRILL,
  normalizeTourMapDrill,
} from './koreaTourMapDrill';
import {
  countKoreaScenicSpotsByRegion,
  countKoreaScenicSpotsByTourArea,
  koreaScenicSpotsDisclaimer,
  listKoreaScenicClusterChips,
  listKoreaScenicHubChips,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots';
import {
  areaHasScenicClusters,
  hubMatchesScenicCluster,
  normalizeScenicClusterId,
  resolveScenicClusterAreaCode,
  scenicClusterIdForHubId,
} from '../Home/lib/koreaScenicClusters';
import {
  countKoreaHeritageScenicByRegion,
  countKoreaHeritageScenicByTourArea,
  getKoreaHeritageScenicById,
  HERITAGE_CATEGORY_ORDER,
  koreaHeritageScenicCount,
  koreaHeritageScenicDisclaimer,
  listKoreaHeritageCategoryChips,
  listKoreaHeritageScenic,
  normalizeHeritageCategory,
} from '../Home/lib/koreaHeritageScenic';
import {
  listTourAttractionCat2,
  listTourAttractionCat3,
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
  normalizeTourAttractionCat3,
  TOUR_ATTRACTION_CAT1,
} from '../Home/lib/koreaTourAttractionCategories';
import {
  countKoreaTourAttractions,
  fetchKoreaTourAttractionById,
  fetchKoreaTourAttractionFirstImagesByIds,
  fetchKoreaTourAttractions,
  fetchKoreaTourAttractionsNear,
  peekKoreaTourAttractionFirstImagesByIds,
  fetchScenicFilterChipCounts,
  labelScenicAreaCode,
  listScenicRegionAreas,
  normalizeScenicAreaCode,
  scenicAreaCodeForHubId,
  scenicRegionForAreaCode,
  SCENIC_REGION_ORDER,
} from '../Home/lib/koreaTourAttractions';
import { resolveCityAttractionHub } from '../Home/lib/cityAttractionHubs';
import { reconcileThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import { formatScenicSpotPlaceLabel } from '../Home/lib/scenicSpotPlaceLabel';
import { sortScenicSpotsByPlaceCluster } from '../Home/lib/sortScenicSpotsByPlaceCluster';
import { resolveKoreaAreaFromCoords } from '../Korea/resolveKoreaAreaFromCoords';
import {
  formatDistanceKm,
  NEAR_SCENIC_KM,
  rankNearbyScenicSpots,
} from './nearbyScenicRank';
import { scenicDbCatalogHeading } from './scenicCatalogHeading';
import {
  listCountForRegionArea,
  pickDefaultClusterId,
  pickDefaultCuratedHubId,
  pickDefaultHeritageCategory,
  resolveDefaultCuratedChips,
  resolveDefaultHeritageChips,
  resolveDefaultTourAreaCode,
  resolveDefaultTourCatChips,
} from './scenicDefaultChips';
import {
  filterScenicSpotsByQuery,
  pickBestRegionByCounts,
} from '../Home/lib/scenicSearch';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';
import {
  groupScenicByRegion,
  hydrateScenicRefs,
  loadScenicFavorites,
  loadScenicViewed,
  pushScenicViewed,
  toggleScenicFavorite,
} from './scenicPersonalStore';

const NEAR_KM = NEAR_SCENIC_KM;
/** 내 주변 관광지 풀(칩 집계) · 종목 필터 전 bbox 거리순 */
const NEAR_DB_POOL_LIMIT = 200;
/** 종목 필터 후 목록 상한 */
const NEAR_DB_LIST_LIMIT = 100;

const DISCLAIMER = koreaScenicSpotsDisclaimer();
const HERITAGE_DISCLAIMER = koreaHeritageScenicDisclaimer();
const HERITAGE_TOTAL = koreaHeritageScenicCount();
const HERITAGE_REGION_COUNTS = countKoreaHeritageScenicByRegion();
const CURATED_REGION_COUNTS = countKoreaScenicSpotsByRegion();
const CURATED_REGIONS = listKoreaScenicRegions();
const RETURN_TO = '/korea/theme/scenic';
const CURATED_ALL = listKoreaScenicSpots();
const HERITAGE_ALL = listKoreaHeritageScenic();
const PAGE_SIZE = 40;
/** 관광지 지도 드릴 리프에서 불러올 핀 상한 */
const TOUR_MAP_PIN_LIMIT = 200;
const DEFAULT_REGION = SCENIC_REGION_ORDER[0];
const DEFAULT_CAT1 = TOUR_ATTRACTION_CAT1[0]?.code || 'A01';

function normalizeScenicHubParam(raw) {
  const id = String(raw || '')
    .trim()
    .toLowerCase();
  if (!id) return null;
  return resolveCityAttractionHub(id) ? id : null;
}

function chipCountLabel(count) {
  if (count == null || !Number.isFinite(count)) return null;
  return Number(count).toLocaleString('ko-KR');
}

/** 명시적 0만 숨김 · 로딩(undefined)은 유지 */
function keepChipByCount(count) {
  if (count == null || !Number.isFinite(Number(count))) return true;
  return Number(count) > 0;
}

function chipLabelsEqual(a, b) {
  return String(a || '').trim() === String(b || '').trim();
}

/** 검색 매칭 풀에서 여행지(hub) 칩 집계 */
function hubChipsFromSpots(spots) {
  /** @type {Map<string, { hubId: string, label: string, count: number }>} */
  const byHub = new Map();
  for (const s of spots || []) {
    const id = String(s.hubId || '')
      .trim()
      .toLowerCase();
    if (!id) continue;
    const prev = byHub.get(id);
    if (prev) {
      prev.count += 1;
      continue;
    }
    const hub = resolveCityAttractionHub(id);
    byHub.set(id, {
      hubId: id,
      label: String(hub?.name || s.hubId || id).trim(),
      count: 1,
    });
  }
  return [...byHub.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, 'ko');
  });
}

/** 내 주변 풀에서 명승 경관 칩 집계 */
function heritageCategoryChipsFromSpots(spots) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const c of HERITAGE_CATEGORY_ORDER) counts[c] = 0;
  for (const s of spots || []) {
    const cat = normalizeHeritageCategory(s.category);
    if (!cat) continue;
    counts[cat] += 1;
  }
  return HERITAGE_CATEGORY_ORDER.filter((c) => counts[c] > 0).map((c) => ({
    code: c,
    label: c,
    count: counts[c],
  }));
}

/**
 * 내 주변 Tour 풀 → 종목 칩 건수 (현 cat1/cat2 기준 중·소분류).
 * @param {object[]} spots
 * @param {string | null} cat1
 * @param {string | null} cat2
 */
function countTourCatsFromNearSpots(spots, cat1, cat2) {
  /** @type {Record<string, number>} */
  const cat1Counts = {};
  /** @type {Record<string, number>} */
  const cat2Counts = {};
  /** @type {Record<string, number>} */
  const cat3Counts = {};
  for (const c of TOUR_ATTRACTION_CAT1) cat1Counts[c.code] = 0;
  for (const c of listTourAttractionCat2(cat1)) cat2Counts[c.code] = 0;
  for (const c of listTourAttractionCat3(cat1, cat2)) cat3Counts[c.code] = 0;
  for (const s of spots || []) {
    const c1 = String(s.cat1 || '').trim();
    if (c1 && cat1Counts[c1] != null) cat1Counts[c1] += 1;
    if (!cat1 || c1 !== cat1) continue;
    const c2 = String(s.cat2 || '').trim();
    if (c2 && cat2Counts[c2] != null) cat2Counts[c2] += 1;
    if (!cat2 || c2 !== cat2) continue;
    const c3 = String(s.cat3 || '').trim();
    if (c3 && cat3Counts[c3] != null) cat3Counts[c3] += 1;
  }
  return { cat1Counts, cat2Counts, cat3Counts };
}

/**
 * @param {object[]} spots
 * @param {string | null} cat1
 * @param {string | null} cat2
 * @param {string | null} cat3
 */
function filterTourSpotsByCats(spots, cat1, cat2, cat3) {
  return (spots || []).filter((s) => {
    if (cat1 && String(s.cat1 || '').trim() !== cat1) return false;
    if (cat2 && String(s.cat2 || '').trim() !== cat2) return false;
    if (cat3 && String(s.cat3 || '').trim() !== cat3) return false;
    return true;
  });
}

/** TourAPI 권역 건수에서 최다 권역 (명소·명승 0건일 때 · 「화천」「성주」등) */
function pickRegionFromTourCounts(regionCounts, fallback) {
  return pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    regionCounts,
    resolveRegion(fallback),
  );
}

function FilterChipLabel({ label, count }) {
  const n = chipCountLabel(count);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {n != null ? <span className="opacity-70 tabular-nums">{n}</span> : null}
    </span>
  );
}

function FilterChipRow({ 'aria-label': ariaLabel, className = '', children }) {
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const [edge, setEdge] = useState({
    overflow: false,
    left: false,
    right: false,
    thumbWidthPct: 100,
    thumbLeftPct: 0,
  });

  const syncScrollEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const overflow = maxScroll > 2;
    const ratio = scrollWidth > 0 ? clientWidth / scrollWidth : 1;
    const thumbWidthPct = overflow
      ? Math.max(18, Math.min(100, ratio * 100))
      : 100;
    const thumbLeftPct = overflow
      ? (scrollLeft / maxScroll) * (100 - thumbWidthPct)
      : 0;
    setEdge({
      overflow,
      left: overflow && scrollLeft > 2,
      right: overflow && scrollLeft < maxScroll - 2,
      thumbWidthPct,
      thumbLeftPct,
    });
  }, []);

  useLayoutEffect(() => {
    syncScrollEdges();
  }, [syncScrollEdges, children]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    syncScrollEdges();
    el.addEventListener('scroll', syncScrollEdges, { passive: true });
    const ro = new ResizeObserver(() => syncScrollEdges());
    ro.observe(el);
    const track = trackRef.current;
    if (track) ro.observe(track);
    const mo = new MutationObserver(() => syncScrollEdges());
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', syncScrollEdges);
    return () => {
      el.removeEventListener('scroll', syncScrollEdges);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', syncScrollEdges);
    };
  }, [syncScrollEdges, children]);

  return (
    <div
      className={
        className ? `relative min-w-0 ${className}` : 'relative min-w-0'
      }
    >
      <div className="relative min-w-0">
        <div
          ref={scrollerRef}
          role="group"
          aria-label={ariaLabel}
          className="korea-scenic-chip-row min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x"
        >
          <div
            ref={trackRef}
            className="flex w-max min-w-full flex-nowrap items-center gap-1.5 [&>button]:shrink-0"
          >
            {children}
          </div>
        </div>
        {edge.left ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-stone-100 via-stone-100/90 to-transparent"
          />
        ) : null}
        {edge.right ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-stone-100 via-stone-100/90 to-transparent"
          />
        ) : null}
      </div>
      {edge.overflow ? (
        <div
          className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-300/50"
          aria-hidden="true"
          title="좌우로 스크롤해 더 많은 분류를 볼 수 있습니다"
        >
          <div
            className="h-full rounded-full bg-amber-500 shadow-sm"
            style={{
              width: `${edge.thumbWidthPct}%`,
              marginLeft: `${edge.thumbLeftPct}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function kmByIdFromRanked(ranked) {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const row of ranked || []) {
    const id = row?.item?.id;
    if (id == null || !Number.isFinite(row.km)) continue;
    map.set(String(id), row.km);
  }
  return map;
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function spotListThumbCandidates(spot) {
  const gallery = Array.isArray(spot?.galleryUrls) ? spot.galleryUrls : [];
  const raw = [
    spot?.thumbUrl,
    spot?.firstImage,
    spot?.imageUrl,
    ...gallery,
  ];
  /** @type {string[]} */
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    const url = toHttps(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

function ScenicListRow({
  spot,
  distanceKm,
  onOpen,
  favorited = false,
  onToggleFavorite,
}) {
  const distanceLabel = formatDistanceKm(distanceKm);
  const candidates = spotListThumbCandidates(spot);
  const [thumbIndex, setThumbIndex] = useState(0);
  const thumb = candidates[thumbIndex] || '';
  return (
    <div className="flex w-full items-stretch gap-1 rounded-2xl border border-stone-200/90 bg-white p-2.5 shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40 sm:px-3 sm:py-3">
      <button
        type="button"
        onClick={() => onOpen(spot.id)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        {thumb ? (
          <img
            key={thumb}
            src={thumb}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => {
              setThumbIndex((i) => i + 1);
            }}
            className="h-16 w-16 shrink-0 rounded-xl object-cover bg-stone-200 sm:h-[4.5rem] sm:w-[4.5rem]"
          />
        ) : (
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400 sm:h-[4.5rem] sm:w-[4.5rem]"
            aria-hidden="true"
          >
            <Landmark size={20} />
          </div>
        )}
        <span className="min-w-0 flex-1 py-0.5">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-extrabold tracking-tight text-stone-900 break-keep">
              {spot.name}
            </span>
            <span className="text-[11px] font-semibold text-stone-500">
              {formatScenicSpotPlaceLabel(spot)}
            </span>
            {distanceLabel ? (
              <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-600">
                {distanceLabel}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep line-clamp-2">
            {spot.blurb}
          </span>
        </span>
      </button>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(spot);
          }}
          aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기'}
          aria-pressed={favorited}
          className="my-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:border-amber-300 hover:bg-amber-50"
        >
          <Star
            size={15}
            className={
              favorited ? 'fill-amber-400 text-amber-500' : 'text-stone-400'
            }
            aria-hidden="true"
          />
        </button>
      ) : null}
    </div>
  );
}

function toModalSpot(spot) {
  if (!spot) return null;
  const placeLabel = formatScenicSpotPlaceLabel(spot);
  return {
    id: spot.id,
    name: spot.name,
    subtitle: placeLabel || spot.areaLabel || spot.region,
    blurb: spot.blurb,
    placeSlug: spot.placeSlug,
    contentId: spot.contentId,
    hubId: spot.hubId,
    region: spot.region,
    locality: spot.locality,
    areaLabel: spot.areaLabel,
    areaCode: spot.areaCode,
    addr1: spot.addr1,
    addr2: spot.addr2,
    nameEn: spot.attractionNameEn || spot.nameEn || null,
    lat: spot.lat,
    lng: spot.lng,
    source: spot.source || null,
    content: spot.content || null,
    overview: spot.overview || null,
    imageUrl: spot.imageUrl || spot.firstImage || null,
    galleryUrls: Array.isArray(spot.galleryUrls) ? spot.galleryUrls : null,
    homepage: spot.homepage || null,
    nameHanja: spot.nameHanja || null,
    designatedAt: spot.designatedAt || null,
    designationNo: spot.designationNo || null,
    quantity: spot.quantity || null,
    heritageType: spot.heritageType || null,
    heritageKind: spot.heritageKind || null,
    category: spot.category || null,
    subCategory: spot.subCategory || null,
    owner: spot.owner || null,
    manager: spot.manager || null,
  };
}

function resolveRegion(raw) {
  const value = String(raw || '').trim();
  if (value && SCENIC_REGION_ORDER.includes(value)) return value;
  return DEFAULT_REGION;
}

/** 파드별 권역 — `cregion`/`hregion`/`tregion` · 레거시 `region` 폴백 */
function resolvePodRegion(searchParams, prefix) {
  return resolveRegion(
    searchParams.get(`${prefix}region`) || searchParams.get('region'),
  );
}

/** 파드별 시도 — `carea`/`harea`/`tarea` · 레거시 `area` 폴백 */
function resolvePodArea(searchParams, prefix, region) {
  return normalizeScenicAreaCode(
    region,
    searchParams.get(`${prefix}area`) || searchParams.get('area'),
  );
}

/** 검색 매칭 풀 → 해당 파드 권역 */
function pickRegionFromSpotMatches(matches, fallback) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const r of SCENIC_REGION_ORDER) counts[r] = 0;
  for (const s of matches || []) {
    if (counts[s.region] != null) counts[s.region] += 1;
  }
  // 첫 권역이 아니라 최다 권역 (주남→제주남쪽 오탐으로 제주/수도권이 잡히던 것 방지)
  return pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    counts,
    resolveRegion(fallback),
  );
}

export default function KoreaThemeScenicPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hubId = normalizeScenicHubParam(searchParams.get('hub'));
  const hub = hubId ? resolveCityAttractionHub(hubId) : null;
  const hubName = hub ? String(hub.name || hubId) : '';
  const curatedRegion = resolvePodRegion(searchParams, 'c');
  const curatedArea = resolvePodArea(searchParams, 'c', curatedRegion);
  const curatedClusterArea = resolveScenicClusterAreaCode(
    curatedRegion,
    curatedArea,
  );
  const curatedCluster = normalizeScenicClusterId(
    curatedClusterArea,
    searchParams.get('ccluster'),
  );
  const heritageRegion = resolvePodRegion(searchParams, 'h');
  const heritageArea = resolvePodArea(searchParams, 'h', heritageRegion);
  const tourRegion = resolvePodRegion(searchParams, 't');
  const tourArea = resolvePodArea(searchParams, 't', tourRegion);
  const cat1 =
    normalizeTourAttractionCat1(searchParams.get('cat1')) || DEFAULT_CAT1;
  const cat2 = normalizeTourAttractionCat2(cat1, searchParams.get('cat2'));
  const cat3 = normalizeTourAttractionCat3(cat1, cat2, searchParams.get('cat3'));
  const heritageCategory = normalizeHeritageCategory(searchParams.get('hcat'));
  const selectedId = searchParams.get('spot');
  const page = Math.max(Number(searchParams.get('page') || '1') || 1, 1);

  const [nearOrigin, setNearOrigin] = useState(null);
  const [nearLabel, setNearLabel] = useState('');
  const [nearBusy, setNearBusy] = useState(false);
  const [nearMsg, setNearMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');
  /** 확정된 검색어 — 입력창을 비워도 리스트 필터 유지 · 분류 칩으로 결과 분해 */
  const [searchApplied, setSearchApplied] = useState('');
  const mobileSearchInputRef = useRef(null);
  const mainScrollRef = useRef(null);
  /** 분류칩 클릭 직후 목록 높이 변화로 스크롤이 튀지 않게 칩 위치 고정 */
  const chipScrollPinRef = useRef(null);
  const chipScrollPinGenRef = useRef(0);
  const chipScrollPinClearTimerRef = useRef(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchFilter = searchDraft.trim() || searchApplied.trim();
  const searchActive = searchFilter.length > 0;
  const [dbSearchFilter, setDbSearchFilter] = useState('');
  useEffect(() => {
    if (!searchActive) {
      setDbSearchFilter('');
      return undefined;
    }
    const t = setTimeout(() => setDbSearchFilter(searchFilter), 280);
    return () => clearTimeout(t);
  }, [searchActive, searchFilter]);
  const dbSearchActive = dbSearchFilter.length > 0;
  const nearActive = Boolean(nearOrigin && nearLabel) && !searchActive;
  const curatedAreaChipDefs = useMemo(
    () => listScenicRegionAreas(curatedRegion),
    [curatedRegion],
  );
  const heritageAreaChipDefs = useMemo(
    () => listScenicRegionAreas(heritageRegion),
    [heritageRegion],
  );
  const tourAreaChipDefs = useMemo(
    () => listScenicRegionAreas(tourRegion),
    [tourRegion],
  );

  const scheduleChipScrollPinClear = useCallback((gen) => {
    if (chipScrollPinClearTimerRef.current) {
      window.clearTimeout(chipScrollPinClearTimerRef.current);
    }
    chipScrollPinClearTimerRef.current = window.setTimeout(() => {
      if (chipScrollPinRef.current?.gen === gen) {
        chipScrollPinRef.current = null;
      }
      chipScrollPinClearTimerRef.current = 0;
    }, 180);
  }, []);

  const runWithChipScrollPin = useCallback(
    (anchorEl, apply) => {
      const root = mainScrollRef.current;
      if (root && anchorEl instanceof HTMLElement) {
        const pinKey = anchorEl.getAttribute('data-chip-pin');
        if (pinKey) {
          const rootRect = root.getBoundingClientRect();
          const elRect = anchorEl.getBoundingClientRect();
          const gen = chipScrollPinGenRef.current + 1;
          chipScrollPinGenRef.current = gen;
          chipScrollPinRef.current = {
            pinKey,
            viewportOffset: elRect.top - rootRect.top,
            gen,
          };
          scheduleChipScrollPinClear(gen);
        }
      }
      apply();
    },
    [scheduleChipScrollPinClear],
  );

  const curatedSearchPool = useMemo(() => {
    if (!searchActive) return null;
    return filterScenicSpotsByQuery(CURATED_ALL, searchFilter);
  }, [searchActive, searchFilter]);

  const heritageSearchPool = useMemo(() => {
    if (!searchActive) return null;
    return filterScenicSpotsByQuery(listKoreaHeritageScenic(), searchFilter);
  }, [searchActive, searchFilter]);

  const curatedNearRanked = useMemo(() => {
    if (!nearOrigin || searchActive) return null;
    return rankNearbyScenicSpots(
      CURATED_ALL,
      nearOrigin.lat,
      nearOrigin.lng,
      NEAR_KM,
    );
  }, [nearOrigin, searchActive]);

  const curatedNearPool = useMemo(() => {
    if (!curatedNearRanked) return null;
    return curatedNearRanked.map((row) => row.item);
  }, [curatedNearRanked]);

  const curatedSpots = useMemo(() => {
    if (searchActive && curatedSearchPool) {
      let list = curatedSearchPool;
      if (hubId) {
        list = list.filter(
          (s) => String(s.hubId || '').trim().toLowerCase() === hubId,
        );
      } else {
        list = list.filter((s) => s.region === curatedRegion);
        if (curatedArea) {
          list = list.filter(
            (s) => scenicAreaCodeForHubId(s.hubId) === curatedArea,
          );
        }
        if (curatedCluster) {
          list = list.filter((s) =>
            hubMatchesScenicCluster(
              s.hubId,
              curatedClusterArea,
              curatedCluster,
            ),
          );
        }
      }
      return sortScenicSpotsByPlaceCluster(list);
    }
    if (curatedNearPool) {
      if (!hubId) return curatedNearPool;
      return curatedNearPool.filter(
        (s) => String(s.hubId || '').trim().toLowerCase() === hubId,
      );
    }
    if (hubId) {
      return sortScenicSpotsByPlaceCluster(
        CURATED_ALL.filter(
          (s) => String(s.hubId || '').trim().toLowerCase() === hubId,
        ),
      );
    }
    const inRegion = listKoreaScenicSpots(curatedRegion);
    let filtered = curatedArea
      ? inRegion.filter((s) => scenicAreaCodeForHubId(s.hubId) === curatedArea)
      : inRegion;
    if (curatedCluster) {
      filtered = filtered.filter((s) =>
        hubMatchesScenicCluster(s.hubId, curatedClusterArea, curatedCluster),
      );
    }
    return sortScenicSpotsByPlaceCluster(filtered);
  }, [
    searchActive,
    curatedSearchPool,
    curatedNearPool,
    curatedRegion,
    curatedArea,
    curatedCluster,
    curatedClusterArea,
    hubId,
  ]);

  const curatedKmById = useMemo(
    () => kmByIdFromRanked(curatedNearRanked),
    [curatedNearRanked],
  );

  const [curatedImageByContentId, setCuratedImageByContentId] = useState(
    () => new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    const ids = curatedSpots
      .map((s) => String(s.contentId || '').trim())
      .filter((id) => /^\d{1,32}$/.test(id));
    if (!ids.length) return undefined;

    const peeked = peekKoreaTourAttractionFirstImagesByIds(ids);
    if (peeked.size) {
      setCuratedImageByContentId((prev) => {
        if (!prev.size) return peeked;
        const next = new Map(prev);
        for (const [id, url] of peeked) next.set(id, url);
        return next;
      });
    }

    fetchKoreaTourAttractionFirstImagesByIds(ids).then((map) => {
      if (cancelled || !map.size) return;
      setCuratedImageByContentId((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, url] of map) {
          if (next.get(id) !== url) {
            next.set(id, url);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [curatedSpots]);

  const curatedSpotsWithThumbs = useMemo(() => {
    const peeked = peekKoreaTourAttractionFirstImagesByIds(
      curatedSpots.map((s) => s.contentId),
    );
    return curatedSpots.map((spot) => {
      const contentId = String(spot.contentId || '').trim();
      const firstImage =
        curatedImageByContentId.get(contentId) ||
        peeked.get(contentId) ||
        spot.firstImage ||
        null;
      if (!firstImage) return spot;
      return { ...spot, firstImage, imageUrl: spot.imageUrl || firstImage };
    });
  }, [curatedSpots, curatedImageByContentId]);

  const heritageNearRanked = useMemo(() => {
    if (!nearOrigin || searchActive) return null;
    return rankNearbyScenicSpots(
      listKoreaHeritageScenic(),
      nearOrigin.lat,
      nearOrigin.lng,
      NEAR_KM,
    );
  }, [nearOrigin, searchActive]);

  const heritageNearPool = useMemo(() => {
    if (!heritageNearRanked) return null;
    return heritageNearRanked.map((row) => row.item);
  }, [heritageNearRanked]);

  const heritageSpots = useMemo(() => {
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      return sortScenicSpotsByPlaceCluster(
        listKoreaHeritageScenic({
          region: heritageRegion,
          areaCode: heritageArea,
          category: heritageCategory,
        }).filter((s) => matchedIds.has(s.id)),
      );
    }
    if (heritageNearPool) {
      if (!heritageCategory) return heritageNearPool;
      return heritageNearPool.filter(
        (s) => normalizeHeritageCategory(s.category) === heritageCategory,
      );
    }
    return sortScenicSpotsByPlaceCluster(
      listKoreaHeritageScenic({
        region: heritageRegion,
        areaCode: heritageArea,
        category: heritageCategory,
      }),
    );
  }, [
    searchActive,
    heritageSearchPool,
    heritageNearPool,
    heritageRegion,
    heritageArea,
    heritageCategory,
  ]);

  const heritageKmById = useMemo(
    () => kmByIdFromRanked(heritageNearRanked),
    [heritageNearRanked],
  );

  const curatedRegionCountsForChips = useMemo(() => {
    if (!searchActive || !curatedSearchPool) return CURATED_REGION_COUNTS;
    /** @type {Record<string, number>} */
    const out = {};
    for (const r of SCENIC_REGION_ORDER) out[r] = 0;
    for (const s of curatedSearchPool) {
      if (out[s.region] != null) out[s.region] += 1;
    }
    return out;
  }, [searchActive, curatedSearchPool]);

  const heritageRegionCountsForChips = useMemo(() => {
    if (!searchActive || !heritageSearchPool) return HERITAGE_REGION_COUNTS;
    /** @type {Record<string, number>} */
    const out = {};
    for (const r of SCENIC_REGION_ORDER) out[r] = 0;
    for (const s of heritageSearchPool) {
      if (out[s.region] != null) out[s.region] += 1;
    }
    return out;
  }, [searchActive, heritageSearchPool]);

  const curatedAreaCounts = useMemo(() => {
    if (searchActive && curatedSearchPool) {
      /** @type {Record<string, number>} */
      const out = {};
      for (const s of curatedSearchPool) {
        if (s.region !== curatedRegion) continue;
        const code = scenicAreaCodeForHubId(s.hubId);
        if (!code) continue;
        out[code] = (out[code] || 0) + 1;
      }
      return out;
    }
    return countKoreaScenicSpotsByTourArea(curatedRegion);
  }, [searchActive, curatedSearchPool, curatedRegion]);

  const curatedClusterChips = useMemo(() => {
    if (nearActive) return [];
    const hasMidRow = curatedAreaChipDefs.filter(
      (chip) => (curatedAreaCounts[chip.code] || 0) > 0,
    ).length > 1;
    if (hasMidRow && !curatedArea) return [];
    if (!areaHasScenicClusters(curatedClusterArea)) return [];
    if (searchActive && curatedSearchPool) {
      let spots = curatedSearchPool.filter((s) => s.region === curatedRegion);
      if (curatedArea) {
        spots = spots.filter(
          (s) => scenicAreaCodeForHubId(s.hubId) === curatedArea,
        );
      }
      return listKoreaScenicClusterChips(curatedRegion, curatedClusterArea)
        .map((chip) => ({
          ...chip,
          count: spots.filter((s) =>
            hubMatchesScenicCluster(s.hubId, curatedClusterArea, chip.id),
          ).length,
        }))
        .filter((chip) => chip.count > 0);
    }
    return listKoreaScenicClusterChips(curatedRegion, curatedClusterArea);
  }, [
    nearActive,
    curatedAreaChipDefs,
    curatedAreaCounts,
    curatedArea,
    curatedClusterArea,
    searchActive,
    curatedSearchPool,
    curatedRegion,
  ]);

  const curatedHubChips = useMemo(() => {
    if (nearActive && curatedNearPool) {
      return hubChipsFromSpots(curatedNearPool);
    }
    if (searchActive && curatedSearchPool) {
      let spots = curatedSearchPool.filter((s) => s.region === curatedRegion);
      if (curatedArea) {
        spots = spots.filter(
          (s) => scenicAreaCodeForHubId(s.hubId) === curatedArea,
        );
      }
      if (curatedCluster) {
        spots = spots.filter((s) =>
          hubMatchesScenicCluster(
            s.hubId,
            curatedClusterArea,
            curatedCluster,
          ),
        );
      }
      return hubChipsFromSpots(spots);
    }
    return listKoreaScenicHubChips(
      curatedRegion,
      curatedArea || curatedClusterArea,
      curatedCluster,
    );
  }, [
    nearActive,
    curatedNearPool,
    searchActive,
    curatedSearchPool,
    curatedRegion,
    curatedArea,
    curatedCluster,
    curatedClusterArea,
  ]);

  const curatedAreaChips = useMemo(() => {
    if (nearActive) return [];
    return curatedAreaChipDefs.filter(
      (chip) => (curatedAreaCounts[chip.code] || 0) > 0,
    );
  }, [nearActive, curatedAreaChipDefs, curatedAreaCounts]);

  const curatedHubChipsVisible = useMemo(() => {
    if (nearActive && curatedNearPool) {
      return hubChipsFromSpots(curatedNearPool).filter(
        (chip) => (chip.count || 0) > 0,
      );
    }
    const hasMidRow = curatedAreaChips.length > 1;
    const hasClusterRow = curatedClusterChips.length > 0;
    // 수도권처럼 시도 중분류가 있으면, 시도 선택 후에만 하위 칩
    if (hasMidRow && !curatedArea) return [];
    // 세권이 있으면 세권 선택 후에만 여행지 소분류
    if (hasClusterRow && !curatedCluster) return [];
    const hubs = hasClusterRow
      ? curatedHubChips
      : hasMidRow
        ? curatedHubChips
        : searchActive && curatedSearchPool
          ? hubChipsFromSpots(
              curatedSearchPool.filter((s) => s.region === curatedRegion),
            )
          : listKoreaScenicHubChips(curatedRegion, null);
    const parentLabel =
      hasMidRow && curatedArea ? labelScenicAreaCode(curatedArea) : null;
    const soleAreaLabel = !hasMidRow
      ? curatedAreaChips[0]?.label || null
      : null;
    return hubs.filter((chip) => {
      if ((chip.count || 0) <= 0) return false;
      if (parentLabel && chipLabelsEqual(chip.label, parentLabel)) return false;
      if (soleAreaLabel && chipLabelsEqual(chip.label, soleAreaLabel)) {
        return false;
      }
      return true;
    });
  }, [
    nearActive,
    curatedNearPool,
    curatedHubChips,
    curatedAreaChips,
    curatedClusterChips,
    curatedArea,
    curatedCluster,
    curatedRegion,
    searchActive,
    curatedSearchPool,
  ]);

  const heritageAreaCounts = useMemo(() => {
    if (nearActive) return {};
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      /** @type {Record<string, number>} */
      const out = {};
      for (const chip of heritageAreaChipDefs) {
        const n = listKoreaHeritageScenic({
          region: heritageRegion,
          areaCode: chip.code,
        }).filter((s) => matchedIds.has(s.id)).length;
        if (n > 0) out[chip.code] = n;
      }
      return out;
    }
    return countKoreaHeritageScenicByTourArea(heritageRegion);
  }, [
    nearActive,
    searchActive,
    heritageSearchPool,
    heritageRegion,
    heritageAreaChipDefs,
  ]);

  const heritageAreaChips = useMemo(() => {
    if (nearActive) return [];
    return heritageAreaChipDefs.filter(
      (chip) => (heritageAreaCounts[chip.code] || 0) > 0,
    );
  }, [nearActive, heritageAreaChipDefs, heritageAreaCounts]);

  const heritageCategoryChips = useMemo(() => {
    if (nearActive && heritageNearPool) {
      return heritageCategoryChipsFromSpots(heritageNearPool);
    }
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      return listKoreaHeritageCategoryChips({
        region: heritageRegion,
        areaCode: heritageArea,
      })
        .map((chip) => ({
          ...chip,
          count: listKoreaHeritageScenic({
            region: heritageRegion,
            areaCode: heritageArea,
            category: chip.code,
          }).filter((s) => matchedIds.has(s.id)).length,
        }))
        .filter((chip) => (chip.count || 0) > 0);
    }
    return listKoreaHeritageCategoryChips({
      region: heritageRegion,
      areaCode: heritageArea,
    });
  }, [
    nearActive,
    heritageNearPool,
    searchActive,
    heritageSearchPool,
    heritageRegion,
    heritageArea,
  ]);

  const heritageCategoryChipsVisible = useMemo(() => {
    const midLabels = new Set(
      heritageAreaChips
        .map((chip) => String(chip.label || '').trim())
        .filter(Boolean),
    );
    const activeMidLabel = heritageArea
      ? labelScenicAreaCode(heritageArea)
      : null;
    return heritageCategoryChips.filter((chip) => {
      if ((chip.count || 0) <= 0) return false;
      const label = String(chip.label || '').trim();
      if (activeMidLabel && chipLabelsEqual(label, activeMidLabel)) return false;
      if (midLabels.has(label)) return false;
      return true;
    });
  }, [heritageCategoryChips, heritageAreaChips, heritageArea]);

  const listReturnTo = useMemo(() => {
    const params = new URLSearchParams();
    if (curatedRegion) params.set('cregion', curatedRegion);
    if (curatedArea) params.set('carea', curatedArea);
    if (curatedCluster) params.set('ccluster', curatedCluster);
    if (hubId) params.set('hub', hubId);
    if (heritageRegion) params.set('hregion', heritageRegion);
    if (heritageArea) params.set('harea', heritageArea);
    if (heritageCategory) params.set('hcat', heritageCategory);
    if (tourRegion) params.set('tregion', tourRegion);
    if (tourArea) params.set('tarea', tourArea);
    if (cat1) params.set('cat1', cat1);
    if (cat2) params.set('cat2', cat2);
    if (cat3) params.set('cat3', cat3);
    if (page > 1) params.set('page', String(page));
    const q = params.toString();
    return q ? `${RETURN_TO}?${q}` : RETURN_TO;
  }, [
    curatedRegion,
    curatedArea,
    curatedCluster,
    hubId,
    heritageRegion,
    heritageArea,
    heritageCategory,
    tourRegion,
    tourArea,
    cat1,
    cat2,
    cat3,
    page,
  ]);

  const [dbSpots, setDbSpots] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [scopeCount, setScopeCount] = useState(0);
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbError, setDbError] = useState(null);
  const [dbKmById, setDbKmById] = useState(() => new Map());
  /** 내 주변 Tour 풀(종목 필터 전) · 칩 집계·목록 공통 */
  const [nearTourPool, setNearTourPool] = useState([]);
  const [nearTourStatus, setNearTourStatus] = useState('idle');
  const [nearTourError, setNearTourError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [personalTab, setPersonalTab] = useState(null);
  const [favoriteList, setFavoriteList] = useState(() => loadScenicFavorites());
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(loadScenicFavorites().map((r) => String(r.id))),
  );
  /** null | curated | heritage | tour | personal — 파드별 목록↔지도 */
  const [mapPod, setMapPod] = useState(null);
  const [openPods, setOpenPods] = useState({
    curated: true,
    heritage: false,
    tour: false,
  });
  const [mapSessionKey, setMapSessionKey] = useState(0);
  /** 명소·명승·관광지 지도 드릴다운(목록 URL 기본칩과 분리) */
  const [curatedMapDrill, setCuratedMapDrill] = useState(() => ({
    ...EMPTY_SCENIC_MAP_DRILL,
  }));
  const [heritageMapDrill, setHeritageMapDrill] = useState(() => ({
    ...EMPTY_HERITAGE_MAP_DRILL,
  }));
  const [tourMapDrill, setTourMapDrill] = useState(() => ({
    ...EMPTY_TOUR_MAP_DRILL,
  }));
  const [tourMapCounts, setTourMapCounts] = useState({
    regionCounts: {},
    areaCounts: {},
    cat1Counts: {},
    cat2Counts: {},
    cat3Counts: {},
  });
  const [tourMapCountsReady, setTourMapCountsReady] = useState(false);
  const [tourMapPins, setTourMapPins] = useState([]);
  const [tourMapPinsStatus, setTourMapPinsStatus] = useState('idle');
  /** @type {[object | null, function]} */
  const [mapFocusView, setMapFocusView] = useState(null);
  const mapOpen = mapPod != null;
  const [viewedList, setViewedList] = useState(() => loadScenicViewed());
  const [chipCounts, setChipCounts] = useState({
    regionCounts: {},
    areaCounts: {},
    cat1Counts: {},
    cat2Counts: {},
    cat3Counts: {},
  });

  const clearNear = useCallback(() => {
    setNearOrigin(null);
    setNearLabel('');
    setNearMsg('');
    setDbKmById(new Map());
  }, []);

  const clearSearchFilter = useCallback(() => {
    setSearchDraft('');
    setSearchApplied('');
    setSearchOpen(false);
  }, []);

  const closeSearch = useCallback(() => {
    clearSearchFilter();
    clearNear();
  }, [clearSearchFilter, clearNear]);

  // 인근 여행지→시·군 명승 홈: 검색 모달·검색어 잔존으로 빈 결과 나는 것 방지
  useEffect(() => {
    const st = location.state;
    if (!st || typeof st !== 'object' || !st.clearScenicSearch) return;
    clearSearchFilter();
    const nextState = { ...st };
    delete nextState.clearScenicSearch;
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    );
  }, [
    location.state,
    location.pathname,
    location.search,
    location.hash,
    clearSearchFilter,
    navigate,
  ]);

  useEffect(() => {
    if (!searchActive || selectedId) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchActive, selectedId, closeSearch]);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el || selectedId) {
      setShowScrollTop(false);
      return undefined;
    }
    const onScroll = () => setShowScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedId, searchActive]);

  const restoreChipScrollPin = useCallback(() => {
    const pin = chipScrollPinRef.current;
    if (!pin) return;
    const root = mainScrollRef.current;
    if (!root) return;
    const escaped =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(pin.pinKey)
        : pin.pinKey.replace(/["\\]/g, '\\$&');
    const el = root.querySelector(`[data-chip-pin="${escaped}"]`);
    if (!el) return;
    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const desired = Math.max(12, pin.viewportOffset);
    const delta = elRect.top - rootRect.top - desired;
    if (Math.abs(delta) > 1) {
      root.scrollTop += delta;
    }
    // 짧은 목록으로 maxScroll이 부족하면 칩을 뷰 상단 근처로 붙임
    const afterRoot = root.getBoundingClientRect();
    const afterEl = el.getBoundingClientRect();
    const actual = afterEl.top - afterRoot.top;
    if (actual - desired > 12) {
      const fallback = Math.min(desired, 64);
      const delta2 = actual - fallback;
      if (Math.abs(delta2) > 1) {
        root.scrollTop += delta2;
      }
    }
  }, []);

  useLayoutEffect(() => {
    const pin = chipScrollPinRef.current;
    if (!pin) return;
    restoreChipScrollPin();
    scheduleChipScrollPinClear(pin.gen);
  }, [
    restoreChipScrollPin,
    scheduleChipScrollPinClear,
    curatedRegion,
    curatedArea,
    curatedCluster,
    hubId,
    heritageRegion,
    heritageArea,
    heritageCategory,
    tourRegion,
    tourArea,
    cat1,
    cat2,
    cat3,
    nearActive,
    dbStatus,
    dbSpots,
    curatedSpots,
    heritageSpots,
  ]);

  // 인근 여행지→다른 hub 홈 등 URL 필터 전환 시 목록 스크롤 유지 방지
  // 분류칩 클릭은 chipScrollPinRef가 잡히므로 여기서 건너뜀
  useLayoutEffect(() => {
    if (chipScrollPinRef.current) return;
    const root = mainScrollRef.current;
    if (!root) return;
    if (root.scrollTop !== 0) root.scrollTop = 0;
  }, [
    curatedRegion,
    curatedArea,
    curatedCluster,
    hubId,
    heritageRegion,
    heritageArea,
  ]);

  const resetListPage = useCallback(() => {
    if (page <= 1 && !searchParams.get('spot')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    next.delete('spot');
    setSearchParams(next, { replace: true });
  }, [page, searchParams, setSearchParams]);

  const onSearchInputChange = useCallback(
    (e) => {
      const next = e.target.value;
      setSearchDraft(next);
      if (next.trim()) {
        clearNear();
        resetListPage();
      }
    },
    [clearNear, resetListPage],
  );

  const commitSearch = useCallback(() => {
    const q = searchDraft.trim() || searchApplied.trim();
    setSearchApplied(q);
    setSearchDraft('');
    setSearchOpen(false);
    if (q) {
      clearNear();
      const curatedMatches = filterScenicSpotsByQuery(CURATED_ALL, q);
      const heritageMatches = filterScenicSpotsByQuery(
        listKoreaHeritageScenic(),
        q,
      );
      const nextCurated = pickRegionFromSpotMatches(
        curatedMatches,
        searchParams.get('cregion') || searchParams.get('region'),
      );
      const nextHeritage = pickRegionFromSpotMatches(
        heritageMatches,
        searchParams.get('hregion') || searchParams.get('region'),
      );
      const tourFallback =
        searchParams.get('tregion') ||
        searchParams.get('region') ||
        nextCurated ||
        nextHeritage;

      const applyPodRegions = (curatedR, heritageR, tourR) => {
        const next = new URLSearchParams(searchParams);
        next.set('cregion', resolveRegion(curatedR));
        next.set('hregion', resolveRegion(heritageR));
        next.set('tregion', resolveRegion(tourR));
        next.delete('carea');
        next.delete('ccluster');
        next.delete('harea');
        next.delete('tarea');
        next.delete('region');
        next.delete('area');
        next.delete('hub');
        next.delete('hcat');
        next.delete('cat2');
        next.delete('cat3');
        next.delete('page');
        next.delete('spot');
        setSearchParams(next, { replace: true });
      };

      // 명소·명승 0건이면 TourAPI 권역 건수로 관광지 파드만 고름 (화천→강원)
      if (curatedMatches.length === 0 && heritageMatches.length === 0) {
        applyPodRegions(nextCurated, nextHeritage, tourFallback);
        Promise.all(
          SCENIC_REGION_ORDER.map(async (r) => {
            const { count } = await countKoreaTourAttractions({
              region: r,
              searchQuery: q,
            });
            return { r, count: count || 0 };
          }),
        ).then((rows) => {
          const counts = Object.fromEntries(rows.map((row) => [row.r, row.count]));
          const nextTour = pickRegionFromTourCounts(counts, tourFallback);
          if (nextTour !== resolveRegion(tourFallback)) {
            applyPodRegions(nextCurated, nextHeritage, nextTour);
          }
        });
      } else {
        applyPodRegions(nextCurated, nextHeritage, tourFallback);
      }
    } else {
      resetListPage();
    }
    if (typeof document !== 'undefined') {
      const el =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      el?.blur?.();
    }
  }, [
    searchDraft,
    searchApplied,
    clearNear,
    resetListPage,
    searchParams,
    setSearchParams,
  ]);

  const regionChips = useMemo(() => {
    const set = new Set([...CURATED_REGIONS, ...SCENIC_REGION_ORDER]);
    return SCENIC_REGION_ORDER.filter((r) => set.has(r));
  }, []);

  /** 검색 중: 해당 섹션 매칭이 있는 권역만 (0건·타 섹션 혼입 금지) */
  const curatedRegionChipsVisible = useMemo(() => {
    if (nearActive) return [];
    if (!searchActive) return regionChips;
    return regionChips.filter(
      (r) => (curatedRegionCountsForChips[r] || 0) > 0,
    );
  }, [nearActive, searchActive, regionChips, curatedRegionCountsForChips]);

  const heritageRegionChipsVisible = useMemo(() => {
    if (nearActive) return [];
    if (!searchActive) return regionChips;
    return regionChips.filter(
      (r) => (heritageRegionCountsForChips[r] || 0) > 0,
    );
  }, [nearActive, searchActive, regionChips, heritageRegionCountsForChips]);

  const curatedAreaChipsForRow = useMemo(
    () => (curatedAreaChips.length > 1 ? curatedAreaChips : []),
    [curatedAreaChips],
  );

  const curatedClusterChipsForRow = useMemo(
    () => (curatedClusterChips.length > 1 ? curatedClusterChips : []),
    [curatedClusterChips],
  );

  const curatedHubChipsForRow = useMemo(
    () => (curatedHubChipsVisible.length > 1 ? curatedHubChipsVisible : []),
    [curatedHubChipsVisible],
  );

  const heritageAreaChipsForRow = useMemo(
    () => (heritageAreaChips.length > 1 ? heritageAreaChips : []),
    [heritageAreaChips],
  );

  /** 검색·내 주변에서 경관 칩이 1개뿐이면 분해 불가 → 숨김 */
  const heritageCategoryChipsForRow = useMemo(() => {
    if (!searchActive && !nearActive) return heritageCategoryChipsVisible;
    return heritageCategoryChipsVisible.length > 1
      ? heritageCategoryChipsVisible
      : [];
  }, [searchActive, nearActive, heritageCategoryChipsVisible]);

  // 시·군 hub에 선정 명소 0건이면 권역·타 여행지 수량 칩이 빈 안내와 충돌
  const showCuratedFilterChips = nearActive
    ? curatedHubChipsForRow.length > 0
    : Boolean(hubId) && curatedSpots.length === 0 && !searchActive
      ? false
      : !searchActive ||
        ((curatedSearchPool?.length || 0) > 0 &&
          (curatedRegionChipsVisible.length > 1 ||
            curatedAreaChipsForRow.length > 0 ||
            curatedClusterChipsForRow.length > 0 ||
            curatedHubChipsForRow.length > 0));

  const showHeritageFilterChips = nearActive
    ? heritageCategoryChipsForRow.length > 0
    : !searchActive ||
      ((heritageSearchPool?.length || 0) > 0 &&
        (heritageRegionChipsVisible.length > 1 ||
          heritageAreaChipsForRow.length > 0 ||
          heritageCategoryChipsForRow.length > 0));

  const cat2Chips = useMemo(() => listTourAttractionCat2(cat1), [cat1]);
  const cat3Chips = useMemo(
    () => listTourAttractionCat3(cat1, cat2),
    [cat1, cat2],
  );

  /** 검색·내 주변은 건수 확정(>0)만 · 로딩(undefined) 칩 나열 금지 */
  const keepTourChipByCount = useCallback(
    (count) => {
      if (searchActive || nearActive) {
        return Number.isFinite(Number(count)) && Number(count) > 0;
      }
      return keepChipByCount(count);
    },
    [searchActive, nearActive],
  );

  const tourCat1ChipsVisible = useMemo(
    () =>
      TOUR_ATTRACTION_CAT1.filter((chip) =>
        keepTourChipByCount(chipCounts.cat1Counts[chip.code]),
      ),
    [chipCounts.cat1Counts, keepTourChipByCount],
  );

  const tourCat2ChipsVisible = useMemo(() => {
    const majorLabel =
      TOUR_ATTRACTION_CAT1.find((c) => c.code === cat1)?.label || '';
    return cat2Chips.filter((chip) => {
      if (!keepTourChipByCount(chipCounts.cat2Counts[chip.code])) return false;
      if (majorLabel && chipLabelsEqual(chip.label, majorLabel)) return false;
      return true;
    });
  }, [cat2Chips, chipCounts.cat2Counts, cat1, keepTourChipByCount]);

  const tourCat3ChipsVisible = useMemo(() => {
    const midLabel = cat2Chips.find((c) => c.code === cat2)?.label || '';
    return cat3Chips.filter((chip) => {
      if (!keepTourChipByCount(chipCounts.cat3Counts[chip.code])) return false;
      if (midLabel && chipLabelsEqual(chip.label, midLabel)) return false;
      return true;
    });
  }, [cat3Chips, chipCounts.cat3Counts, cat2Chips, cat2, keepTourChipByCount]);

  const tourAreaCounts = useMemo(() => {
    if (nearActive) return {};
    return chipCounts.areaCounts || {};
  }, [nearActive, chipCounts.areaCounts]);

  const tourAreaChips = useMemo(() => {
    if (nearActive) return [];
    return tourAreaChipDefs.filter((chip) =>
      keepChipByCount(tourAreaCounts[chip.code]),
    );
  }, [nearActive, tourAreaChipDefs, tourAreaCounts]);

  const tourAreaChipsForRow = useMemo(
    () => (tourAreaChips.length > 1 ? tourAreaChips : []),
    [tourAreaChips],
  );

  const tourRegionChipsVisible = useMemo(() => {
    if (nearActive) return [];
    if (!searchActive) return regionChips;
    return regionChips.filter(
      (r) => (chipCounts.regionCounts?.[r] || 0) > 0,
    );
  }, [nearActive, searchActive, regionChips, chipCounts.regionCounts]);

  const showTourFilterChips = nearActive
    ? tourCat1ChipsVisible.length > 0 ||
      tourCat2ChipsVisible.length > 0 ||
      tourCat3ChipsVisible.length > 0
    : !searchActive ||
      tourRegionChipsVisible.length > 1 ||
      tourAreaChipsForRow.length > 0 ||
      tourCat1ChipsVisible.length > 1 ||
      tourCat2ChipsVisible.length > 1 ||
      tourCat3ChipsVisible.length > 1;

  const catalogHeading = useMemo(
    () => scenicDbCatalogHeading(tourRegion, tourArea, null),
    [tourRegion, tourArea],
  );

  useEffect(() => {
    if (nearActive) return undefined;
    let cancelled = false;
    fetchScenicFilterChipCounts({
      region: tourRegion,
      areaCode: tourArea,
      cat1,
      cat2,
      cat3,
      localityQuery: null,
      searchQuery: dbSearchActive ? dbSearchFilter : null,
    }).then((res) => {
      if (cancelled) return;
      setChipCounts({
        regionCounts: res.regionCounts || {},
        areaCounts: res.areaCounts || {},
        cat1Counts: res.cat1Counts || {},
        cat2Counts: res.cat2Counts || {},
        cat3Counts: res.cat3Counts || {},
      });
    });
    return () => {
      cancelled = true;
    };
  }, [
    nearActive,
    tourRegion,
    tourArea,
    cat1,
    cat2,
    cat3,
    dbSearchActive,
    dbSearchFilter,
  ]);

  useEffect(() => {
    if (!nearActive) return;
    const counts = countTourCatsFromNearSpots(nearTourPool, cat1, cat2);
    setChipCounts((prev) => ({
      ...prev,
      cat1Counts: counts.cat1Counts,
      cat2Counts: counts.cat2Counts,
      cat3Counts: counts.cat3Counts,
    }));
  }, [nearActive, nearTourPool, cat1, cat2]);

  useEffect(() => {
    let cancelled = false;
    countKoreaTourAttractions(
      dbSearchActive
        ? {
            searchQuery: dbSearchFilter,
            region: tourRegion,
            areaCode: tourArea,
            localityQuery: null,
          }
        : { region: tourRegion, areaCode: tourArea, localityQuery: null },
    ).then((res) => {
      if (cancelled) return;
      setScopeCount(res.count || 0);
    });
    return () => {
      cancelled = true;
    };
  }, [tourRegion, tourArea, dbSearchActive, dbSearchFilter]);

  useEffect(() => {
    const rawLegacyRegion = searchParams.get('region');
    const rawLegacyArea = searchParams.get('area');
    const rawCat1 = searchParams.get('cat1');
    const rawCat2 = searchParams.get('cat2');
    const rawCat3 = searchParams.get('cat3');
    const rawHub = searchParams.get('hub');
    const rawHcat = searchParams.get('hcat');
    const next = new URLSearchParams(searchParams);
    let changed = false;

    const hubArea = hubId ? scenicAreaCodeForHubId(hubId) : null;
    const hubRegion = hubArea
      ? scenicRegionForAreaCode(hubArea) || null
      : null;
    const seedRegion = resolveRegion(rawLegacyRegion || hubRegion);
    const seedArea =
      normalizeScenicAreaCode(
        seedRegion,
        rawLegacyArea || (hubRegion === seedRegion ? hubArea : null),
      ) || null;

    for (const prefix of /** @type {const} */ (['c', 'h', 't'])) {
      const rKey = `${prefix}region`;
      const aKey = `${prefix}area`;
      const rawR = searchParams.get(rKey);
      if (!rawR || rawR === '전체' || !SCENIC_REGION_ORDER.includes(rawR)) {
        if (!rawR) {
          next.set(rKey, seedRegion);
          changed = true;
        } else {
          next.set(rKey, DEFAULT_REGION);
          changed = true;
        }
      }
      const podRegion = resolveRegion(next.get(rKey));
      const rawA = searchParams.get(aKey) || (!rawR ? rawLegacyArea : null);
      if (rawA && !normalizeScenicAreaCode(podRegion, rawA)) {
        if (searchParams.get(aKey)) {
          next.delete(aKey);
          changed = true;
        }
      } else if (
        !searchParams.get(aKey) &&
        seedArea &&
        !rawR &&
        normalizeScenicAreaCode(podRegion, seedArea)
      ) {
        next.set(aKey, seedArea);
        changed = true;
      }
    }

    // 파드 키가 채워지면 레거시 region/area 제거 — 칩 재결합 방지
    if (
      next.get('cregion') &&
      next.get('hregion') &&
      next.get('tregion') &&
      (next.has('region') || next.has('area'))
    ) {
      next.delete('region');
      next.delete('area');
      changed = true;
    }

    if (rawHub && !normalizeScenicHubParam(rawHub)) {
      next.delete('hub');
      changed = true;
    }
    if (rawHcat && !normalizeHeritageCategory(rawHcat)) {
      next.delete('hcat');
      changed = true;
    }
    if (
      heritageCategory &&
      !heritageCategoryChips.some((c) => c.code === heritageCategory)
    ) {
      next.delete('hcat');
      changed = true;
    }
    if (!normalizeTourAttractionCat1(rawCat1)) {
      next.set('cat1', cat1);
      changed = true;
    }
    if (rawCat2 && !normalizeTourAttractionCat2(cat1, rawCat2)) {
      next.delete('cat2');
      next.delete('cat3');
      changed = true;
    }
    if (rawCat3 && !normalizeTourAttractionCat3(cat1, cat2, rawCat3)) {
      next.delete('cat3');
      changed = true;
    }

    // 기본 중·소분류 — 권역 전체(긴 목록) 대신 첫 시도·필요 시 ~10건 소분류
    if (!nearActive && !searchActive) {
      const cRegion = resolveRegion(next.get('cregion'));
      const hRegion = resolveRegion(next.get('hregion'));
      const tRegion = resolveRegion(next.get('tregion'));
      const curatedAreaCounts = countKoreaScenicSpotsByTourArea(cRegion);
      const heritageAreaCounts = countKoreaHeritageScenicByTourArea(hRegion);
      const curatedDef = resolveDefaultCuratedChips(cRegion);
      const heritageDef = resolveDefaultHeritageChips(hRegion);

      if (!next.get('carea') && curatedDef.areaCode) {
        next.set('carea', curatedDef.areaCode);
        changed = true;
      }
      const cAreaNow =
        normalizeScenicAreaCode(cRegion, next.get('carea')) || null;
      const cClusterAreaNow = resolveScenicClusterAreaCode(cRegion, cAreaNow);
      const hubClusterFromHub = hubId
        ? scenicClusterIdForHubId(hubId)
        : null;
      if (
        !next.get('ccluster') &&
        (curatedDef.clusterId || hubClusterFromHub)
      ) {
        const seedCluster =
          normalizeScenicClusterId(
            cClusterAreaNow,
            curatedDef.clusterId || hubClusterFromHub,
          ) || null;
        if (seedCluster) {
          next.set('ccluster', seedCluster);
          changed = true;
        }
      }
      if (
        next.get('ccluster') &&
        !normalizeScenicClusterId(cClusterAreaNow, next.get('ccluster'))
      ) {
        next.delete('ccluster');
        changed = true;
      }
      const cClusterNow =
        normalizeScenicClusterId(cClusterAreaNow, next.get('ccluster')) ||
        null;
      if (!next.get('hub')) {
        const hubDef = pickDefaultCuratedHubId(
          cRegion,
          cAreaNow,
          cClusterNow,
          curatedAreaCounts,
          CURATED_REGION_COUNTS,
        );
        if (hubDef && normalizeScenicHubParam(hubDef)) {
          next.set('hub', hubDef);
          changed = true;
        }
      }
      if (!next.get('harea') && heritageDef.areaCode) {
        next.set('harea', heritageDef.areaCode);
        changed = true;
      }
      const hAreaNow =
        normalizeScenicAreaCode(hRegion, next.get('harea')) || null;
      if (!next.get('hcat')) {
        const listCount = listCountForRegionArea(
          hRegion,
          hAreaNow,
          heritageAreaCounts,
          HERITAGE_REGION_COUNTS,
        );
        const catDef = pickDefaultHeritageCategory(
          hRegion,
          hAreaNow,
          listCount,
        );
        if (catDef && normalizeHeritageCategory(catDef)) {
          next.set('hcat', catDef);
          changed = true;
        }
      }
      if (!next.get('tarea')) {
        // Tour 시도 건수는 비동기 — 동기 SSOT 순서로 첫 중분류(서울 등) 시드
        const tourAreaDef =
          resolveDefaultTourAreaCode(
            tRegion,
            Object.fromEntries(
              listScenicRegionAreas(tRegion).map((a) => [a.code, 1]),
            ),
          ) || null;
        if (tourAreaDef) {
          next.set('tarea', tourAreaDef);
          changed = true;
        }
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    hubId,
    cat1,
    cat2,
    heritageCategory,
    heritageCategoryChips,
    nearActive,
    searchActive,
  ]);

  useEffect(() => {
    if (!selectedId) {
      reconcileThemeNavBack(listReturnTo);
      return;
    }
    const q = listReturnTo.includes('?')
      ? listReturnTo.slice(listReturnTo.indexOf('?') + 1)
      : '';
    const params = new URLSearchParams(q);
    params.set('spot', selectedId);
    reconcileThemeNavBack(`${RETURN_TO}?${params.toString()}`);
  }, [listReturnTo, selectedId]);

  useEffect(() => {
    if (!nearActive || !nearOrigin) {
      setNearTourPool([]);
      setNearTourStatus('idle');
      setNearTourError(null);
      return undefined;
    }
    let cancelled = false;
    setNearTourStatus('loading');
    setNearTourError(null);
    fetchKoreaTourAttractionsNear({
      lat: nearOrigin.lat,
      lng: nearOrigin.lng,
      radiusKm: NEAR_KM,
      limit: NEAR_DB_POOL_LIMIT,
    }).then((res) => {
      if (cancelled) return;
      const ranked = rankNearbyScenicSpots(
        res.spots || [],
        nearOrigin.lat,
        nearOrigin.lng,
        NEAR_KM,
      );
      setNearTourPool(ranked.map((row) => row.item));
      setDbKmById(kmByIdFromRanked(ranked));
      if (res.error) {
        setNearTourStatus('error');
        setNearTourError(res.error);
      } else {
        setNearTourStatus('ok');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [nearActive, nearOrigin]);

  useEffect(() => {
    if (!nearActive) return;
    if (nearTourStatus === 'loading' || nearTourStatus === 'idle') {
      setDbStatus('loading');
      setDbError(null);
      setDbSpots([]);
      setDbCount(0);
      return;
    }
    if (nearTourStatus === 'error') {
      setDbStatus('error');
      setDbError(nearTourError);
      setDbSpots([]);
      setDbCount(0);
      return;
    }
    const filtered = filterTourSpotsByCats(
      nearTourPool,
      cat1,
      cat2,
      cat3,
    ).slice(0, NEAR_DB_LIST_LIMIT);
    setDbSpots(filtered);
    setDbCount(filtered.length);
    setDbError(null);
    setDbStatus(filtered.length === 0 ? 'empty' : 'ok');
  }, [
    nearActive,
    nearTourPool,
    nearTourStatus,
    nearTourError,
    cat1,
    cat2,
    cat3,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (nearActive) return undefined;
    if (searchActive && !dbSearchActive) {
      setDbStatus('loading');
      setDbError(null);
      return undefined;
    }
    setDbStatus('loading');
    setDbError(null);

    const fetchLimit = PAGE_SIZE;
    const fetchOffset = (page - 1) * PAGE_SIZE;
    const fetchOpts = dbSearchActive
      ? {
          searchQuery: dbSearchFilter,
          region: tourRegion,
          areaCode: tourArea,
          cat1,
          cat2,
          cat3,
          localityQuery: null,
          limit: fetchLimit,
          offset: fetchOffset,
        }
      : {
          region: tourRegion,
          areaCode: tourArea,
          cat1,
          cat2,
          cat3,
          localityQuery: null,
          limit: fetchLimit,
          offset: fetchOffset,
        };
    fetchKoreaTourAttractions(fetchOpts).then((res) => {
      if (cancelled) return;
      setDbKmById(new Map());
      setDbSpots(res.spots || []);
      setDbCount(res.count || 0);
      if (res.error) {
        setDbStatus('error');
        setDbError(res.error);
      } else if ((res.spots || []).length === 0 && (res.count || 0) === 0) {
        setDbStatus('empty');
      } else {
        setDbStatus('ok');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    tourRegion,
    tourArea,
    cat1,
    cat2,
    cat3,
    page,
    nearActive,
    searchActive,
    dbSearchActive,
    dbSearchFilter,
  ]);

  useEffect(() => {
    if (!nearActive) return;
    const curatedN = curatedNearPool?.length ?? 0;
    const heritageN = heritageNearPool?.length ?? 0;
    const dbN =
      nearTourStatus === 'loading' || nearTourStatus === 'idle'
        ? null
        : nearTourPool.length;
    const known = curatedN + heritageN + (dbN ?? 0);
    if (dbN == null) {
      setNearMsg(
        `${nearLabel} 주변 · ${NEAR_KM}km 안 명소 ${curatedN} · 명승 ${heritageN} · 관광지 확인 중…`,
      );
      return;
    }
    setNearMsg(
      known > 0
        ? `${nearLabel} 주변 · ${NEAR_KM}km 안 명소 ${curatedN} · 명승 ${heritageN} · 관광지 ${dbN}`
        : `${NEAR_KM}km 안 명소·명승·관광지가 없습니다. 권역 칩으로 둘러보세요.`,
    );
  }, [
    nearActive,
    nearLabel,
    curatedNearPool,
    heritageNearPool,
    nearTourPool.length,
    nearTourStatus,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedId) {
      setSelectedSpot(null);
      return undefined;
    }
    const curated = CURATED_ALL.find((s) => s.id === selectedId);
    if (curated) {
      const contentId = String(curated.contentId || '').trim();
      const firstImage = curatedImageByContentId.get(contentId) || null;
      setSelectedSpot(
        firstImage
          ? { ...curated, firstImage, imageUrl: firstImage }
          : curated,
      );
      return undefined;
    }
    const heritage = getKoreaHeritageScenicById(selectedId);
    if (heritage) {
      setSelectedSpot(heritage);
      return undefined;
    }
    const fromPage = dbSpots.find((s) => s.id === selectedId);
    if (fromPage) {
      setSelectedSpot(
        fromPage.firstImage && !fromPage.imageUrl
          ? { ...fromPage, imageUrl: fromPage.firstImage }
          : fromPage,
      );
      return undefined;
    }
    const savedRef =
      favoriteList.find((s) => String(s.id) === String(selectedId)) ||
      viewedList.find((s) => String(s.id) === String(selectedId)) ||
      null;
    if (savedRef) setSelectedSpot(savedRef);
    fetchKoreaTourAttractionById(selectedId).then((spot) => {
      if (cancelled) return;
      if (!spot) {
        if (!savedRef) setSelectedSpot(null);
        return;
      }
      setSelectedSpot(
        spot.firstImage && !spot.imageUrl
          ? { ...spot, imageUrl: spot.firstImage }
          : spot,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, dbSpots, curatedImageByContentId, favoriteList, viewedList]);

  const setCuratedRegion = useCallback(
    (r) => {
      clearNear();
      const region = resolveRegion(r);
      const def = resolveDefaultCuratedChips(region);
      const next = new URLSearchParams(searchParams);
      next.set('cregion', region);
      if (def.areaCode) next.set('carea', def.areaCode);
      else next.delete('carea');
      if (def.clusterId) next.set('ccluster', def.clusterId);
      else next.delete('ccluster');
      if (def.hubId) next.set('hub', def.hubId);
      else next.delete('hub');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, clearNear],
  );

  const setCuratedArea = useCallback(
    (code) => {
      clearNear();
      const normalized = normalizeScenicAreaCode(curatedRegion, code);
      if (!normalized || normalized === curatedArea) return;
      const areaCounts = countKoreaScenicSpotsByTourArea(curatedRegion);
      const clusterDef = pickDefaultClusterId(curatedRegion, normalized);
      const hubDef = pickDefaultCuratedHubId(
        curatedRegion,
        normalized,
        clusterDef,
        areaCounts,
        CURATED_REGION_COUNTS,
      );
      const next = new URLSearchParams(searchParams);
      next.set('carea', normalized);
      if (clusterDef) next.set('ccluster', clusterDef);
      else next.delete('ccluster');
      if (hubDef) next.set('hub', hubDef);
      else next.delete('hub');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, curatedRegion, curatedArea, clearNear],
  );

  const setCuratedCluster = useCallback(
    (id) => {
      clearNear();
      const normalized = normalizeScenicClusterId(curatedClusterArea, id);
      if (!normalized || normalized === curatedCluster) return;
      const areaCounts = countKoreaScenicSpotsByTourArea(curatedRegion);
      const hubDef = pickDefaultCuratedHubId(
        curatedRegion,
        curatedArea,
        normalized,
        areaCounts,
        CURATED_REGION_COUNTS,
      );
      const next = new URLSearchParams(searchParams);
      next.set('ccluster', normalized);
      if (hubDef) next.set('hub', hubDef);
      else next.delete('hub');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [
      searchParams,
      setSearchParams,
      curatedRegion,
      curatedArea,
      curatedCluster,
      curatedClusterArea,
      clearNear,
    ],
  );

  const setHeritageRegion = useCallback(
    (r) => {
      clearNear();
      const region = resolveRegion(r);
      const def = resolveDefaultHeritageChips(region);
      const next = new URLSearchParams(searchParams);
      next.set('hregion', region);
      if (def.areaCode) next.set('harea', def.areaCode);
      else next.delete('harea');
      if (def.category) next.set('hcat', def.category);
      else next.delete('hcat');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, clearNear],
  );

  const setHeritageArea = useCallback(
    (code) => {
      clearNear();
      const normalized = normalizeScenicAreaCode(heritageRegion, code);
      if (!normalized || normalized === heritageArea) return;
      const areaCounts = countKoreaHeritageScenicByTourArea(heritageRegion);
      const listCount = listCountForRegionArea(
        heritageRegion,
        normalized,
        areaCounts,
        HERITAGE_REGION_COUNTS,
      );
      const catDef = pickDefaultHeritageCategory(
        heritageRegion,
        normalized,
        listCount,
      );
      const next = new URLSearchParams(searchParams);
      next.set('harea', normalized);
      if (catDef) next.set('hcat', catDef);
      else next.delete('hcat');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, heritageRegion, heritageArea, clearNear],
  );

  const setTourRegion = useCallback(
    (r) => {
      clearNear();
      const region = resolveRegion(r);
      const next = new URLSearchParams(searchParams);
      next.set('tregion', region);
      const tourAreaDef = resolveDefaultTourAreaCode(
        region,
        Object.fromEntries(
          listScenicRegionAreas(region).map((a) => [a.code, 1]),
        ),
      );
      if (tourAreaDef) next.set('tarea', tourAreaDef);
      else next.delete('tarea');
      next.delete('cat2');
      next.delete('cat3');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, clearNear],
  );

  const setTourArea = useCallback(
    (code) => {
      clearNear();
      const normalized = normalizeScenicAreaCode(tourRegion, code);
      if (!normalized || normalized === tourArea) return;
      const next = new URLSearchParams(searchParams);
      next.set('tarea', normalized);
      next.delete('cat2');
      next.delete('cat3');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, tourRegion, tourArea, clearNear],
  );

  const setHub = useCallback(
    (id) => {
      // 내 주변 중에는 hub 칩으로 풀만 좁힘 · near 유지
      if (!nearActive) clearNear();
      const normalized = normalizeScenicHubParam(id);
      if (!normalized || normalized === hubId) return;
      const next = new URLSearchParams(searchParams);
      next.set('hub', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, hubId, clearNear, nearActive],
  );

  const setHeritageCategory = useCallback(
    (code) => {
      // 내 주변 중에는 경관 칩으로 풀만 좁힘 · near 유지
      if (!nearActive) clearNear();
      const normalized = normalizeHeritageCategory(code);
      if (!normalized || normalized === heritageCategory) return;
      const next = new URLSearchParams(searchParams);
      next.set('hcat', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, heritageCategory, clearNear, nearActive],
  );

  const applyUserLocation = useCallback(
    (lat, lng) => {
      const hubResolved = resolveKoreaAreaFromCoords(lat, lng);
      if (!hubResolved) {
        setNearLabel('');
        setNearOrigin(null);
        setNearMsg('국내 위치를 찾지 못했습니다. 권역 칩으로 골라 보세요.');
        return false;
      }
      const nextRegion =
        scenicRegionForAreaCode(hubResolved.areaCode) || DEFAULT_REGION;
      const nextArea =
        normalizeScenicAreaCode(nextRegion, hubResolved.areaCode) || null;
      const next = new URLSearchParams(searchParams);
      for (const prefix of ['c', 'h', 't']) {
        next.set(`${prefix}region`, nextRegion);
        if (nextArea) next.set(`${prefix}area`, nextArea);
        else next.delete(`${prefix}area`);
      }
      next.delete('region');
      next.delete('area');
      next.delete('hub');
      next.delete('hcat');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
      setNearOrigin({ lat, lng });
      setNearLabel(hubResolved.hubName || '');
      setNearMsg('주변 목록을 정리하는 중…');
      return true;
    },
    [searchParams, setSearchParams],
  );

  const handleNearMe = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNearLabel('');
      setNearOrigin(null);
      setNearMsg('이 기기에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }
    setNearBusy(true);
    setNearLabel('');
    setNearMsg('위치를 확인하는 중…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearBusy(false);
        applyUserLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setNearBusy(false);
        setNearLabel('');
        setNearOrigin(null);
        const code = err?.code;
        if (code === 1) {
          setNearMsg(
            '위치 권한이 필요합니다. 브라우저에서 위치를 허용해 주세요.',
          );
        } else if (code === 3) {
          setNearMsg('위치 확인이 지연되었습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          setNearMsg(
            '위치를 가져오지 못했습니다. 권한·네트워크를 확인해 주세요.',
          );
        }
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 },
    );
  }, [applyUserLocation]);

  const setCat1 = useCallback(
    (code) => {
      const normalized =
        normalizeTourAttractionCat1(code) || DEFAULT_CAT1;
      if (normalized === cat1) return;
      const next = new URLSearchParams(searchParams);
      next.set('cat1', normalized);
      next.delete('cat2');
      next.delete('cat3');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1],
  );

  /** 검색·내 주변에서 기본 종목(자연)에 0건이면 결과 있는 첫 종목으로 전환 */
  useEffect(() => {
    const poolReady =
      (searchActive && dbSearchActive) ||
      (nearActive && nearTourStatus === 'ok');
    if (!poolReady) return;
    const counts = chipCounts.cat1Counts || {};
    const loaded = TOUR_ATTRACTION_CAT1.some((c) =>
      Number.isFinite(Number(counts[c.code])),
    );
    if (!loaded) return;
    if ((Number(counts[cat1]) || 0) > 0) return;
    const next = TOUR_ATTRACTION_CAT1.find(
      (c) => (Number(counts[c.code]) || 0) > 0,
    );
    if (!next || next.code === cat1) return;
    setCat1(next.code);
  }, [
    searchActive,
    dbSearchActive,
    nearActive,
    nearTourStatus,
    chipCounts.cat1Counts,
    cat1,
    setCat1,
  ]);

  /**
   * 검색 중 명소·명승 전국 0이면 TourAPI 최다 권역으로 관광지 파드만 전환.
   * 현 권역에 오탐 소수만 있어도(성주→보령 성주면) 본 지역 권역으로 승격.
   */
  useEffect(() => {
    if (!searchActive || !dbSearchActive) return;
    if ((curatedSearchPool?.length || 0) > 0) return;
    if ((heritageSearchPool?.length || 0) > 0) return;
    const counts = chipCounts.regionCounts || {};
    const loaded = SCENIC_REGION_ORDER.some((r) =>
      Number.isFinite(Number(counts[r])),
    );
    if (!loaded) return;
    const next = pickRegionFromTourCounts(counts, tourRegion);
    if (!next || next === tourRegion) return;
    const curN = Number(counts[tourRegion]) || 0;
    const nextN = Number(counts[next]) || 0;
    if (nextN <= curN) return;
    setTourRegion(next);
  }, [
    searchActive,
    dbSearchActive,
    curatedSearchPool,
    heritageSearchPool,
    chipCounts.regionCounts,
    tourRegion,
    setTourRegion,
  ]);

  const setCat2 = useCallback(
    (code) => {
      const normalized = normalizeTourAttractionCat2(cat1, code);
      if (!normalized || normalized === cat2) return;
      const next = new URLSearchParams(searchParams);
      next.set('cat2', normalized);
      next.delete('cat3');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1, cat2],
  );

  const setCat3 = useCallback(
    (code) => {
      const normalized = normalizeTourAttractionCat3(cat1, cat2, code);
      if (!normalized || normalized === cat3) return;
      const next = new URLSearchParams(searchParams);
      next.set('cat3', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1, cat2, cat3],
  );

  /** 관광지 종목 중·소분류 기본값 — 칩 건수 로드 후 첫 중분류·길면 소분류 */
  useEffect(() => {
    if (nearActive || searchActive) return;
    const resolved = resolveDefaultTourCatChips(cat1, cat2, cat3, chipCounts);
    if (!resolved.changed) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (resolved.cat2 && next.get('cat2') !== resolved.cat2) {
          next.set('cat2', resolved.cat2);
          changed = true;
        }
        if (resolved.cat3 && next.get('cat3') !== resolved.cat3) {
          next.set('cat3', resolved.cat3);
          changed = true;
        }
        if (!changed) return prev;
        next.delete('spot');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  }, [
    nearActive,
    searchActive,
    cat1,
    cat2,
    cat3,
    chipCounts.cat2Counts,
    chipCounts.cat3Counts,
    setSearchParams,
  ]);

  const setPage = useCallback(
    (p) => {
      const next = new URLSearchParams(searchParams);
      if (p <= 1) next.delete('page');
      else next.set('page', String(p));
      next.delete('spot');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const scenicById = useMemo(() => {
    /** @type {Map<string, Record<string, unknown>>} */
    const map = new Map();
    for (const s of CURATED_ALL) {
      if (s?.id) map.set(String(s.id), s);
    }
    for (const s of listKoreaHeritageScenic()) {
      if (s?.id) map.set(String(s.id), s);
    }
    for (const s of dbSpots) {
      if (s?.id && !map.has(String(s.id))) map.set(String(s.id), s);
    }
    return map;
  }, [dbSpots]);

  const refreshFavorites = useCallback(() => {
    const list = loadScenicFavorites();
    setFavoriteList(list);
    setFavoriteIds(new Set(list.map((r) => String(r.id))));
  }, []);

  const handleToggleFavorite = useCallback(
    (spot) => {
      toggleScenicFavorite(spot);
      refreshFavorites();
    },
    [refreshFavorites],
  );

  const openPersonal = useCallback(
    (tab) => {
      setPersonalTab(tab);
      setMapPod((cur) =>
        cur === 'personal' || cur == null ? cur : null,
      );
      clearNear();
      clearSearchFilter();
      const next = new URLSearchParams(searchParams);
      next.delete('spot');
      setSearchParams(next, { replace: true });
      if (tab === 'favorites') refreshFavorites();
      else setViewedList(loadScenicViewed());
    },
    [
      clearNear,
      clearSearchFilter,
      refreshFavorites,
      searchParams,
      setSearchParams,
    ],
  );

  const closePersonal = useCallback(() => {
    setPersonalTab(null);
    setMapPod((cur) => (cur === 'personal' ? null : cur));
  }, []);

  const personalItems = useMemo(() => {
    const refs =
      personalTab === 'favorites'
        ? favoriteList
        : personalTab === 'viewed'
          ? viewedList
          : [];
    return hydrateScenicRefs(refs, scenicById);
  }, [personalTab, favoriteList, viewedList, scenicById]);

  const personalGroups = useMemo(
    () => groupScenicByRegion(personalItems),
    [personalItems],
  );

  const curatedMapModel = useMemo(
    () => buildCuratedMapDrill(CURATED_ALL, curatedMapDrill),
    [curatedMapDrill],
  );

  const heritageMapModel = useMemo(
    () => buildHeritageMapDrill(HERITAGE_ALL, heritageMapDrill),
    [heritageMapDrill],
  );

  const tourMapModel = useMemo(
    () =>
      buildTourMapDrill(tourMapDrill, tourMapCounts, {
        countsReady: tourMapCountsReady,
      }),
    [tourMapDrill, tourMapCounts, tourMapCountsReady],
  );

  /** 관광지 지도 칩 건수 — 드릴 scope 기준(목록 URL 칩과 분리) */
  useEffect(() => {
    if (mapPod !== 'tour') return undefined;
    let cancelled = false;
    setTourMapCountsReady(false);
    const d = normalizeTourMapDrill(tourMapDrill);
    fetchScenicFilterChipCounts({
      region: d.region,
      areaCode: d.area,
      cat1: d.cat1,
      cat2: d.cat2,
      cat3: d.cat3,
    }).then((res) => {
      if (cancelled) return;
      setTourMapCounts({
        regionCounts: res.regionCounts || {},
        areaCounts: res.areaCounts || {},
        cat1Counts: res.cat1Counts || {},
        cat2Counts: res.cat2Counts || {},
        cat3Counts: res.cat3Counts || {},
      });
      setTourMapCountsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mapPod, tourMapDrill]);

  const tourMapFetchKey = useMemo(() => {
    if (!tourMapModel.showSpotPins || !tourMapModel.fetchFilters) return '';
    const f = tourMapModel.fetchFilters;
    return [
      f.region || '',
      f.areaCode || '',
      f.cat1 || '',
      f.cat2 || '',
      f.cat3 || '',
    ].join('|');
  }, [tourMapModel.showSpotPins, tourMapModel.fetchFilters]);

  /** 관광지 지도 핀 — 리프(소분류) 도달 시에만 */
  useEffect(() => {
    if (mapPod !== 'tour') {
      setTourMapPins([]);
      setTourMapPinsStatus('idle');
      return undefined;
    }
    if (!tourMapFetchKey || !tourMapModel.fetchFilters) {
      setTourMapPins([]);
      setTourMapPinsStatus('idle');
      return undefined;
    }
    let cancelled = false;
    setTourMapPinsStatus('loading');
    const f = tourMapModel.fetchFilters;
    fetchKoreaTourAttractions({
      region: f.region,
      areaCode: f.areaCode,
      cat1: f.cat1,
      cat2: f.cat2,
      cat3: f.cat3,
      limit: TOUR_MAP_PIN_LIMIT,
      offset: 0,
    }).then((res) => {
      if (cancelled) return;
      setTourMapPins(res.spots || []);
      setTourMapPinsStatus(res.error ? 'error' : 'ok');
    });
    return () => {
      cancelled = true;
    };
  }, [mapPod, tourMapFetchKey, tourMapModel.fetchFilters]);

  /** 지도 핀 — 명소·명승·관광지는 드릴 리프에서만 · 개인은 목록 */
  const mapItems = useMemo(() => {
    if (mapPod === 'personal') return personalItems;
    if (mapPod === 'curated') {
      return curatedMapModel.showSpotPins ? curatedMapModel.scopeSpots : [];
    }
    if (mapPod === 'heritage') {
      return heritageMapModel.showSpotPins ? heritageMapModel.scopeSpots : [];
    }
    if (mapPod === 'tour') {
      return tourMapModel.showSpotPins ? tourMapPins : [];
    }
    return [];
  }, [
    mapPod,
    personalItems,
    curatedMapModel,
    heritageMapModel,
    tourMapModel,
    tourMapPins,
  ]);

  useEffect(() => {
    if (!mapPod) return;
    if (mapPod === 'curated') {
      setMapFocusView(
        focusViewForMapDrill(
          curatedMapModel.chips,
          curatedMapModel.scopeSpots,
        ),
      );
      return;
    }
    if (mapPod === 'heritage') {
      setMapFocusView(
        focusViewForMapDrill(
          heritageMapModel.chips,
          heritageMapModel.scopeSpots,
        ),
      );
      return;
    }
    if (mapPod === 'tour') {
      setMapFocusView(
        focusViewForMapDrill(tourMapModel.chips, tourMapPins),
      );
      return;
    }
    const view = focusViewFromScenicItems(mapItems);
    setMapFocusView(view || KOREA_SCENIC_MAP_OVERVIEW);
  }, [
    mapPod,
    mapItems,
    curatedMapModel,
    heritageMapModel,
    tourMapModel,
    tourMapPins,
  ]);

  /** 검색·내 주변은 결과 누락 방지로 세 파드 펼침(다중 펼침 유지) */
  useEffect(() => {
    if (!searchActive && !nearActive) return;
    setOpenPods({ curated: true, heritage: true, tour: true });
  }, [searchActive, nearActive]);

  useEffect(() => {
    if (personalTab == null && mapPod === 'personal') setMapPod(null);
  }, [personalTab, mapPod]);

  const syncCuratedMapDrillToUrl = useCallback(
    (drill) => {
      const d = normalizeScenicMapDrill(drill);
      if (!d.region) return;
      const next = new URLSearchParams(searchParams);
      next.set('cregion', d.region);
      if (d.area) next.set('carea', d.area);
      else next.delete('carea');
      if (d.cluster) next.set('ccluster', d.cluster);
      else next.delete('ccluster');
      if (d.hub) next.set('hub', d.hub);
      else next.delete('hub');
      next.delete('region');
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const syncHeritageMapDrillToUrl = useCallback(
    (drill) => {
      const d = normalizeHeritageMapDrill(drill);
      if (!d.region) return;
      const next = new URLSearchParams(searchParams);
      next.set('hregion', d.region);
      if (d.area) next.set('harea', d.area);
      else next.delete('harea');
      if (d.category) next.set('hcat', d.category);
      else next.delete('hcat');
      next.delete('spot');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const syncTourMapDrillToUrl = useCallback(
    (drill, fetchFilters = null) => {
      const d = normalizeTourMapDrill(drill);
      const region = d.region || fetchFilters?.region || null;
      if (!region) return;
      const area = d.area || fetchFilters?.areaCode || null;
      const nextCat1 = d.cat1 || fetchFilters?.cat1 || null;
      const nextCat2 = d.cat2 || fetchFilters?.cat2 || null;
      const nextCat3 = d.cat3 || fetchFilters?.cat3 || null;
      const next = new URLSearchParams(searchParams);
      next.set('tregion', region);
      if (area) next.set('tarea', area);
      else next.delete('tarea');
      if (nextCat1) next.set('cat1', nextCat1);
      else next.delete('cat1');
      if (nextCat2) next.set('cat2', nextCat2);
      else next.delete('cat2');
      if (nextCat3) next.set('cat3', nextCat3);
      else next.delete('cat3');
      next.delete('page');
      next.delete('spot');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const syncActiveMapDrillToUrl = useCallback(() => {
    if (mapPod === 'curated') syncCuratedMapDrillToUrl(curatedMapDrill);
    else if (mapPod === 'heritage') {
      syncHeritageMapDrillToUrl(heritageMapDrill);
    } else if (mapPod === 'tour') {
      syncTourMapDrillToUrl(tourMapDrill, tourMapModel.fetchFilters);
    }
  }, [
    mapPod,
    curatedMapDrill,
    heritageMapDrill,
    tourMapDrill,
    tourMapModel.fetchFilters,
    syncCuratedMapDrillToUrl,
    syncHeritageMapDrillToUrl,
    syncTourMapDrillToUrl,
  ]);

  const closeMap = useCallback(() => {
    syncActiveMapDrillToUrl();
    setMapPod(null);
  }, [syncActiveMapDrillToUrl]);

  const togglePodOpen = useCallback(
    (pod) => {
      setOpenPods((prev) => {
        const nextOpen = !prev[pod];
        if (!nextOpen && mapPod === pod) {
          syncActiveMapDrillToUrl();
          setMapPod(null);
        }
        return { ...prev, [pod]: nextOpen };
      });
    },
    [mapPod, syncActiveMapDrillToUrl],
  );

  const togglePodMap = useCallback(
    (pod) => {
      if (mapPod === pod) {
        syncActiveMapDrillToUrl();
        setMapPod(null);
        return;
      }
      if (pod !== 'personal') {
        setOpenPods((prev) => (prev[pod] ? prev : { ...prev, [pod]: true }));
      }
      if (pod === 'curated') {
        setCuratedMapDrill({ ...EMPTY_SCENIC_MAP_DRILL });
      } else if (pod === 'heritage') {
        setHeritageMapDrill({ ...EMPTY_HERITAGE_MAP_DRILL });
      } else if (pod === 'tour') {
        setTourMapDrill({ ...EMPTY_TOUR_MAP_DRILL });
        setTourMapCounts({
          regionCounts: {},
          areaCounts: {},
          cat1Counts: {},
          cat2Counts: {},
          cat3Counts: {},
        });
        setTourMapCountsReady(false);
        setTourMapPins([]);
      }
      setMapSessionKey((k) => k + 1);
      requestAnimationFrame(() => {
        mainScrollRef.current?.scrollTo({ top: 0 });
      });
      setMapPod(pod);
    },
    [mapPod, syncActiveMapDrillToUrl],
  );

  const handleCuratedMapDrillChip = useCallback((chip) => {
    setCuratedMapDrill((prev) => drillDownScenicMap(prev, chip));
  }, []);

  const handleCuratedMapDrillUp = useCallback(() => {
    setCuratedMapDrill((prev) => drillUpScenicMap(prev));
  }, []);

  const handleCuratedMapDrillCrumb = useCallback(
    (index) => {
      const crumb = curatedMapModel.crumbs[index];
      if (!crumb) return;
      setCuratedMapDrill(normalizeScenicMapDrill(crumb.drill));
    },
    [curatedMapModel.crumbs],
  );

  const handleHeritageMapDrillChip = useCallback((chip) => {
    setHeritageMapDrill((prev) => drillDownHeritageMap(prev, chip));
  }, []);

  const handleHeritageMapDrillUp = useCallback(() => {
    setHeritageMapDrill((prev) => drillUpHeritageMap(prev));
  }, []);

  const handleHeritageMapDrillCrumb = useCallback(
    (index) => {
      const crumb = heritageMapModel.crumbs[index];
      if (!crumb) return;
      setHeritageMapDrill(normalizeHeritageMapDrill(crumb.drill));
    },
    [heritageMapModel.crumbs],
  );

  const handleTourMapDrillChip = useCallback((chip) => {
    setTourMapDrill((prev) => drillDownTourMap(prev, chip));
  }, []);

  const handleTourMapDrillUp = useCallback(() => {
    setTourMapDrill((prev) => drillUpTourMap(prev));
  }, []);

  const handleTourMapDrillCrumb = useCallback(
    (index) => {
      const crumb = tourMapModel.crumbs[index];
      if (!crumb) return;
      setTourMapDrill(normalizeTourMapDrill(crumb.drill));
    },
    [tourMapModel.crumbs],
  );

  const activeMapDrillChips = useMemo(() => {
    if (mapPod === 'curated') return curatedMapModel.chips;
    if (mapPod === 'heritage') return heritageMapModel.chips;
    if (mapPod === 'tour') return tourMapModel.chips;
    return null;
  }, [mapPod, curatedMapModel, heritageMapModel, tourMapModel]);

  const activeMapDrillCrumbs = useMemo(() => {
    if (mapPod === 'curated') return curatedMapModel.crumbs;
    if (mapPod === 'heritage') return heritageMapModel.crumbs;
    if (mapPod === 'tour') return tourMapModel.crumbs;
    return null;
  }, [mapPod, curatedMapModel, heritageMapModel, tourMapModel]);

  const activeMapDrillLevelLabel = useMemo(() => {
    if (mapPod === 'curated') return curatedMapModel.levelLabel;
    if (mapPod === 'heritage') return heritageMapModel.levelLabel;
    if (mapPod === 'tour') {
      if (tourMapModel.showSpotPins && tourMapPinsStatus === 'loading') {
        return '불러오는 중…';
      }
      return tourMapModel.levelLabel;
    }
    return '';
  }, [
    mapPod,
    curatedMapModel,
    heritageMapModel,
    tourMapModel,
    tourMapPinsStatus,
  ]);

  const activeMapShowSpotPins = useMemo(() => {
    if (mapPod === 'curated') return curatedMapModel.showSpotPins;
    if (mapPod === 'heritage') return heritageMapModel.showSpotPins;
    if (mapPod === 'tour') return tourMapModel.showSpotPins;
    return true;
  }, [mapPod, curatedMapModel, heritageMapModel, tourMapModel]);

  const handleActiveMapDrillChip = useCallback(
    (chip) => {
      if (mapPod === 'curated') handleCuratedMapDrillChip(chip);
      else if (mapPod === 'heritage') handleHeritageMapDrillChip(chip);
      else if (mapPod === 'tour') handleTourMapDrillChip(chip);
    },
    [
      mapPod,
      handleCuratedMapDrillChip,
      handleHeritageMapDrillChip,
      handleTourMapDrillChip,
    ],
  );

  const handleActiveMapDrillUp = useCallback(() => {
    if (mapPod === 'curated') handleCuratedMapDrillUp();
    else if (mapPod === 'heritage') handleHeritageMapDrillUp();
    else if (mapPod === 'tour') handleTourMapDrillUp();
  }, [
    mapPod,
    handleCuratedMapDrillUp,
    handleHeritageMapDrillUp,
    handleTourMapDrillUp,
  ]);

  const handleActiveMapDrillCrumb = useCallback(
    (index) => {
      if (mapPod === 'curated') handleCuratedMapDrillCrumb(index);
      else if (mapPod === 'heritage') handleHeritageMapDrillCrumb(index);
      else if (mapPod === 'tour') handleTourMapDrillCrumb(index);
    },
    [
      mapPod,
      handleCuratedMapDrillCrumb,
      handleHeritageMapDrillCrumb,
      handleTourMapDrillCrumb,
    ],
  );

  const openSpot = useCallback(
    (id) => {
      const key = String(id || '').trim();
      if (!key) return;
      const live = scenicById.get(key);
      const fromPersonal = personalItems.find((s) => String(s.id) === key);
      const fromMap = mapItems.find((s) => String(s.id) === key);
      const refSpot = live || fromPersonal || fromMap || { id: key, name: key };
      setViewedList(pushScenicViewed(refSpot));
      const next = new URLSearchParams(searchParams);
      next.set('spot', key);
      setSearchParams(next, { replace: false });
    },
    [mapItems, personalItems, scenicById, searchParams, setSearchParams],
  );

  const closeModal = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('spot');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const totalPages = nearActive
    ? 1
    : Math.max(1, Math.ceil(dbCount / PAGE_SIZE));
  const modalSpot = toModalSpot(selectedSpot);
  const activeCat1Label =
    TOUR_ATTRACTION_CAT1.find((c) => c.code === cat1)?.label || '종목';
  const activeCat2Label =
    cat2Chips.find((c) => c.code === cat2)?.label || '중분류';
  const listHeadline = nearActive ? `${nearLabel} 주변` : '한국의 명승';
  const catalogHeadingLabel = searchActive
    ? `검색 · ${searchFilter}`
    : catalogHeading;

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 명승"
        description="국가유산청 지정 명승과 GATEO 선정 명소. 권역별로 상세를 모달로 봅니다."
        url={RETURN_TO}
      />
      <style>{`
        /* OS 오버레이 스크롤바는 숨기고, FilterChipRow 커스텀 바가 항시 시인 */
        .korea-scenic-chip-row {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .korea-scenic-chip-row::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Korea · Scenic
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  {listHeadline}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form
                  className="hidden w-56 xl:w-64 lg:block"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitSearch();
                  }}
                >
                  <label className="sr-only" htmlFor="korea-scenic-search-pc">
                    명소·명승 검색
                  </label>
                  <div
                    className={`flex w-full items-center gap-2 rounded-full border px-3 py-1.5 ${
                      searchActive
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 bg-stone-50 focus-within:border-amber-400 focus-within:bg-white'
                    }`}
                  >
                    <Search
                      size={15}
                      className="shrink-0 text-stone-500"
                      aria-hidden="true"
                    />
                    <input
                      id="korea-scenic-search-pc"
                      type="search"
                      value={searchDraft}
                      onChange={onSearchInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          if (searchActive) closeSearch();
                          else e.currentTarget.blur();
                        }
                      }}
                      placeholder={
                        searchApplied
                          ? `검색 · ${searchApplied}`
                          : '명소·지역 검색'
                      }
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none"
                    />
                    {searchActive ? (
                      <button
                        type="button"
                        onClick={closeSearch}
                        aria-label="검색 결과 닫기"
                        title="검색 결과 닫기"
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    if (searchOpen) {
                      setSearchOpen(false);
                      return;
                    }
                    // 클릭 제스처 안에서 mount+focus (setTimeout/useEffect는 모바일 키보드 차단)
                    flushSync(() => {
                      setSearchOpen(true);
                    });
                    mobileSearchInputRef.current?.focus();
                  }}
                  aria-label={searchOpen ? '검색창 닫기' : '명소·명승 검색'}
                  aria-pressed={searchOpen}
                  title={searchOpen ? '검색창 닫기' : '명소·명승 검색'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden ${
                    searchOpen || searchActive
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {searchOpen ? (
                    <X size={15} aria-hidden="true" />
                  ) : (
                    <Search size={15} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    personalTab
                      ? closePersonal()
                      : openPersonal('favorites')
                  }
                  aria-label="즐겨찾기·본 항목"
                  aria-pressed={personalTab != null}
                  title="즐겨찾기·본 항목"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    personalTab != null
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Star
                    size={15}
                    className={
                      personalTab != null || favoriteIds.size > 0
                        ? 'fill-amber-400 text-amber-500'
                        : ''
                    }
                    aria-hidden="true"
                  />
                </button>
                <ThemeModuleBackButton onlyWhenBack />
                {mapOpen ? (
                  <button
                    type="button"
                    onClick={closeMap}
                    aria-label="지도 닫기 · 목록으로"
                    title="목록으로"
                    className="flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <X size={14} aria-hidden="true" />
                    닫기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    aria-label="홈으로"
                    title="홈으로"
                    className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                  >
                    <Home size={14} aria-hidden="true" />
                    홈으로
                  </button>
                )}
              </div>
            </div>
            {searchOpen ? (
              <form
                className="mt-2 flex items-center gap-2 lg:hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  commitSearch();
                }}
              >
                <label className="sr-only" htmlFor="korea-scenic-search">
                  명소·명승 검색
                </label>
                <input
                  ref={mobileSearchInputRef}
                  id="korea-scenic-search"
                  type="search"
                  value={searchDraft}
                  onChange={onSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setSearchOpen(false);
                    }
                  }}
                  placeholder={
                    searchApplied
                      ? `검색 · ${searchApplied}`
                      : '명소·지역 검색'
                  }
                  autoComplete="off"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
                >
                  검색
                </button>
              </form>
            ) : null}
            <ThemeNavBackHint />
          </div>
        </div>
      </header>

      <div
        className={
          searchActive
            ? 'relative z-20 flex min-h-0 flex-1 flex-col bg-stone-900/40 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))]'
            : 'contents'
        }
        onClick={searchActive ? closeSearch : undefined}
        role={searchActive ? 'presentation' : undefined}
      >
        <main
          ref={searchActive ? undefined : mainScrollRef}
          className={
            searchActive
              ? 'relative mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl md:rounded-3xl lg:max-w-6xl xl:max-w-7xl'
              : 'min-h-0 flex-1 overflow-y-auto'
          }
          onClick={searchActive ? (e) => e.stopPropagation() : undefined}
          role={searchActive ? 'dialog' : undefined}
          aria-modal={searchActive ? true : undefined}
          aria-labelledby={
            searchActive ? 'korea-scenic-search-modal-title' : undefined
          }
        >
          {searchActive ? (
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                  검색
                </p>
                <h2
                  id="korea-scenic-search-modal-title"
                  className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
                >
                  「{searchFilter}」검색 결과
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSearch}
                aria-label="검색 결과 닫기"
                title="검색 결과 닫기"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div
            ref={searchActive ? mainScrollRef : undefined}
            className={
              searchActive ? 'min-h-0 flex-1 overflow-y-auto' : undefined
            }
          >
            <div
              className={`mx-auto w-full max-w-3xl space-y-8 px-3 pt-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl ${
                dbStatus === 'empty' ||
                dbStatus === 'error' ||
                dbSpots.length <= 3
                  ? 'pb-[max(8rem,60vh)]'
                  : 'pb-6'
              }`}
            >
              {!searchActive && personalTab == null ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleNearMe}
                      disabled={nearBusy}
                      aria-label="내 주변 명소·명승·관광지 불러오기"
                      title="내 주변"
                      aria-pressed={nearActive}
                      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${
                        nearActive
                          ? 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600'
                          : 'border-amber-500/40 bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {nearBusy ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <LocateFixed size={14} aria-hidden="true" />
                      )}
                      내 주변
                    </button>
                  </div>
                  {nearMsg ? (
                    <div
                      role="status"
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2"
                    >
                      <p className="text-[12px] font-bold leading-snug text-amber-950 break-keep">
                        {nearMsg}
                      </p>
                      {!nearBusy ? (
                        <button
                          type="button"
                          onClick={clearNear}
                          className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-amber-800/70 hover:bg-amber-100/80"
                        >
                          닫기
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

          {personalTab != null ? (
            <section
              aria-label="내 명소·명승 목록"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold tracking-tight text-stone-900 md:text-base">
                    {personalTab === 'favorites' ? '즐겨찾기' : '본 항목'}
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    {personalItems.length}건 · 권역 그룹
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => togglePodMap('personal')}
                    aria-label={
                      mapPod === 'personal'
                        ? '목록으로'
                        : '즐겨찾기·본 항목 지도'
                    }
                    title={mapPod === 'personal' ? '목록' : '지도'}
                    aria-pressed={mapPod === 'personal'}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      mapPod === 'personal'
                        ? 'border-amber-400/90 bg-amber-50 text-amber-950'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <MapIcon size={13} aria-hidden="true" />
                    {mapPod === 'personal' ? '목록' : '지도'}
                  </button>
                  <button
                    type="button"
                    onClick={closePersonal}
                    className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-100"
                  >
                    목록으로
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => openPersonal('favorites')}
                  className={
                    personalTab === 'favorites'
                      ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                      : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                  }
                >
                  즐겨찾기
                  <span className="opacity-70">{favoriteList.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPersonal('viewed')}
                  className={
                    personalTab === 'viewed'
                      ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                      : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                  }
                >
                  본 항목
                  <span className="opacity-70">{viewedList.length}</span>
                </button>
              </div>
              {personalItems.length === 0 ? (
                <p className="text-sm text-stone-500 break-keep">
                  {personalTab === 'favorites'
                    ? '즐겨찾은 명소·명승이 없습니다. 목록이나 상세에서 ★로 추가해 보세요.'
                    : '아직 본 항목이 없습니다. 카드를 열어 보면 여기에 쌓입니다.'}
                </p>
              ) : (
                <div className="space-y-4">
                  {personalGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <p className="px-0.5 text-[11px] font-bold tracking-wide text-stone-500">
                        {group.label}
                        <span className="ml-1 font-normal opacity-70">
                          {group.items.length}
                        </span>
                      </p>
                      <ul className="space-y-2">
                        {group.items.map((spot) => (
                          <li key={`p-${spot.id}`}>
                            <ScenicListRow
                              spot={spot}
                              onOpen={openSpot}
                              favorited={favoriteIds.has(String(spot.id))}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
          <section aria-labelledby="korea-scenic-curated-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => togglePodOpen('curated')}
                aria-expanded={openPods.curated}
                aria-controls="korea-scenic-curated-body"
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-stone-700"
              >
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-stone-500 transition-transform ${
                    openPods.curated ? '' : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
                <Landmark size={18} className="shrink-0 text-amber-700" aria-hidden="true" />
                <h2
                  id="korea-scenic-curated-heading"
                  className="text-sm font-bold tracking-tight md:text-base"
                >
                  GATEO 선정 명소
                </h2>
                <span className="text-xs font-semibold text-stone-500 tabular-nums">
                  {curatedSpots.length.toLocaleString('ko-KR')}곳
                </span>
              </button>
              {openPods.curated ? (
                <button
                  type="button"
                  onClick={() => togglePodMap('curated')}
                  aria-label={
                    mapPod === 'curated' ? '명소 목록으로' : '명소 지도로'
                  }
                  title={mapPod === 'curated' ? '명소' : '지도'}
                  aria-pressed={mapPod === 'curated'}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    mapPod === 'curated'
                      ? 'border-amber-400/90 bg-amber-50 text-amber-950'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <MapIcon size={13} aria-hidden="true" />
                  {mapPod === 'curated' ? '명소' : '지도'}
                </button>
              ) : null}
            </div>
            {openPods.curated ? (
            <div id="korea-scenic-curated-body" className="space-y-4">
            {curatedSpots.length > 0 ? (
              <p className="text-sm leading-relaxed text-stone-600 break-keep">
                {DISCLAIMER}
              </p>
            ) : null}

            {showCuratedFilterChips ? (
              <div className="space-y-2">
                {!nearActive &&
                (!searchActive || curatedRegionChipsVisible.length > 1) &&
                curatedRegionChipsVisible.length > 0 ? (
                  <FilterChipRow aria-label="명소 권역 대분류">
                    {curatedRegionChipsVisible.map((r) => {
                      const active = curatedRegion === r;
                      const pinKey = `c-r-${r}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setCuratedRegion(r),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                          }
                        >
                          <FilterChipLabel
                            label={r}
                            count={curatedRegionCountsForChips[r]}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
                {curatedAreaChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명소 시도 중분류"
                    className="pl-0.5"
                  >
                    {curatedAreaChipsForRow.map((chip) => {
                      const active = curatedArea === chip.code;
                      const pinKey = `c-a-${chip.code}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setCuratedArea(chip.code),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-stone-400 bg-stone-800 px-2.5 py-0.5 text-[11px] font-bold text-white'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100'
                          }
                        >
                          <FilterChipLabel
                            label={chip.label}
                            count={curatedAreaCounts[chip.code]}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
                {curatedClusterChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명소 세권 중분류"
                    className="pl-0.5"
                  >
                    {curatedClusterChipsForRow.map((chip) => {
                      const active = curatedCluster === chip.id;
                      const pinKey = `c-c-${chip.id}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setCuratedCluster(chip.id),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-stone-500 bg-stone-700 px-2.5 py-0.5 text-[11px] font-bold text-white'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100'
                          }
                        >
                          <FilterChipLabel
                            label={chip.label}
                            count={chip.count}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
                {curatedHubChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명소 여행지 소분류"
                    className="pl-1"
                  >
                    {curatedHubChipsForRow.map((chip) => {
                      const active = hubId === chip.hubId;
                      const pinKey = `c-h-${chip.hubId}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setHub(chip.hubId),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-amber-500/80 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50'
                          }
                        >
                          <FilterChipLabel
                            label={chip.label}
                            count={chip.count}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
              </div>
            ) : null}

            <ul className="space-y-2 [overflow-anchor:none]">
              {curatedSpotsWithThumbs.map((spot) => (
                <li key={`c-${spot.id}`} className="[overflow-anchor:none]">
                  <ScenicListRow
                    spot={spot}
                    distanceKm={curatedKmById.get(String(spot.id))}
                    onOpen={openSpot}
                    favorited={favoriteIds.has(String(spot.id))}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </li>
              ))}
            </ul>
            {curatedSpots.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                {searchActive
                  ? (curatedSearchPool?.length || 0) > 0
                    ? `「${searchFilter}」·이 분류에는 선정 명소가 없습니다. 다른 권역·시도 칩을 골라 보세요.`
                    : `「${searchFilter}」와 맞는 선정 명소가 없습니다.`
                  : nearActive
                    ? (curatedNearPool?.length || 0) > 0
                      ? `${NEAR_KM}km 안·이 분류에는 선정 명소가 없습니다. 다른 여행지 칩을 골라 보세요.`
                      : `${NEAR_KM}km 안에는 선정 명소가 없습니다. 아래 국가유산 명승을 둘러보세요.`
                    : hubId
                      ? `${hubName || '이 여행지'}에는 아직 GATEO 선정 명소가 없습니다. 아래 국가유산 명승을 둘러보세요.`
                      : curatedArea
                        ? '이 시도에는 아직 선정 명소가 없습니다. 다른 시도를 골라 보세요.'
                        : '이 권역에는 아직 선정 명소가 없습니다.'}
              </p>
            ) : null}
            </div>
            ) : null}
          </section>

          <section aria-labelledby="korea-scenic-heritage-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => togglePodOpen('heritage')}
                aria-expanded={openPods.heritage}
                aria-controls="korea-scenic-heritage-body"
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-stone-800"
              >
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-stone-500 transition-transform ${
                    openPods.heritage ? '' : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
                <Mountain
                  size={18}
                  className="shrink-0 text-emerald-800"
                  aria-hidden="true"
                />
                <h2
                  id="korea-scenic-heritage-heading"
                  className="text-sm font-bold tracking-tight md:text-base"
                >
                  국가유산 명승
                </h2>
                <span className="text-xs font-semibold text-stone-500 tabular-nums">
                  {heritageSpots.length.toLocaleString('ko-KR')}곳
                  {heritageSpots.length !== HERITAGE_TOTAL
                    ? ` · 전국 ${HERITAGE_TOTAL.toLocaleString('ko-KR')}`
                    : ''}
                </span>
              </button>
              {openPods.heritage ? (
                <button
                  type="button"
                  onClick={() => togglePodMap('heritage')}
                  aria-label={
                    mapPod === 'heritage' ? '명승 목록으로' : '명승 지도로'
                  }
                  title={mapPod === 'heritage' ? '명승' : '지도'}
                  aria-pressed={mapPod === 'heritage'}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    mapPod === 'heritage'
                      ? 'border-amber-400/90 bg-amber-50 text-amber-950'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <MapIcon size={13} aria-hidden="true" />
                  {mapPod === 'heritage' ? '명승' : '지도'}
                </button>
              ) : null}
            </div>
            {openPods.heritage ? (
            <div id="korea-scenic-heritage-body" className="space-y-4">
            <p className="text-xs text-stone-500 break-keep">{HERITAGE_DISCLAIMER}</p>

            {showHeritageFilterChips ? (
              <div className="space-y-2">
                {!nearActive &&
                (!searchActive || heritageRegionChipsVisible.length > 1) &&
                heritageRegionChipsVisible.length > 0 ? (
                  <FilterChipRow aria-label="명승 권역 대분류">
                    {heritageRegionChipsVisible.map((r) => {
                      const active = heritageRegion === r;
                      const pinKey = `h-r-${r}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setHeritageRegion(r),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                          }
                        >
                          <FilterChipLabel
                            label={r}
                            count={heritageRegionCountsForChips[r]}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
                {heritageAreaChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명승 시도 중분류"
                    className="pl-0.5"
                  >
                    {heritageAreaChipsForRow.map((chip) => {
                      const active = heritageArea === chip.code;
                      const pinKey = `h-a-${chip.code}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setHeritageArea(chip.code),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-stone-400 bg-stone-800 px-2.5 py-0.5 text-[11px] font-bold text-white'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100'
                          }
                        >
                          <FilterChipLabel
                            label={chip.label}
                            count={heritageAreaCounts[chip.code]}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
                {heritageCategoryChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명승 경관 소분류"
                    className="pl-1"
                  >
                    {heritageCategoryChipsForRow.map((chip) => {
                      const active = heritageCategory === chip.code;
                      const pinKey = `h-c-${chip.code}`;
                      return (
                        <button
                          key={pinKey}
                          type="button"
                          data-chip-pin={pinKey}
                          onClick={(e) =>
                            runWithChipScrollPin(e.currentTarget, () =>
                              setHeritageCategory(chip.code),
                            )
                          }
                          aria-pressed={active}
                          className={
                            active
                              ? 'inline-flex items-center gap-1 rounded-full border border-amber-500/80 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950'
                              : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50'
                          }
                        >
                          <FilterChipLabel
                            label={chip.label}
                            count={chip.count}
                          />
                        </button>
                      );
                    })}
                  </FilterChipRow>
                ) : null}
              </div>
            ) : null}

            {heritageSpots.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                {searchActive
                  ? (heritageSearchPool?.length || 0) > 0
                    ? `「${searchFilter}」·이 분류에 해당하는 국가유산 명승이 없습니다. 다른 권역·경관 칩을 골라 보세요.`
                    : `「${searchFilter}」에 해당하는 국가유산 명승이 없습니다.`
                  : nearActive
                    ? (heritageNearPool?.length || 0) > 0
                      ? `${NEAR_KM}km 안·이 경관 유형에 해당하는 국가유산 명승이 없습니다. 다른 소분류를 골라 보세요.`
                      : `${NEAR_KM}km 안 국가유산 명승이 없습니다.`
                    : heritageCategory
                      ? '이 경관 유형에 해당하는 국가유산 명승이 없습니다. 다른 소분류를 골라 보세요.'
                      : '이 권역·시도에 해당하는 국가유산 명승이 없습니다.'}
              </p>
            ) : (
              <ul className="space-y-2 [overflow-anchor:none]">
                {heritageSpots.map((spot) => (
                  <li key={`h-${spot.id}`} className="[overflow-anchor:none]">
                    <ScenicListRow
                      spot={spot}
                      distanceKm={heritageKmById.get(String(spot.id))}
                      onOpen={openSpot}
                      favorited={favoriteIds.has(String(spot.id))}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </li>
                ))}
              </ul>
            )}
            </div>
            ) : null}
          </section>

          <section aria-labelledby="korea-scenic-db-heading" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => togglePodOpen('tour')}
                aria-expanded={openPods.tour}
                aria-controls="korea-scenic-tour-body"
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-stone-800"
              >
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-stone-500 transition-transform ${
                    openPods.tour ? '' : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
                <MapPin
                  size={18}
                  className="shrink-0 text-sky-800"
                  aria-hidden="true"
                />
                <h2
                  id="korea-scenic-db-heading"
                  className="text-sm font-bold tracking-tight md:text-base"
                >
                  {catalogHeadingLabel}
                </h2>
                {nearActive
                  ? dbStatus !== 'loading' && (
                      <span className="text-xs font-semibold text-stone-500 tabular-nums">
                        {dbCount.toLocaleString('ko-KR')}곳 · 가까운 순
                      </span>
                    )
                  : scopeCount > 0 || dbStatus === 'ok' || dbCount > 0 ? (
                      <span className="text-xs font-semibold text-stone-500 tabular-nums">
                        {(scopeCount > 0 ? scopeCount : dbCount).toLocaleString(
                          'ko-KR',
                        )}
                        곳
                        {totalPages > 1 ? ` · ${page}/${totalPages}` : ''}
                      </span>
                    ) : null}
              </button>
              {openPods.tour ? (
                <button
                  type="button"
                  onClick={() => togglePodMap('tour')}
                  aria-label={
                    mapPod === 'tour' ? '관광지 목록으로' : '관광지 지도로'
                  }
                  title={mapPod === 'tour' ? '관광지' : '지도'}
                  aria-pressed={mapPod === 'tour'}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    mapPod === 'tour'
                      ? 'border-amber-400/90 bg-amber-50 text-amber-950'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <MapIcon size={13} aria-hidden="true" />
                  {mapPod === 'tour' ? '관광지' : '지도'}
                </button>
              ) : null}
            </div>
            {openPods.tour ? (
            <div id="korea-scenic-tour-body" className="space-y-4">
            <p className="text-xs text-stone-500 break-keep">
              한국관광공사 선정 관광지입니다.
            </p>

            {showTourFilterChips ? (
            <div className="space-y-2">
              {!nearActive &&
              (!searchActive || tourRegionChipsVisible.length > 1) &&
              tourRegionChipsVisible.length > 0 ? (
                <FilterChipRow aria-label="관광지 권역 대분류">
                  {tourRegionChipsVisible.map((r) => {
                    const active = tourRegion === r;
                    const pinKey = `t-r-${r}`;
                    return (
                      <button
                        key={pinKey}
                        type="button"
                        data-chip-pin={pinKey}
                        onClick={(e) =>
                          runWithChipScrollPin(e.currentTarget, () =>
                            setTourRegion(r),
                          )
                        }
                        aria-pressed={active}
                        className={
                          active
                            ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                            : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                        }
                      >
                        <FilterChipLabel
                          label={r}
                          count={chipCounts.regionCounts?.[r]}
                        />
                      </button>
                    );
                  })}
                </FilterChipRow>
              ) : null}
              {tourAreaChipsForRow.length > 0 ? (
                <FilterChipRow
                  aria-label="관광지 시도 중분류"
                  className="pl-0.5"
                >
                  {tourAreaChipsForRow.map((chip) => {
                    const active = tourArea === chip.code;
                    const pinKey = `t-a-${chip.code}`;
                    return (
                      <button
                        key={pinKey}
                        type="button"
                        data-chip-pin={pinKey}
                        onClick={(e) =>
                          runWithChipScrollPin(e.currentTarget, () =>
                            setTourArea(chip.code),
                          )
                        }
                        aria-pressed={active}
                        className={
                          active
                            ? 'inline-flex items-center gap-1 rounded-full border border-stone-400 bg-stone-800 px-2.5 py-0.5 text-[11px] font-bold text-white'
                            : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100'
                        }
                      >
                        <FilterChipLabel
                          label={chip.label}
                          count={tourAreaCounts[chip.code]}
                        />
                      </button>
                    );
                  })}
                </FilterChipRow>
              ) : null}
              {(nearActive ||
                !searchActive ||
                tourCat1ChipsVisible.length > 1) &&
              tourCat1ChipsVisible.length > 0 ? (
                <FilterChipRow aria-label="관광 종목 대분류">
                  {tourCat1ChipsVisible.map((chip) => {
                    const active = cat1 === chip.code;
                    const pinKey = `t-c1-${chip.code}`;
                    return (
                      <button
                        key={pinKey}
                        type="button"
                        data-chip-pin={pinKey}
                        onClick={(e) =>
                          runWithChipScrollPin(e.currentTarget, () =>
                            setCat1(chip.code),
                          )
                        }
                        aria-pressed={active}
                        className={
                          active
                            ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                            : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                        }
                      >
                        <FilterChipLabel
                          label={chip.label}
                          count={chipCounts.cat1Counts[chip.code]}
                        />
                      </button>
                    );
                  })}
                </FilterChipRow>
              ) : null}
              {(nearActive ||
                !searchActive ||
                tourCat2ChipsVisible.length > 1) &&
              tourCat2ChipsVisible.length > 0 ? (
                <FilterChipRow
                  aria-label={`${activeCat1Label} 중분류`}
                  className="pl-0.5"
                >
                  {tourCat2ChipsVisible.map((chip) => {
                    const active = cat2 === chip.code;
                    const pinKey = `t-c2-${chip.code}`;
                    return (
                      <button
                        key={pinKey}
                        type="button"
                        data-chip-pin={pinKey}
                        onClick={(e) =>
                          runWithChipScrollPin(e.currentTarget, () =>
                            setCat2(chip.code),
                          )
                        }
                        aria-pressed={active}
                        className={
                          active
                            ? 'inline-flex items-center gap-1 rounded-full border border-stone-400 bg-stone-800 px-2.5 py-0.5 text-[11px] font-bold text-white'
                            : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 hover:bg-stone-100'
                        }
                      >
                        <FilterChipLabel
                          label={chip.label}
                          count={chipCounts.cat2Counts[chip.code]}
                        />
                      </button>
                    );
                  })}
                </FilterChipRow>
              ) : null}
              {(nearActive ||
                !searchActive ||
                tourCat3ChipsVisible.length > 1) &&
              tourCat3ChipsVisible.length > 0 ? (
                <FilterChipRow
                  aria-label={`${activeCat2Label} 소분류`}
                  className="pl-1"
                >
                  {tourCat3ChipsVisible.map((chip) => {
                    const active = cat3 === chip.code;
                    const pinKey = `t-c3-${chip.code}`;
                    return (
                      <button
                        key={pinKey}
                        type="button"
                        data-chip-pin={pinKey}
                        onClick={(e) =>
                          runWithChipScrollPin(e.currentTarget, () =>
                            setCat3(chip.code),
                          )
                        }
                        aria-pressed={active}
                        className={
                          active
                            ? 'inline-flex items-center gap-1 rounded-full border border-amber-500/80 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950'
                            : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600 hover:bg-stone-50'
                        }
                      >
                        <FilterChipLabel
                          label={chip.label}
                          count={chipCounts.cat3Counts[chip.code]}
                        />
                      </button>
                    );
                  })}
                </FilterChipRow>
              ) : null}
            </div>
            ) : null}

            {dbStatus === 'loading' ? (
              <p className="text-sm text-stone-500 break-keep">불러오는 중…</p>
            ) : null}
            {dbStatus === 'error' ? (
              <p className="text-sm text-stone-500 break-keep">
                카탈로그를 불러오지 못했습니다{dbError ? ` (${dbError})` : ''}.
              </p>
            ) : null}
            {dbStatus === 'empty' ? (
              <p className="text-sm text-stone-500 break-keep">
                {searchActive
                  ? `「${searchFilter}」·이 종목에 해당하는 관광지가 없습니다. 다른 종목 칩을 골라 보세요.`
                  : nearActive
                    ? (nearTourPool.length || 0) > 0
                      ? `${NEAR_KM}km 안·이 종목에 해당하는 관광지가 없습니다. 다른 종목 칩을 골라 보세요.`
                      : `${NEAR_KM}km 안 관광지가 없습니다.`
                    : '이 권역·시도·종목에 해당하는 관광지가 없습니다. 다른 중·소분류를 골라 보세요.'}
              </p>
            ) : null}

            {dbSpots.length > 0 ? (
              <ul className="space-y-2 [overflow-anchor:none]">
                {dbSpots.map((spot) => (
                  <li key={`d-${spot.id}`} className="[overflow-anchor:none]">
                    <ScenicListRow
                      spot={spot}
                      distanceKm={dbKmById.get(String(spot.id))}
                      onOpen={openSpot}
                      favorited={favoriteIds.has(String(spot.id))}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            {!nearActive && totalPages > 1 && dbSpots.length > 0 ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  이전
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40"
                >
                  다음
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            ) : null}
            </div>
            ) : null}
          </section>
            </>
          )}
            </div>
          </div>
        </main>
      </div>

      <button
        type="button"
        aria-label="맨 위로"
        onClick={() => {
          mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-3 z-40 flex h-11 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500 px-3.5 text-white shadow-[0_4px_18px_rgba(245,158,11,0.45)] transition-all duration-300 md:hidden ${
          showScrollTop && !selectedId && !mapOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp
          size={18}
          strokeWidth={2.5}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-bold">위로</span>
      </button>

      {mapOpen ? (
        <div className="fixed inset-0 z-20 overflow-hidden bg-[#1b1410] pt-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))]">
          <KoreaScenicMap
            className="absolute inset-0 h-full w-full"
            items={mapItems}
            activeSpotId={selectedId ? String(selectedId) : ''}
            focusView={mapFocusView}
            historyKey={
              mapPod === 'curated'
                ? `${mapSessionKey}:curated:${curatedMapDrill.region || ''}:${curatedMapDrill.area || ''}:${curatedMapDrill.cluster || ''}:${curatedMapDrill.hub || ''}`
                : mapPod === 'heritage'
                  ? `${mapSessionKey}:heritage:${heritageMapDrill.region || ''}:${heritageMapDrill.area || ''}:${heritageMapDrill.category || ''}`
                  : mapPod === 'tour'
                    ? `${mapSessionKey}:tour:${tourMapDrill.region || ''}:${tourMapDrill.area || ''}:${tourMapDrill.cat1 || ''}:${tourMapDrill.cat2 || ''}:${tourMapDrill.cat3 || ''}`
                    : `${mapSessionKey}:${mapPod}:${personalTab || ''}:${searchFilter}:${hubId || ''}`
            }
            layoutKey={`immersive:${mapPod}`}
            onSelectPoint={(spotId) => openSpot(spotId)}
            drillChips={activeMapDrillChips}
            onSelectDrillChip={
              activeMapDrillChips ? handleActiveMapDrillChip : undefined
            }
            drillCrumbs={activeMapDrillCrumbs}
            onDrillCrumb={
              activeMapDrillCrumbs ? handleActiveMapDrillCrumb : undefined
            }
            onDrillUp={
              activeMapDrillCrumbs ? handleActiveMapDrillUp : undefined
            }
            drillLevelLabel={activeMapDrillLevelLabel}
            showSpotPins={activeMapShowSpotPins}
          />
        </div>
      ) : null}

      {modalSpot ? (
        <ThemeSpotDetailModal
          spot={modalSpot}
          eyebrow={
            modalSpot?.source === 'cha' ? '국가유산 명승' : '명소 상세'
          }
          returnTo={listReturnTo}
          onClose={closeModal}
          overlayZClass={
            searchActive || mapOpen ? 'z-50' : 'z-40'
          }
          favorited={
            modalSpot?.id != null && favoriteIds.has(String(modalSpot.id))
          }
          onToggleFavorite={handleToggleFavorite}
        />
      ) : null}
    </div>
  );
}
