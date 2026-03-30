/**
 * AI가 생성한 마크다운 정보에서 위키 본문과 스마트 툴킷 데이터를 분리합니다.
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

    // 툴킷 파싱용 구분자가 없는 구버전 데이터거나 오류인 경우, 원본을 그대로 위키로 반환
    if (!startMatch || !endMatch) {
        console.warn("[aiDataParser] 툴킷 데이터 분리 구분자(---[TOOLKIT_START]---)를 찾을 수 없습니다. 원본 전체를 위키로 처리합니다.", {
            startMatch: !!startMatch,
            endMatch: !!endMatch,
            preview: markdown.substring(0, 100) + '...'
        });
        return { wikiContent: markdown.trim(), toolkitData: null };
    }

    console.log("[aiDataParser] 툴킷 구분자 매칭 성공, 파싱 시작...");
    const startIndex = startMatch.index;
    const endIndex = endMatch.index;

    const wikiContent = markdown.substring(0, startIndex).trim();
    const toolkitSection = markdown.substring(startIndex + startMatch[0].length, endIndex).trim();

    const toolkitData = {};
    const lines = toolkitSection.split('\n');
    let parsedCount = 0;

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

            // 불필요한 메타 접두사 제거 방어 로직 (Advice:, Tip:, Note: 등)
            content = content.replace(/^(Advice|Tip|Note):\s*/i, '').trim();

            toolkitData[key] = { advice: content, official_url };
            parsedCount++;
        }
    });

    console.log(`[aiDataParser] 툴킷 파싱 완료. (${parsedCount}개 항목 성공)`, toolkitData);

    // 만약 파싱된 개수가 0개라면, 정규식에 걸리지 않은 포맷 불량임
    if (parsedCount === 0) {
        console.error("[aiDataParser] 툴킷 섹션 내에서 파싱된 항목이 없습니다. AI 출력 형식을 확인하세요:\n", toolkitSection);
    }

    return { wikiContent, toolkitData };
};
