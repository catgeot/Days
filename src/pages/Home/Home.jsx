import React, { useState, useRef } from 'react';

// 컴포넌트 불러오기
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 

// 🚨 [연결] 사장님이 작성하신 번역기 파일 가져오기
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  // 상태 관리
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  
  // 검색창에 채워넣을 텍스트 (Draft)
  const [draftInput, setDraftInput] = useState('');

  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // 지구본 제어 Ref
  const globeRef = useRef();

  // --- 이벤트 핸들러 ---

  // 1. 지구본 클릭 핸들러
  const handleGlobeClick = async ({ lat, lng }) => {
    // 1) 회전 잠시 멈춤
    if (globeRef.current) globeRef.current.pauseRotation();

    // 2) 좌표 저장
    setSelectedLocation({ lat, lng, type: 'coordinates' });
    
    // 3) 🚨 [UX] 주소 찾는 동안 사용자에게 피드백 ("잠시만요...")
    setDraftInput("위치 정보를 확인하고 있습니다... 🛰️");

    // 4) 🚨 [번역] 좌표 -> 주소 변환 실행
    const addressData = await getAddressFromCoordinates(lat, lng);

    // 5) 🚨 [결과 반영] 검색창 텍스트 업데이트
    if (addressData) {
      // "국가"와 "도시" 정보를 조합
      // 예: "대한민국 서울특별시", "일본 오사카"
      // 만약 알 수 없는 지역이면 fallback 텍스트 사용
      const country = addressData.country !== '알 수 없는 국가' ? addressData.country : '';
      const city = addressData.city !== '알 수 없는 도시' ? addressData.city : '';
      
      const locationName = `${country} ${city}`.trim();

      if (locationName) {
        setDraftInput(`${locationName} 여행에 대해 알려줘`);
      } else {
        // 바다 한가운데거나 정보가 없을 때
        setDraftInput(`위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`);
      }
    } else {
      // 에러 등으로 데이터가 없을 때
      setDraftInput(`위도 ${lat.toFixed(2)}, 경도 ${lng.toFixed(2)} 위치의 여행 정보 알려줘`);
    }

    console.log(`📍 Pin dropped at: ${lat}, ${lng}`);
  };

  // 2. 마커(도시) 또는 랭킹 클릭
  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    setIsTicketOpen(true);
    if (globeRef.current) globeRef.current.pauseRotation();
  };

  // 3. 검색 (엔터 입력 시) -> 채팅 모달 오픈
  const handleSearch = (query) => {
    setInitialQuery(query); 
    setIsChatOpen(true);    
  };

  // 4. 티켓 발권 완료 시
  const handleTicketIssue = (prompt) => {
    setInitialQuery(prompt);
    setIsChatOpen(true);
  };

  // 5. 티켓 모달 닫기
  const handleCloseTicket = () => {
    setIsTicketOpen(false);
    if (globeRef.current) globeRef.current.resumeRotation();
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      <HomeGlobe 
        ref={globeRef}
        onGlobeClick={handleGlobeClick}
        onMarkerClick={handleLocationSelect}
        isChatOpen={isChatOpen}
      />

      {/* Draft 텍스트 전달 */}
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        onTicketClick={() => setIsTicketOpen(true)}
        externalInput={draftInput} 
      />

      <TicketModal 
        isOpen={isTicketOpen} 
        onClose={handleCloseTicket}
        onIssue={handleTicketIssue}
        preFilledDestination={selectedLocation} 
      />
      
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => {
          setIsChatOpen(false);
          // 채팅창 닫으면 다시 회전 재개
          if (globeRef.current) globeRef.current.resumeRotation();
        }} 
        initialQuery={initialQuery} 
      />
    </div>
  );
}

export default Home;