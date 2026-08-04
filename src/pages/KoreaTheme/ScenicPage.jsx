import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Landmark } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  koreaScenicSpotsDisclaimer,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots';
import ThemeSpotDetailModal from './ThemeSpotDetailModal';

const DISCLAIMER = koreaScenicSpotsDisclaimer();
const REGIONS = listKoreaScenicRegions();
const RETURN_TO = '/korea/theme/scenic';

export default function KoreaThemeScenicPage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState('전체');
  const [selectedId, setSelectedId] = useState(null);
  const spots = listKoreaScenicSpots(region);
  const selectedSpot =
    listKoreaScenicSpots().find((s) => s.id === selectedId) || null;
  const closeModal = useCallback(() => setSelectedId(null), []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="한국의 명승지 · 한국의 테마여행"
        description="GATEO가 고른 한국 명승·풍경. 권역 필터로 궁궐·사찰·해안·마을 상세를 모달로 봅니다."
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
                <Link
                  to="/korea/theme"
                  aria-label="테마여행으로"
                  title="테마여행"
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  테마
                </Link>
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
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 py-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-scenic-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Landmark size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-scenic-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                GATEO 선정 명승
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">{DISCLAIMER}</p>
            <p className="text-xs text-stone-500 break-keep">
              항목을 누르면 상세를 봅니다. 장소 카드는 상세에서 이어갈 수 있습니다.
            </p>

            <div
              role="group"
              aria-label="권역 필터"
              className="flex flex-wrap gap-1.5"
            >
              {['전체', ...REGIONS].map((r) => {
                const active = region === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRegion(r);
                      setSelectedId(null);
                    }}
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

            <ul className="space-y-2">
              {spots.map((spot) => (
                <li key={spot.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(spot.id)}
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

            {spots.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">이 권역에 해당하는 명승이 없습니다.</p>
            ) : null}
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
          eyebrow="명승지 상세"
          returnTo={RETURN_TO}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
