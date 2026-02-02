// src/data/travelSpots.js
// 🚨 [Fix/New] 한글 데이터로 전면 교체 및 영어 검색(name_en) 호환성 추가
// 이제 UI에는 한글이 뜨지만, 검색은 영어로도 가능합니다.

export const TRAVEL_SPOTS = [
  // 1. 💎 Paradise (휴양)
  { 
    id: 101, name: "아이투타키", name_en: "Aitutaki", 
    country: "쿡 제도", country_en: "Cook Islands",
    lat: -18.85, lng: -159.78, category: "paradise", videoId: "bO8iIeK0yGY",
    keywords: ["휴양", "비치", "바다", "신혼여행", "아일랜드"]
  },
  { 
    id: 102, name: "산토리니", name_en: "Santorini", 
    country: "그리스", country_en: "Greece",
    lat: 36.39, lng: 25.46, category: "paradise", videoId: "F8BN0sT7f6c",
    keywords: ["유럽", "화이트", "로맨틱", "지중해", "일몰"]
  },
  { 
    id: 103, name: "팔라우", name_en: "Palau", 
    country: "팔라우", country_en: "Palau",
    lat: 7.51, lng: 134.58, category: "paradise", videoId: "7_uG7F6t6u8",
    keywords: ["다이빙", "해파리", "자연", "오션"]
  },
  { 
    id: 104, name: "길리 메노", name_en: "Gili Meno", 
    country: "인도네시아", country_en: "Indonesia",
    lat: -8.35, lng: 116.05, category: "paradise", videoId: "bO8iIeK0yGY",
    keywords: ["거북이", "발리", "스노클링", "동남아"]
  },
  { 
    id: 105, name: "보라카이", name_en: "Boracay", 
    country: "필리핀", country_en: "Philippines",
    lat: 11.96, lng: 121.92, category: "paradise", videoId: "Jd1wKqG8Fj0",
    keywords: ["화이트비치", "필리핀", "파티", "석양"]
  },

  // 2. 🏔️ Nature (자연)
  { 
    id: 201, name: "아이슬란드", name_en: "Iceland", 
    country: "아이슬란드", country_en: "Iceland",
    lat: 64.96, lng: -19.02, category: "nature", videoId: "0gVlO5gMvj0",
    keywords: ["오로라", "빙하", "폭포", "북유럽", "드라이브"]
  },
  { 
    id: 202, name: "옐로나이프", name_en: "Yellowknife", 
    country: "캐나다", country_en: "Canada",
    lat: 62.45, lng: -114.37, category: "nature", videoId: "Ez_u0j8QkMc", desc: "오로라 빌리지",
    keywords: ["오로라", "캐나다", "겨울", "눈"]
  },
  { 
    id: 205, name: "스위스 알프스", name_en: "Swiss Alps", 
    country: "스위스", country_en: "Switzerland",
    lat: 46.81, lng: 8.22, category: "nature", videoId: "M-b3tM0g8Sw",
    keywords: ["알프스", "하이킹", "기차", "유럽", "산"]
  },

  // 3. 🏙️ Urban (도시)
  { 
    id: 301, name: "파리", name_en: "Paris", 
    country: "프랑스", country_en: "France",
    lat: 48.85, lng: 2.35, category: "urban", videoId: "L_KyK85-r10",
    keywords: ["에펠탑", "쇼핑", "예술", "박물관", "카페"]
  },
  { 
    id: 304, name: "도쿄", name_en: "Tokyo", 
    country: "일본", country_en: "Japan",
    lat: 35.67, lng: 139.76, category: "urban", videoId: "Et7oMvNYGR0",
    keywords: ["쇼핑", "애니메이션", "스시", "야경", "거리"]
  },
  { 
    id: 303, name: "뉴욕", name_en: "New York", 
    country: "미국", country_en: "USA",
    lat: 40.71, lng: -74.00, category: "urban", videoId: "h53g2rKxHhY",
    keywords: ["타임스퀘어", "미국", "빌딩", "자유의여신상"]
  },

  // 4. ✈️ Nearby (근거리)
  { 
    id: 401, name: "다낭", name_en: "Danang", 
    country: "베트남", country_en: "Vietnam",
    lat: 16.05, lng: 108.20, category: "nearby", videoId: "5j0z0y8hYg0",
    keywords: ["가성비", "리조트", "가족여행", "베트남"]
  },
  { 
    id: 403, name: "오사카", name_en: "Osaka", 
    country: "일본", country_en: "Japan",
    lat: 34.69, lng: 135.50, category: "nearby", videoId: "C9tY814tG48",
    keywords: ["먹방", "유니버셜", "오사카성", "도톤보리"]
  },
  { 
    id: 405, name: "후쿠오카", name_en: "Fukuoka", 
    country: "일본", country_en: "Japan",
    lat: 33.59, lng: 130.40, category: "nearby", videoId: "C9tY814tG48",
    keywords: ["온천", "라멘", "쇼핑", "가깝다"]
  },

  // 5. 🧗 Adventure (모험)
  { 
    id: 501, name: "세렝게티", name_en: "Serengeti", 
    country: "탄자니아", country_en: "Tanzania",
    lat: -2.33, lng: 34.83, category: "adventure", videoId: "Hj7g5z9y8x0",
    keywords: ["사파리", "동물", "아프리카", "대자연"]
  }
];