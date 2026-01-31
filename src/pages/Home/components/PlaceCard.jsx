import React, { useState, useEffect } from 'react';
import { X, Globe, MessageSquare, Ticket, Sparkles, Maximize2, PlayCircle, ArrowLeft } from 'lucide-react';
import { TRAVEL_SPOTS } from '../data/travelSpots'; // 🚨 [Fix] 비디오 ID 참조를 위해 임포트

// --- [Sub Component] 상세 보기 모드 (Deep Dive View) ---
const PlaceDetail = ({ location, onClose, onChat, videoId }) => {
  const [images, setImages] = useState([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Unsplash 이미지 가져오기
  useEffect(() => {
    const fetchImages = async () => {
      // 🚨 [Setup] .env에 키가 없으면 데모용 랜덤 이미지 사용 (에러 방지)
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      
      if (!accessKey) {
        // Fallback: 키가 없을 때 보여줄 고화질 더미
        setImages([
          `https://source.unsplash.com/featured/800x600?${location.name},travel`,
          `https://source.unsplash.com/featured/800x600?${location.name},food`,
          `https://source.unsplash.com/featured/800x600?${location.name},street`,
        ]);
        return;
      }

      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${location.name} travel&per_page=4&orientation=landscape&client_id=${accessKey}`
        );
        const data = await res.json();
        if (data.results) {
          setImages(data.results.map(img => img.urls.regular));
        }
      } catch (err) {
        console.error("Unsplash Fetch Error:", err);
      }
    };
    fetchImages();
  }, [location]);

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* 배경 블러 처리 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full h-full flex flex-col md:flex-row p-4 md:p-8 gap-6 pointer-events-none">
        {/* 1. 좌측: AI 커맨드 센터 (35%) */}
        <div className="w-full md:w-[35%] h-full pointer-events-auto flex flex-col justify-center">
           <div className="bg-black/80 border border-white/10 rounded-3xl p-6 shadow-2xl h-[80%] flex flex-col relative overflow-hidden">
              <button onClick={onClose} className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft size={18} /> <span className="text-sm">Back</span>
              </button>
              
              <div className="mt-10 mb-6">
                <h1 className="text-4xl font-extrabold text-white mb-2">{location.name}</h1>
                <p className="text-blue-400 font-bold tracking-widest uppercase text-sm">{location.country}</p>
              </div>

              <div className="flex-1 bg-white/5 rounded-2xl p-4 mb-4 overflow-y-auto">
                <p className="text-gray-300 leading-relaxed text-sm">
                  {/* AI가 채워줄 공간, 우선 정적 텍스트 */}
                  여행의 모든 순간이 영화가 되는 곳, {location.name}. 
                  이곳에서 경험할 수 있는 최고의 미식과 숨겨진 명소를 AI에게 지금 바로 물어보세요.
                  당신의 취향을 분석하여 최적의 루트를 설계해 드립니다.
                </p>
              </div>

              <button 
                onClick={() => onChat({ text: `${location.name}의 숨겨진 명소 3곳만 추천해줘`, persona: 'INSPIRER' })}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} /> AI 가이드와 대화 시작
              </button>
           </div>
        </div>

        {/* 2. 우측: 비주얼 갤러리 & 유튜브 (65%) */}
        <div className="w-full md:w-[65%] h-full pointer-events-auto flex flex-col justify-center gap-4">
          
          {/* Main Visual (Masonry 느낌의 Grid) */}
          <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[80%]">
             {/* 첫 번째 큰 이미지 */}
             <div className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden shadow-2xl group border border-white/10">
               {images[0] ? (
                 <img src={images[0]} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               ) : (
                 <div className="w-full h-full bg-white/10 animate-pulse" />
               )}
               
               {/* 🚨 [Strategy] 우측 하단 구석: 큐레이션 된 유튜브 썸네일 */}
               {videoId && (
                 <div className="absolute bottom-6 right-6 w-48 aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 group-video cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setIsVideoPlaying(true)}
                 >
                    <div className="absolute inset-0 bg-black/40 group-video-hover:bg-black/20 transition-colors z-10 flex items-center justify-center">
                       <PlayCircle size={32} className="text-white opacity-80" />
                    </div>
                    <img 
                      src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                      alt="Vlog Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-bold truncate z-20">
                       Click to Watch (4K)
                    </div>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Video Overlay (Lightbox) */}
      {isVideoPlaying && videoId && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-10 animate-fade-in">
           <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden border border-white/20">
              <button 
                onClick={() => setIsVideoPlaying(false)}
                className="absolute top-4 right-4 text-white hover:text-red-500 z-50 p-2 bg-black/50 rounded-full"
              >
                <X size={24} />
              </button>
              <iframe 
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
                title="YouTube video player" 
                className="w-full h-full"
                allow="autoplay; encrypted-media" 
                allowFullScreen
              ></iframe>
           </div>
        </div>
      )}
    </div>
  );
};


// --- [Main Component] 기존 카드 (Peek) ---
const PlaceCard = ({ location, onClose, onChat, onTicket, isCompactMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🚨 [Data] 현재 장소에 매칭되는 Video ID 찾기 (없으면 기본값)
  const matchedSpot = TRAVEL_SPOTS.find(s => s.name === location?.name);
  const videoId = matchedSpot?.videoId || "C9tY814tG48"; // Default: Osaka Vlog ID

  useEffect(() => {
    if (!location) return; 
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  if (!location) return null;

  // [Mode 1] 상세 보기 (Deep Dive)
  if (isExpanded) {
    return (
      <PlaceDetail 
        location={location} 
        videoId={videoId}
        onClose={() => setIsExpanded(false)} 
        onChat={onChat} 
      />
    );
  }

  // [Mode 2] 컴팩트 모드
  if (isCompactMode) {
    return (
      <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in transition-all duration-300 pointer-events-none">
         <div className="pointer-events-auto bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
               <Globe size={14} className="text-blue-400" />
               <span className="text-sm font-bold text-white">{location.name}</span>
            </div>
            <button onClick={onClose} className="p-1 hover:text-white text-gray-500"><X size={12}/></button>
         </div>
      </div>
    );
  }

  // [Mode 3] 기본 카드 (Peek) - 디자인 복구됨
  return (
    <div className="absolute bottom-6 right-8 w-80 z-40 animate-fade-in-up transition-all duration-300">
      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group">
        
        {/* 상단 장식 및 확대 힌트 */}
        <div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={() => setIsExpanded(true)}
        ></div>

        <div className="flex items-start justify-between mb-4">
           <div className="flex flex-col cursor-pointer" onClick={() => setIsExpanded(true)}>
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className="text-yellow-400" />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                 {location.country || "Global Destination"}
               </span>
             </div>
             <h2 className="text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2 group-hover:text-blue-200 transition-colors">
               {location.name}
               <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors" />
             </h2>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors -mr-2 -mt-2">
               <X size={18} />
           </button>
        </div>

        {/* 텍스트 영역 */}
        <div className="min-h-[100px] mb-6 cursor-pointer" onClick={() => setIsExpanded(true)}> 
          {isLoading ? (
            <div className="w-full animate-pulse space-y-3 mt-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className="text-xs text-gray-300 leading-relaxed font-light line-clamp-3">
                {location.name}의 숨겨진 매력을 발견하세요. 
                카드를 클릭하면 고화질 갤러리와 엄선된 여행 영상으로 떠날 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3">
           <button 
             onClick={() => onChat({ text: `${location.name} 정보 알려줘`, persona: 'INSPIRER' })}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
           >
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI 묻기</span>
           </button>
           <button 
             onClick={onTicket}
             className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.05] transition-all"
           >
             <Ticket size={16} className="text-white" />
             <span className="text-xs font-bold text-white">여행 계획</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;