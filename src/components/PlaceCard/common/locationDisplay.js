const HANGUL_REGEX = /[\u3131-\u318e\uac00-\ud7a3]/i;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const hasHangul = (value) => HANGUL_REGEX.test(normalizeText(value));

export const getPlaceTitleLines = (location) => {
  const primaryName = normalizeText(location?.name);
  const englishName = normalizeText(location?.name_en || location?.curation_data?.locationEn);
  const koreanName = normalizeText(location?.name_ko || location?.curation_data?.location);

  if (!primaryName) {
    return { primaryName: '', secondaryName: '' };
  }

  if (hasHangul(primaryName)) {
    if (englishName && englishName.toLowerCase() !== primaryName.toLowerCase()) {
      return { primaryName, secondaryName: englishName };
    }
    return { primaryName, secondaryName: '' };
  }

  if (koreanName && hasHangul(koreanName) && koreanName.toLowerCase() !== primaryName.toLowerCase()) {
    return { primaryName, secondaryName: koreanName };
  }

  if (englishName && englishName.toLowerCase() !== primaryName.toLowerCase()) {
    return { primaryName, secondaryName: englishName };
  }

  return { primaryName, secondaryName: '' };
};
