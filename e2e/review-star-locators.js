/** Editorial/persona cards must not show user star ratings (#372). */
export function editorialReviewCards(page) {
  return page
    .locator('div.bg-white.border.border-gray-100.rounded-xl.p-5.shadow-sm')
    .filter({
      has: page.locator('span.border-indigo-100', { hasText: /GATEO 리뷰어/i }),
    });
}

export function starRatingIn(scope) {
  return scope.locator(
    [
      '[data-review-stars]',
      '[data-review-stars] svg',
      'svg.fill-yellow-400',
      'svg.text-yellow-400',
      '[aria-label*="별점"]',
      '[aria-label*="star rating" i]',
    ].join(', '),
  );
}
