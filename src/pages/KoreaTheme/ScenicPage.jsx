import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Home, Landmark } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  koreaScenicSpotsDisclaimer,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots';
import {
  listTourAttractionCat2,
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
  TOUR_ATTRACTION_CAT1,
} from '../Home/lib/koreaTourAttractionCategories';
import {
  fetchKoreaTourAttractionById,
  fetchKoreaTourAttractions,
  fetchScenicFilterChipCounts,
  labelScenicAreaCode,
  listScenicRegionAreas,
  normalizeScenicAreaCode,
  scenicAreaCodeForHubId,
  SCENIC_REGION_ORDER,
} from '../Home/lib/koreaTourAttractions';
import { reconcileThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';

const DISCLAIMER = koreaScenicSpotsDisclaimer();
const CURATED_REGIONS = listKoreaScenicRegions();
const RETURN_TO = '/korea/theme/scenic';
const CURATED_ALL = listKoreaScenicSpots();
const PAGE_SIZE = 40;
const DEFAULT_REGION = SCENIC_REGION_ORDER[0];
const DEFAULT_CAT1 = TOUR_ATTRACTION_CAT1[0]?.code || 'A01';

function chipCountLabel(count) {
  if (count == null || !Number.isFinite(count)) return null;
  return Number(count).toLocaleString('ko-KR');
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

function toModalSpot(spot) {
  if (!spot) return null;
  return {
    id: spot.id,
    name: spot.name,
    subtitle: spot.areaLabel || spot.region,
    blurb: spot.blurb,
    placeSlug: spot.placeSlug,
    contentId: spot.contentId,
    hubId: spot.hubId,
    region: spot.region,
    nameEn: spot.attractionNameEn || spot.nameEn || null,
    lat: spot.lat,
    lng: spot.lng,
  };
}

function resolveRegion(raw) {
  const value = String(raw || '').trim();
  if (value && SCENIC_REGION_ORDER.includes(value)) return value;
  return DEFAULT_REGION;
}

function spotRegionLabel(spot) {
  if (!spot) return '';
  if (spot.areaLabel) return `${spot.region} · ${spot.areaLabel}`;
  return spot.region || '';
}

export default function KoreaThemeScenicPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const region = resolveRegion(searchParams.get('region'));
  const areaCode = normalizeScenicAreaCode(region, searchParams.get('area'));
  const cat1 =
    normalizeTourAttractionCat1(searchParams.get('cat1')) || DEFAULT_CAT1;
  const cat2 = normalizeTourAttractionCat2(cat1, searchParams.get('cat2'));
  const selectedId = searchParams.get('spot');
  const page = Math.max(Number(searchParams.get('page') || '1') || 1, 1);

  const areaChips = useMemo(() => listScenicRegionAreas(region), [region]);

  const curatedSpots = useMemo(() => {
    const inRegion = listKoreaScenicSpots(region);
    if (!areaCode) return inRegion;
    return inRegion.filter((s) => scenicAreaCodeForHubId(s.hubId) === areaCode);
  }, [region, areaCode]);

  const [dbSpots, setDbSpots] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbError, setDbError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [chipCounts, setChipCounts] = useState({
    regionCounts: {},
    areaCounts: {},
    cat1Counts: {},
    cat2Counts: {},
  });

  const regionChips = useMemo(() => {
    const set = new Set([...CURATED_REGIONS, ...SCENIC_REGION_ORDER]);
    return SCENIC_REGION_ORDER.filter((r) => set.has(r));
  }, []);

  const cat2Chips = useMemo(() => listTourAttractionCat2(cat1), [cat1]);

  useEffect(() => {
    let cancelled = false;
    fetchScenicFilterChipCounts({ region, areaCode, cat1, cat2 }).then((res) => {
      if (cancelled) return;
      setChipCounts({
        regionCounts: res.regionCounts || {},
        areaCounts: res.areaCounts || {},
        cat1Counts: res.cat1Counts || {},
        cat2Counts: res.cat2Counts || {},
      });
    });
    return () => {
      cancelled = true;
    };
  }, [region, areaCode, cat1, cat2]);

  useEffect(() => {
    const rawRegion = searchParams.get('region');
    const rawArea = searchParams.get('area');
    const rawCat1 = searchParams.get('cat1');
    const rawCat2 = searchParams.get('cat2');
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
    if (!normalizeTourAttractionCat1(rawCat1)) {
      next.set('cat1', cat1);
      changed = true;
    }
    if (rawCat2 && !normalizeTourAttractionCat2(cat1, rawCat2)) {
      next.delete('cat2');
      changed = true;
    }
    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, region, cat1]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (areaCode) params.set('area', areaCode);
    if (cat1) params.set('cat1', cat1);
    if (cat2) params.set('cat2', cat2);
    if (selectedId) params.set('spot', selectedId);
    if (page > 1) params.set('page', String(page));
    const q = params.toString();
    reconcileThemeNavBack(q ? `${RETURN_TO}?${q}` : RETURN_TO);
  }, [region, areaCode, cat1, cat2, selectedId, page]);

  useEffect(() => {
    let cancelled = false;
    setDbStatus('loading');
    setDbError(null);
    fetchKoreaTourAttractions({
      region,
      areaCode,
      cat1,
      cat2,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).then((res) => {
      if (cancelled) return;
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
  }, [region, areaCode, cat1, cat2, page]);

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

  const setRegion = useCallback(
    (r) => {
      const next = new URLSearchParams(searchParams);
      next.set('region', resolveRegion(r));
      next.delete('area');
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setArea = useCallback(
    (code) => {
      const next = new URLSearchParams(searchParams);
      const normalized = normalizeScenicAreaCode(region, code);
      if (!normalized || normalized === areaCode) next.delete('area');
      else next.set('area', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, region, areaCode],
  );

  const setCat1 = useCallback(
    (code) => {
      const next = new URLSearchParams(searchParams);
      next.set('cat1', normalizeTourAttractionCat1(code) || DEFAULT_CAT1);
      next.delete('cat2');
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
      if (!normalized || normalized === cat2) next.delete('cat2');
      else next.set('cat2', normalized);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, cat1, cat2],
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

  const totalPages = Math.max(1, Math.ceil(dbCount / PAGE_SIZE));
  const modalSpot = toModalSpot(selectedSpot);
  const activeCat1Label =
    TOUR_ATTRACTION_CAT1.find((c) => c.code === cat1)?.label || '종목';

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 명승"
        description="국내 관광지 카탈로그와 GATEO 선정 명승. 권역·종목 필터로 상세를 모달로 봅니다."
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
                  한국의 명승
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
            <div
              role="group"
              aria-label="권역 대분류"
              className="flex flex-wrap gap-1.5"
            >
              {regionChips.map((r) => {
                const active = region === r;
                return (
                  <button
                    key={r}
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
                      count={chipCounts.regionCounts[r]}
                    />
                  </button>
                );
              })}
            </div>
            {areaChips.length > 1 ? (
              <div
                role="group"
                aria-label={`${region} 시도 소분류`}
                className="flex flex-wrap gap-1.5 pl-0.5"
              >
                {areaChips.map((chip) => {
                  const active = areaCode === chip.code;
                  return (
                    <button
                      key={chip.code}
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
                        count={chipCounts.areaCounts[chip.code]}
                      />
                    </button>
                  );
                })}
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
                GATEO 선정 명승
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">{DISCLAIMER}</p>

            <ul className="space-y-2">
              {curatedSpots.map((spot) => (
                <li key={`c-${spot.id}`}>
                  <button
                    type="button"
                    onClick={() => openSpot(spot.id)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-sm font-extrabold tracking-tight text-stone-900 break-keep">
                          {spot.name}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {spotRegionLabel({
                            region: spot.region,
                            areaLabel: labelScenicAreaCode(
                              scenicAreaCodeForHubId(spot.hubId),
                            ),
                          })}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep">
                        {spot.blurb}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {curatedSpots.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                {areaCode
                  ? '이 시도에 해당하는 선정 명승이 없습니다. 다른 시도를 골라 보세요.'
                  : '이 권역에 해당하는 선정 명승이 없습니다.'}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="korea-scenic-db-heading" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="korea-scenic-db-heading"
                className="text-sm font-bold tracking-tight text-stone-800 md:text-base"
              >
                전국 관광지
              </h2>
              {dbStatus === 'ok' || dbCount > 0 ? (
                <p className="text-xs font-semibold text-stone-500">
                  {dbCount.toLocaleString('ko-KR')}곳
                  {totalPages > 1 ? ` · ${page}/${totalPages}` : ''}
                </p>
              ) : null}
            </div>
            <p className="text-xs text-stone-500 break-keep">
              선택한 권역·시도 아래 TourAPI 종목(대분류·소분류)으로 나눈 카탈로그입니다. 항목을 누르면 상세를 봅니다.
            </p>

            <div className="space-y-2">
              <div
                role="group"
                aria-label="관광 종목 대분류"
                className="flex flex-wrap gap-1.5"
              >
                {TOUR_ATTRACTION_CAT1.map((chip) => {
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
              {cat2Chips.length > 0 ? (
                <div
                  role="group"
                  aria-label={`${activeCat1Label} 소분류`}
                  className="flex flex-wrap gap-1.5 pl-0.5"
                >
                  {cat2Chips.map((chip) => {
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
                이 권역·시도·종목에 해당하는 관광지가 없습니다. 다른 소분류를 골라 보세요.
              </p>
            ) : null}

            {dbSpots.length > 0 ? (
              <ul className="space-y-2">
                {dbSpots.map((spot) => (
                  <li key={`d-${spot.id}`}>
                    <button
                      type="button"
                      onClick={() => openSpot(spot.id)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-extrabold tracking-tight text-stone-900 break-keep">
                            {spot.name}
                          </span>
                          <span className="text-[11px] font-semibold text-stone-500">
                            {spotRegionLabel(spot)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep">
                          {spot.blurb}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {totalPages > 1 && dbSpots.length > 0 ? (
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
          eyebrow="명승지 상세"
          returnTo={RETURN_TO}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
