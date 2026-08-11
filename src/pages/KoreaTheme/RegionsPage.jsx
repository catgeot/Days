import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Map } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  listKoreaThemeAreas,
  listKoreaThemeRegionAttractions,
} from '../Home/lib/koreaThemeRegions';
import {
  buildThemeModulePath,
  reconcileThemeNavBack,
} from '../Home/lib/koreaThemeNavBack';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';

const AREAS = listKoreaThemeAreas();
const RETURN_TO = '/korea/theme/regions';
const DEFAULT_AREA = AREAS[0]?.areaCode || '1';

function areaFromSearch(searchParams) {
  const q = String(searchParams.get('area') || '').trim();
  if (q && AREAS.some((a) => a.areaCode === q)) return q;
  return DEFAULT_AREA;
}

export default function KoreaThemeRegionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const areaCode = areaFromSearch(searchParams);
  const selectedId = searchParams.get('spot');
  const attractions = listKoreaThemeRegionAttractions(areaCode);
  const activeArea = AREAS.find((a) => a.areaCode === areaCode);
  const multiHub = new Set(attractions.map((a) => a.hubId)).size > 1;
  const selectedSpot = useMemo(
    () => attractions.find((s) => s.id === selectedId) || null,
    [attractions, selectedId],
  );

  useEffect(() => {
    reconcileThemeNavBack(
      buildThemeModulePath(RETURN_TO, {
        areaCode,
        spotId: selectedId,
      }),
    );
  }, [areaCode, selectedId]);

  const setAreaCode = useCallback(
    (code) => {
      const next = new URLSearchParams();
      next.set('area', code);
      setSearchParams(next, { replace: true });
    },
    [setSearchParams],
  );

  const openSpot = useCallback(
    (id) => {
      const next = new URLSearchParams(searchParams);
      next.set('area', areaCode);
      next.set('spot', id);
      setSearchParams(next, { replace: false });
    },
    [areaCode, searchParams, setSearchParams],
  );

  const closeModal = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.set('area', areaCode);
    next.delete('spot');
    setSearchParams(next, { replace: true });
  }, [areaCode, searchParams, setSearchParams]);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="방방곡곡 · 한국의 테마여행"
        description="시도별 큐레이션 명소 목록. 서울·부산·제주 등 지역을 고르면 명소 상세를 모달로 봅니다."
        url={RETURN_TO}
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Korea · Theme
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  방방곡곡
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
        <div className="page-scroll-end-pad mx-auto w-full max-w-3xl px-3 pt-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-regions-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Map size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-regions-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                시도별 명소
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">
              지역을 고르면 그곳의 큐레이션 명소가 목록으로 나옵니다. 항목을 누르면 상세를 봅니다.
            </p>

            <div
              role="group"
              aria-label="시도 필터"
              className="flex flex-wrap gap-1.5"
            >
              {AREAS.map((area) => {
                const active = areaCode === area.areaCode;
                return (
                  <button
                    key={area.areaCode}
                    type="button"
                    onClick={() => setAreaCode(area.areaCode)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                        : 'rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                    }
                  >
                    {area.name}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-stone-500 break-keep">
              {activeArea?.name || '지역'} · 명소 {attractions.length}곳
            </p>

            <ul className="space-y-2">
              {attractions.map((spot) => (
                <li key={spot.id}>
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
                          {multiHub ? spot.hubName : spot.kindLabel}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-stone-600 break-keep">
                        {multiHub
                          ? `${spot.kindLabel}${spot.nameEn ? ` · ${spot.nameEn}` : ''}`
                          : spot.nameEn || spot.areaName}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {attractions.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                이 시도에 연결된 명소가 없습니다.
              </p>
            ) : null}
          </section>
        </div>
      </main>

      {selectedSpot ? (
        <ThemeSpotDetailModal
          spot={{
            id: selectedSpot.id,
            name: selectedSpot.name,
            subtitle: multiHub
              ? `${selectedSpot.hubName} · ${selectedSpot.kindLabel}`
              : selectedSpot.kindLabel || selectedSpot.areaName,
            blurb: selectedSpot.blurb || selectedSpot.nameEn || selectedSpot.areaName,
            placeSlug: selectedSpot.placeSlug,
            contentId: selectedSpot.contentId,
            hubId: selectedSpot.hubId,
            region: selectedSpot.areaName,
            areaCode: selectedSpot.areaCode || areaCode,
            nameEn: selectedSpot.nameEn,
          }}
          eyebrow="방방곡곡 상세"
          returnTo={RETURN_TO}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
