/**
 * AI가 생성한 마크다운 정보에서 위키 본문과 스마트 툴킷 데이터를 분리합니다.
 * @param {string} markdown - DB에서 불러온 `ai_practical_info` (원본 마크다운 문자열)
 * @returns {Object} { wikiContent, toolkitData }
 */
export const parseAiPracticalInfo = (markdown) => {
    if (!markdown || markdown === '[[LOADING]]') {
        return { wikiContent: null, toolkitData: null };
    }

    const startToken = '---[TOOLKIT_START]---';
    const endToken = '---[TOOLKIT_END]---';

    const startIndex = markdown.indexOf(startToken);
    const endIndex = markdown.indexOf(endToken);

    // 툴킷 파싱용 구분자가 없는 구버전 데이터거나 오류인 경우, 원본을 그대로 위키로 반환
    if (startIndex === -1 || endIndex === -1) {
        return { wikiContent: markdown.trim(), toolkitData: null };
    }

    const wikiContent = markdown.substring(0, startIndex).trim();
    const toolkitSection = markdown.substring(startIndex + startToken.length, endIndex).trim();

    const toolkitData = {};
    const lines = toolkitSection.split('\n');

    lines.forEach(line => {
        // Match example: `* **[map_poi]**: 내용...` or `[map_poi]: 내용...`
        // We will make it resilient to list formatting like `* ` or `- ` or `**`
        const match = line.match(/\[([a-zA-Z_]+)\]:\s*(.*)/);
        if (match) {
            const key = match[1].trim();
            let content = match[2].trim();
            let official_url = null;

            // URL 파싱 (예: ... | URL: https://...)
            if (content.includes('| URL:')) {
                const parts = content.split('| URL:');
                content = parts[0].trim();
                const urlStr = parts[1].trim();
                if (urlStr !== 'null' && urlStr !== '') {
                    official_url = urlStr;
                }
            } else if (content.includes('[URL:')) {
                 const urlMatch = content.match(/\[URL:\s*(.*?)\]/i);
                 if (urlMatch) {
                     official_url = urlMatch[1].trim();
                     if (official_url === 'null') official_url = null;
                     content = content.replace(urlMatch[0], '').trim();
                 }
            }

            // 마크다운 잔재(** 등) 정리
            content = content.replace(/^\*\*\s*/, '').trim();

            toolkitData[key] = { advice: content, official_url };
        }
    });

    return { wikiContent, toolkitData };
};
