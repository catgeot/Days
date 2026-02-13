// src/pages/Home/data/trendingData.js
// 🚨 [Fix] 모듈 export 오류 해결: TRENDING_LIST를 명시적으로 내보냅니다.
// 이 파일은 DB 연결이 실패하거나 데이터가 없을 때 사용하는 '안전장치(Fallback)'입니다.

import { TRAVEL_SPOTS } from './travelSpots';

// 1. 순위 설정 (수동 관리 or 기본값)
// 날씨와 등락폭(Change)은 매주 수동으로 업데이트한다고 가정합니다.
const RANKING_CONFIG = [
  { id: 403, temp: 18, weather: 'sun', change: 'up' },    // 1위: Osaka
  { id: 401, temp: 28, weather: 'cloud', change: 'same' }, // 2위: Danang
  { id: 103, temp: 30, weather: 'sun', change: 'up' },    // 3위: Palau (예시)
  { id: 405, temp: 15, weather: 'sun', change: 'down' },  // 4위: Fukuoka
  { id: 304, temp: 16, weather: 'cloud', change: 'up' },  // 5위: Tokyo
  { id: 102, temp: 22, weather: 'wind', change: 'down' }, // 6위: Santorini
  { id: 105, temp: 29, weather: 'sun', change: 'same' },  // 7위: Boracay
  { id: 301, temp: 12, weather: 'wind', change: 'up' },   // 8위: Paris
  { id: 303, temp: 10, weather: 'wind', change: 'down' }, // 9위: New York
  { id: 201, temp: -2, weather: 'rain', change: 'up' },   // 10위: Iceland
];

// 2. 데이터 결합 및 내보내기 (Export)
export const TRENDING_LIST = RANKING_CONFIG.map((config, index) => {
  // travelSpots.js에서 ID로 데이터 찾기
  const spot = TRAVEL_SPOTS.find(s => s.id === config.id);
  
  // 데이터가 없으면 에러 방지를 위해 더미 리턴 (안전장치)
  if (!spot) return null;

  // Ticker가 사용할 포맷으로 결합
  return {
    ...spot,        // name, country, lat, lng 등 원본 데이터 상속
    rank: index + 1, // 배열 순서대로 자동 랭킹 부여
    temp: config.temp,
    weather: config.weather,
    change: config.change
  };
}).filter(item => item !== null); // 없는 데이터는 제외