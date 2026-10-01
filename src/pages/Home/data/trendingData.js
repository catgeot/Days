// src/pages/Home/data/trendingData.js
// 🚨 [Fix] 모듈 export 오류 해결: TRENDING_LIST를 명시적으로 내보냅니다.
// 이 파일은 DB 연결이 실패하거나 데이터가 없을 때 사용하는 '안전장치(Fallback)'입니다.

import { TRAVEL_SPOTS } from './travelSpots';

// 1. 순위 설정 (수동 관리 or 기본값) — DB 실패 시 fallback
const RANKING_CONFIG = [
  { id: 403 },
  { id: 401 },
  { id: 103 },
  { id: 405 },
  { id: 304 },
  { id: 102 },
  { id: 105 },
  { id: 301 },
  { id: 303 },
  { id: 201 },
];

// 2. 데이터 결합 및 내보내기 (Export)
export const TRENDING_LIST = RANKING_CONFIG.map((config, index) => {
  // travelSpots.js에서 ID로 데이터 찾기
  const spot = TRAVEL_SPOTS.find(s => s.id === config.id);
  
  // 데이터가 없으면 에러 방지를 위해 더미 리턴 (안전장치)
  if (!spot) return null;

  // Ticker가 사용할 포맷으로 결합
  return {
    ...spot,
    rank: index + 1,
  };
}).filter(item => item !== null); // 없는 데이터는 제외