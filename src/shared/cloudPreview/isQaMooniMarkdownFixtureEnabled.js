/** Dev server or Vercel Preview build only — not gateo.kr PROD. */
export const isQaMooniMarkdownFixtureEnabled =
  import.meta.env.DEV || import.meta.env.VITE_GATEO_QA_MOONI_MD_FIXTURE === '1';
