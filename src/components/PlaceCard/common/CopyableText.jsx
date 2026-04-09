import React from 'react';

export const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const renderMarkdownInline = (text) => {
    if (!text.includes('**')) return text;

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return part;
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

const CopyableText = ({ text, locationName, type }) => {
    if (!text) return <span>관련 정보를 불러올 수 없습니다.</span>;

    // [하위 호환성 유지] 기존의 '우유니 소금사막(Salar de Uyuni)' 등 잘못된 따옴표 위치 교정 전처리
    let normalizedText = text.replace(/['"‘’“”]([가-힣a-zA-Z0-9\s]+?)\((.+?)\)['"‘’“”]/g, "$1('$2')");
    normalizedText = normalizedText.replace(/([가-힣a-zA-Z0-9\s]+?)\(['"‘’“”](.+?)['"‘’“”]\)/g, "$1('$2')");

    // [신규 로직 및 하위 호환]
    // 한글명[@영문명@] 방식과 기존의 한글명('영문명') 방식을 모두 파싱하는 하이브리드 정규식
    // 매칭 그룹 1: 한글명 (공백 포함 최대 3단어, 없을 수도 있음)
    // 매칭 그룹 2: [@ @] 사이의 영문명
    // 매칭 그룹 3: (' ') 사이의 영문명
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

    return (
        <span className="select-text break-keep">
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    {typeof part === 'string' ? renderWithLineBreaks(part) : part}
                </React.Fragment>
            ))}
        </span>
    );
};

export default CopyableText;
