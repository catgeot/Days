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
const TwelveGoSearchWidget = ({ slug, targetUrl, routeLabel = '페리·교통 검색', className = '' }) => {
  const linkTarget = getPartnerLinkTarget();
  const linkRel = getPartnerLinkRel(linkTarget);
  const poweredHref = get12GoHomeUrl({
    subId: slug ? `${slug}-12go-widget` : 'gateo-12go-widget',
  });

  if (!targetUrl) return null;

  return (
    <div className={className}>
      <a
        href={targetUrl}
        target={linkTarget}
        rel={linkRel}
        className="group block w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white p-4 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md pointer-events-auto"
        aria-label={`12Go ${routeLabel} 검색`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
              12Go · Sponsored
            </p>
            <p className="mt-1 text-sm font-bold text-gray-900 break-keep">{routeLabel}</p>
            <p className="mt-0.5 text-xs text-gray-600 break-keep">페리·쾌속선 시간표 · 티켓 검색</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition-colors group-hover:bg-emerald-700">
            <Search size={14} />
            티켓 찾기
          </span>
        </div>
      </a>
      <p className="mt-1 text-center text-[10px] text-gray-400">
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
    </div>
  );
};

export default TwelveGoSearchWidget;
