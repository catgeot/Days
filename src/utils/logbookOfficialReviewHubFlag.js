export function isLogbookOfficialReviewHubEnabled() {
  return import.meta.env.VITE_GATEO_LOGBOOK_REVIEW_HUB === '1';
}

export function isGateoReviewDeeplinkEnabled() {
  return import.meta.env.VITE_GATEO_REVIEW_DEEPLINK === '1';
}
