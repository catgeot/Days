/** transport 등 — DB 본문에 [@…@] 없을 때 클릭→구글 검색 스마트 링크로 치환 */
const NAVIGO_SEMAINE_PLAIN_RE = /나비고\s*주간권\s*\(\s*Navigo\s+Semaine\s*\)/gi;

export function normalizePlannerSmartLinkPhrases(text, type) {
    if (typeof text !== 'string' || !text) return text;
    if (type !== 'transport') return text;
    return text.replace(NAVIGO_SEMAINE_PLAIN_RE, '[@나비고 주간권 Navigo Semaine@]');
}
