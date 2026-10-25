import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import CopyableText from '../../../common/CopyableText';
import { AiGeneratedBanner, PlaceLocalInfoInline } from '../../../common/PlaceVerifiedFacts';
import { resolveVerifiedFacts } from '../../../../../data/placeVerifiedFacts/index.js';
import { plannerSlotForToolkit } from '../../../../../data/placeVerifiedFacts/localInfoLayout.js';
import { isMobileDevice } from '../../../common/device';
import FlightOfficialBookingWidget from './FlightOfficialBookingWidget';
import TripcomFlightBannerWidget from './TripcomFlightBannerWidget';
import {
    GYG_PLANNER_ACTIVITIES_ITEM_COUNT,
    getKlookAffiliateUrl,
    getKlookRentalUrlByLocation,
} from '../../../../../utils/affiliate';
import MrtDynamicLink from './MrtDynamicLink';
import FerryBookingWidget from './FerryBookingWidget';
import KlookCarBannerWidget from './KlookCarBannerWidget';
import KlookTourBannerWidget from './KlookTourBannerWidget';
import GetYourGuideActivitiesWidget from './GetYourGuideActivitiesWidget';
import MrtTnaActivitiesWidget from './MrtTnaActivitiesWidget';
import { THEME_COLORS } from '../constants';
import { plannerLinkHint } from '../readableText';
import { cleanAdviceText, getAdviceText, getMultiLinks } from '../utils';
import { replaceEtiasClaims } from '../etiasNotice';
import { buildGygActivitiesSearchQuery } from '../locationRules';
import { shouldShowFerryCard } from '../../../../../utils/ferryBookingMatch';
import { canShowMrtTnaStrip } from '../../../../../utils/mrtTnaQuery';
import { MRT_TNA_PLANNER_SIZE } from '../../../../../utils/fetchMrtTnas';
import ToolkitFreshnessBadge from './ToolkitFreshnessBadge.jsx';
import ToolkitReportSheet from './ToolkitReportSheet.jsx';
import { resolveToolkitSectionCheckedIso } from '../../../../../data/toolkitFreshness/policy.js';

