import React from 'react';
import { Search } from 'lucide-react';
import { get12GoHomeUrl } from '../../../../../utils/affiliate';
import {
  getPartnerLinkRel,
  getPartnerLinkTarget,
} from '../../../common/partnerNavigation';

/**
 * 12Go 노선 검색 배너 — 제휴 딥링크로 연결 (React SPA에서 Form embed는 클릭 불가 이슈).
 * `Powered by 12Go` 링크는 약관상 필수.
 */
const TwelveGoSearchWidget = ({
  slug,
  targetUrl,
  routeLabel = '페리·교통 검색',
  className = '',
  variant = 'default',
  showRouteLabel = true,
  showPoweredBy = true,
}) => {
  const linkTarget = getPartnerLinkTarget();
  const linkRel = getPartnerLinkRel(linkTarget);
  const poweredHref = get12GoHomeUrl({
    subId: slug ? `${slug}-12go-widget` : 'gateo-12go-widget',
  });
  const isCompact = variant === 'compact';

  if (!targetUrl) return null;

  const ariaLabel = showRouteLabel
    ? `12Go ${routeLabel} 검색`
    : '12Go 페리·쾌속선 티켓 검색';

  return (
    <div className={className}>
      <a
        href={targetUrl}
        target={linkTarget}
        rel={linkRel}
        className={`group block w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md pointer-events-auto ${
          isCompact ? 'p-2.5' : 'p-4'
        }`}
        aria-label={ariaLabel}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              12Go · Sponsored
            </p>
            {showRouteLabel && (
              <p className={`font-bold text-gray-900 break-keep ${isCompact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>
                {routeLabel}
              </p>
            )}
            <p className={`text-gray-600 break-keep ${showRouteLabel ? 'mt-0.5 text-xs' : 'mt-0.5 text-[11px]'}`}>
              페리·쾌속선 시간표 · 티켓 검색
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 font-bold text-white transition-colors group-hover:bg-emerald-700 ${
              isCompact ? 'px-2.5 py-2 text-[11px]' : 'gap-1.5 px-3 py-2.5 text-xs'
            }`}
          >
            <Search size={isCompact ? 12 : 14} />
            티켓 찾기
          </span>
        </div>
      </a>
      {showPoweredBy && (
        <p className={`text-center text-[10px] text-gray-400 ${isCompact ? 'mt-0.5' : 'mt-1'}`}>
          Powered by{' '}
          <a
            href={poweredHref}
            target={linkTarget}
            rel={linkRel}
            className="text-emerald-600 hover:underline pointer-events-auto"
          >
            12Go system
          </a>
        </p>
      )}
    </div>
  );
};

export default TwelveGoSearchWidget;
