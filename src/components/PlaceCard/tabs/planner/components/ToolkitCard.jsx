import React from 'react';
import { ExternalLink } from 'lucide-react';
import CopyableText from '../../../common/CopyableText';
import { isMobileDevice } from '../../../common/device';
import WhiteLabelWidget from '../../../common/WhiteLabelWidget';
import FlightSearchCta from './FlightSearchCta';
import FlightOfficialBookingWidget from './FlightOfficialBookingWidget';
import { getKlookAffiliateUrl, getKlookRentalUrlByLocation } from '../../../../../utils/affiliate';
import MrtDynamicLink from './MrtDynamicLink';
import FerryBookingWidget from './FerryBookingWidget';
import KlookCarBannerWidget from './KlookCarBannerWidget';
import KlookTourBannerWidget from './KlookTourBannerWidget';
import GetYourGuideCityWidget from './GetYourGuideCityWidget';
import { THEME_COLORS } from '../constants';
import { plannerLinkHint } from '../readableText';
import { cleanAdviceText, getAdviceText, getMultiLinks, isMapPoiGygOnlyLocation } from '../utils';
import { shouldShowFerryCard } from '../../../../../utils/ferryBookingMatch';

const ToolkitCard = ({
    icon,
    title,
    type,
    data,
    isSponsored,
    isOfficial,
    location,
    essentialGuide,
    themeColor = 'gray',
    className = ''
}) => {
    const Icon = icon;
    const theme = THEME_COLORS[themeColor] || THEME_COLORS.gray || THEME_COLORS.default;

    const links = getMultiLinks({ type, data, location, essentialGuide });
    const ferryAdviceText = cleanAdviceText(getAdviceText(data));
    const ferryHasSsot = type === 'ferry_booking' && shouldShowFerryCard(location?.slug);
    const showFerryAdviceBlock = ferryAdviceText || !ferryHasSsot;
    const isGygFallbackLocation = type === 'map_poi' && isMapPoiGygOnlyLocation(location);
    const klookTourQuery = encodeURIComponent(`${location?.name || location?.country || ''} 투어`);
    const klookTourTargetUrl = `https://www.klook.com/ko/search/result/?query=${klookTourQuery}`;
    const klookTourDeepLink = getKlookAffiliateUrl(klookTourTargetUrl);
    const klookCarBannerSearchUrl = getKlookRentalUrlByLocation(location, { essentialGuide });

    return (
        <div className={`${theme.bg} border ${theme.border} rounded-2xl p-5 shadow-sm hover:shadow-md ${theme.hover} transition-all flex flex-col h-full relative group ${className}`.trim()}>
            {/* Label */}
            <div className="absolute top-4 right-4 flex gap-1">
                {isOfficial && (
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                        Official
                    </span>
                )}
                {isSponsored && (
                    <span className="bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fuchsia-100 uppercase tracking-wider group-hover:bg-fuchsia-100 transition-colors" title="파트너사 제휴 링크로, 사이트 운영에 도움이 됩니다.">
                        Sponsored
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2.5 mb-3">
                <div className={`p-2.5 ${theme.icon} rounded-xl`}>
                    <Icon size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-base">{title}</h3>
            </div>

            {showFerryAdviceBlock && (
                <p className="text-sm text-gray-700 leading-[1.7] mb-5 flex-1 select-text break-keep">
                    <CopyableText text={ferryAdviceText} locationName={location?.name} type={type} />
                </p>
            )}

            {links.length > 0 && (
                <div className="mt-auto grid grid-cols-2 gap-2">
                    {links.map((link, idx) => {
                        const isColSpan2 = links.length === 1 || link.isBanner;
                        if (link.isMrt) {
                            return (
                                <MrtDynamicLink
                                    key={idx}
                                    mrtQuery={link.mrtQuery}
                                    text={link.text}
                                    colorClass={link.colorClass}
                                    isColSpan2={isColSpan2}
                                />
                            );
                        }
                        if (link.isBanner && link.bannerSrc) {
                            return (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full overflow-hidden rounded-xl transition-transform hover:scale-[1.02] border border-gray-200 shadow-sm col-span-2`}
                                >
                                    {link.bannerSrcMobile ? (
                                        <picture>
                                            <source media="(min-width: 768px)" srcSet={link.bannerSrc} />
                                            <img src={link.bannerSrcMobile} alt={link.text} className="w-full h-auto" />
                                        </picture>
                                    ) : (
                                        <img src={link.bannerSrc} alt={link.text} className="w-full h-auto object-cover" />
                                    )}
                                </a>
                            );
                        }
                        return (
                            <a
                                key={idx}
                                href={link.url}
                                target={isMobileDevice() ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                className={`flex ${link.subtext ? 'flex-col gap-0.5 py-2' : 'flex-row items-center gap-1 py-3'} justify-center w-full px-1 min-h-[44px] rounded-xl transition-colors border overflow-hidden ${link.colorClass} ${isColSpan2 ? 'col-span-2' : ''}`}
                                aria-label={link.subtext ? `${link.text}. ${link.subtext}` : `${link.text}에서 검색하기`}
                            >
                                <span className={`flex items-center justify-center gap-1 min-w-0 text-[11px] md:text-xs font-semibold ${link.subtext ? '' : 'w-full'}`}>
                                    <span className="truncate max-w-[85%]">{link.text}</span>
                                    <ExternalLink size={12} className="shrink-0" />
                                </span>
                                {link.subtext && (
                                    <span className={`${plannerLinkHint} text-center px-0.5`}>
                                        {link.subtext}
                                    </span>
                                )}
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Trip.com 제휴 + OTA 미지원 지역 공식 예약 링크 */}
            {type === 'flight' && (
                <div id="planner-prep-flight-booking" className="scroll-mt-24">
                    <FlightOfficialBookingWidget location={location} />
                    <WhiteLabelWidget
                        location={location}
                        essentialGuide={essentialGuide}
                        customTrigger={
                            <FlightSearchCta location={location} essentialGuide={essentialGuide} />
                        }
                    />
                </div>
            )}
            {/* 🆕 [Phase 8-8] Direct Ferries 페리 예약 위젯 (2026.04.21) */}
            {type === 'ferry_booking' && (
                <FerryBookingWidget location={location} aiFerryData={data} />
            )}
            {type === 'airport_transfer' && (
                <KlookCarBannerWidget targetUrl={klookCarBannerSearchUrl} />
            )}
            {type === 'map_poi' && (
                isGygFallbackLocation
                    ? <GetYourGuideCityWidget location={location} />
                    : <KlookTourBannerWidget targetUrl={klookTourDeepLink} />
            )}
        </div>
    );
};

export default ToolkitCard;
