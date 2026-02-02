// src/data/trendingData.js
// 🚨 [New] 티커 전용 데이터 조립 파일
import { TRAVEL_SPOTS } from './travelSpots';

// 관리자 설정 구역: 여기에 ID만 넣으면 순위가 결정됩니다.
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

// 데이터 결합 로직 (자동화)
export const TRENDING_LIST = RANKING_CONFIG.map((config, index) => {
  // 1. 원본 데이터 찾기
  const spot = TRAVEL_SPOTS.find(s => s.id === config.id);
  
  // 2. 데이터가 없으면 에러 방지를 위해 더미 리턴 (안전장치)
  if (!spot) return null;

  // 3. Ticker가 사용할 포맷으로 결합
  return {
    ...spot,        // name, country, lat, lng 등 원본 데이터 상속
    rank: index + 1, // 배열 순서대로 자동 랭킹 부여
    temp: config.temp,
    weather: config.weather,
    change: config.change
  };
}).filter(item => item !== null); // 없는 데이터는 제외