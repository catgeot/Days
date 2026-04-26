/**
 * AI가 생성한 마크다운 정보에서 위키 본문을 추출합니다.
 * 기존에는 툴킷 데이터도 파싱했으나, 현재 툴킷은 essential_guide JSON을 직접 참조하므로 하위 호환성만 유지합니다.
 * @param {string} markdown - DB에서 불러온 `ai_practical_info` (원본 마크다운 문자열)
 * @returns {Object} { wikiContent, toolkitData }
 */

export const parseAiPracticalInfo = (markdown) => {
    if (!markdown || markdown === '[[LOADING]]') {
        return { wikiContent: null, toolkitData: null };
    }

    // 약간의 띄어쓰기 변형도 허용하는 정규식 기반 토큰 찾기
    const startRegex = /---\s*\[TOOLKIT_START\]\s*---/;
    const endRegex = /---\s*\[TOOLKIT_END\]\s*---/;

    const startMatch = markdown.match(startRegex);
    const endMatch = markdown.match(endRegex);

    // 툴킷 파싱용 구분자가 없거나 신규 버전(위키만 있음)인 경우 전체를 위키로 반환
    if (!startMatch || !endMatch) {
        return { wikiContent: markdown.trim(), toolkitData: null };
    }

    const startIndex = startMatch.index;
    const endIndex = endMatch.index;

    // 구분자 이전 텍스트만 위키 본문으로
    const wikiContent = markdown.substring(0, startIndex).trim();

    // (하위 호환성) 구버전 데이터의 툴킷 추출
    const toolkitSection = markdown.substring(startIndex + startMatch[0].length, endIndex).trim();
    const toolkitData = {};
    const lines = toolkitSection.split('\n');

    lines.forEach(line => {
        const match = line.match(/\[([a-zA-Z_]+)\]:\s*(.*)/);
        if (match) {
            const key = match[1].trim();
            let content = match[2].trim();
            let official_url = null;

            if (content.includes('| URL:')) {
                const parts = content.split('| URL:');
                content = parts[0].trim();
                const urlStr = parts[1].trim();
                if (urlStr !== 'null' && urlStr !== '') {
                    official_url = urlStr;
                }
            }

            content = content
                .replace(/^\*\*\s*/, '')
                .replace(/^(Advice|Tip|Note):\s*/i, '')
                .replace(/^[-•*]\s+/, '')
                .replace(/\s+/g, ' ')
                .trim();

            toolkitData[key] = { advice: content, official_url };
        }
    });

    return { wikiContent, toolkitData };
};
