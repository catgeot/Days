import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import SEO from '../../components/SEO';
import { getKoreaThemeModule } from '../Home/lib/koreaThemeModules';

export default function KoreaThemeModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const mod = getKoreaThemeModule(moduleId);

  if (!mod || mod.id === 'festivals' || !mod.enabled) {
    return <Navigate to="/korea/theme" replace />;
  }

  if (mod.id === 'packages') {
    return <Navigate to="/korea/theme/packages" replace />;
  }

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title={`${mod.label} · 한국의 테마여행`}
        description={mod.blurb}
        url={mod.path}
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
                  {mod.label}
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
        <div className="mx-auto w-full max-w-3xl px-3 py-8 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <p className="text-sm leading-relaxed text-stone-600 break-keep">{mod.blurb}</p>
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-12 text-center text-sm text-stone-500 break-keep">
            이 테마 본문은 다음 세션에서 채웁니다.
          </div>
        </div>
      </main>
    </div>
  );
}
