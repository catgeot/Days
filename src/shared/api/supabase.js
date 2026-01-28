import { createClient } from '@supabase/supabase-js';

// 1. 비밀 금고(.env)에서 열쇠 꺼내기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. 열쇠가 없으면 에러 띄우기 (실수 방지)
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL과 Key가 설정되지 않았습니다. .env 파일을 확인하세요!");
}

// 3. 연결 시작!
export const supabase = createClient(supabaseUrl, supabaseKey);