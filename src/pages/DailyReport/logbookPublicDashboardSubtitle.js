/**
 * Public LogBook header subtitle — travelogues plus official review hub count when both are known.
 * @param {{
 *   reportsLoading: boolean,
 *   travelogueCount: number,
 *   reviewHubEnabled: boolean,
 *   reviewsLoading: boolean,
 *   reviewsLoadFailed: boolean,
 *   reviewCount: number,
 *   locationFilter: string | null | undefined,
 *   filteredTravelogueCount: number,
 *   t: (key: string, opts?: Record<string, unknown>) => string,
 * }} input
 */
export function resolveLogbookPublicDashboardSubtitle({
  reportsLoading,
  travelogueCount,
  reviewHubEnabled,
  reviewsLoading,
  reviewsLoadFailed,
  reviewCount,
  locationFilter,
  filteredTravelogueCount,
  t,
}) {
  if (reportsLoading) {
    return t('logbook.dashboard.syncing');
  }

  if (locationFilter) {
    return t('logbook.dashboard.countPublicFiltered', {
      location: locationFilter,
      count: filteredTravelogueCount,
    });
  }

  const reviewsReady = reviewHubEnabled && !reviewsLoading && !reviewsLoadFailed;

  if (reviewsReady) {
    return t('logbook.dashboard.countPublicCombined', {
      total: travelogueCount + reviewCount,
      travelogues: travelogueCount,
      reviews: reviewCount,
    });
  }

  return t('logbook.dashboard.countPublic', { count: travelogueCount });
}