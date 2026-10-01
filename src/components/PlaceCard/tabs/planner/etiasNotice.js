// ETIAS 현황 — EU 공식 사이트 확인 문구 (2026-10-02 확인)
// 출처: https://travel-europe.europa.eu/etias_en
// 「ETIAS is currently not in operation and no applications for travel authorisations are collected at this point.
//  The European Union will inform about the specific date for the start of ETIAS several months prior to its launch.」
// 저장된 AI 툴킷(place_toolkit.essential_guide*)에 남은 「2025년 중반 의무화 예정」류 날짜 주장을 화면에서 대체한다.

export const ETIAS_OFFICIAL_URL = 'https://travel-europe.europa.eu/etias_en';

export const ETIAS_STATUS_TEXT_KO =
    '- ETIAS(유럽 전자여행허가)는 아직 시행 전이며 현재 신청을 받지 않습니다. 시작일은 EU가 시행 몇 달 전에 공지합니다. (EU 공식 사이트 travel-europe.europa.eu, 2026-10-02 확인)';

export const ETIAS_STATUS_TEXT_EN =
    '- ETIAS (EU travel authorisation) is not yet in operation and no applications are being collected. The EU will announce the start date several months before launch. (Official EU site travel-europe.europa.eu, checked 2026-10-02)';

const ETIAS_RE = /etias/i;

/**
 * 비자 advice 텍스트에서 ETIAS를 언급하는 줄을 모두 지우고, 공식 확인 문구 1줄로 대체한다.
 * ETIAS 언급이 없으면 원문 그대로 반환.
 */
export function replaceEtiasClaims(text, locale = 'ko') {
    if (!text || typeof text !== 'string' || !ETIAS_RE.test(text)) return text;
    const statusLine = String(locale).toLowerCase().startsWith('en') ? ETIAS_STATUS_TEXT_EN : ETIAS_STATUS_TEXT_KO;
    const lines = text.split('\n');
    const out = [];
    let inserted = false;
    for (const line of lines) {
        if (ETIAS_RE.test(line)) {
            if (!inserted) {
                out.push(statusLine);
                inserted = true;
            }
            continue;
        }
        out.push(line);
    }
    return out.join('\n');
}
