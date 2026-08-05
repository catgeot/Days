import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Home, Package } from 'lucide-react';
import SEO from '../../components/SEO';
import { listKoreaThemePackageCtas } from '../Home/lib/koreaThemePackages';
import { reconcileThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';

const RETURN_TO = '/korea/theme/packages';
const CTAS = listKoreaThemePackageCtas();

export default function KoreaThemePackagesPage() {
  const navigate = useNavigate();

  useEffect(() => {
    reconcileThemeNavBack(RETURN_TO);
  }, []);

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="패키지 상품 · 한국의 테마여행"
        description="마이리얼트립 국내 패키지·에어텔 딥링크. 제주·경주 검색과 패키지 홈으로 이어갑니다."
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
                  패키지 상품
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
        <div className="mx-auto w-full max-w-3xl px-3 py-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-packages-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Package size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-packages-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                MRT 국내 패키지
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">
              관심 지역을 고르면 마이리얼트립 패키지 검색·홈으로 이어집니다. 상품 목록은 제휴사
              페이지에서 확인하세요.
            </p>

            <ul className="space-y-2">
              {CTAS.map((cta) => (
                <li key={cta.key}>
                  <a
                    href={cta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3.5 text-sm font-extrabold text-stone-900 shadow-sm transition-colors hover:border-amber-300/80 hover:bg-amber-50/40"
                  >
                    <span className="min-w-0 break-keep">{cta.ctaLabel}</span>
                    <ExternalLink
                      size={16}
                      className="shrink-0 text-amber-800 opacity-80"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>

            <p className="text-xs leading-relaxed text-stone-500 break-keep">
              제휴 링크로 이동합니다. 가격·일정은 마이리얼트립에서 달라질 수 있습니다.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
