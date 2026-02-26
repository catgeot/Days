import { create } from 'zustand';

// useTravelStore라는 이름의 중앙 저장소를 만듭니다.
const useTravelStore = create((set) => ({
  
  // 1. 상태 (보관할 데이터): 처음에 앱이 켜질 때 기본으로 가지고 있을 여행지 정보입니다.
  currentDestination: {
    id: 101, 
    name: "라루통가", 
    name_en: "Aitutaki", 
    country: "쿡 제도", 
    country_en: "Cook Islands", 
    lat: -18.85, 
    lng: -159.78, 
    category: "paradise", 
    keywords: ["휴양", "비치", "바다", "신혼여행", "아일랜드"]
  },

  // 2. 액션 (데이터를 바꾸는 함수): 나중에 질문/답변이나 버튼 클릭을 통해 다른 여행지로 바꿀 때 사용합니다.
  setDestination: (newDestination) => set({ currentDestination: newDestination }),

}));

export default useTravelStore;