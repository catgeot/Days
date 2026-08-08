import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Home,
  Landmark,
  Loader2,
  LocateFixed,
  Search,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import {
  countKoreaScenicSpotsByRegion,
  countKoreaScenicSpotsByTourArea,
  koreaScenicSpotsDisclaimer,
  listKoreaScenicHubChips,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots';
import {
  countKoreaHeritageScenicByRegion,
  countKoreaHeritageScenicByTourArea,
  getKoreaHeritageScenicById,
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
  scenicLocalityQueryForHubName,
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
import { filterScenicSpotsByQuery } from '../Home/lib/scenicSearch';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';

const NEAR_KM = NEAR_SCENIC_KM;
const NEAR_DB_LIMIT = 100;

const DISCLAIMER = koreaScenicSpotsDisclaimer();
const HERITAGE_DISCLAIMER = koreaHeritageScenicDisclaimer();
const HERITAGE_TOTAL = koreaHeritageScenicCount();
const HERITAGE_REGION_COUNTS = countKoreaHeritageScenicByRegion();
const CURATED_REGION_COUNTS = countKoreaScenicSpotsByRegion();
const CURATED_REGIONS = listKoreaScenicRegions();
const RETURN_TO = '/korea/theme/scenic';
const CURATED_ALL = listKoreaScenicSpots();
const PAGE_SIZE = 40;
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

/** 검색 매칭 수 기준 권역 선택(결과 있는 첫 권역 · 없으면 현 권역) */
function pickRegionForSearchMatches(curatedMatches, heritageMatches, fallback) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const r of SCENIC_REGION_ORDER) counts[r] = 0;
  for (const s of curatedMatches || []) {
    if (counts[s.region] != null) counts[s.region] += 1;
  }
  for (const s of heritageMatches || []) {
    if (counts[s.region] != null) counts[s.region] += 1;
  }
  const best = SCENIC_REGION_ORDER.find((r) => (counts[r] || 0) > 0);
  return best || resolveRegion(fallback);
}

