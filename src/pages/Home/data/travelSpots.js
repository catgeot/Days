// src/data/travelSpots.js
// 🚨 [Fix/New] Rank 제거, Keywords 추가, Youtube ID 매핑 완료
// 이 파일은 '불변의 정보'만 담습니다. 순위는 trendingData.js에서 관리합니다.

export const TRAVEL_SPOTS = [
  // 1. 💎 Paradise
  { 
    id: 101, name: "Aitutaki", country: "Cook Islands", lat: -18.85, lng: -159.78, 
    category: "paradise", videoId: "bO8iIeK0yGY",
    keywords: ["휴양", "비치", "바다", "신혼여행", "아일랜드"]
  },
  { 
    id: 102, name: "Santorini", country: "Greece", lat: 36.39, lng: 25.46, 
    category: "paradise", videoId: "F8BN0sT7f6c",
    keywords: ["유럽", "화이트", "로맨틱", "지중해", "일몰"]
  },
  { 
    id: 103, name: "Palau", country: "Palau", lat: 7.51, lng: 134.58, 
    category: "paradise", videoId: "7_uG7F6t6u8",
    keywords: ["다이빙", "해파리", "자연", "오션"]
  },
  { 
    id: 104, name: "Gili Meno", country: "Indonesia", lat: -8.35, lng: 116.05, 
    category: "paradise", videoId: "bO8iIeK0yGY",
    keywords: ["거북이", "발리", "스노클링", "동남아"]
  },
  { 
    id: 105, name: "Boracay", country: "Philippines", lat: 11.96, lng: 121.92, 
    category: "paradise", videoId: "Jd1wKqG8Fj0",
    keywords: ["화이트비치", "필리핀", "파티", "석양"]
  },

  // 2. 🏔️ Nature
  { 
    id: 201, name: "Iceland", country: "Iceland", lat: 64.96, lng: -19.02, 
    category: "nature", videoId: "0gVlO5gMvj0",
    keywords: ["오로라", "빙하", "폭포", "북유럽", "드라이브"]
  },
  { 
    id: 202, name: "Yellowknife", country: "Canada", lat: 62.45, lng: -114.37, 
    category: "nature", videoId: "Ez_u0j8QkMc", desc: "Aurora Village",
    keywords: ["오로라", "캐나다", "겨울", "눈"]
  },
  { 
    id: 205, name: "Swiss Alps", country: "Switzerland", lat: 46.81, lng: 8.22, 
    category: "nature", videoId: "M-b3tM0g8Sw",
    keywords: ["알프스", "하이킹", "기차", "유럽", "산"]
  },

  // 3. 🏙️ Urban
  { 
    id: 301, name: "Paris", country: "France", lat: 48.85, lng: 2.35, 
    category: "urban", videoId: "L_KyK85-r10",
    keywords: ["에펠탑", "쇼핑", "예술", "박물관", "카페"]
  },
  { 
    id: 304, name: "Tokyo", country: "Japan", lat: 35.67, lng: 139.76, 
    category: "urban", videoId: "Et7oMvNYGR0",
    keywords: ["쇼핑", "애니메이션", "스시", "야경", "거리"]
  },
  { 
    id: 303, name: "New York", country: "USA", lat: 40.71, lng: -74.00, 
    category: "urban", videoId: "h53g2rKxHhY",
    keywords: ["타임스퀘어", "미국", "빌딩", "자유의여신상"]
  },

  // 4. ✈️ Nearby
  { 
    id: 401, name: "Danang", country: "Vietnam", lat: 16.05, lng: 108.20, 
    category: "nearby", videoId: "5j0z0y8hYg0",
    keywords: ["가성비", "리조트", "가족여행", "베트남"]
  },
  { 
    id: 403, name: "Osaka", country: "Japan", lat: 34.69, lng: 135.50, 
    category: "nearby", videoId: "C9tY814tG48",
    keywords: ["먹방", "유니버셜", "오사카성", "도톤보리"]
  },
  { 
    id: 405, name: "Fukuoka", country: "Japan", lat: 33.59, lng: 130.40, 
    category: "nearby", videoId: "C9tY814tG48",
    keywords: ["온천", "라멘", "쇼핑", "가깝다"]
  },

  // 5. 🧗 Adventure
  { 
    id: 501, name: "Serengeti", country: "Tanzania", lat: -2.33, lng: 34.83, 
    category: "adventure", videoId: "Hj7g5z9y8x0",
    keywords: ["사파리", "동물", "아프리카", "대자연"]
  }
];