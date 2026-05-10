import React from 'react';
import { getAffiliateLink } from '../../../../../utils/affiliate';
import holaflyBannerImg from '../../../../../assets/Holafly.png';

const HOLAFLY_URL = getAffiliateLink('https://esim.holafly.com/ko/', 'holafly', {
    campaign: 'planner_banner',
    locationName: 'planner',
});

const HolaflyBannerWidget = ({ className = '' }) => {
    return (
        <a
            href={HOLAFLY_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-rose-300/90 bg-white shadow-sm ring-1 ring-rose-900/10 transition-all hover:border-rose-400 hover:shadow-md hover:ring-rose-900/15 ${className}`}
            aria-label="Holafly eSIM 제휴 배너: 무제한 데이터 중심"
        >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rose-100/90 bg-gradient-to-r from-rose-50/90 to-white px-2.5 py-1.5 md:px-3">
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                    <span className="truncate text-sm font-black tracking-tight text-rose-800 md:text-base">Holafly</span>
                    <span className="shrink-0 rounded-md bg-rose-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800 md:text-[11px]">
                        eSIM
                    </span>
                </div>
                <span className="shrink-0 rounded-full bg-gray-800/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    제휴광고
                </span>
            </div>
            <div className="relative overflow-hidden">
                <img
                    src={holaflyBannerImg}
                    alt="Holafly eSIM"
                    className="h-auto w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className="border-t border-rose-100/90 bg-gradient-to-b from-rose-50/70 to-white px-2.5 py-2 md:px-3">
                <p className="break-keep text-[10px] leading-snug text-gray-700 md:text-[11px]">
                    <span className="font-bold text-rose-800">무제한 중심</span>
                    <span className="mx-0.5 text-rose-700/70" aria-hidden="true">
                        ·
                    </span>
                    데이터 걱정 줄이고, 장기·단순 플랜에 유리
                </p>
            </div>
        </a>
    );
};

export default HolaflyBannerWidget;
