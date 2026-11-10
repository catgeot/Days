export function isQaRestaurantPlannerFixtureEnabled() {
  return (
    import.meta.env.DEV || import.meta.env.VITE_GATEO_QA_RESTAURANT_PLANNER_FIXTURE === '1'
  );
}
