/** Dev server or Vercel Preview QA only — not gateo.kr PROD. */
export const isQaFestivalRoadFixtureEnabled =
  import.meta.env.DEV || import.meta.env.VITE_GATEO_QA_FESTIVAL_ROAD_FIXTURE === '1';
