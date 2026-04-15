import React from 'react';
import { ExternalLink } from 'lucide-react';
import CopyableText, { isMobileDevice } from '../../../common/CopyableText';
import WhiteLabelWidget from '../../../common/WhiteLabelWidget';
import MrtDynamicLink from './MrtDynamicLink';
import HotelWidget from './HotelWidget';
import { THEME_COLORS } from '../constants';
import { cleanAdviceText, getAdviceText, getMultiLinks } from '../utils';

const ToolkitCard = ({ icon: Icon, title, type, data, isSponsored, isOfficial, location, themeColor = 'gray' }) => {
    const theme = THEME_COLORS[themeColor] || THEME_COLORS.gray || THEME_COLORS.default;

    const links = getMultiLinks({ type, data, location });

    return (
        <div className={`${theme.bg} border ${theme.border} rounded-2xl p-5 shadow-sm hover:shadow-md ${theme.hover} transition-all flex flex-col h-full relative group`}>
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

            <p className="text-sm text-gray-700 leading-[1.7] mb-5 flex-1 select-text break-keep">
                <CopyableText text={cleanAdviceText(getAdviceText(data))} locationName={location?.name} type={type} />
            </p>

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
                                    <img src={link.bannerSrc} alt={link.text} className="w-full h-auto object-cover" />
                                </a>
                            );
                        }
                        return (
                            <a
                                key={idx}
                                href={link.url}
                                target={isMobileDevice() ? "_self" : "_blank"}
                                rel="noopener noreferrer"
                                className={`flex items-center justify-center gap-1 w-full py-3 px-1 min-h-[44px] rounded-xl text-[11px] md:text-xs font-semibold transition-colors border overflow-hidden ${link.colorClass} ${isColSpan2 ? 'col-span-2' : ''}`}
                                aria-label={`${link.text}에서 검색하기`}
                            >
                                <span className="truncate max-w-[85%]">{link.text}</span>
                                <ExternalLink size={12} className="shrink-0" />
                            </a>
                        );
                    })}
                </div>
            )}

            {/* Travelpayouts 화이트 라벨 위젯 (항공권 검색 전용) */}
            {type === 'flight' && (
                <WhiteLabelWidget locationName={location?.name} type="flight" />
            )}
            {/* 🆕 [Phase 8-4] TravelPayouts 숙소 전용 검색 위젯 */}
            {type === 'accommodation' && (
                <HotelWidget location={location} />
            )}
        </div>
    );
};

export default ToolkitCard;
