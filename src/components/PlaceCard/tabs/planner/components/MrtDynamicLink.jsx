import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { generateMrtLink } from '../../../../../utils/affiliate';
import { isMobileDevice } from '../../../common/device';

const MrtDynamicLink = ({ mrtQuery, text, colorClass, isColSpan2 }) => {
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchLink = async () => {
            setLoading(true);
            const link = await generateMrtLink(mrtQuery);
            if (isMounted) {
                setUrl(link);
                setLoading(false);
            }
        };
        fetchLink();
        return () => { isMounted = false; };
    }, [mrtQuery]);

    return (
        <a
            href={url || '#'}
            target={isMobileDevice() ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onClick={(e) => {
                if (loading || !url) e.preventDefault();
            }}
            className={`flex items-center justify-center gap-1 w-full py-3 px-1 min-h-[44px] rounded-xl text-[11px] md:text-xs font-semibold transition-colors border overflow-hidden ${colorClass} ${isColSpan2 ? 'col-span-2' : ''} ${loading ? 'opacity-70 cursor-wait' : ''}`}
            aria-label={`${text} 검색`}
        >
            <span className="truncate max-w-[85%]">{loading ? '제휴 링크 생성 중...' : text}</span>
            {!loading && <ExternalLink size={12} className="shrink-0" />}
            {loading && <Loader2 size={12} className="shrink-0 animate-spin" />}
        </a>
    );
};

export default MrtDynamicLink;
