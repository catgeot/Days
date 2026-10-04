/** Editorial/persona cards must not show user star ratings (#372). */
export function editorialReviewCards(page) {
  return page.locator('.border-indigo-100');
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
