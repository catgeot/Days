import { register } from 'node:module';

globalThis.__VITE_ENV__ = {
  DEV: false,
  PROD: true,
  MODE: 'test',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  VITE_GATEO_POI_COUNTY_SLUG_SEARCH: process.env.VITE_GATEO_POI_COUNTY_SLUG_SEARCH || '',
  VITE_GATEO_PLACE_CROSSLINK: process.env.VITE_GATEO_PLACE_CROSSLINK || '',
  VITE_GATEO_SITE_SEARCH: process.env.VITE_GATEO_SITE_SEARCH || '',
};

register('./src-resolve-loader.mjs', import.meta.url);
