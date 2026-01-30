// src/data/keywords.js
import { TRAVEL_SPOTS } from './travelSpots';

// 🚨 [Neural Network] 기존 TRAVEL_SPOTS에 한국어/별칭 매핑 (ID 매칭 아님, Name 기준)
// 사용자가 '다낭', '경기도 다낭시' 등을 입력해도 정확히 연결되도록 함.
const ALIAS_MAP = {
  // 1. Paradise
  "Aitutaki": ["아이투타키", "쿡 제도", "aitutaki"],
  "Santorini": ["산토리니", "그리스", "santorini"],
  "Palau": ["팔라우", "palau"],
  "Gili Meno": ["길리 메노", "길리", "인도네시아"],
  "Boracay": ["보라카이", "필리핀", "boracay"],
  "Rarotonga": ["라로통가", "rarotonga"],
  "Maldives": ["몰디브", "maldives"],

  // 2. Nature
  "Iceland": ["아이슬란드", "iceland", "오로라"],
  "Yellowknife": ["옐로나이프", "캐나다", "오로라 빌리지"],
  "Galapagos": ["갈라파고스", "에콰도르"],
  "Pamir Highway": ["파미르", "타지키스탄", "파미르 고원"],
  "Swiss Alps": ["스위스", "알프스", "switzerland", "alps", "융프라우"],
  "Salar de Uyuni": ["우유니", "볼리비아", "소금사막"],

  // 3. Urban
  "Paris": ["파리", "프랑스", "에펠탑", "paris"],
  "Rome": ["로마", "이탈리아", "콜로세움", "rome"],
  "New York": ["뉴욕", "미국", "맨해튼", "new york", "nyc"],
  "Tokyo": ["도쿄", "일본", "동경", "tokyo"],
  "London": ["런던", "영국", "london"],

  // 4. Nearby
  "Danang": ["다낭", "베트남", "경기도 다낭시", "danang"],
  "Cebu": ["세부", "필리핀", "cebu"],
  "Osaka": ["오사카", "일본", "간사이", "osaka"],
  "Shanghai": ["상하이", "상해", "중국", "shanghai"],
  "Fukuoka": ["후쿠오카", "일본", "fukuoka"],

  // 5. Adventure
  "Serengeti": ["세렝게티", "탄자니아", "사파리"],
  "Antarctica": ["남극", "antarctica"],
  "Svalbard": ["스발바르", "노르웨이"],
  "Gobi Desert": ["고비 사막", "몽골"]
};

// 🚨 [Expansion] UI(TravelSpots)에는 없지만 검색 가능한 '히든 플레이스'
// API 호출을 줄이고, 주요 도시를 미리 확보함.
const EXTRA_SPOTS = [
  // 국내
  { name: "Seoul", country: "South Korea", lat: 37.56, lng: 126.97, category: "urban", aliases: ["서울", "대한민국", "한국", "seoul", "korea"] },
  { name: "Jeju", country: "South Korea", lat: 33.49, lng: 126.53, category: "paradise", aliases: ["제주", "제주도", "jeju"] },
  { name: "Busan", country: "South Korea", lat: 35.17, lng: 129.07, category: "nearby", aliases: ["부산", "busan"] },
  
  // 아시아 인기
  { name: "Bangkok", country: "Thailand", lat: 13.75, lng: 100.50, category: "nearby", aliases: ["방콕", "태국", "bangkok"] },
  { name: "Hanoi", country: "Vietnam", lat: 21.02, lng: 105.83, category: "nearby", aliases: ["하노이", "베트남", "hanoi"] },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.82, lng: 106.62, category: "nearby", aliases: ["호치민", "사이공"] },
  { name: "Taipei", country: "Taiwan", lat: 25.03, lng: 121.56, category: "nearby", aliases: ["타이베이", "대만", "타이페이"] },
  { name: "Hong Kong", country: "China", lat: 22.31, lng: 114.16, category: "urban", aliases: ["홍콩", "hong kong"] },
  { name: "Singapore", country: "Singapore", lat: 1.35, lng: 103.81, category: "urban", aliases: ["싱가포르", "싱가폴"] },
  { name: "Bali", country: "Indonesia", lat: -8.40, lng: 115.18, category: "paradise", aliases: ["발리", "인도네시아", "bali"] },

  // 미주/유럽 기타
  { name: "Los Angeles", country: "USA", lat: 34.05, lng: -118.24, category: "urban", aliases: ["로스앤젤레스", "LA", "엘에이"] },
  { name: "San Francisco", country: "USA", lat: 37.77, lng: -122.41, category: "urban", aliases: ["샌프란시스코", "샌프란"] },
  { name: "Barcelona", country: "Spain", lat: 41.38, lng: 2.17, category: "urban", aliases: ["바르셀로나", "스페인"] },
  { name: "Prague", country: "Czech Republic", lat: 50.07, lng: 14.43, category: "urban", aliases: ["프라하", "체코"] }
];

// 🚨 [Integration] 기존 데이터 + 별칭 + 추가 데이터를 합친 '완전체 DB'
export const KEYWORD_DB = [
  ...TRAVEL_SPOTS.map(spot => ({
    ...spot,
    aliases: ALIAS_MAP[spot.name] || [] // 기존 데이터에 별칭 탑재
  })),
  ...EXTRA_SPOTS
];