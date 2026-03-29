import React from 'react';
import { Search } from 'lucide-react';

export const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const CopyableWord = ({ word, displayText, locationName, type }) => {
    const handleSmartLink = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const searchTarget = word;
        const isMapSearch = ['map_poi', 'accommodation', 'transport'].includes(type);

        let queryStr = searchTarget;

        if (['apps', 'connectivity'].includes(type)) {
            queryStr = searchTarget;
        } else if (locationName) {
            queryStr = isMapSearch ? `${searchTarget}, ${locationName}` : `${searchTarget} ${locationName}`;
        }

        const query = encodeURIComponent(queryStr);

        const url = isMapSearch
            ? `https://www.google.com/maps/search/?api=1&query=${query}`
            : `https://www.google.com/search?q=${query}`;

        window.open(url, isMobileDevice() ? '_self' : '_blank');
    };

    const isMapSearch = ['map_poi', 'accommodation', 'transport'].includes(type);

    return (
        <button
            onClick={handleSmartLink}
            className="inline-flex items-center gap-0.5 mx-0.5 font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-2 whitespace-nowrap transition-colors focus:outline-none"
            title={isMapSearch ? "구글 맵에서 검색하기" : "구글 웹에서 검색하기"}
        >
            {displayText || word}
            <Search size={10} className="opacity-70" />
        </button>
    );
};

const CopyableText = ({ text, locationName, type }) => {
    if (!text) return <span>관련 정보를 불러올 수 없습니다.</span>;

    let normalizedText = text.replace(/['"‘’“”]([^(\s]+(?:\s[^(\s]+)?)\((.+?)\)['"‘’“”]/g, "$1('$2')");
    normalizedText = normalizedText.replace(/([^(\s]+(?:\s[^(\s]+)?)\(['"‘’“”](.+?)['"‘’“”]\)/g, "$1('$2')");

    const regex = /([^(\s]+(?:\s[^(\s]+)?)\('(.+?)'\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalizedText)) !== null) {
        if (match.index > lastIndex) {
            parts.push(normalizedText.substring(lastIndex, match.index));
        }

        const koreanName = match[1].trim();
        const englishName = match[2].trim();

        parts.push(
            <CopyableWord
                key={match.index}
                word={englishName}
                displayText={`${koreanName}(${englishName})`}
                locationName={locationName}
                type={type}
            />
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < normalizedText.length) {
        parts.push(normalizedText.substring(lastIndex));
    }

    if (parts.length === 1 && parts[0] === normalizedText) {
        const fallbackText = normalizedText.replace(/['"‘’“”]/g, "'");
        const fallbackParts = fallbackText.split(/('[^']+')/g);

        if (fallbackParts.length === 1) {
             return <span className="select-text break-keep">{fallbackParts[0]}</span>;
        }

        return (
            <span className="select-text break-keep">
                {fallbackParts.map((part, i) => {
                    if (part.startsWith("'") && part.endsWith("'")) {
                        const word = part.slice(1, -1);
                        return <CopyableWord key={i} word={word} displayText={word} locationName={locationName} type={type} />;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </span>
        );
    }

    return (
        <span className="select-text break-keep">
            {parts.map((part, i) => (
                <React.Fragment key={i}>{part}</React.Fragment>
            ))}
        </span>
    );
};

export default CopyableText;
