// src/shared/api/supabase.js
// 🚨 [Fix] 테이블 명칭 수정: 'pins' -> 'scout_pins' (실제 DB 테이블명 반영)

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

// --- 데이터 관리 로직 ---

/**
 * 랭킹 시스템: 사용자 인터랙션 기록 (Fire-and-Forget)
 */
export const recordInteraction = async (placeId, type) => {
  if (!placeId) return;
  const { error } = await supabase.rpc('increment_place_stats', {
    p_id: placeId,
    i_type: type // 'view', 'chat', 'save'
  });
  if (error) console.warn("🚨 [Rank] Update failed:", error);
};

/**
 * 24시간 이내의 활성 핀 조회 (Safe-Start)
 */
export const fetchActivePins = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  // 🚨 [Fix] 테이블 이름 수정: pins -> scout_pins
  const { data, error } = await supabase
    .from('scout_pins') 
    .select('*')
    .gt('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.warn("🚨 [Pins] Fetch failed:", error);
    return [];
  }
  return data;
};

/**
 * 휴지통: 임시 데이터 삭제
 */
export const clearTemporaryData = async (userId) => {
  if (!userId) return;
  // 🚨 [Fix] 테이블 이름 수정: pins -> scout_pins
  const { error } = await supabase
    .from('scout_pins')
    .delete()
    .eq('user_id', userId)
    .eq('category', 'scout'); 
    
  if (error) console.error("🚨 [Trash] Clean failed:", error);
};