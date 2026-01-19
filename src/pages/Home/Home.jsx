import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// 분리된 컴포넌트 불러오기
import HomeGlobe from './components/HomeGlobe';
import HomeUI from './components/HomeUI';
import TicketModal from './TicketModal'; 
import ChatModal from '../../components/ChatModal'; 
import { getAddressFromCoordinates } from '../../lib/geocoding';

function Home() {
  // 상태 관리 (State)
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false); 
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 지구본 제어를 위한 Ref
  const globeRef = useRef();

  // --- 이벤트 핸들러들 ---

  // 1. 지구본 빈 땅 클릭
  const handleGlobeClick = async ({ lat, lng }) => {
    setIsGeoLoading(true); 
    if (globeRef.current) globeRef.current.pauseRotation();

    const result = await getAddressFromCoordinates(lat, lng);
    setIsGeoLoading(false); 

    if (result) {
      setSelectedLocation(`${result.country}, ${result.city}`);
      setIsTicketOpen(true);
    } else {
      if (globeRef.current) globeRef.current.resumeRotation();
      alert("🌊 그곳은 넓은 바다입니다. 육지를 클릭해주세요!");
    }
  };

  // 2. 마커(도시) 또는 랭킹 클릭
  const handleLocationSelect = (cityName) => {
    setSelectedLocation(cityName);
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
    setSelectedLocation(null);
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

      {/* 2. 로딩 인디케이터 */}
      {isGeoLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-none">
          <Loader2 size={48} className="text-blue-400 animate-spin mb-4" />
          <span className="text-lg font-bold tracking-widest text-white/90">LOCATING...</span>
        </div>
      )}

      {/* 3. UI 컴포넌트 (헤더, 푸터, 텍스트) */}
      <HomeUI 
        onSearch={handleSearch}
        onTickerClick={handleLocationSelect}
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