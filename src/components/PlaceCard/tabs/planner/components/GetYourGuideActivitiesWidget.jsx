import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import {
  GYG_ACTIVITIES_ITEM_COUNT,
  GYG_CURRENCY,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  buildGygPlannerCmp,
  getGygHomeUrl,
} from '../../../../../utils/affiliate';
import { buildGygActivitiesSearchQuery } from '../locationRules';

/** 파트너 프리뷰 공식 폭 — 740에서 Activities 2열 (560은 패딩 후 1열로 남는 경우 많음) */
export const GYG_ACTIVITIES_FRAME_WIDTH = 740;

const FRAME_LOAD_FALLBACK_MS = 6000;
/** cross-origin iframe은 이미 load된 뒤 listener를 못 붙일 수 있어, 등장 후 짧게 확정 */
const FRAME_APPEAR_SETTLE_MS = 900;

/**
 * 제휴 홈 CTA — cmp 유지 · 스케치/모달/플래너 하단 공통
 * @param {{ location?: object, cmp?: string, label?: string, compact?: boolean, tone?: 'dark'|'light', className?: string }} props
 */
export function GygHomeMoreLink({
  location,
  cmp: cmpProp,
  label = '겟유어가이드에서 더보기',
  compact = false,
  tone = 'dark',
  className = '',
}) {
  const cmp = cmpProp || buildGygPlannerCmp(location);
  const href = getGygHomeUrl({ cmp });
  const toneClass =
    tone === 'light'
      ? compact
        ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-orange-700 underline-offset-2 transition-colors hover:text-orange-800 hover:underline'
        : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-orange-700 underline-offset-2 transition-colors hover:text-orange-800 hover:underline'
      : compact
        ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-orange-100/80 underline-offset-2 transition-colors hover:text-orange-50 hover:underline'
        : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-orange-100/85 underline-offset-2 transition-colors hover:text-orange-50 hover:underline';
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => e.stopPropagation()}
      className={className || toneClass}
    >
      <span>{label}</span>
      <ExternalLink size={compact ? 12 : 13} className="shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

/**
 * @param {'boxed'|'open'} [variant]
 * boxed — 플래너 map_poi: Sponsored 박스 · 짧은 리스트+링크
 * open — 써머리 모달: 박스 없이 패널 스크롤
 * @param {number} [itemCount] — data-gyg-number-of-items (플래너 3 · 그 외 12)
 * @param {number|null} [frameWidth] — open일 때 공식 폭(px). null이면 부모 폭
 * @param {boolean} [showMoreLink] — 하단 제휴 홈 CTA (iframe 로드 후에만)
 * @param {boolean} [linkSponsoredLabel] — Sponsored·GetYourGuide 라벨을 제휴 홈 링크로
 */
