// src/data/travelSpots.js

// Tier 1: 주요 도시 (멀리서도 보임)
export const MAJOR_CITIES = [
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, temp: 18, weather: 'sun', country: 'South Korea', type: 'major' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, temp: 10, weather: 'rain', country: 'USA', type: 'major' },
  { name: 'London', lat: 51.5074, lng: -0.1278, temp: 12, weather: 'cloud', country: 'UK', type: 'major' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, temp: 15, weather: 'sun', country: 'France', type: 'major' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, temp: 20, weather: 'rain', country: 'Japan', type: 'major' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, temp: 25, weather: 'sun', country: 'Australia', type: 'major' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, temp: 35, weather: 'sun', country: 'UAE', type: 'major' },
];

// Tier 2: 숨겨진 여행지 (확대해야 보임) - 여기에 계속 추가하세요!
export const HIDDEN_GEMS = [
  { name: 'Jeju', lat: 33.4996, lng: 126.5312, temp: 22, weather: 'wind', country: 'South Korea', type: 'spot' },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, temp: 19, weather: 'cloud', country: 'Japan', type: 'spot' },
  { name: 'Sapporo', lat: 43.0618, lng: 141.3545, temp: 8, weather: 'snow', country: 'Japan', type: 'spot' },
  { name: 'Danang', lat: 16.0544, lng: 108.2022, temp: 29, weather: 'sun', country: 'Vietnam', type: 'spot' },
  { name: 'Chiang Mai', lat: 18.7883, lng: 98.9853, temp: 31, weather: 'sun', country: 'Thailand', type: 'spot' },
  { name: 'Bali', lat: -8.4095, lng: 115.1889, temp: 30, weather: 'rain', country: 'Indonesia', type: 'spot' },
  { name: 'Nice', lat: 43.7102, lng: 7.2620, temp: 20, weather: 'sun', country: 'France', type: 'spot' },
  { name: 'Interlaken', lat: 46.6863, lng: 7.8632, temp: 14, weather: 'cloud', country: 'Switzerland', type: 'spot' },
  { name: 'Cancun', lat: 21.1619, lng: -86.8515, temp: 32, weather: 'sun', country: 'Mexico', type: 'spot' },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734, temp: 24, weather: 'sun', country: 'Spain', type: 'spot' },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, temp: 2, weather: 'snow', country: 'Iceland', type: 'spot' }, // 추가
  { name: 'Cusco', lat: -13.5319, lng: -71.9675, temp: 15, weather: 'cloud', country: 'Peru', type: 'spot' }, // 추가
  { name: 'Santorini', lat: 36.3932, lng: 25.4615, temp: 22, weather: 'sun', country: 'Greece', type: 'spot' }, // 추가
];