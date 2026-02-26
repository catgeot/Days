import React, { useState } from 'react';
// 🚨 [Fix] 새롭게 만든 PlanCard 컴포넌트 임포트 
// (실제 파일 경로에 맞게 수정이 필요할 수 있습니다. 예: './components/PlaceCard/expanded/PlanCard')
import PlanCard from '../src/components/TravelPlan/PlanCard'; 

function App() {
  // 🚨 [New] 여행 계획 카드 모달 상태 관리 (초기값: 닫힘)
  const [isPlanCardOpen, setIsPlanCardOpen] = useState(false);

  // 🚨 [Fact Check] PlanCard 내부의 TravelPlanPanel이 터지지 않기 위한 최소한의 물리적 Mock 데이터
  // (과거 히스토리 반영: Aitutaki에서 치환된 'Rarotonga' 텍스트 사용)
  const mockLocation = {
    id: '라로통가', 
    name: '라로통가', // DB의 place_id 컬럼에 텍스트로 들어갈 핵심 값
    country: 'Cook Islands',
  };

  // 🚨 [Pessimistic] 우측 갤러리 패널이 에러를 뱉지 않도록 빈 데이터 껍데기 주입 (Safe-Start)
  const mockGalleryData = {
    images: [],
    isImgLoading: false,
    selectedImg: null,
    setSelectedImg: () => {}
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-blue-400 mb-4">
          Days: Travel Plan 샌드박스
        </h1>
        <p className="text-gray-400 mb-8 text-sm bg-white/5 p-4 rounded-lg border border-white/10">
          이 버튼을 누르면 기존 확장 카드의 디자인을 재활용한 
          <br/><span className="text-white font-bold">새로운 여행 계획(PlanCard) 폼</span>이 렌더링됩니다.
        </p>
        
        <button 
          onClick={() => setIsPlanCardOpen(true)}
          className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2 w-full text-lg group"
        >
          <span className="group-hover:scale-110 transition-transform">🗺️</span> 
          라로통가 여행 계획 짜기 (Test Open)
        </button>
      </div>

      {/* 🛡️ [Subtraction] isPlanCardOpen이 true일 때만 무거운 컴포넌트 마운트 */}
      {isPlanCardOpen && (
        <PlanCard 
          location={mockLocation}
          galleryData={mockGalleryData}
          onClose={() => setIsPlanCardOpen(false)}
        />
      )}
    </div>
  );
}

export default App;