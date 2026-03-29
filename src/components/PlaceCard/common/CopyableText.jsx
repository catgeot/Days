import React from 'react';

export const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const renderWithLineBreaks = (text) => {
    if (typeof text !== 'string') return text;
    return text.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
            {line === '' ? <span className="block h-3 md:h-4" aria-hidden="true" /> : line}
            {i !== arr.length - 1 && line !== '' && <br />}
        </React.Fragment>
    ));
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
        <span className="inline align-middle">
            {koreanName && <span className="font-bold mr-0.5">{koreanName}</span>}
            <button
                onClick={handleSmartLink}
                className={`inline-flex items-center gap-0.5 font-bold ${type === 'wiki' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-500 hover:text-blue-700'} transition-colors focus:outline-none bg-black/5 hover:bg-black/10 px-1 rounded-md whitespace-nowrap`}
                title={isMapSearch ? "구글 맵에서 검색하기" : "구글 웹에서 검색하기"}
            >
                ({word})
            </button>
        </span>
    );
};

const CopyableText = ({ text, locationName, type }) => {
    if (!text) return <span>관련 정보를 불러올 수 없습니다.</span>;

    // 잘못된 따옴표 위치 교정 전처리 (예: '우유니 소금사막(Salar de Uyuni)' -> 우유니 소금사막('Salar de Uyuni'))
    let normalizedText = text.replace(/['"‘’“”]([가-힣a-zA-Z0-9\s]+?)\((.+?)\)['"‘’“”]/g, "$1('$2')");
    // 조사 등 띄어쓰기 없이 붙은 따옴표 예외 처리
    normalizedText = normalizedText.replace(/([가-힣a-zA-Z0-9\s]+?)\(['"‘’“”](.+?)['"‘’“”]\)/g, "$1('$2')");

    // 개선된 정규식: 한글명 부분에 조사나 약간의 공백/줄바꿈이 섞이더라도 유연하게 잡아내기 위함.
    // 기존: /([^(\s]+(?:\s[^(\s]+)?)\('(.+?)'\)/g
    // 변경: 괄호 앞의 텍스트 덩어리를 더 여유롭게 잡음 (최대 3단어 정도)
    const regex = /([가-힣a-zA-Z0-9]+(?:\s[가-힣a-zA-Z0-9]+){0,2})\('(.+?)'\)/g;
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
