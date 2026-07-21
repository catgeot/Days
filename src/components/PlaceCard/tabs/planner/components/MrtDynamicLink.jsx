import React from 'react';
import { ExternalLink } from 'lucide-react';
import { getMrtAccommodationSearchUrl } from '../../../../../utils/affiliate';
import { isMobileDevice } from '../../../common/device';

const MrtDynamicLink = ({ mrtQuery, text, colorClass, isColSpan2 }) => {
    const url = getMrtAccommodationSearchUrl(mrtQuery);

    return (
        <a
            href={url}
            target={isMobileDevice() ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-1 w-full py-3 px-1 min-h-[44px] rounded-xl text-[11px] md:text-xs font-semibold transition-colors border overflow-hidden ${colorClass} ${isColSpan2 ? 'col-span-2' : ''}`}
            aria-label={`${text} 검색`}
        >
            <span className="truncate max-w-[85%]">{text}</span>
            <ExternalLink size={12} className="shrink-0" />
        </a>
    );
};

export default MrtDynamicLink;
