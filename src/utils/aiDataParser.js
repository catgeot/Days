/**
 * AI가 생성한 마크다운 정보에서 위키 본문과 스마트 툴킷 데이터를 분리합니다.
 * 🆕 [Phase 7-2] 콘솔 로그 최적화: 경고 중복 제거, Production 필터링 적용
 * @param {string} markdown - DB에서 불러온 `ai_practical_info` (원본 마크다운 문자열)
 * @returns {Object} { wikiContent, toolkitData }
 */

// 🆕 [Phase 7-2] 경고 중복 방지를 위한 캐시
const warningCache = new Set();
const isDev = import.meta.env.DEV;

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
        // 🆕 [Phase 7-2] 경고 중복 제거: 동일한 마크다운에 대해 한 번만 경고
        const cacheKey = markdown.substring(0, 50) || 'empty';
        if (!warningCache.has(cacheKey)) {
            console.warn("[aiDataParser] 툴킷 구분자 없음 - Fallback 모드 (구버전 데이터)");
            warningCache.add(cacheKey);

            // 🆕 [Phase 7-2] 상세 정보는 개발 환경에서만
            if (isDev) {
                console.warn("[aiDataParser] 상세:", {
                    startMatch: !!startMatch,
                    endMatch: !!endMatch,
                    preview: markdown.substring(0, 100) + '...'
                });
            }
        }
        return { wikiContent: markdown.trim(), toolkitData: null };
    }

    // 성공 로그 제거 (과도한 반복 방지)

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

            // 🆕 [Phase 7-2] 마크다운 잔재 정리 강화
            content = content
                .replace(/^\*\*\s*/, '')                    // 볼드 기호
                .replace(/^(Advice|Tip|Note):\s*/i, '')     // 메타 접두사
                .replace(/^[-•*]\s+/, '')                   // 리스트 기호
                .replace(/\s+/g, ' ')                       // 연속 공백 정리
                .trim();

            toolkitData[key] = { advice: content, official_url };
            parsedCount++;
        }
    });

    // 파싱 완료 로그 제거 (과도한 반복 방지)

    // 🆕 [Phase 7-2] 에러는 항상 출력 (Production 포함)
    if (parsedCount === 0) {
        console.error("[aiDataParser] 툴킷 섹션 파싱 실패 - AI 출력 형식 확인 필요");
        if (isDev) {
            console.error("[aiDataParser] 툴킷 섹션 내용:\n", toolkitSection);
        }
    }

    return { wikiContent, toolkitData };
};
