import React from 'react';

export const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const CopyableWord = ({ word, koreanName, locationName, type }) => {
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
        <span className="inline-flex items-center whitespace-nowrap">
            {koreanName && <span className="font-bold mr-0.5">{koreanName}</span>}
            <button
                onClick={handleSmartLink}
                className={`inline-flex items-center gap-0.5 font-bold ${type === 'wiki' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-500 hover:text-blue-700'} transition-colors focus:outline-none bg-black/5 hover:bg-black/10 px-1 rounded-md`}
                title={isMapSearch ? "구글 맵에서 검색하기" : "구글 웹에서 검색하기"}
            >
                ({word})
            </button>
        </span>
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
                koreanName={koreanName}
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
                        return <CopyableWord key={i} word={word} koreanName="" locationName={locationName} type={type} />;
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
