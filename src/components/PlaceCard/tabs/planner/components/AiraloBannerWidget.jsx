import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAiraloHomeUrl } from '../../../../../utils/affiliate';
import airaloBannerImg from '../../../../../assets/Airalo.svg';

const AIRALO_URL = getAiraloHomeUrl({
    campaign: 'planner_banner',
    locationName: 'planner',
});

const AiraloBannerWidget = ({ className = '' }) => {
    const { t } = useTranslation();

    return (
        <a
            href={AIRALO_URL}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border border-cyan-300/90 bg-white shadow-sm ring-1 ring-cyan-900/10 transition-all hover:border-cyan-400 hover:shadow-md hover:ring-cyan-900/15 ${className}`}
            aria-label={t('place.planner.banners.airalo.aria')}
        >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-100/90 bg-gradient-to-r from-cyan-50/90 to-white px-2.5 py-1.5 md:px-3">
                <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
                    <span className="truncate text-sm font-black tracking-tight text-cyan-900 md:text-base">Airalo</span>
                    <span className="shrink-0 rounded-md bg-cyan-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-800 md:text-[11px]">
                        eSIM
                    </span>
                </div>
                <span className="shrink-0 rounded-full bg-gray-800/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    {t('place.planner.banners.affiliateBadge')}
                </span>
            </div>
            <div className="relative overflow-hidden">
                <img
                    src={airaloBannerImg}
                    alt="Airalo eSIM"
                    className="h-auto w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                />
            </div>
            <div className="border-t border-cyan-100/90 bg-gradient-to-b from-cyan-50/70 to-white px-2.5 py-2 md:px-3">
                <p className="break-keep text-xs leading-snug text-gray-700 md:text-sm">
                    <span className="font-bold text-cyan-900">{t('place.planner.banners.airalo.subtitleBold')}</span>
                    <span className="mx-0.5 text-cyan-700/70" aria-hidden="true">
                        ·
                    </span>
                    {t('place.planner.banners.airalo.subtitleRest')}
                </p>
            </div>
        </a>
    );
};

export default AiraloBannerWidget;
