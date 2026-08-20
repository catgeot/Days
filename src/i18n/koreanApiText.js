/**
 * TourAPI 등 한국어 원문 — EN UI에서도 `lang="ko"`로 표시해
 * 브라우저 번역·스크린리더가 원문 언어를 인식하게 함.
 */
export function koreanApiTextProps(isEnglish) {
  return isEnglish ? { lang: 'ko', translate: 'yes' } : {};
}