const ToolkitCard = ({
    icon,
    title,
    type,
    data,
    isSponsored,
    isOfficial,
    location,
    essentialGuide,
    eventTripWindow,
    themeColor = 'gray',
    className = '',
    toolkitFreshnessEnabled = false,
    sectionMeta = null,
    toolkitUpdatedAt = null,
    placeId = null,
}) => {
    const { t, i18n } = useTranslation();
    const [reportOpen, setReportOpen] = useState(false);
    const Icon = icon;
    const theme = THEME_COLORS[themeColor] || THEME_COLORS.gray || THEME_COLORS.default;

    const links = getMultiLinks({ type, data, location, essentialGuide });
    const cleanedAdviceText = cleanAdviceText(getAdviceText(data));
    // 비자 카드: 저장된 AI 문구의 ETIAS 날짜 주장을 EU 공식 확인 문구로 대체
    const ferryAdviceText =
        type === 'visa' ? replaceEtiasClaims(cleanedAdviceText, i18n?.language) : cleanedAdviceText;
    const ferryHasSsot = type === 'ferry_booking' && shouldShowFerryCard(location?.slug);
    const verifiedPlannerFirst = Boolean(plannerSlotForToolkit(resolveVerifiedFacts(location), type));
    const showAdviceBlock = !verifiedPlannerFirst && (ferryAdviceText || !ferryHasSsot);
    const useMrtTna = type === 'map_poi' && canShowMrtTnaStrip(location);
    const gygActivitiesQuery =
        type === 'map_poi' && !useMrtTna ? buildGygActivitiesSearchQuery(location) : null;
    const klookTourQuery = encodeURIComponent(`${location?.name || location?.country || ''} 투어`);
    const klookTourTargetUrl = `https://www.klook.com/ko/search/result/?query=${klookTourQuery}`;
    const klookTourDeepLink = getKlookAffiliateUrl(klookTourTargetUrl);
    const klookCarBannerSearchUrl = getKlookRentalUrlByLocation(location, { essentialGuide });
    const mapPoiWidgetKey =
        location?.slug || gygActivitiesQuery || (useMrtTna ? 'mrt-tna' : 'map-poi-tour');

    const checkedIso = toolkitFreshnessEnabled
        ? resolveToolkitSectionCheckedIso(type, sectionMeta?.[type], toolkitUpdatedAt)
        : null;
    const sourceUrls = toolkitFreshnessEnabled ? sectionMeta?.[type]?.source_urls : null;

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
                    <span className="bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fuchsia-100 tracking-wider group-hover:bg-fuchsia-100 transition-colors" title={t('place.planner.toolkit.sponsoredTitle')}>
                        {t('place.planner.toolkit.sponsored')}
                    </span>
                )}
            </div>

            {toolkitFreshnessEnabled ? (
                <div className="flex items-start justify-between gap-2 mb-3 pr-16">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2.5 ${theme.icon} rounded-xl shrink-0`}>
                            <Icon size={20} />
                        </div>
                        <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                    </div>
                    {checkedIso ? (
                        <ToolkitFreshnessBadge section={type} checkedIso={checkedIso} className="mt-0.5" />
                    ) : null}
                </div>
            ) : (
                <div className="flex items-center gap-2.5 mb-3">
                    <div className={`p-2.5 ${theme.icon} rounded-xl`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base">{title}</h3>
                </div>
            )}

            {verifiedPlannerFirst ? (
                <PlaceLocalInfoInline
                    location={location}
                    toolkitType={type}
                    presentation="planner"
                    defaultOpen
                    className="mb-4"
                />
            ) : null}

            {showAdviceBlock && (
                <div className="mb-5 flex-1">
                    {resolveVerifiedFacts(location) && ferryAdviceText ? <AiGeneratedBanner light /> : null}
                    <p className="text-sm text-gray-700 leading-[1.7] select-text break-keep">
                        <CopyableText text={ferryAdviceText} locationName={location?.name || location?.name_en || location?.slug} type={type} />
                    </p>
                </div>
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
                                    checkIn={eventTripWindow?.checkIn}
                                    checkOut={eventTripWindow?.checkOut}
                                    isDomestic={
                                        location?.country === '대한민국' ||
                                        location?.country_en === 'South Korea'
                                    }
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
                                aria-label={link.subtext ? `${link.text}. ${link.subtext}` : t('place.planner.searchOn', { label: link.text })}
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
                    <TripcomFlightBannerWidget
                        location={location}
                        essentialGuide={essentialGuide}
                        departDate={eventTripWindow?.departDate}
                        returnDate={eventTripWindow?.returnDate}
                        className="mt-3"
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
                useMrtTna
                    ? (
                        <MrtTnaActivitiesWidget
                            key={mapPoiWidgetKey}
                            location={location}
                            variant="planner"
                            itemCount={MRT_TNA_PLANNER_SIZE}
                            showMoreLink
                            linkSponsoredLabel
                        />
                    )
                    : gygActivitiesQuery
                        ? (
                            <GetYourGuideActivitiesWidget
                                key={mapPoiWidgetKey}
                                location={location}
                                query={gygActivitiesQuery}
                                itemCount={GYG_PLANNER_ACTIVITIES_ITEM_COUNT}
                                showMoreLink
                                linkSponsoredLabel
                            />
                        )
                        : <KlookTourBannerWidget key={mapPoiWidgetKey} targetUrl={klookTourDeepLink} />
            )}
            {verifiedPlannerFirst ? null : (
                <PlaceLocalInfoInline
                    location={location}
                    toolkitType={type}
                    presentation="planner"
                    className="mt-4"
                />
            )}
            {toolkitFreshnessEnabled && Array.isArray(sourceUrls) && sourceUrls.length > 0 ? (
                <p className="mt-3 text-[11px] text-gray-500 leading-snug" data-toolkit-section-sources="">
                    {t('place.planner.toolkitFreshness.sources', {
                        list: sourceUrls.filter(Boolean).join(' · '),
                    })}
                </p>
            ) : null}
            {toolkitFreshnessEnabled && placeId ? (
                <>
                    <button
                        type="button"
                        data-toolkit-report-trigger=""
                        data-toolkit-section={type}
                        onClick={() => setReportOpen(true)}
                        className="mt-3 self-start text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        {t('place.planner.toolkitFreshness.reportCta')}
                    </button>
                    <ToolkitReportSheet
                        open={reportOpen}
                        onClose={() => setReportOpen(false)}
                        placeId={placeId}
                        section={type}
                        sectionTitle={title}
                    />
                </>
            ) : null}
        </div>
    );
};

export default ToolkitCard;
