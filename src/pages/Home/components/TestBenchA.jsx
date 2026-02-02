import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, List, X, Settings, RotateCcw } from 'lucide-react';

// 🚨 [Import] 분리된 UI 부품 수입
import PlaceChatView from './PlaceChatView';
import PlaceGalleryView from './PlaceGalleryView';

// --- [Mock Data] 테스트용 가짜 데이터 ---
const MOCK_IMAGES = Array.from({ length: 12 }).map((_, i) => ({
  id: `mock-${i}`,
  urls: { 
    regular: `https://source.unsplash.com/random/800x600?boracay,beach&sig=${i}`, // Unsplash Random Source
    small: `https://source.unsplash.com/random/400x400?boracay,beach&sig=${i}`,
    full: `https://source.unsplash.com/random/1600x900?boracay,beach&sig=${i}`
  },
  width: 1920,
  height: 1080,
  likes: 100 + i * 5,
  created_at: new Date().toISOString(),
  user: { name: `Test User ${i}` },
  alt_description: "Beautiful scenery of Boracay"
}));

const TestBench = ({ onClose }) => {
  // --- [Test State] 제어판용 상태 ---
  const [testMode, setTestMode] = useState('default'); // 'default' | 'chat' | 'image_detail'
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'user', text: '테스트 질문입니다.' },
    { role: 'model', text: '테스트 답변입니다.\n줄바꿈도\n잘 되는지 확인해보세요.' }
  ]);
  
  // --- [Component State] 실제 컴포넌트 Props ---
  const [selectedImg, setSelectedImg] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUI, setShowUI] = useState(true);

  // 이미지 선택 시 자동 모드 전환 시뮬레이션
  useEffect(() => {
    if (selectedImg) setTestMode('image_detail');
    else if (testMode === 'image_detail') setTestMode('default');
  }, [selectedImg]);

  // --- [Handlers] 시뮬레이션 핸들러 ---
  const handleSimulateSend = (text) => {
    setIsAiLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    
    // 1초 뒤 가짜 응답
    setTimeout(() => {
      setChatHistory(prev => [...prev, { role: 'model', text: `[Test Echo]: ${text}` }]);
      setIsAiLoading(false);
    }, 1000);
  };

  const toggleFullScreen = (elementRef) => {
    if (!document.fullscreenElement && elementRef.current) {
      elementRef.current.requestFullscreen();
      setIsFullScreen(true);
      setShowUI(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 🛠️ [Test Control Panel] 개발자용 제어판 */}
      <div className="absolute top-4 right-4 z-[999] bg-gray-800/80 backdrop-blur border border-white/20 p-4 rounded-xl flex flex-col gap-2 shadow-2xl w-64">
        <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2 border-b border-white/10 pb-2">
          <Settings size={16} /> Test Controls
        </div>
        <button onClick={() => setIsAiLoading(!isAiLoading)} className={`text-xs px-3 py-2 rounded border ${isAiLoading ? 'bg-red-500/50 border-red-500' : 'bg-gray-700 border-gray-600'}`}>
          Toggle AI Loading ({isAiLoading ? 'ON' : 'OFF'})
        </button>
        <button onClick={() => setIsImgLoading(!isImgLoading)} className={`text-xs px-3 py-2 rounded border ${isImgLoading ? 'bg-red-500/50 border-red-500' : 'bg-gray-700 border-gray-600'}`}>
          Toggle Img Loading ({isImgLoading ? 'ON' : 'OFF'})
        </button>
        <button onClick={() => setChatHistory([])} className="text-xs px-3 py-2 rounded border bg-gray-700 border-gray-600 flex items-center justify-center gap-2">
          <RotateCcw size={12} /> Clear Chat
        </button>
        <div className="text-[10px] text-gray-400 mt-1">
          * 실제 API 호출 없음<br/>
          * 디자인/레이아웃 점검용
        </div>
      </div>

      {/* 1. Global Home Button */}
      <div className={`absolute top-8 left-8 z-[110] transition-opacity ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-full text-blue-300 hover:text-white hover:border-blue-500/50 transition-all text-xs font-bold backdrop-blur-md">
          <ArrowLeft size={14} /> Close TestBench
        </button>
      </div>

      {/* 2. Left Panel (Chat & Info) */}
      <div className={`w-[35%] h-full backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen ? 'opacity-0 translate-x-[-100%]' : 'opacity-100 translate-x-0'} bg-[#05070a]/80`}>
        
        {/* Header */}
        <div className="pt-20 px-8 pb-4 flex flex-col gap-3 z-10 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-cyan-400" />
                <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">Test Mode</span>
              </div>
              <h1 className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 text-4xl truncate pr-2">
                TEST BENCH
              </h1>
            </div>
            
            {(testMode === 'chat' || selectedImg) && (
               <button onClick={() => { setTestMode('default'); setSelectedImg(null); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all animate-fade-in shrink-0">
                 <List size={14} /> <span>Reset</span>
               </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 px-6 pb-6 overflow-hidden relative">
           {selectedImg ? (
              // [A] Image Info Placeholder (단순 텍스트)
              <div className="animate-fade-in p-4 bg-white/5 rounded-2xl border border-white/5">
                <h3 className="text-white font-bold mb-2">Image ID: {selectedImg.id}</h3>
                <p className="text-gray-400 text-sm">이미지 상세 정보 뷰 테스트 영역입니다.</p>
              </div>
           ) : testMode === 'chat' ? (
              // [B] Chat View Integration Test
              <PlaceChatView 
                chatHistory={chatHistory}
                isAiLoading={isAiLoading}
                onSendMessage={handleSimulateSend}
                locationName="Test Location"
              />
           ) : (
              // [C] Default View
              <div className="animate-fade-in space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/5 mb-4">
                   <p className="text-gray-300 text-sm leading-relaxed font-light">
                     이곳은 UI 디자인을 점검하는 <span className="text-blue-300 font-bold">테스트 벤치</span>입니다.<br/>
                     우측 패널을 통해 로딩 상태를 강제로 켜거나 끌 수 있습니다.
                   </p>
                 </div>
                 <button 
                   onClick={() => setTestMode('chat')} 
                   className="w-full py-4 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-300 text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                 >
                   Open Chat UI Test
                 </button>
              </div>
           )}
        </div>
      </div>

      {/* 3. Right Panel (Gallery) */}
      <PlaceGalleryView 
        images={isImgLoading ? [] : MOCK_IMAGES} // 로딩 테스트 시 빈 배열 전달
        isImgLoading={isImgLoading}
        selectedImg={selectedImg}
        setSelectedImg={setSelectedImg}
        isFullScreen={isFullScreen}
        toggleFullScreen={toggleFullScreen}
        closeImageKeepFullscreen={(e) => { e.stopPropagation(); setSelectedImg(null); }}
        showUI={showUI}
      />
      
      {/* Global CSS Injection (If needed) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-blue::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-blue::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-blue::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.2), transparent); border-radius: 10px; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}} />
    </div>
  );
};

export default TestBench;