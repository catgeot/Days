/** 「세부 일정·내용·사항」 등 — 필리핀 세부(Cebu) 지명이 아닌 일반어 「세부」 */
export function isCebuGenericDetailUsage(haystack) {
  const h = String(haystack ?? '');
  if (/세부\s*(?:일정|내용|사항|계획|안|설명|항목|정보|내역|스케줄|리스트)/u.test(h)) {
    return true;
  }
  if (/(?:시간별|일별|주별|코스별|동선별|일정별|분(?:별|당)|시(?:간|점)별)\s+세부/u.test(h)) {
    return true;
  }
  return false;
}