const GetYourGuideActivitiesWidget = ({
  location,
  query: queryProp,
  variant = 'boxed',
  itemCount = GYG_ACTIVITIES_ITEM_COUNT,
  frameWidth = null,
  showMoreLink = false,
  linkSponsoredLabel = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [frameReady, setFrameReady] = useState(() => frameWidth == null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const frameHostRef = useRef(null);
  const query = useMemo(
    () => (queryProp != null ? queryProp : buildGygActivitiesSearchQuery(location)),
    [
      queryProp,
      location?.slug,
      location?.name,
      location?.name_en,
      location?.curation_data?.locationEn,
    ]
  );
  const cmp = useMemo(() => buildGygPlannerCmp(location), [location?.slug]);
  const isBoxed = variant !== 'open';
  const items = Math.max(1, Number(itemCount) || GYG_ACTIVITIES_ITEM_COUNT);
  const openFramePx =
    !isBoxed && frameWidth != null && Number(frameWidth) > 0 ? Number(frameWidth) : null;
  const remountKey = `${location?.slug || query || 'gyg-activities'}|${items}|${openFramePx || 'fluid'}`;
  const homeHref = useMemo(() => getGygHomeUrl({ cmp }), [cmp]);

  // 패널 폭 전환 후 한 프레임 뒤 마운트 — 좁은 폭으로 iframe이 고정되는 것 방지
  useEffect(() => {
    if (openFramePx == null) {
      setFrameReady(true);
      return undefined;
    }
    setFrameReady(false);
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) setFrameReady(true);
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [openFramePx, remountKey]);

  useEffect(() => {
    setWidgetLoaded(false);
  }, [remountKey]);

  // GYG analyzer가 iframe을 주입·로드할 때까지 로딩 UI · 더보기는 로드 후
  useEffect(() => {
    if (!frameReady || !query) return undefined;
    const host = frameHostRef.current;
    if (!host) return undefined;

    let settled = false;
    let fallbackTimer = null;
    let appearTimer = null;
    let iframeEl = null;

    const settle = () => {
      if (settled) return;
      settled = true;
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      if (appearTimer != null) window.clearTimeout(appearTimer);
      if (iframeEl) iframeEl.removeEventListener('load', settle);
      setWidgetLoaded(true);
    };

    const watchIframe = (iframe) => {
      if (!iframe || iframeEl === iframe) return;
      if (iframeEl) iframeEl.removeEventListener('load', settle);
      iframeEl = iframe;
      iframe.addEventListener('load', settle);
      if (appearTimer != null) window.clearTimeout(appearTimer);
      appearTimer = window.setTimeout(settle, FRAME_APPEAR_SETTLE_MS);
    };

    const existing = host.querySelector('iframe');
    if (existing) watchIframe(existing);

    const observer = new MutationObserver(() => {
      const iframe = host.querySelector('iframe');
      if (iframe) watchIframe(iframe);
    });
    observer.observe(host, { childList: true, subtree: true });

    fallbackTimer = window.setTimeout(settle, FRAME_LOAD_FALLBACK_MS);

    return () => {
      settled = true;
      if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
      if (appearTimer != null) window.clearTimeout(appearTimer);
      observer.disconnect();
      if (iframeEl) iframeEl.removeEventListener('load', settle);
    };
  }, [frameReady, remountKey, query]);

  const copyQuery = useCallback(async () => {
    if (!query) return;
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.warn('[GetYourGuideActivitiesWidget] 검색어 복사 실패', err);
    }
  }, [query]);

  if (!query) return null;

  const sponsoredText = (
    <span className="inline-flex items-baseline gap-1 uppercase tracking-wide">
      <span
        className={`text-[10px] font-medium ${
          isBoxed ? 'text-orange-500/55' : 'text-orange-200/45'
        }`}
      >
        Sponsored
      </span>
      <span
        className={`text-[10px] font-medium ${
          isBoxed ? 'text-orange-400/40' : 'text-orange-200/30'
        }`}
        aria-hidden
      >
        ·
      </span>
      <span
        className={`text-[10px] font-bold ${
          isBoxed ? 'text-orange-600' : 'text-orange-300/90'
        }`}
      >
        GetYourGuide
      </span>
    </span>
  );

  const sponsoredLabel = linkSponsoredLabel ? (
    <a
      href={homeHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${
        isBoxed ? 'hover:opacity-90' : 'hover:opacity-95'
      }`}
    >
      {sponsoredText}
      <ExternalLink
        size={10}
        className={`shrink-0 ${isBoxed ? 'text-orange-600/70' : 'text-orange-300/70'}`}
        aria-hidden
      />
    </a>
  ) : (
    <div className="inline-flex items-center">{sponsoredText}</div>
  );

  const chrome = (
    <div className={`mb-2 flex flex-wrap items-center justify-between gap-2 ${isBoxed ? '' : 'px-0.5'}`}>
      {sponsoredLabel}
      <button
        type="button"
        onClick={copyQuery}
        title="위젯 검색어 복사 (투어 카드 본문은 제휴 iframe이라 선택이 안 됩니다)"
        className={`max-w-full truncate rounded-md border px-2 py-0.5 text-[10px] font-medium select-text ${
          isBoxed
            ? 'border-orange-200/80 bg-white/70 text-orange-800 hover:bg-white'
            : 'border-white/15 bg-white/10 text-orange-100/90 hover:bg-white/15'
        }`}
      >
        {copied ? '복사됨' : `검색어 · ${query}`}
      </button>
    </div>
  );

  const loadingOverlay = !widgetLoaded ? (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2.5 rounded-lg px-4 ${
        isBoxed ? 'bg-orange-50/90' : 'bg-black/55'
      }`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        size={22}
        className={`animate-spin ${isBoxed ? 'text-orange-500' : 'text-orange-200/90'}`}
        aria-hidden
      />
      <p
        className={`break-keep text-center text-[12px] font-medium leading-relaxed ${
          isBoxed ? 'text-orange-800/85' : 'text-white/75'
        }`}
      >
        현지 투어를 불러오는 중이에요
      </p>
      <p
        className={`break-keep text-center text-[11px] leading-relaxed ${
          isBoxed ? 'text-orange-700/60' : 'text-white/45'
        }`}
      >
        GetYourGuide 목록이 곧 표시됩니다
      </p>
    </div>
  ) : null;

  const frame = frameReady ? (
    <div className="relative w-full min-w-0">
      <div
        ref={frameHostRef}
        key={remountKey}
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-widget="activities"
        data-gyg-partner-id={GYG_PARTNER_ID}
        data-gyg-locale-code={GYG_LOCALE}
        data-gyg-currency={GYG_CURRENCY}
        data-gyg-number-of-items={String(items)}
        data-gyg-q={query}
        data-gyg-cmp={cmp}
        className={`min-h-[160px] w-full min-w-0 [&_iframe]:!w-full ${
          widgetLoaded ? '' : 'opacity-0'
        }`}
        aria-busy={!widgetLoaded}
      />
      {loadingOverlay}
    </div>
  ) : (
    <div
      className={`flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-lg ${
        isBoxed ? 'bg-orange-50/80' : 'bg-white/5'
      }`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        size={22}
        className={`animate-spin ${isBoxed ? 'text-orange-500' : 'text-orange-200/80'}`}
        aria-hidden
      />
      <p
        className={`text-[12px] ${isBoxed ? 'text-orange-800/80' : 'text-white/55'}`}
      >
        현지 투어를 불러오는 중이에요
      </p>
    </div>
  );

  const moreFooter =
    showMoreLink && widgetLoaded ? (
      <div
        className={
          isBoxed
            ? 'mt-3 flex w-full flex-col items-center pb-1 pt-1'
            : 'mt-6 flex w-full flex-col items-center pb-10 pt-2'
        }
      >
        <GygHomeMoreLink location={location} cmp={cmp} tone={isBoxed ? 'light' : 'dark'} />
      </div>
    ) : null;

  if (!isBoxed) {
    return (
      <div className={`mt-0 w-full min-w-0 ${className}`.trim()}>
        {chrome}
        <div
          className="min-w-0"
          style={
            openFramePx
              ? { width: openFramePx, maxWidth: '100%', minWidth: 0 }
              : undefined
          }
        >
          {frame}
        </div>
        {moreFooter}
      </div>
    );
  }

  return (
    <div className={`mt-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3 ${className}`.trim()}>
      {chrome}
      <div className="w-full min-w-0">{frame}</div>
      {moreFooter}
    </div>
  );
};

export default GetYourGuideActivitiesWidget;
