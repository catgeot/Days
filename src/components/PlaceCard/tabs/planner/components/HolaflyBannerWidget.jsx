import React from 'react';
import { getAffiliateLink } from '../../../../../utils/affiliate';

const HOLAFLY_URL = getAffiliateLink('https://esim.holafly.com/ko/', 'holafly', {
    campaign: 'planner_banner',
    locationName: 'planner'
});

const HolaflyBannerWidget = ({ className = '' }) => {
    return (
        <a
            href={HOLAFLY_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`relative block w-full min-h-[148px] overflow-hidden rounded-2xl border border-rose-100 p-4 shadow-sm transition-all hover:shadow-md ${className}`}
            aria-label="Holafly eSIM 제휴 배너"
        >
            <img
                src="/holafly-asia-banner.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-700/35 via-black/20 to-rose-800/20" />

            <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        제휴광고
                    </div>
                    <div className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                        Holafly eSIM
                    </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-black/40 p-2.5 backdrop-blur-[1px]">
                    <div className="max-w-[70%] break-keep">
                        <h4 className="mt-1 text-base font-black tracking-tight text-white drop-shadow-sm md:text-lg">
                            Holafly eSIM: 무제한 데이터 중심
                        </h4>
                        <p className="mt-1 text-[11px] text-white/95 drop-shadow-sm">
                            데이터 걱정 줄이고 오래 쓰는 일정에 유리한 단순 플랜
                        </p>
                    </div>

                    <div className="rounded-xl bg-white/80 px-2.5 py-2 text-center shrink-0">
                        <div className="text-sm font-black text-rose-700">eSIM</div>
                        <div className="text-[10px] text-rose-600">간편 개통</div>
                    </div>
                </div>
            </div>
        </a>
    );
};

export default HolaflyBannerWidget;
