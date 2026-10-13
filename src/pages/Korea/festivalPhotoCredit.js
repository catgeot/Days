const KTO_KOGL_TYPE3_KO =
  /한국관광공사[\s\S]*?공공누리\s*제\s*3\s*유형|공공누리\s*제\s*3\s*유형[\s\S]*?한국관광공사/;

const EN_KTO_KOGL_TYPE3 = 'Photo: Korea Tourism Organization (KOGL Type 3)';

function isEnglishLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('en');
}

/**
 * @param {unknown} credit SSOT (usually KO from manual or TourAPI)
 * @param {unknown} locale
 */
export function formatFestivalPhotoCreditLine(credit, locale) {
  const raw = String(credit || '').trim();
  if (!raw) return '';
  if (!isEnglishLocale(locale)) return raw;

  if (KTO_KOGL_TYPE3_KO.test(raw)) return EN_KTO_KOGL_TYPE3;

  let en = raw.replace(/^출처:\s*/i, '').trim();
  en = en.replace(
    /한국관광공사\s*\(\s*공공누리\s*제\s*([1-4])\s*유형\s*\)/g,
    'Korea Tourism Organization (KOGL Type $1)',
  );
  en = en
    .replace(/한국관광공사/g, 'Korea Tourism Organization')
    .replace(/\(\s*공공누리\s*제\s*([1-4])\s*유형\s*\)/g, ' (KOGL Type $1)')
    .replace(/공공누리\s*제\s*([1-4])\s*유형/g, '(KOGL Type $1)')
    .replace(/\(\s*\(KOGL/g, '(KOGL')
    .trim();

  if (/^photo:\s*/i.test(en)) {
    return en.replace(/^photo:\s*/i, 'Photo: ');
  }
  return `Photo: ${en}`;
}
