// src/pages/Home/data/trendingData.js
// 🚨 [Fix] 모듈 export 오류 해결: TRENDING_LIST를 명시적으로 내보냅니다.
// 이 파일은 DB 연결이 실패하거나 데이터가 없을 때 사용하는 '안전장치(Fallback)'입니다.

import { TRAVEL_SPOTS } from './travelSpots';

// 1. 순위 설정 (수동 관리 or 기본값) — 날씨는 Open-Meteo(tickerWeather.js)에서 실시간 조회
const RANKING_CONFIG = [
  { id: 403, change: 'up' },
  { id: 401, change: 'same' },
  { id: 103, change: 'up' },
  { id: 405, change: 'down' },
  { id: 304, change: 'up' },
  { id: 102, change: 'down' },
  { id: 105, change: 'same' },
  { id: 301, change: 'up' },
  { id: 303, change: 'down' },
  { id: 201, change: 'up' },
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
    change: config.change,
  };
}).filter(item => item !== null); // 없는 데이터는 제외