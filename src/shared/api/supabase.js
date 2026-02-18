// src/shared/api/supabase.js
// 🚨 [Fix] 테이블 명칭 수정: 'pins' -> 'scout_pins' (실제 DB 테이블명 반영)
// 🚨 [Fix] 어뷰징 방어벽 투-트랙 적용: 'view'(클릭)는 단기 기억(Session Storage)으로 탭 단위 1회 인정, 'chat/save'는 장기 기억(Local Storage)으로 1일 1회 엄격히 제한.

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
  // 1. 데이터 오염 방지: 추상적 대화 차단
  if (!placeId || placeId === "New Session" || placeId === "Scanning...") {
      return;
  }
  
  // 🚨 [Fix] 타입에 따라 검문소 분리: view는 단기 기억(sessionStorage), 나머지는 장기 기억(localStorage)
  const storage = type === 'view' ? sessionStorage : localStorage;
  
  // 오늘 날짜를 문자열로 생성
  const today = new Date().toLocaleDateString(); 
  const storageKey = `Days_Score_${type}_${placeId}`; 
  const lastActionDate = storage.getItem(storageKey);

  // 영수증 날짜가 오늘과 같다면 DB 쿼리를 생략하고 조용히 함수 종료 (Subtraction)
  if (lastActionDate === today) {
      console.log(`🛡️ [Abuse Guard] Blocked duplicate '${type}' for ${placeId} in this session/day.`);
      return; 
  }

  // 비관적 우선: 네트워크 지연 중 더블클릭을 막기 위해, DB 요청 직전에 영수증부터 선발급
  storage.setItem(storageKey, today);

  // 2. 실제 DB 쿼리 전송
  const { error } = await supabase.rpc('increment_place_stats', {
    p_id: placeId,
    i_type: type 
  });
  
  if (error) {
      console.warn("🚨 [Rank] Update failed:", error);
  } else {
      console.log(`📊 [Rank] Successfully added '${type}' score for ${placeId}.`);
  }
};

/**
 * 24시간 이내의 활성 핀 조회 (Safe-Start)
 */
export const fetchActivePins = async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
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
  const { error } = await supabase
    .from('scout_pins')
    .delete()
    .eq('user_id', userId)
    .eq('category', 'scout'); 
    
  if (error) console.error("🚨 [Trash] Clean failed:", error);
};