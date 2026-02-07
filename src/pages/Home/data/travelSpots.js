// src/pages/Home/data/travelSpots.js
// 🚨 [Fix] 영상 데이터를 travelVideos.js로 분리하여 관리 효율성 증대

export const TRAVEL_SPOTS = [
  // 1. 💎 Paradise (휴양)
  { 
    id: 101, name: "아이투타키", name_en: "Aitutaki", 
    country: "쿡 제도", country_en: "Cook Islands",
    lat: -18.85, lng: -159.78, category: "paradise", 
    keywords: ["휴양", "비치", "바다", "신혼여행", "아일랜드"]
  },
  { 
    id: 102, name: "산토리니", name_en: "Santorini", 
    country: "그리스", country_en: "Greece",
    lat: 36.39, lng: 25.46, category: "paradise", 
    keywords: ["유럽", "화이트", "로맨틱", "지중해", "일몰"]
  },
  { 
    id: 103, name: "팔라우", name_en: "Palau", 
    country: "팔라우", country_en: "Palau",
    lat: 7.51, lng: 134.58, category: "paradise", 
    keywords: ["다이빙", "해파리", "자연", "오션"]
  },
  { 
    id: 104, name: "길리 메노", name_en: "Gili Meno", 
    country: "인도네시아", country_en: "Indonesia",
    lat: -8.35, lng: 116.05, category: "paradise", 
    keywords: ["거북이", "발리", "스노클링", "동남아"]
  },
  { 
    id: 105, name: "보라카이", name_en: "Boracay", 
    country: "필리핀", country_en: "Philippines",
    lat: 11.96, lng: 121.92, category: "paradise", 
    keywords: ["화이트비치", "필리핀", "파티", "석양"]
  },
  { 
    id: 106, name: "몰디브", name_en: "Maldives", 
    country: "몰디브", country_en: "Maldives",
    lat: 3.20, lng: 73.22, category: "paradise", 
    keywords: ["럭셔리", "신혼여행", "수중환경", "리조트"]
  },
  { 
    id: 107, name: "괌", name_en: "Guam", 
    country: "미국", country_en: "USA",
    lat: 13.44, lng: 144.79, category: "paradise", 
    keywords: ["가족여행", "쇼핑", "태교여행", "호캉스"]
  },
  { 
    id: 108, name: "칸쿤", name_en: "Cancun", 
    country: "멕시코", country_en: "Mexico",
    lat: 21.16, lng: -86.85, category: "paradise", 
    keywords: ["허니문", "올인클루시브", "카리브해", "액티비티"]
  },

  // 2. 🏔️ Nature (자연)
  { 
    id: 201, name: "아이슬란드", name_en: "Iceland", 
    country: "아이슬란드", country_en: "Iceland",
    lat: 64.96, lng: -19.02, category: "nature", 
    keywords: ["오로라", "빙하", "폭포", "북유럽", "드라이브"]
  },
  { 
    id: 202, name: "옐로나이프", name_en: "Yellowknife", 
    country: "캐나다", country_en: "Canada",
    lat: 62.45, lng: -114.37, category: "nature", desc: "오로라 빌리지",
    keywords: ["오로라", "캐나다", "겨울", "눈"]
  },
  { 
  id: 203, name: "갈라파고스", name_en: "Galápagos Islands", 
  country: "에콰도르", country_en: "Ecuador",
  lat: -0.7402, lng: -90.3134, category: "nature", desc: "살아있는 진화의 박물관, 야생동물의 낙원",
  keywords: ["거북이", "스노클링", "다윈", "에콰도르", "자연"]
  },
  { 
    id: 205, name: "스위스 알프스", name_en: "Swiss Alps", 
    country: "스위스", country_en: "Switzerland",
    lat: 46.81, lng: 8.22, category: "nature", 
    keywords: ["알프스", "하이킹", "기차", "유럽", "산"]
  },

  // 3. 🏙️ Urban (도시)
  { 
    id: 301, name: "파리", name_en: "Paris", 
    country: "프랑스", country_en: "France",
    lat: 48.85, lng: 2.35, category: "urban", 
    keywords: ["에펠탑", "쇼핑", "예술", "박물관", "카페"]
  },
  { 
    id: 304, name: "도쿄", name_en: "Tokyo", 
    country: "일본", country_en: "Japan",
    lat: 35.67, lng: 139.76, category: "urban", 
    keywords: ["쇼핑", "애니메이션", "스시", "야경", "거리"]
  },
  { 
    id: 303, name: "뉴욕", name_en: "New York", 
    country: "미국", country_en: "USA",
    lat: 40.71, lng: -74.00, category: "urban", 
    keywords: ["타임스퀘어", "미국", "빌딩", "자유의여신상"]
  },
  { 
    id: 305, name: "런던", name_en: "London", 
    country: "영국", country_en: "UK",
    lat: 51.50, lng: -0.12, category: "urban", 
    keywords: ["빅벤", "해리포터", "뮤지컬", "유럽", "역사"]
  },
  { 
    id: 306, name: "방콕", name_en: "Bangkok", 
    country: "태국", country_en: "Thailand",
    lat: 13.75, lng: 100.50, category: "urban", 
    keywords: ["카오산로드", "왕궁", "마사지", "미식", "배낭여행"]
  },
  { 
    id: 307, name: "싱가포르", name_en: "Singapore", 
    country: "싱가포르", country_en: "Singapore",
    lat: 1.35, lng: 103.81, category: "urban", 
    keywords: ["마리나베이", "깨끗함", "가든", "쇼핑", "야경"]
  },
  { 
    id: 308, name: "로마", name_en: "Rome", 
    country: "이탈리아", country_en: "Italy",
    lat: 41.90, lng: 12.49, category: "urban", 
    keywords: ["콜로세움", "바티칸", "역사", "유럽", "파스타"]
  },

  // 4. ✈️ Nearby (근거리)
  { 
    id: 401, name: "다낭", name_en: "Danang", 
    country: "베트남", country_en: "Vietnam",
    lat: 16.05, lng: 108.20, category: "nearby", 
    keywords: ["가성비", "리조트", "가족여행", "베트남"]
  },
  { 
    id: 403, name: "오사카", name_en: "Osaka", 
    country: "일본", country_en: "Japan",
    lat: 34.69, lng: 135.50, category: "nearby", 
    keywords: ["먹방", "유니버셜", "오사카성", "도톤보리"]
  },
  { 
    id: 405, name: "후쿠오카", name_en: "Fukuoka", 
    country: "일본", country_en: "Japan",
    lat: 33.59, lng: 130.40, category: "nearby", 
    keywords: ["온천", "라멘", "쇼핑", "가깝다"]
  },
  { 
    id: 406, name: "타이베이", name_en: "Taipei", 
    country: "대만", country_en: "Taiwan",
    lat: 25.03, lng: 121.56, category: "nearby", 
    keywords: ["야시장", "딤섬", "101타워", "근거리"]
  },
  { 
    id: 407, name: "홍콩", name_en: "Hong Kong", 
    country: "홍콩", country_en: "Hong Kong",
    lat: 22.31, lng: 114.16, category: "nearby", 
    keywords: ["디즈니랜드", "쇼핑", "딤섬", "야경"]
  },

  // 5. 🧗 Adventure (모험)
  { 
    id: 501, name: "세렝게티", name_en: "Serengeti", 
    country: "탄자니아", country_en: "Tanzania",
    lat: -2.33, lng: 34.83, category: "adventure", 
    keywords: ["사파리", "동물", "아프리카", "대자연"]
  },
  { 
    id: 502, name: "카이로", name_en: "Cairo", 
    country: "이집트", country_en: "Egypt",
    lat: 30.04, lng: 31.23, category: "adventure", 
    keywords: ["피라미드", "스핑크스", "사막", "역사"]
  }
];