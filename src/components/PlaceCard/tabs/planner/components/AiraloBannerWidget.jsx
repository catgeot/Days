import React from 'react';
import { getAffiliateLink } from '../../../../../utils/affiliate';

const AIRALO_URL = getAffiliateLink('https://www.airalo.com/ko/', 'airalo', {
    campaign: 'planner_banner',
    locationName: 'planner'
});

const AiraloBannerWidget = ({ className = '' }) => {
    return (
        <a
            href={AIRALO_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`relative block w-full min-h-[148px] overflow-hidden rounded-2xl border border-cyan-100 p-4 shadow-sm transition-all hover:shadow-md ${className}`}
            aria-label="Airalo eSIM 제휴 배너"
        >
            <img
                src="/airalo-page2.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-sky-900/70 to-indigo-800/55" />

            <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    제휴광고
                </div>
                <div className="rounded-full bg-white/30 px-2.5 py-1 text-[10px] font-extrabold text-white ring-1 ring-white/45">
                    Airalo eSIM
                </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <div className="break-keep">
                    <h4 className="mt-1 text-base font-black tracking-tight text-white md:text-lg">
                        Airalo eSIM: 국가별 요금제 다양성
                    </h4>
                    <p className="mt-1 text-[11px] text-white/90">
                        필요한 만큼 GB/기간 선택, 200+ 지역 세밀 비교에 강점
                    </p>
                </div>

                <div className="rounded-xl bg-white/30 px-2.5 py-2 text-center shrink-0 ring-1 ring-white/40">
                    <div className="text-base font-black text-white">200+</div>
                    <div className="text-[10px] font-semibold text-white/90">지원 지역</div>
                </div>
            </div>
            </div>
        </a>
    );
};

export default AiraloBannerWidget;
