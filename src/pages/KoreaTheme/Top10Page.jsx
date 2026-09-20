import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Mountain } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  koreaTop10ScenicDisclaimer,
  listKoreaTop10Scenic,
} from '../Home/lib/koreaTop10Scenic';
import { reconcileThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';

const SPOTS = listKoreaTop10Scenic();
const DISCLAIMER = koreaTop10ScenicDisclaimer();
const RETURN_TO = '/korea/theme/top10';

export default function KoreaThemeTop10Page() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('spot');

  const selectedSpot = useMemo(
    () => SPOTS.find((s) => s.id === selectedId) || null,
    [selectedId],
  );

  useEffect(() => {
    const path = selectedId
      ? `${RETURN_TO}?spot=${encodeURIComponent(selectedId)}`
      : RETURN_TO;
    reconcileThemeNavBack(path);
  }, [selectedId]);

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

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 10대 절경 · 한국의 테마여행"
        description="GATEO가 고른 한국 대표 절경 열 곳. 한라산·성산일출봉·설악산·순천만 등 명소 상세를 모달로 봅니다."
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
                  한국의 10대 절경
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
          <section aria-labelledby="korea-top10-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Mountain size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-top10-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                GATEO 선정 열 곳
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">{DISCLAIMER}</p>
            <p className="text-xs text-stone-500 break-keep">
              항목을 누르면 상세를 봅니다. 장소 카드는 상세에서 이어갈 수 있습니다.
            </p>

            <ol className="space-y-2">
              {SPOTS.map((spot) => (
                <li key={spot.id}>
                  <button
                    type="button"
                    onClick={() => openSpot(spot.id)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-sm font-extrabold tabular-nums text-amber-900"
                      aria-hidden="true"
                    >
                      {spot.rank}
                    </span>
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
            </ol>
          </section>
        </div>
      </main>

      {selectedSpot ? (
        <ThemeSpotDetailModal
          spot={{
            id: selectedSpot.id,
            name: selectedSpot.name,
            subtitle: selectedSpot.region,
            blurb: selectedSpot.blurb,
            placeSlug: selectedSpot.placeSlug,
            contentId: selectedSpot.contentId,
            hubId: selectedSpot.hubId,
            region: selectedSpot.region,
            nameEn: selectedSpot.attractionNameEn,
            lat: selectedSpot.lat,
            lng: selectedSpot.lng,
          }}
          eyebrow="10대 절경 상세"
          returnTo={RETURN_TO}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
