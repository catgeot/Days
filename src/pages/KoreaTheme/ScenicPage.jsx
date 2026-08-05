import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Landmark } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  koreaScenicSpotsDisclaimer,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots';
import {
  fetchKoreaTourAttractionById,
  fetchKoreaTourAttractions,
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

function toModalSpot(spot) {
  if (!spot) return null;
  return {
    id: spot.id,
    name: spot.name,
    subtitle: spot.region,
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

export default function KoreaThemeScenicPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const region = searchParams.get('region') || '전체';
  const selectedId = searchParams.get('spot');
  const page = Math.max(Number(searchParams.get('page') || '1') || 1, 1);

  const curatedSpots = useMemo(
    () => listKoreaScenicSpots(region === '전체' ? null : region),
    [region],
  );

  const [dbSpots, setDbSpots] = useState([]);
  const [dbCount, setDbCount] = useState(0);
  const [dbStatus, setDbStatus] = useState('loading');
  const [dbError, setDbError] = useState(null);
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (region && region !== '전체') params.set('region', region);
    if (selectedId) params.set('spot', selectedId);
    if (page > 1) params.set('page', String(page));
    const q = params.toString();
    reconcileThemeNavBack(q ? `${RETURN_TO}?${q}` : RETURN_TO);
  }, [region, selectedId, page]);

  useEffect(() => {
    let cancelled = false;
    setDbStatus('loading');
    setDbError(null);
    fetchKoreaTourAttractions({
      region,
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
  }, [region, page]);

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
      if (!r || r === '전체') next.delete('region');
      else next.set('region', r);
      next.delete('spot');
      next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
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

  const regionChips = useMemo(() => {
    const set = new Set([...CURATED_REGIONS, ...SCENIC_REGION_ORDER]);
    return SCENIC_REGION_ORDER.filter((r) => set.has(r));
  }, []);

  const totalPages = Math.max(1, Math.ceil(dbCount / PAGE_SIZE));
  const modalSpot = toModalSpot(selectedSpot);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 명승지 · 한국의 테마여행"
        description="국내 관광지 카탈로그와 GATEO 선정 명승. 권역 필터로 상세를 모달로 봅니다."
        url={RETURN_TO}
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Korea · Theme · GATEO
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  한국의 명승지
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
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
          <div
            role="group"
            aria-label="권역 필터"
            className="flex flex-wrap gap-1.5"
          >
            {['전체', ...regionChips].map((r) => {
              const active = region === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegion(r)}
                  aria-pressed={active}
                  className={
                    active
                      ? 'rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                      : 'rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                  }
                >
                  {r}
                </button>
              );
            })}
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
                          {spot.region}
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
              <p className="text-sm text-stone-500 break-keep">이 권역에 해당하는 선정 명승이 없습니다.</p>
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
              TourAPI 관광지 목록을 주 1회 동기화한 카탈로그입니다. 항목을 누르면 상세를 봅니다.
            </p>

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
                아직 동기화된 관광지가 없습니다. 주간 sync 후 표시됩니다.
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
                            {spot.region}
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
