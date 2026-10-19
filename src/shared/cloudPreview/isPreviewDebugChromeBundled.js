/** Dev server or Vercel Preview build — not gateo.kr production deploy (CI `npm run build`). */
export const isPreviewDebugChromeBundled =
  import.meta.env.DEV || import.meta.env.VITE_GATEO_PREVIEW_DEBUG_CHROME === '1';
