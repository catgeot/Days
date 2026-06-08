import { createClient } from '@supabase/supabase-js';
import { loadEnvFile, SCRIPT_ROOT } from './load-env-file.mjs';

export { loadEnvFile, SCRIPT_ROOT };

export function createSupabaseScriptClient() {
  loadEnvFile();

  const url = process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      'Supabase 연결 정보가 없습니다. .env.local에 VITE_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY(권장)를 설정하세요.'
    );
    process.exit(1);
  }

  return createClient(url, key);
}
