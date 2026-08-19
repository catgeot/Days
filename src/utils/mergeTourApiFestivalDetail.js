function hasText(value) {
  return String(value ?? '').trim().length > 0;
}

/**
 * EN 필드가 있으면 우선, 비면 KO 값 유지.
 * @param {Record<string, unknown> | null | undefined} en
 * @param {Record<string, unknown> | null | undefined} ko
 */
export function mergeTourApiFestivalFields(en, ko) {
  if (!ko && !en) return null;
  if (!en) return ko ?? null;
  if (!ko) return en ?? null;
  const merged = { ...ko };
  for (const [key, value] of Object.entries(en)) {
    if (hasText(value)) merged[key] = value;
  }
  return merged;
}

/**
 * @param {unknown} rows
 */
export function mergeTourApiFestivalInfoRows(enRows, koRows) {
  const en = Array.isArray(enRows) ? enRows : [];
  const ko = Array.isArray(koRows) ? koRows : [];
  const enHasBody = en.some(
    (row) => hasText(row?.infoname) || hasText(row?.infotext),
  );
  if (enHasBody) return en;
  return ko;
}

/**
 * EngService2 + KorService2 festivalDetail 응답 병합 (목록 KO SSOT · 본문 EN 우선).
 * @param {Record<string, unknown> | null | undefined} enData
 * @param {Record<string, unknown> | null | undefined} koData
 */
export function mergeTourApiFestivalDetailBundle(enData, koData) {
  const koOk = Boolean(koData?.ok);
  const enOk = Boolean(enData?.ok);
  if (!koOk && !enOk) {
    return koData || enData || { ok: false };
  }

  const intro = mergeTourApiFestivalFields(enData?.intro, koData?.intro);
  const common = mergeTourApiFestivalFields(enData?.common, koData?.common);
  const info = mergeTourApiFestivalInfoRows(enData?.info, koData?.info);

  return {
    ok: true,
    intro,
    common,
    info,
    items: intro ? [intro] : [],
    rawCount: intro ? 1 : 0,
    fromCache: Boolean(enData?.fromCache && koData?.fromCache),
    stale: Boolean(enData?.stale || koData?.stale),
    localeMerged: true,
  };
}
