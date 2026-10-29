/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

/** Short landscape viewports only — not tablet/desktop 768–1023 landscape (e.g. 1023×900). */
const LANDSCAPE_PHONE_MEDIA =
  '(max-width: 1023px) and (orientation: landscape) and (max-height: 500px)';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('landscape-phone', `@media ${LANDSCAPE_PHONE_MEDIA}`);
    }),
  ],
};
