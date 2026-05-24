import { RefreshCw, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSiteUpdateBanner } from '../hooks/useSiteUpdateBanner';
import { useSiteNoticeAnchorRect } from '../hooks/useSiteNoticeAnchorRect';
import { openUpdatesList } from '../lib/siteNoticeEvents';

function isHomeNoticeSurface(pathname) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/explore')) return true;
  return false;
}

function SiteUpdateBanner() {
  const location = useLocation();
  const { mode, release, closeRelease, dismissPermanent, reload } = useSiteUpdateBanner();
  const showSurface = Boolean(mode) && isHomeNoticeSurface(location.pathname);
  const anchorRect = useSiteNoticeAnchorRect(showSurface);

  if (!showSurface) return null;

  const isRefresh = mode === 'refresh';
  const headerLabel = isRefresh ? '업데이트 안내' : '시스템 공지';
  const anchored = Boolean(anchorRect);

  const panelStyle = anchored
    ? {
        top: anchorRect.top,
        left: anchorRect.left,
        width: anchorRect.width,
      }
    : undefined;

  const headerStyle = anchored
    ? { minHeight: anchorRect.height }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[180] pointer-events-none"
      aria-live="polite"
    >
      <div
        style={panelStyle}
        className={`pointer-events-auto absolute flex flex-col animate-fade-in-down overflow-hidden rounded-[1.5rem] bg-slate-950/78 backdrop-blur-2xl border border-blue-200/25 shadow-[0_20px_56px_rgba(0,0,0,0.72),0_0_0_1px_rgba(147,197,253,0.14),0_0_28px_rgba(59,130,246,0.14)] ${
          anchored
            ? ''
            : 'top-4 left-1/2 -translate-x-1/2 w-full max-w-[200px] sm:max-w-xs md:max-w-md px-4 sm:px-0'
        }`}
        role="dialog"
        aria-modal="false"
        aria-labelledby="site-update-notice-title"
      >
        <div
          style={headerStyle}
          className="flex shrink-0 items-center justify-between gap-3 bg-black/82 px-4 md:px-5"
        >
          <p className="text-[11px] md:text-xs font-bold tracking-[0.18em] uppercase text-blue-300 break-keep">
            {headerLabel}
          </p>
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
            aria-hidden="true"
          >
            {isRefresh ? <RefreshCw size={15} /> : <Sparkles size={15} />}
          </div>
        </div>

        <div className="px-4 py-4 md:px-5 md:py-5 bg-black/20">
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

          <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
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
                  onClick={() => {
                    closeRelease();
                    openUpdatesList();
                  }}
                  className="mr-auto rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  지난 공지 보기
                </button>
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
    </div>
  );
}

export default SiteUpdateBanner;
