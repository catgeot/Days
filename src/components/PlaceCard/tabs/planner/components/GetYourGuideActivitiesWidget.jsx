import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
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

/**
 * 제휴 홈 CTA — cmp 유지 · 스케치/모달 하단 공통
 * @param {{ location?: object, cmp?: string, label?: string, compact?: boolean, className?: string }} props
 */
export function GygHomeMoreLink({
  location,
  cmp: cmpProp,
  label = '겟유어가이드에서 더보기',
  compact = false,
  className = '',
}) {
  const cmp = cmpProp || buildGygPlannerCmp(location);
  const href = getGygHomeUrl({ cmp });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => e.stopPropagation()}
      className={
        className ||
        (compact
          ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-orange-100/80 underline-offset-2 transition-colors hover:text-orange-50 hover:underline'
          : 'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-orange-100/85 underline-offset-2 transition-colors hover:text-orange-50 hover:underline')
      }
    >
      <span>{label}</span>
      <ExternalLink size={compact ? 12 : 13} className="shrink-0 opacity-70" aria-hidden />
    </a>
  );
}

/**
 * @param {'boxed'|'open'} [variant]
 * boxed — 플래너 map_poi: Sponsored 박스 유지 · 고정 높이 내부 스크롤
 * open — 스케치 좌측·써머리 모달: 박스 없이 패널 스크롤
 * @param {number|null} [frameWidth] — open일 때 공식 폭(px). null이면 부모 폭
 * @param {boolean} [showMoreLink] — 하단 제휴 홈 CTA
 * @param {boolean} [linkSponsoredLabel] — Sponsored·GetYourGuide 라벨을 제휴 홈 링크로
 */
const GetYourGuideActivitiesWidget = ({
  location,
  query: queryProp,
  variant = 'boxed',
  frameWidth = null,
  showMoreLink = false,
  linkSponsoredLabel = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [frameReady, setFrameReady] = useState(() => frameWidth == null);
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
  const openFramePx =
    !isBoxed && frameWidth != null && Number(frameWidth) > 0 ? Number(frameWidth) : null;
  const remountKey = `${location?.slug || query || 'gyg-activities'}|${openFramePx || 'fluid'}`;
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

  const sponsoredLabel = linkSponsoredLabel ? (
    <a
      href={homeHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide underline-offset-2 hover:underline ${
        isBoxed ? 'text-orange-600 hover:text-orange-700' : 'text-orange-300/90 hover:text-orange-200'
      }`}
    >
      <span>Sponsored · GetYourGuide</span>
      <ExternalLink size={10} className="shrink-0 opacity-70" aria-hidden />
    </a>
  ) : (
    <div
      className={`text-[10px] font-bold uppercase tracking-wide ${
        isBoxed ? 'text-orange-600' : 'text-orange-300/90'
      }`}
    >
      Sponsored · GetYourGuide
    </div>
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

  const frame = frameReady ? (
    <div
      key={remountKey}
      data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
      data-gyg-widget="activities"
      data-gyg-partner-id={GYG_PARTNER_ID}
      data-gyg-locale-code={GYG_LOCALE}
      data-gyg-currency={GYG_CURRENCY}
      data-gyg-number-of-items={String(GYG_ACTIVITIES_ITEM_COUNT)}
      data-gyg-q={query}
      data-gyg-cmp={cmp}
    />
  ) : (
    <div className="min-h-[120px] w-full animate-pulse rounded-lg bg-white/5" aria-hidden />
  );

  const moreFooter = showMoreLink ? (
    <div className="mt-6 flex w-full flex-col items-center pb-10 pt-2">
      <GygHomeMoreLink location={location} cmp={cmp} />
    </div>
  ) : null;

  if (!isBoxed) {
    return (
      <div className={`mt-0 w-full min-w-0 ${className}`.trim()}>
        {chrome}
        <div
          className="min-w-0 [&_iframe]:!w-full"
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
      <div className="max-h-[min(52vh,520px)] overflow-y-auto overscroll-contain pr-0.5 custom-scrollbar">
        {frame}
      </div>
      {moreFooter}
    </div>
  );
};

export default GetYourGuideActivitiesWidget;
