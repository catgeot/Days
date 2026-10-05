import { register } from 'node:module';

globalThis.__VITE_ENV__ = {
  DEV: false,
  PROD: true,
  MODE: 'test',
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
};

register('./src-resolve-loader.mjs', import.meta.url);
