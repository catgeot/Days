import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  Landmark,
  Loader2,
  LocateFixed,
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
  fetchKoreaTourAttractions,
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

function FilterChipLabel({ label, count }) {
  const n = chipCountLabel(count);
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {n != null ? <span className="opacity-70 tabular-nums">{n}</span> : null}
    </span>
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

function ScenicListRow({ spot, distanceKm, onOpen }) {
  const distanceLabel = formatDistanceKm(distanceKm);
  return (
    <button
      type="button"
      onClick={() => onOpen(spot.id)}
      className="flex w-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
    >
      <span className="min-w-0 flex-1">
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
        <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep">
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
    imageUrl: spot.imageUrl || null,
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

  const nearActive = Boolean(nearOrigin && nearLabel);
  const areaChips = useMemo(() => listScenicRegionAreas(region), [region]);

  const curatedNearRanked = useMemo(() => {
    if (!nearOrigin) return null;
    return rankNearbyScenicSpots(
      CURATED_ALL,
      nearOrigin.lat,
      nearOrigin.lng,
      NEAR_KM,
    );
  }, [nearOrigin]);

  const curatedSpots = useMemo(() => {
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
  }, [curatedNearRanked, region, areaCode, hubId]);

  const curatedKmById = useMemo(
    () => kmByIdFromRanked(curatedNearRanked),
    [curatedNearRanked],
  );

  const heritageNearRanked = useMemo(() => {
    if (!nearOrigin) return null;
    return rankNearbyScenicSpots(
      listKoreaHeritageScenic(),
      nearOrigin.lat,
      nearOrigin.lng,
      NEAR_KM,
    );
  }, [nearOrigin]);

  const heritageSpots = useMemo(() => {
    if (heritageNearRanked) return heritageNearRanked.map((row) => row.item);
    return sortScenicSpotsByPlaceCluster(
      listKoreaHeritageScenic({
        region,
        areaCode,
        localityQuery,
        category: heritageCategory,
      }),
    );
  }, [heritageNearRanked, region, areaCode, localityQuery, heritageCategory]);

  const heritageKmById = useMemo(
    () => kmByIdFromRanked(heritageNearRanked),
    [heritageNearRanked],
  );

  const curatedAreaCounts = useMemo(
    () => countKoreaScenicSpotsByTourArea(region),
    [region],
  );

  const curatedHubChips = useMemo(
    () => listKoreaScenicHubChips(region, areaCode),
    [region, areaCode],
  );

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
  }, [curatedHubChips, curatedAreaChips, areaCode, region]);

  const heritageAreaCounts = useMemo(
    () => countKoreaHeritageScenicByTourArea(region),
    [region],
  );

  const heritageAreaChips = useMemo(
    () =>
      areaChips.filter((chip) => (heritageAreaCounts[chip.code] || 0) > 0),
    [areaChips, heritageAreaCounts],
  );

  const heritageCategoryChips = useMemo(
    () =>
      listKoreaHeritageCategoryChips({
        region,
        areaCode,
        localityQuery,
      }),
    [region, areaCode, localityQuery],
  );

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

  const regionChips = useMemo(() => {
    const set = new Set([...CURATED_REGIONS, ...SCENIC_REGION_ORDER]);
    return SCENIC_REGION_ORDER.filter((r) => set.has(r));
  }, []);

  const cat2Chips = useMemo(() => listTourAttractionCat2(cat1), [cat1]);
  const cat3Chips = useMemo(
    () => listTourAttractionCat3(cat1, cat2),
    [cat1, cat2],
  );

  const tourCat1ChipsVisible = useMemo(
    () =>
      TOUR_ATTRACTION_CAT1.filter((chip) =>
        keepChipByCount(chipCounts.cat1Counts[chip.code]),
      ),
    [chipCounts.cat1Counts],
  );

  const tourCat2ChipsVisible = useMemo(() => {
    const majorLabel =
      TOUR_ATTRACTION_CAT1.find((c) => c.code === cat1)?.label || '';
    return cat2Chips.filter((chip) => {
      if (!keepChipByCount(chipCounts.cat2Counts[chip.code])) return false;
      if (majorLabel && chipLabelsEqual(chip.label, majorLabel)) return false;
      return true;
    });
  }, [cat2Chips, chipCounts.cat2Counts, cat1]);

  const tourCat3ChipsVisible = useMemo(() => {
    const midLabel = cat2Chips.find((c) => c.code === cat2)?.label || '';
    return cat3Chips.filter((chip) => {
      if (!keepChipByCount(chipCounts.cat3Counts[chip.code])) return false;
      if (midLabel && chipLabelsEqual(chip.label, midLabel)) return false;
      return true;
    });
  }, [cat3Chips, chipCounts.cat3Counts, cat2Chips, cat2]);

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
      localityQuery,
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
  }, [region, areaCode, cat1, cat2, cat3, localityQuery]);

  useEffect(() => {
    let cancelled = false;
    countKoreaTourAttractions({ region, areaCode, localityQuery }).then((res) => {
      if (cancelled) return;
      setScopeCount(res.count || 0);
    });
    return () => {
      cancelled = true;
    };
  }, [region, areaCode, localityQuery]);

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
    setDbStatus('loading');
    setDbError(null);
    const fetchLimit = nearActive ? NEAR_DB_LIMIT : PAGE_SIZE;
    const fetchOffset = nearActive ? 0 : (page - 1) * PAGE_SIZE;
    fetchKoreaTourAttractions({
      region,
      areaCode: nearActive ? null : areaCode,
      cat1,
      cat2,
      cat3,
      localityQuery: nearActive ? null : localityQuery,
      limit: fetchLimit,
      offset: fetchOffset,
    }).then((res) => {
      if (cancelled) return;
      if (nearActive && nearOrigin) {
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
        return;
      }
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
  }, [region, areaCode, cat1, cat2, cat3, localityQuery, page, nearActive, nearOrigin]);

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
      setSelectedSpot(curated);
      return undefined;
    }
    const heritage = getKoreaHeritageScenicById(selectedId);
    if (heritage) {
      setSelectedSpot(heritage);
      return undefined;
    }
    const fromPage = dbSpots.find((s) => s.id === selectedId);
    if (fromPage) {
      setSelectedSpot(fromPage);
      return undefined;
    }
    fetchKoreaTourAttractionById(selectedId).then((spot) => {
      if (cancelled) return;
      setSelectedSpot(spot);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId, dbSpots]);

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

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 명승"
        description="국가유산청 지정 명승과 GATEO 선정 명소. 권역별로 상세를 모달로 봅니다."
        url={RETURN_TO}
      />

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
                <Link
                  to="/korea?from=theme"
                  aria-label="한국의 축제로"
                  title="축제"
                  className="flex items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <CalendarDays size={14} aria-hidden="true" />
                  축제
                </Link>
                <ThemeModuleBackButton />
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
            <ThemeNavBackHint />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-8 px-3 py-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
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
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
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

            {!nearActive ? (
              <div className="space-y-2">
                <div
                  role="group"
                  aria-label="명소 권역 대분류"
                  className="flex flex-wrap gap-1.5"
                >
                  {regionChips.map((r) => {
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
                          count={CURATED_REGION_COUNTS[r]}
                        />
                      </button>
                    );
                  })}
                </div>
                {curatedAreaChips.length > 1 ? (
                  <div
                    role="group"
                    aria-label="명소 시도 중분류"
                    className="flex flex-wrap gap-1.5 pl-0.5"
                  >
                    {curatedAreaChips.map((chip) => {
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
                  </div>
                ) : null}
                {curatedHubChipsVisible.length > 1 ? (
                  <div
                    role="group"
                    aria-label="명소 여행지 소분류"
                    className="flex flex-wrap gap-1.5 pl-1"
                  >
                    {curatedHubChipsVisible.map((chip) => {
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
                  </div>
                ) : null}
              </div>
            ) : null}

            <ul className="space-y-2">
              {curatedSpots.map((spot) => (
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
                {nearActive
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

            {!nearActive ? (
              <div className="space-y-2">
                <div
                  role="group"
                  aria-label="명승 권역 대분류"
                  className="flex flex-wrap gap-1.5"
                >
                  {regionChips.map((r) => {
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
                          count={HERITAGE_REGION_COUNTS[r]}
                        />
                      </button>
                    );
                  })}
                </div>
                {heritageAreaChips.length > 1 ? (
                  <div
                    role="group"
                    aria-label="명승 시도 중분류"
                    className="flex flex-wrap gap-1.5 pl-0.5"
                  >
                    {heritageAreaChips.map((chip) => {
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
                  </div>
                ) : null}
                {heritageCategoryChipsVisible.length > 0 ? (
                  <div
                    role="group"
                    aria-label="명승 경관 소분류"
                    className="flex flex-wrap gap-1.5 pl-1"
                  >
                    {heritageCategoryChipsVisible.map((chip) => {
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
                  </div>
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
                {nearActive
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
                {catalogHeading}
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
              {nearActive
                ? `현재 위치 ${NEAR_KM}km 안 TourAPI 관광지(지정 명승과 별개)입니다. 가까운 순으로 나열합니다.`
                : hubId
                  ? `${hubName} 주소 기준 TourAPI 관광지(지정 명승과 별개)입니다. 같은 시·군끼리 묶어 나열합니다.`
                  : 'TourAPI 관광지(지정 명승과 별개)입니다. 대표 이미지가 있는 곳을 먼저·같은 시·군끼리 묶어 나열합니다. 아래 종목으로 목록을 나눕니다.'}
            </p>

            <div className="space-y-2">
              {tourCat1ChipsVisible.length > 0 ? (
                <div
                  role="group"
                  aria-label="관광 종목 대분류"
                  className="flex flex-wrap gap-1.5"
                >
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
                </div>
              ) : null}
              {tourCat2ChipsVisible.length > 0 ? (
                <div
                  role="group"
                  aria-label={`${activeCat1Label} 중분류`}
                  className="flex flex-wrap gap-1.5 pl-0.5"
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
                </div>
              ) : null}
              {tourCat3ChipsVisible.length > 0 ? (
                <div
                  role="group"
                  aria-label={`${activeCat2Label} 소분류`}
                  className="flex flex-wrap gap-1.5 pl-1"
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
                </div>
              ) : null}
            </div>

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
                {nearActive
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
      </main>

      {modalSpot ? (
        <ThemeSpotDetailModal
          spot={modalSpot}
          eyebrow={
            modalSpot?.source === 'cha' ? '국가유산 명승' : '명소 상세'
          }
          returnTo={listReturnTo}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
