import { RefreshCw, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSiteUpdateBanner } from '../hooks/useSiteUpdateBanner';

function isHomeNoticeSurface(pathname) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/explore')) return true;
  return false;
}

function SiteUpdateBanner() {
  const location = useLocation();
  const { mode, release, closeRelease, dismissPermanent, reload } = useSiteUpdateBanner();

  if (!mode || !isHomeNoticeSurface(location.pathname)) return null;

  const isRefresh = mode === 'refresh';

  return (
    <div
      className="fixed inset-0 z-[180] pointer-events-none flex justify-center items-start pt-3 md:pt-4 px-4"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto relative w-full max-w-[22rem] md:max-w-[26rem] flex flex-col animate-fade-in-down rounded-[1.5rem] bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_24px_80px_rgba(0,0,0,0.8)] px-5 pb-5 pt-[9vh] md:px-7 md:pb-7 md:pt-[11vh]"
        role="dialog"
        aria-modal="false"
        aria-labelledby="site-update-notice-title"
      >
        <div className="flex items-start gap-3 md:gap-4 relative z-10">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            {isRefresh ? (
              <RefreshCw size={18} aria-hidden />
            ) : (
              <Sparkles size={18} aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              id="site-update-notice-title"
              className="text-base md:text-lg font-bold text-white break-keep leading-snug"
            >
              {isRefresh ? '새 버전이 배포되었습니다' : release?.title}
            </p>

            {isRefresh ? (
              <p className="mt-2 text-sm text-slate-300 break-keep leading-relaxed">
                새로고침하면 최신 기능을 사용할 수 있어요.
              </p>
            ) : (
              release?.items?.length > 0 && (
                <ul className="mt-2.5 space-y-1.5 text-sm text-slate-300 break-keep leading-relaxed">
                  {release.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-blue-400 font-bold shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5 relative z-10">
          {isRefresh ? (
            <>
              <button
                type="button"
                onClick={closeRelease}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={reload}
                className="rounded-xl bg-blue-600/80 hover:bg-blue-500 border border-blue-500/30 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                새로고침
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={closeRelease}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={dismissPermanent}
                className="rounded-xl bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 border border-blue-500/30 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                다시 보지 않기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SiteUpdateBanner;
