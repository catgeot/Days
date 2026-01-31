// src/data/travelSpots.js
// 🚨 [Fix/New] 실제 유튜브 Video ID 매핑 추가 (TestBench 및 PlaceCard 연동용)

export const TRAVEL_SPOTS = [
  // 1. 💎 Paradise (고립된 낙원 & 휴양)
  // Aitutaki: Cook Islands 4K
  { id: 101, name: "Aitutaki", country: "Cook Islands", lat: -18.85, lng: -159.78, category: "paradise", rank: 1, videoId: "bO8iIeK0yGY" },
  // Santorini: Walking Tour
  { id: 102, name: "Santorini", country: "Greece", lat: 36.39, lng: 25.46, category: "paradise", rank: 6, videoId: "F8BN0sT7f6c" },
  { id: 103, name: "Palau", country: "Palau", lat: 7.51, lng: 134.58, category: "paradise", rank: 3, videoId: "7_uG7F6t6u8" },
  { id: 104, name: "Gili Meno", country: "Indonesia", lat: -8.35, lng: 116.05, category: "paradise", rank: 12, videoId: "bO8iIeK0yGY" },
  { id: 105, name: "Boracay", country: "Philippines", lat: 11.96, lng: 121.92, category: "paradise", rank: 9, videoId: "Jd1wKqG8Fj0" },
  { id: 106, name: "Rarotonga", country: "Cook Islands", lat: -21.23, lng: -159.77, category: "paradise", rank: 15, videoId: "bO8iIeK0yGY" },
  { id: 107, name: "Maldives", country: "Maldives", lat: 3.20, lng: 73.22, category: "paradise", rank: 25, videoId: "F-cKe-t8mPQ" },

  // 2. 🏔️ Nature (대자연 & 신비)
  // Iceland: Cinematic
  { id: 201, name: "Iceland", country: "Iceland", lat: 64.96, lng: -19.02, category: "nature", rank: 4, videoId: "0gVlO5gMvj0" },
  { id: 202, name: "Yellowknife", country: "Canada", lat: 62.45, lng: -114.37, category: "nature", rank: 7, desc: "Aurora Village", videoId: "Ez_u0j8QkMc" },
  { id: 203, name: "Galapagos", country: "Ecuador", lat: -0.95, lng: -90.96, category: "nature", rank: 8, videoId: "4S1y5aOQG4s" },
  { id: 204, name: "Pamir Highway", country: "Tajikistan", lat: 38.00, lng: 73.00, category: "nature", rank: 20, videoId: "8JjXj1b8Gg0" },
  // Swiss: 4K Drone
  { id: 205, name: "Swiss Alps", country: "Switzerland", lat: 46.81, lng: 8.22, category: "nature", rank: 5, videoId: "M-b3tM0g8Sw" },
  { id: 206, name: "Salar de Uyuni", country: "Bolivia", lat: -20.13, lng: -67.48, category: "nature", rank: 23, videoId: "1pM6uD8nePo" },

  // 3. 🏙️ Urban (도시 & 문화)
  // Paris: Walking
  { id: 301, name: "Paris", country: "France", lat: 48.85, lng: 2.35, category: "urban", rank: 2, videoId: "L_KyK85-r10" },
  { id: 302, name: "Rome", country: "Italy", lat: 41.90, lng: 12.49, category: "urban", rank: 10, videoId: "EsFheWkimsU" },
  // NY: 8K
  { id: 303, name: "New York", country: "USA", lat: 40.71, lng: -74.00, category: "urban", rank: 11, videoId: "h53g2rKxHhY" },
  // Tokyo: Night Walk
  { id: 304, name: "Tokyo", country: "Japan", lat: 35.67, lng: 139.76, category: "urban", rank: 13, videoId: "Et7oMvNYGR0" },
  { id: 305, name: "London", country: "UK", lat: 51.50, lng: -0.12, category: "urban", rank: 24, videoId: "H1tQk2i5Yc8" },

  // 4. ✈️ Nearby (가성비 & 근거리)
  { id: 401, name: "Danang", country: "Vietnam", lat: 16.05, lng: 108.20, category: "nearby", rank: 14, videoId: "5j0z0y8hYg0" },
  { id: 402, name: "Cebu", country: "Philippines", lat: 10.31, lng: 123.88, category: "nearby", rank: 16, videoId: "Jd1wKqG8Fj0" },
  // Osaka: Street Food
  { id: 403, name: "Osaka", country: "Japan", lat: 34.69, lng: 135.50, category: "nearby", rank: 17, videoId: "C9tY814tG48" },
  { id: 404, name: "Shanghai", country: "China", lat: 31.23, lng: 121.47, category: "nearby", rank: 18, videoId: "5j0z0y8hYg0" },
  { id: 405, name: "Fukuoka", country: "Japan", lat: 33.59, lng: 130.40, category: "nearby", rank: 26, videoId: "C9tY814tG48" },

  // 5. 🧗 Adventure (탐험 & 극한)
  { id: 501, name: "Serengeti", country: "Tanzania", lat: -2.33, lng: 34.83, category: "adventure", rank: 19, videoId: "Hj7g5z9y8x0" },
  { id: 502, name: "Antarctica", country: "Antarctica", lat: -75.25, lng: -0.07, category: "adventure", rank: 21, videoId: "M-b3tM0g8Sw" },
  { id: 503, name: "Svalbard", country: "Norway", lat: 77.87, lng: 20.97, category: "adventure", rank: 22, videoId: "0gVlO5gMvj0" },
  { id: 504, name: "Gobi Desert", country: "Mongolia", lat: 42.61, lng: 103.88, category: "adventure", rank: 27, videoId: "1pM6uD8nePo" }
];