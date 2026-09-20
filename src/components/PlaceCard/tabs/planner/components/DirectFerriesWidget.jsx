import React from 'react';
import { Ship } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DIRECT_FERRIES_HOME_URL, DIRECT_FERRIES_RECOMMENDATIONS } from '../constants';

function localizeFerryRoute(route, locale) {
    if (!locale?.startsWith?.('en')) return route;
    const withLatin = route.replace(/[^\x00-\x7F]+(\(([^)]+)\))/g, '$2');
    const withoutKoreanParens = withLatin.replace(/\([^)]*[\u3131-\uD79D][^)]*\)/g, '');
    const cleaned = withoutKoreanParens.replace(/\s+/g, ' ').trim();
    return cleaned || route;
}

const DirectFerriesWidget = ({ location }) => {
    const { t, i18n } = useTranslation();
    const recommendations = location?.slug ? DIRECT_FERRIES_RECOMMENDATIONS[location.slug] : null;

    return (
        <div className="mt-4 space-y-3">
            {recommendations && recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💡</span>
                        <h4 className="font-semibold text-blue-900 text-sm">
                            {t('place.planner.banners.directFerries.recommendedTitle')}
                        </h4>
                    </div>
                    <ul className="space-y-1.5">
                        {recommendations.map((route, idx) => (
                            <li key={idx} className="text-xs text-blue-800 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span className="break-keep">{localizeFerryRoute(route, i18n.language)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <a
                href={DIRECT_FERRIES_HOME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
            >
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Ship className="text-white" size={24} />
                                </div>
                                <h3 className="text-white font-bold text-lg">Direct Ferries</h3>
                            </div>
                            <p className="text-white/90 text-sm font-medium break-keep">
                                {t('place.planner.banners.directFerries.subtitle')}
                            </p>
                            <p className="text-white/70 text-xs mt-1 break-keep">
                                {t('place.planner.banners.directFerries.features')}
                            </p>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <div className="bg-white text-cyan-600 px-4 py-2 rounded-lg font-bold text-sm group-hover:bg-cyan-50 transition-colors">
                                {t('place.planner.banners.directFerries.searchCta')} →
                            </div>
                        </div>
                    </div>
                </div>
            </a>

            <p className="text-xs text-gray-500 text-center leading-relaxed break-keep">
                {t('place.planner.banners.directFerries.affiliateNote')}
            </p>
        </div>
    );
};

export default DirectFerriesWidget;
