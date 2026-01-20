import React, { useState, useRef } from 'react';
// import { Loader2 } from 'lucide-react'; // 1. 로딩 아이콘 삭제 (화면 가림 방지)

// 분리된 컴포넌트 불러오기
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './components/TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
// import { getAddressFromCoordinates } from '../../lib/geocoding'; // 2. 여기서 주소변환 안함 (나중에 모달에서 처리)

function Home() {
  // 상태 관리 (State)
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  
  // 3. 로딩 상태 삭제 (화면 멈춤 원인 제거)
  // const [isGeoLoading, setIsGeoLoading] = useState(false); 

  // 선택된 위치 정보 (좌표 객체 혹은 도시 이름 문자열)
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 지구본 제어를 위한 Ref
  const globeRef = useRef();

  // --- 이벤트 핸들러들 ---

  // 1. 지구본 빈 땅 클릭 (수정됨)
  const handleGlobeClick = ({ lat, lng }) => {
    // 🚨 핵심: 로딩창 띄우지 않음! 모달도 바로 열지 않음!
    
    // 1) 지구본 자동 회전만 잠시 멈춤 (사용자가 핀을 볼 수 있게)
    if (globeRef.current) globeRef.current.pauseRotation();

    // 2) 선택된 좌표만 state에 담아둠
    // 나중에 하단 "티켓 발권하기" 버튼을 누르면 이 좌표를 사용함
    setSelectedLocation({ lat, lng, type: 'coordinates' });

    // 3) (선택사항) 여기에 "AI 대화창에 텍스트 미리 입력(Draft)" 로직 추가 가능
    // setInitialQuery("이곳의 여행 정보가 궁금해..."); 
    
    console.log(`📍 핀이 꽂혔습니다: ${lat}, ${lng}`);
  };

  // 2. 마커(도시) 또는 랭킹 클릭
  const handleLocationSelect = (locationData) => {
    // 마커나 랭킹 클릭은 "여기로 갈래!"라는 명확한 의사표시이므로 티켓 창을 열어줌
    setSelectedLocation(locationData);
    setIsTicketOpen(true);
    if (globeRef.current) globeRef.current.pauseRotation();
  };

  // 3. 검색창 입력
  const handleSearch = (query) => {
    setInitialQuery(query);
    setIsChatOpen(true);
  };

  // 4. 티켓 발권 완료
  const handleTicketIssue = (prompt) => {
    setInitialQuery(prompt);
    setIsChatOpen(true);
  };

  // 5. 모달 닫기
  const handleCloseTicket = () => {
    setIsTicketOpen(false);
    // 닫을 때 선택된 위치를 초기화할지, 유지할지는 선택 (유지하는게 UX상 좋음)
    // setSelectedLocation(null); 
    
    // 다시 지구본 회전 시작
    if (globeRef.current) globeRef.current.resumeRotation();
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* 1. 지구본 컴포넌트 */}
      <HomeGlobe 
        ref={globeRef}
        onGlobeClick={handleGlobeClick}
        onMarkerClick={handleLocationSelect}
        isChatOpen={isChatOpen}
      />

      {/* 2. 로딩 인디케이터 삭제됨 */}

      {/* 3. UI 컴포넌트 (헤더, 푸터, 텍스트) */}
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
        // 하단 버튼을 클릭해야만 비로소 모달이 열림
        onTicketClick={() => setIsTicketOpen(true)}
      />

      {/* 4. 모달들 */}
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
          if (globeRef.current) globeRef.current.resumeRotation();
        }} 
        initialQuery={initialQuery} 
      />
    </div>
  );
}

export default Home;