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
  VITE_GATEO_SITE_SEARCH_ALL_ASSETS: process.env.VITE_GATEO_SITE_SEARCH_ALL_ASSETS || '',
  VITE_GATEO_FESTIVAL_DATE_CHIP: process.env.VITE_GATEO_FESTIVAL_DATE_CHIP || '',
  VITE_GATEO_LOCAL_INFO_ROLLOUT: process.env.VITE_GATEO_LOCAL_INFO_ROLLOUT || '',
  VITE_GATEO_FESTIVAL_ROAD: process.env.VITE_GATEO_FESTIVAL_ROAD || '',
  VITE_GATEO_KOGL_REELS: process.env.VITE_GATEO_KOGL_REELS || '',
  VITE_GATEO_REELS_BASE_URL: process.env.VITE_GATEO_REELS_BASE_URL || '',
};

register('./src-resolve-loader.mjs', import.meta.url);
