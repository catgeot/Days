import React, { useState, useEffect } from 'react';
import { generateMrtLink } from '../../../../../utils/affiliate';

const MrtTimelineAction = ({ mrtQuery, label, icon, colorClass, customTrigger }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchLink = async () => {
            const link = await generateMrtLink(mrtQuery);
            if (isMounted) setUrl(link);
        };
        fetchLink();
        return () => { isMounted = false; };
    }, [mrtQuery]);

    // customTrigger가 있으면 그것을 사용
    if (customTrigger) {
        return (
            <a href={url || '#'} target="_blank" rel="noopener noreferrer"
               onClick={(e) => { if (!url) e.preventDefault(); }}
               className={!url ? 'opacity-50 cursor-wait' : ''}>
                {customTrigger}
            </a>
        );
    }

    // 기본 버튼
    return (
        <a href={url || '#'} target="_blank" rel="noopener noreferrer"
           onClick={(e) => { if (!url) e.preventDefault(); }}
           className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors border border-transparent hover:border-current ${colorClass} ${!url ? 'opacity-50 cursor-wait' : ''}`}>
            {icon}
            {label}
        </a>
    );
};

export default MrtTimelineAction;
