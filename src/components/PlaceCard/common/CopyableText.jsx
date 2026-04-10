import React from 'react';

export const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const renderMarkdownInline = (text) => {
    if (!text.includes('**')) return text;

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // 이 함수는 현재 사용되지 않으나 일관성을 위해 다크모드 대응을 추가 (기본적으로 위키에선 하얀색을 띄게 함)
            return <strong key={index} className="font-bold text-gray-900 dark:text-white">{parseSmartLinks(part.slice(2, -2))}</strong>;
        }
        return parseSmartLinks(part);
    });
};

const renderWithLineBreaks = (text) => {
    if (typeof text !== 'string') return text;
    return text.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
            {line === '' ? <span className="block h-3 md:h-4" aria-hidden="true" /> : (
                <span className={line.trim().startsWith('•') ? "pl-[10px] -indent-[10px] block my-0.5" : ""}>
                    {renderMarkdownInline(line)}
                </span>
            )}
            {i !== arr.length - 1 && line !== '' && <br />}
        </React.Fragment>
    ));
};

export const CopyableWord = ({ word, koreanName, locationName, type }) => {
    const handleSmartLink = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const searchTarget = word;

        // 검색어 구성: 위치 컨텍스트 포함으로 정확도 향상
        let queryStr = searchTarget;

        if (['apps', 'connectivity'].includes(type)) {
            // 앱이나 통신 관련은 검색어 그대로 사용
            queryStr = searchTarget;
        } else if (locationName) {
            // 지도 관련 타입은 쉼표로, 나머지는 공백으로 구분
            const isMapRelated = ['map_poi', 'accommodation', 'transport'].includes(type);
            queryStr = isMapRelated ? `${searchTarget}, ${locationName}` : `${searchTarget} ${locationName}`;
        }

        const query = encodeURIComponent(queryStr);

        // 모든 타입에서 구글 검색 사용 (통합)
        const url = `https://www.google.com/search?q=${query}`;

        window.open(url, isMobileDevice() ? '_self' : '_blank');
    };

    return (
        <span className="inline align-middle">
            {koreanName && <span className="font-bold mr-0.5">{koreanName}</span>}
            <button
                onClick={handleSmartLink}
                className={`inline-flex items-center gap-0.5 font-bold ${type === 'wiki' ? 'text-amber-400 hover:text-amber-300' : 'text-blue-500 hover:text-blue-700'} transition-colors focus:outline-none bg-black/5 hover:bg-black/10 px-1 rounded-md whitespace-nowrap`}
                title="구글에서 검색하기"
            >
                {word}
            </button>
        </span>
    );
};

// parseSmartLinks 함수: 문자열을 받아 스마트 링크를 파싱하여 배열(문자열/컴포넌트)로 반환
const parseSmartLinks = (text, locationName, type) => {
    if (typeof text !== 'string') return text;

    let normalizedText = text.replace(/['"‘’“”]([가-힣a-zA-Z0-9\s]+?)\((.+?)\)['"‘’“”]/g, "$1('$2')");
    normalizedText = normalizedText.replace(/([가-힣a-zA-Z0-9\s]+?)\(['"‘’“”](.+?)['"‘’“”]\)/g, "$1('$2')");

    const regex = /([가-힣a-zA-Z0-9]+(?:\s[가-힣a-zA-Z0-9]+){0,2})?(?:\[@([^@\]]+)@\]|\('([^']+)'\))/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(normalizedText)) !== null) {
        if (match.index > lastIndex) {
            parts.push(normalizedText.substring(lastIndex, match.index));
        }

        const koreanName = match[1] ? match[1].trim() : "";
        const englishName = (match[2] || match[3]) ? (match[2] || match[3]).trim() : "";

        parts.push(
            <CopyableWord
                key={`word-${match.index}`}
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

    return parts.length === 1 ? parts[0] : parts;
};

const CopyableText = ({ text, locationName, type }) => {
    if (!text) return <span>관련 정보를 불러올 수 없습니다.</span>;

    // 전체 텍스트를 줄바꿈 기준으로 먼저 분리하고, 각 줄에서 볼드체 파싱 -> 그 안에서 스마트 링크 파싱 수행
    return (
        <span className="select-text break-keep">
            {text.split('\n').map((line, i, arr) => {
                if (line === '') {
                    return (
                        <React.Fragment key={i}>
                            <span className="block h-3 md:h-4" aria-hidden="true" />
                            {i !== arr.length - 1 && <br />}
                        </React.Fragment>
                    );
                }

                // 1. 볼드체 파싱
                const lineParts = line.includes('**') ? line.split(/(\*\*.*?\*\*)/g) : [line];

                // 2. 각 파트 내에서 스마트 링크 파싱
                const renderedParts = lineParts.map((part, index) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const content = part.slice(2, -2);
                        const textColorClass = type === 'wiki' ? 'text-white' : 'text-gray-900';
                        return <strong key={index} className={`font-bold ${textColorClass}`}>{parseSmartLinks(content, locationName, type)}</strong>;
                    }
                    return <React.Fragment key={index}>{parseSmartLinks(part, locationName, type)}</React.Fragment>;
                });

                return (
                    <React.Fragment key={i}>
                        <span className={line.trim().startsWith('•') ? "pl-[10px] -indent-[10px] block my-0.5" : ""}>
                            {renderedParts}
                        </span>
                        {i !== arr.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

export default CopyableText;
