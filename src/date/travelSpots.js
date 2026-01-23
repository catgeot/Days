// src/data/travelSpots.js

export const TRAVEL_SPOTS = [
  // 1. 💎 Paradise (고립된 낙원 & 휴양)
  { id: 101, name: "Aitutaki", country: "Cook Islands", lat: -18.85, lng: -159.78, category: "paradise", rank: 1 },
  { id: 102, name: "Santorini", country: "Greece", lat: 36.39, lng: 25.46, category: "paradise", rank: 6 },
  { id: 103, name: "Palau", country: "Palau", lat: 7.51, lng: 134.58, category: "paradise", rank: 3 },
  { id: 104, name: "Gili Meno", country: "Indonesia", lat: -8.35, lng: 116.05, category: "paradise", rank: 12 },
  { id: 105, name: "Boracay", country: "Philippines", lat: 11.96, lng: 121.92, category: "paradise", rank: 9 },
  { id: 106, name: "Rarotonga", country: "Cook Islands", lat: -21.23, lng: -159.77, category: "paradise", rank: 15 },

  // 2. 🏔️ Nature (대자연 & 신비)
  { id: 201, name: "Iceland", country: "Iceland", lat: 64.96, lng: -19.02, category: "nature", rank: 4 },
  { id: 202, name: "Yellowknife", country: "Canada", lat: 62.45, lng: -114.37, category: "nature", rank: 7, desc: "Aurora Village" },
  { id: 203, name: "Galapagos", country: "Ecuador", lat: -0.95, lng: -90.96, category: "nature", rank: 8 },
  { id: 204, name: "Pamir Highway", country: "Tajikistan", lat: 38.00, lng: 73.00, category: "nature", rank: 20 },
  { id: 205, name: "Swiss Alps", country: "Switzerland", lat: 46.81, lng: 8.22, category: "nature", rank: 5 },

  // 3. 🏙️ Urban (도시 & 문화)
  { id: 301, name: "Paris", country: "France", lat: 48.85, lng: 2.35, category: "urban", rank: 2 },
  { id: 302, name: "Rome", country: "Italy", lat: 41.90, lng: 12.49, category: "urban", rank: 10 },
  { id: 303, name: "New York", country: "USA", lat: 40.71, lng: -74.00, category: "urban", rank: 11 },
  { id: 304, name: "Tokyo", country: "Japan", lat: 35.67, lng: 139.76, category: "urban", rank: 13 },

  // 4. ✈️ Nearby (가성비 & 근거리)
  { id: 401, name: "Danang", country: "Vietnam", lat: 16.05, lng: 108.20, category: "nearby", rank: 14 },
  { id: 402, name: "Cebu", country: "Philippines", lat: 10.31, lng: 123.88, category: "nearby", rank: 16 },
  { id: 403, name: "Osaka", country: "Japan", lat: 34.69, lng: 135.50, category: "nearby", rank: 17 },
  { id: 404, name: "Shanghai", country: "China", lat: 31.23, lng: 121.47, category: "nearby", rank: 18 },

  // 5. 🧗 Adventure (탐험 & 극한)
  { id: 501, name: "Serengeti", country: "Tanzania", lat: -2.33, lng: 34.83, category: "adventure", rank: 19 },
  { id: 502, name: "Antarctica", country: "Antarctica", lat: -75.25, lng: -0.07, category: "adventure", rank: 21 },
  { id: 503, name: "Svalbard", country: "Norway", lat: 77.87, lng: 20.97, category: "adventure", rank: 22 }
];