/** TourAPI 권역 건수에서 결과 있는 첫 권역 (명소·명승 0건일 때 · 「화천」등) */
function pickRegionFromTourCounts(regionCounts, fallback) {
  const best = SCENIC_REGION_ORDER.find(
    (r) => (Number(regionCounts?.[r]) || 0) > 0,
  );
  return best || resolveRegion(fallback);
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

function ScenicListRow({ spot, distanceKm, onOpen }) {
  const distanceLabel = formatDistanceKm(distanceKm);
  const candidates = spotListThumbCandidates(spot);
  const [thumbIndex, setThumbIndex] = useState(0);
  const thumb = candidates[thumbIndex] || '';
  return (
    <button
      type="button"
      onClick={() => onOpen(spot.id)}
      className="flex w-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white p-2.5 text-left shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40 sm:px-3 sm:py-3"
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

export default function KoreaThemeScenicPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hubId = normalizeScenicHubParam(searchParams.get('hub'));
  const hub = hubId ? resolveCityAttractionHub(hubId) : null;
  const hubName = hub ? String(hub.name || hubId) : '';
  const localityQuery = scenicLocalityQueryForHubName(hubName);
  const region = resolveRegion(searchParams.get('region'));
  const areaCode = normalizeScenicAreaCode(region, searchParams.get('area'));
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
  const mainScrollRef = useRef(null);
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
  const areaChips = useMemo(() => listScenicRegionAreas(region), [region]);

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

  const curatedSpots = useMemo(() => {
    if (searchActive && curatedSearchPool) {
      let list = curatedSearchPool;
      if (hubId) {
        list = list.filter(
          (s) => String(s.hubId || '').trim().toLowerCase() === hubId,
        );
      } else {
        list = list.filter((s) => s.region === region);
        if (areaCode) {
          list = list.filter(
            (s) => scenicAreaCodeForHubId(s.hubId) === areaCode,
          );
        }
      }
      return sortScenicSpotsByPlaceCluster(list);
    }
    if (curatedNearRanked) return curatedNearRanked.map((row) => row.item);
    if (hubId) {
      return sortScenicSpotsByPlaceCluster(
        CURATED_ALL.filter(
          (s) => String(s.hubId || '').trim().toLowerCase() === hubId,
        ),
      );
    }
    const inRegion = listKoreaScenicSpots(region);
    const filtered = areaCode
      ? inRegion.filter((s) => scenicAreaCodeForHubId(s.hubId) === areaCode)
      : inRegion;
    return sortScenicSpotsByPlaceCluster(filtered);
  }, [
    searchActive,
    curatedSearchPool,
    curatedNearRanked,
    region,
    areaCode,
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

  const heritageSpots = useMemo(() => {
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      return sortScenicSpotsByPlaceCluster(
        listKoreaHeritageScenic({
          region,
          areaCode,
          localityQuery,
          category: heritageCategory,
        }).filter((s) => matchedIds.has(s.id)),
      );
    }
    if (heritageNearRanked) return heritageNearRanked.map((row) => row.item);
    return sortScenicSpotsByPlaceCluster(
      listKoreaHeritageScenic({
        region,
        areaCode,
        localityQuery,
        category: heritageCategory,
      }),
    );
  }, [
    searchActive,
    heritageSearchPool,
    heritageNearRanked,
    region,
    areaCode,
    localityQuery,
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
        if (s.region !== region) continue;
        const code = scenicAreaCodeForHubId(s.hubId);
        if (!code) continue;
        out[code] = (out[code] || 0) + 1;
      }
      return out;
    }
    return countKoreaScenicSpotsByTourArea(region);
  }, [searchActive, curatedSearchPool, region]);

  const curatedHubChips = useMemo(() => {
    if (searchActive && curatedSearchPool) {
      let spots = curatedSearchPool.filter((s) => s.region === region);
      if (areaCode) {
        spots = spots.filter(
          (s) => scenicAreaCodeForHubId(s.hubId) === areaCode,
        );
      }
      return hubChipsFromSpots(spots);
    }
    return listKoreaScenicHubChips(region, areaCode);
  }, [searchActive, curatedSearchPool, region, areaCode]);

  const curatedAreaChips = useMemo(
    () =>
      areaChips.filter((chip) => (curatedAreaCounts[chip.code] || 0) > 0),
    [areaChips, curatedAreaCounts],
  );

  const curatedHubChipsVisible = useMemo(() => {
    const hasMidRow = curatedAreaChips.length > 1;
    // 수도권처럼 시도 중분류가 있으면, 시도 선택 후에만 여행지 소분류
    if (hasMidRow && !areaCode) return [];
    // 강원·제주처럼 시도가 1개면 권역 전체 hub를 소분류로 (area 미매핑 hub 포함)
    const hubs = hasMidRow
      ? curatedHubChips
      : searchActive && curatedSearchPool
        ? hubChipsFromSpots(
            curatedSearchPool.filter((s) => s.region === region),
          )
        : listKoreaScenicHubChips(region, null);
    const parentLabel =
      hasMidRow && areaCode ? labelScenicAreaCode(areaCode) : null;
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
    curatedHubChips,
    curatedAreaChips,
    areaCode,
    region,
    searchActive,
    curatedSearchPool,
  ]);

  const heritageAreaCounts = useMemo(() => {
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      /** @type {Record<string, number>} */
      const out = {};
      for (const chip of areaChips) {
        const n = listKoreaHeritageScenic({
          region,
          areaCode: chip.code,
        }).filter((s) => matchedIds.has(s.id)).length;
        if (n > 0) out[chip.code] = n;
      }
      return out;
    }
    return countKoreaHeritageScenicByTourArea(region);
  }, [searchActive, heritageSearchPool, region, areaChips]);

  const heritageAreaChips = useMemo(
    () =>
      areaChips.filter((chip) => (heritageAreaCounts[chip.code] || 0) > 0),
    [areaChips, heritageAreaCounts],
  );

  const heritageCategoryChips = useMemo(() => {
    if (searchActive && heritageSearchPool) {
      const matchedIds = new Set(heritageSearchPool.map((s) => s.id));
      return listKoreaHeritageCategoryChips({
        region,
        areaCode,
        localityQuery,
      })
        .map((chip) => ({
          ...chip,
          count: listKoreaHeritageScenic({
            region,
            areaCode,
            localityQuery,
            category: chip.code,
          }).filter((s) => matchedIds.has(s.id)).length,
        }))
        .filter((chip) => (chip.count || 0) > 0);
    }
    return listKoreaHeritageCategoryChips({
      region,
      areaCode,
      localityQuery,
    });
  }, [searchActive, heritageSearchPool, region, areaCode, localityQuery]);

  const heritageCategoryChipsVisible = useMemo(() => {
    const midLabels = new Set(
      heritageAreaChips
        .map((chip) => String(chip.label || '').trim())
        .filter(Boolean),
    );
    const activeMidLabel = areaCode ? labelScenicAreaCode(areaCode) : null;
    return heritageCategoryChips.filter((chip) => {
      if ((chip.count || 0) <= 0) return false;
      const label = String(chip.label || '').trim();
      if (activeMidLabel && chipLabelsEqual(label, activeMidLabel)) return false;
      if (midLabels.has(label)) return false;
      return true;
    });
  }, [heritageCategoryChips, heritageAreaChips, areaCode]);

  const listReturnTo = useMemo(() => {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (areaCode) params.set('area', areaCode);
    if (hubId) params.set('hub', hubId);
    if (heritageCategory) params.set('hcat', heritageCategory);
    if (cat1) params.set('cat1', cat1);
    if (cat2) params.set('cat2', cat2);
    if (cat3) params.set('cat3', cat3);
    if (page > 1) params.set('page', String(page));
    const q = params.toString();
    return q ? `${RETURN_TO}?${q}` : RETURN_TO;
  }, [region, areaCode, hubId, heritageCategory, cat1, cat2, cat3, page]);

  const [dbSpots, setDbSpots] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [scopeCount, setScopeCount] = useState(0);
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbError, setDbError] = useState(null);
  const [dbKmById, setDbKmById] = useState(() => new Map());
  const [selectedSpot, setSelectedSpot] = useState(null);
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
      const fallbackRegion = searchParams.get('region');
      let nextRegion = pickRegionForSearchMatches(
        curatedMatches,
        heritageMatches,
        fallbackRegion,
      );

      const applyRegionParams = (regionName) => {
        const next = new URLSearchParams(searchParams);
        next.set('region', regionName);
        next.delete('area');
        next.delete('hub');
        next.delete('hcat');
        next.delete('cat2');
        next.delete('cat3');
        next.delete('page');
        next.delete('spot');
        setSearchParams(next, { replace: true });
      };

      // 명소·명승 0건이면 TourAPI 권역 건수로 고름 (화천→강원)
      if (curatedMatches.length === 0 && heritageMatches.length === 0) {
        applyRegionParams(nextRegion);
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
          const tourRegion = pickRegionFromTourCounts(counts, nextRegion);
          if (tourRegion !== nextRegion) applyRegionParams(tourRegion);
        });
      } else {
        applyRegionParams(nextRegion);
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
    if (!searchActive) return regionChips;
    return regionChips.filter(
      (r) => (curatedRegionCountsForChips[r] || 0) > 0,
    );
  }, [searchActive, regionChips, curatedRegionCountsForChips]);

  const heritageRegionChipsVisible = useMemo(() => {
    if (!searchActive) return regionChips;
    return regionChips.filter(
      (r) => (heritageRegionCountsForChips[r] || 0) > 0,
    );
  }, [searchActive, regionChips, heritageRegionCountsForChips]);

  const curatedAreaChipsForRow = useMemo(
    () => (curatedAreaChips.length > 1 ? curatedAreaChips : []),
    [curatedAreaChips],
  );

  const curatedHubChipsForRow = useMemo(
    () => (curatedHubChipsVisible.length > 1 ? curatedHubChipsVisible : []),
    [curatedHubChipsVisible],
  );

  const heritageAreaChipsForRow = useMemo(
    () => (heritageAreaChips.length > 1 ? heritageAreaChips : []),
    [heritageAreaChips],
  );

  /** 검색 중 경관 칩이 1개뿐이면 분해 불가 → 숨김 */
  const heritageCategoryChipsForRow = useMemo(() => {
    if (!searchActive) return heritageCategoryChipsVisible;
    return heritageCategoryChipsVisible.length > 1
      ? heritageCategoryChipsVisible
      : [];
  }, [searchActive, heritageCategoryChipsVisible]);

  const showCuratedFilterChips =
    !nearActive &&
    (!searchActive ||
      ((curatedSearchPool?.length || 0) > 0 &&
        (curatedRegionChipsVisible.length > 1 ||
          curatedAreaChipsForRow.length > 0 ||
          curatedHubChipsForRow.length > 0)));

  const showHeritageFilterChips =
    !nearActive &&
    (!searchActive ||
      ((heritageSearchPool?.length || 0) > 0 &&
        (heritageRegionChipsVisible.length > 1 ||
          heritageAreaChipsForRow.length > 0 ||
          heritageCategoryChipsForRow.length > 0 ||
          Boolean(hubId && hubName))));

  const cat2Chips = useMemo(() => listTourAttractionCat2(cat1), [cat1]);
  const cat3Chips = useMemo(
    () => listTourAttractionCat3(cat1, cat2),
    [cat1, cat2],
  );

  /** 검색 중에는 건수 확정(>0)만 · 로딩(undefined) 칩 나열 금지 */
  const keepTourChipByCount = useCallback(
    (count) => {
      if (searchActive) {
        return Number.isFinite(Number(count)) && Number(count) > 0;
      }
      return keepChipByCount(count);
    },
    [searchActive],
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

  const showTourFilterChips =
    !nearActive &&
    (!searchActive ||
      tourCat1ChipsVisible.length > 1 ||
      tourCat2ChipsVisible.length > 1 ||
      tourCat3ChipsVisible.length > 1);

  const catalogHeading = useMemo(
    () => scenicDbCatalogHeading(region, areaCode, hubName || null),
    [region, areaCode, hubName],
  );

  useEffect(() => {
    let cancelled = false;
    fetchScenicFilterChipCounts({
      region,
      areaCode,
      cat1,
      cat2,
      cat3,
      localityQuery: dbSearchActive ? null : localityQuery,
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
    region,
    areaCode,
    cat1,
    cat2,
    cat3,
    localityQuery,
    dbSearchActive,
    dbSearchFilter,
  ]);

  useEffect(() => {
    let cancelled = false;
    countKoreaTourAttractions(
      dbSearchActive
        ? {
            searchQuery: dbSearchFilter,
            region,
            areaCode,
            localityQuery: hubId ? localityQuery : null,
          }
        : { region, areaCode, localityQuery },
    ).then((res) => {
      if (cancelled) return;
      setScopeCount(res.count || 0);
    });
    return () => {
      cancelled = true;
    };
  }, [
    region,
    areaCode,
    localityQuery,
    hubId,
    dbSearchActive,
    dbSearchFilter,
  ]);

  useEffect(() => {
    const rawRegion = searchParams.get('region');
    const rawArea = searchParams.get('area');
    const rawCat1 = searchParams.get('cat1');
    const rawCat2 = searchParams.get('cat2');
    const rawCat3 = searchParams.get('cat3');
    const rawHub = searchParams.get('hub');
    const rawHcat = searchParams.get('hcat');
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if (!rawRegion || rawRegion === '전체' || !SCENIC_REGION_ORDER.includes(rawRegion)) {
      next.set('region', region);
      changed = true;
    }
    if (rawArea && !normalizeScenicAreaCode(region, rawArea)) {
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
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    region,
    cat1,
    cat2,
    heritageCategory,
    heritageCategoryChips,
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
    let cancelled = false;
    if (searchActive && !dbSearchActive) {
      setDbStatus('loading');
      setDbError(null);
      return undefined;
    }
    setDbStatus('loading');
    setDbError(null);

    if (nearActive && nearOrigin) {
      fetchKoreaTourAttractionsNear({
        lat: nearOrigin.lat,
        lng: nearOrigin.lng,
        radiusKm: NEAR_KM,
        limit: NEAR_DB_LIMIT,
        cat1,
        cat2,
        cat3,
      }).then((res) => {
        if (cancelled) return;
        const ranked = rankNearbyScenicSpots(
          res.spots || [],
          nearOrigin.lat,
          nearOrigin.lng,
          NEAR_KM,
        );
        const spots = ranked.map((row) => row.item);
        setDbSpots(spots);
        setDbCount(spots.length);
        setDbKmById(kmByIdFromRanked(ranked));
        if (res.error) {
          setDbStatus('error');
          setDbError(res.error);
        } else if (spots.length === 0) {
          setDbStatus('empty');
        } else {
          setDbStatus('ok');
        }
      });
      return () => {
        cancelled = true;
      };
    }

    const fetchLimit = PAGE_SIZE;
    const fetchOffset = (page - 1) * PAGE_SIZE;
    const fetchOpts = dbSearchActive
      ? {
          searchQuery: dbSearchFilter,
          region,
          areaCode,
          cat1,
          cat2,
          cat3,
          localityQuery: hubId ? localityQuery : null,
          limit: fetchLimit,
          offset: fetchOffset,
        }
      : {
          region,
          areaCode,
          cat1,
          cat2,
          cat3,
          localityQuery: localityQuery,
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
    region,
    areaCode,
    cat1,
    cat2,
    cat3,
    localityQuery,
    page,
    nearActive,
    nearOrigin,
    searchActive,
    dbSearchActive,
    dbSearchFilter,
    hubId,
  ]);

  useEffect(() => {
    if (!nearActive) return;
    const curatedN = curatedSpots.length;
    const heritageN = heritageSpots.length;
    const dbN = dbStatus === 'loading' ? null : dbSpots.length;
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
    curatedSpots.length,
    heritageSpots.length,
    dbSpots.length,
    dbStatus,
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
    fetchKoreaTourAttractionById(selectedId).then((spot) => {
      if (cancelled) return;
      setSelectedSpot(
        spot?.firstImage && !spot.imageUrl
          ? { ...spot, imageUrl: spot.firstImage }
          : spot,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, dbSpots, curatedImageByContentId]);

  const clearHub = useCallback(() => {
    clearNear();
    const next = new URLSearchParams(searchParams);
    next.delete('hub');
    next.delete('spot');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, clearNear]);

  const setRegion = useCallback(
    (r) => {
      clearNear();
      const next = new URLSearchParams(searchParams);
      next.set('region', resolveRegion(r));
      next.delete('area');
      next.delete('hub');
      next.delete('hcat');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, clearNear],
  );

  const setArea = useCallback(
    (code) => {
      clearNear();
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeScenicAreaCode(region, code);
      if (!normalized || normalized === areaCode) next.delete('area');
      else next.set('area', normalized);
      next.delete('hub');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, region, areaCode, clearNear],
  );

  const setHub = useCallback(
    (id) => {
      clearNear();
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeScenicHubParam(id);
      if (!normalized || normalized === hubId) next.delete('hub');
      else next.set('hub', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, hubId, clearNear],
  );

  const setHeritageCategory = useCallback(
    (code) => {
      clearNear();
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeHeritageCategory(code);
      if (!normalized || normalized === heritageCategory) next.delete('hcat');
      else next.set('hcat', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, heritageCategory, clearNear],
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
      next.set('region', nextRegion);
      if (nextArea) next.set('area', nextArea);
      else next.delete('area');
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
      const next = new URLSearchParams(searchParams);
      next.set('cat1', normalizeTourAttractionCat1(code) || DEFAULT_CAT1);
      next.delete('cat2');
      next.delete('cat3');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /** 검색 중 기본 종목(자연)에 0건이면 결과 있는 첫 종목으로 전환 — 「경포」=인문만 등 */
  useEffect(() => {
    if (!searchActive || !dbSearchActive) return;
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
    chipCounts.cat1Counts,
    cat1,
    setCat1,
  ]);

  /**
   * 검색 중 현 권역 TourAPI 0건 · 명소·명승도 전국 0이면
   * 결과 있는 첫 권역으로 전환 — 「화천」=강원만 등
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
    if ((Number(counts[region]) || 0) > 0) return;
    const next = pickRegionFromTourCounts(counts, region);
    if (!next || next === region) return;
    setRegion(next);
  }, [
    searchActive,
    dbSearchActive,
    curatedSearchPool,
    heritageSearchPool,
    chipCounts.regionCounts,
    region,
    setRegion,
  ]);

  const setCat2 = useCallback(
    (code) => {
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeTourAttractionCat2(cat1, code);
      if (!normalized || normalized === cat2) {
        next.delete('cat2');
        next.delete('cat3');
      } else {
        next.set('cat2', normalized);
        next.delete('cat3');
      }
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1, cat2],
  );

  const setCat3 = useCallback(
    (code) => {
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeTourAttractionCat3(cat1, cat2, code);
      if (!normalized || normalized === cat3) next.delete('cat3');
      else next.set('cat3', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1, cat2, cat3],
  );

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

  const openSpot = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      next.set('spot', id);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
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
                    if (searchOpen) setSearchOpen(false);
                    else setSearchOpen(true);
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
                <ThemeModuleBackButton onlyWhenBack />
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
            <div className="mx-auto w-full max-w-3xl space-y-8 px-3 py-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
              {!searchActive ? (
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

          <section aria-labelledby="korea-scenic-curated-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Landmark size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-scenic-curated-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                GATEO 선정 명소
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">{DISCLAIMER}</p>

            {showCuratedFilterChips ? (
              <div className="space-y-2">
                {(!searchActive || curatedRegionChipsVisible.length > 1) &&
                curatedRegionChipsVisible.length > 0 ? (
                  <FilterChipRow aria-label="명소 권역 대분류">
                    {curatedRegionChipsVisible.map((r) => {
                      const active = region === r;
                      return (
                        <button
                          key={`c-r-${r}`}
                          type="button"
                          onClick={() => setRegion(r)}
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
                      const active = areaCode === chip.code;
                      return (
                        <button
                          key={`c-a-${chip.code}`}
                          type="button"
                          onClick={() => setArea(chip.code)}
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
                {curatedHubChipsForRow.length > 0 ? (
                  <FilterChipRow
                    aria-label="명소 여행지 소분류"
                    className="pl-1"
                  >
                    {curatedHubChipsForRow.map((chip) => {
                      const active = hubId === chip.hubId;
                      return (
                        <button
                          key={`c-h-${chip.hubId}`}
                          type="button"
                          onClick={() => setHub(chip.hubId)}
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

            <ul className="space-y-2">
              {curatedSpotsWithThumbs.map((spot) => (
                <li key={`c-${spot.id}`}>
                  <ScenicListRow
                    spot={spot}
                    distanceKm={curatedKmById.get(String(spot.id))}
                    onOpen={openSpot}
                  />
                </li>
              ))}
            </ul>
            {curatedSpots.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                {searchActive
                  ? (curatedSearchPool?.length || 0) > 0
                    ? `「${searchFilter}」·이 분류에 해당하는 선정 명소가 없습니다. 다른 권역·시도 칩을 골라 보세요.`
                    : `「${searchFilter}」에 해당하는 선정 명소가 없습니다.`
                  : nearActive
                    ? `${NEAR_KM}km 안 선정 명소가 없습니다. 아래 국가유산 명승을 둘러보세요.`
                    : hubId
                      ? `${hubName || '이 여행지'}에 해당하는 선정 명소가 없습니다. 아래 국가유산 명승을 둘러보세요.`
                      : areaCode
                        ? '이 시도에 해당하는 선정 명소가 없습니다. 다른 시도를 골라 보세요.'
                        : '이 권역에 해당하는 선정 명소가 없습니다.'}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="korea-scenic-heritage-heading" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="korea-scenic-heritage-heading"
                className="text-sm font-bold tracking-tight text-stone-800 md:text-base"
              >
                국가유산 명승
              </h2>
              <p className="text-xs font-semibold text-stone-500 tabular-nums">
                {heritageSpots.length.toLocaleString('ko-KR')}곳
                {heritageSpots.length !== HERITAGE_TOTAL
                  ? ` · 전국 ${HERITAGE_TOTAL.toLocaleString('ko-KR')}`
                  : ''}
              </p>
            </div>
            <p className="text-xs text-stone-500 break-keep">{HERITAGE_DISCLAIMER}</p>

            {showHeritageFilterChips ? (
              <div className="space-y-2">
                {(!searchActive || heritageRegionChipsVisible.length > 1) &&
                heritageRegionChipsVisible.length > 0 ? (
                  <FilterChipRow aria-label="명승 권역 대분류">
                    {heritageRegionChipsVisible.map((r) => {
                      const active = region === r;
                      return (
                        <button
                          key={`h-r-${r}`}
                          type="button"
                          onClick={() => setRegion(r)}
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
                      const active = areaCode === chip.code;
                      return (
                        <button
                          key={`h-a-${chip.code}`}
                          type="button"
                          onClick={() => setArea(chip.code)}
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
                      return (
                        <button
                          key={`h-c-${chip.code}`}
                          type="button"
                          onClick={() => setHeritageCategory(chip.code)}
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
                {hubId && hubName ? (
                  <div
                    role="status"
                    className="flex flex-wrap items-center gap-2 pl-0.5 pt-0.5"
                  >
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                      {hubName} 명승
                    </span>
                    <button
                      type="button"
                      onClick={clearHub}
                      className="text-[11px] font-semibold text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
                    >
                      시·군 필터 해제
                    </button>
                  </div>
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
                    ? `${NEAR_KM}km 안 국가유산 명승이 없습니다.`
                    : hubId
                      ? `${hubName || '이 여행지'}에 해당하는 국가유산 명승이 없습니다. 시·군 필터를 해제해 보세요.`
                      : heritageCategory
                        ? '이 경관 유형에 해당하는 국가유산 명승이 없습니다. 다른 소분류를 골라 보세요.'
                        : '이 권역·시도에 해당하는 국가유산 명승이 없습니다.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {heritageSpots.map((spot) => (
                  <li key={`h-${spot.id}`}>
                    <ScenicListRow
                      spot={spot}
                      distanceKm={heritageKmById.get(String(spot.id))}
                      onOpen={openSpot}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="korea-scenic-db-heading" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="korea-scenic-db-heading"
                className="text-sm font-bold tracking-tight text-stone-800 md:text-base"
              >
                {catalogHeadingLabel}
              </h2>
              {nearActive
                ? dbStatus !== 'loading' && (
                    <p className="text-xs font-semibold text-stone-500 tabular-nums">
                      {dbCount.toLocaleString('ko-KR')}곳 · 가까운 순
                    </p>
                  )
                : scopeCount > 0 || dbStatus === 'ok' || dbCount > 0 ? (
                    <p className="text-xs font-semibold text-stone-500 tabular-nums">
                      {(scopeCount > 0 ? scopeCount : dbCount).toLocaleString(
                        'ko-KR',
                      )}
                      곳
                      {totalPages > 1 ? ` · ${page}/${totalPages}` : ''}
                    </p>
                  ) : null}
            </div>
            <p className="text-xs text-stone-500 break-keep">
              한국관광공사 선정 관광지입니다.
            </p>

            {showTourFilterChips ? (
            <div className="space-y-2">
              {(!searchActive || tourCat1ChipsVisible.length > 1) &&
              tourCat1ChipsVisible.length > 0 ? (
                <FilterChipRow aria-label="관광 종목 대분류">
                  {tourCat1ChipsVisible.map((chip) => {
                    const active = cat1 === chip.code;
                    return (
                      <button
                        key={chip.code}
                        type="button"
                        onClick={() => setCat1(chip.code)}
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
              {(!searchActive || tourCat2ChipsVisible.length > 1) &&
              tourCat2ChipsVisible.length > 0 ? (
                <FilterChipRow
                  aria-label={`${activeCat1Label} 중분류`}
                  className="pl-0.5"
                >
                  {tourCat2ChipsVisible.map((chip) => {
                    const active = cat2 === chip.code;
                    return (
                      <button
                        key={chip.code}
                        type="button"
                        onClick={() => setCat2(chip.code)}
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
              {(!searchActive || tourCat3ChipsVisible.length > 1) &&
              tourCat3ChipsVisible.length > 0 ? (
                <FilterChipRow
                  aria-label={`${activeCat2Label} 소분류`}
                  className="pl-1"
                >
                  {tourCat3ChipsVisible.map((chip) => {
                    const active = cat3 === chip.code;
                    return (
                      <button
                        key={chip.code}
                        type="button"
                        onClick={() => setCat3(chip.code)}
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
                    ? `${NEAR_KM}km 안 관광지가 없습니다. 다른 종목을 골라 보세요.`
                    : hubId
                      ? `${hubName}에 해당하는 관광지가 없습니다. 시·군 필터를 해제하거나 다른 종목을 골라 보세요.`
                      : '이 권역·시도·종목에 해당하는 관광지가 없습니다. 다른 중·소분류를 골라 보세요.'}
              </p>
            ) : null}

            {dbSpots.length > 0 ? (
              <ul className="space-y-2">
                {dbSpots.map((spot) => (
                  <li key={`d-${spot.id}`}>
                    <ScenicListRow
                      spot={spot}
                      distanceKm={dbKmById.get(String(spot.id))}
                      onOpen={openSpot}
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
          </section>
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
          showScrollTop && !selectedId
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

      {modalSpot ? (
        <ThemeSpotDetailModal
          spot={modalSpot}
          eyebrow={
            modalSpot?.source === 'cha' ? '국가유산 명승' : '명소 상세'
          }
          returnTo={listReturnTo}
          onClose={closeModal}
          overlayZClass={searchActive ? 'z-50' : 'z-40'}
        />
      ) : null}
    </div>
  );
}
