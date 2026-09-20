import React from 'react';
import { getMrtAccommodationSearchUrl, getMrtSearchUrl } from '../../../../../utils/affiliate';

const MrtTimelineAction = ({
    mrtQuery,
    label,
    icon,
    colorClass,
    customTrigger,
    checkIn,
    checkOut,
    isDomestic,
}) => {
    const url =
        checkIn && checkOut
            ? getMrtAccommodationSearchUrl(mrtQuery, {
                  isDomestic: Boolean(isDomestic),
                  checkIn,
                  checkOut,
              })
            : getMrtSearchUrl(mrtQuery);

    // customTrigger가 있으면 그것을 사용
    if (customTrigger) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer">
                {customTrigger}
            </a>
        );
    }

    // 기본 버튼
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors border border-transparent hover:border-current ${colorClass}`}
        >
            {icon}
            {label}
        </a>
    );
};

export default MrtTimelineAction;
