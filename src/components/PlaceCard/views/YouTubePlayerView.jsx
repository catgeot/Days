import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Play, Sparkles, Info } from 'lucide-react';

const YouTubePlayerView = ({ videoId, videos, isFullScreen, toggleFullScreen, showUI }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // 1. 데이터 안전 장치: videos가 없으면 videoId로 하나 만듦
  const videoList = videos && videos.length > 0 
    ? videos 
    : (videoId ? [{ id: videoId, title: "Main Video" }] : []);

  const currentVideo = videoList[currentVideoIndex];
  
  useEffect(() => {
    setIsPlaying(false);
    setCurrentVideoIndex(0);
  }, [videoId, videos]);

  if (!currentVideo) return null;

  // 🚨 [핵심 수정] 썸네일 주소 생성 로직 (가장 안전한 방법)
  // 1순위: 데이터 파일에 적힌 thumbnail 값이 있으면 그것을 씀
  // 2순위: 없으면 유튜브의 hqdefault(고화질, 무조건 존재함)를 사용
  // 참고: maxresdefault는 없는 영상이 많아서 오류가 잘 납니다.
  const thumbnailSrc = currentVideo.thumbnail 
    ? currentVideo.thumbnail 
    : `https://img.youtube.com/vi/${currentVideo.id}/hqdefault.jpg`;

  return (
    <div className={`flex-1 h-full bg-[#05070a] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {/* --- [Screen 1: Play Mode] --- */}
      {isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <div className={`w-full h-full transition-all duration-500 ${isFullScreen ? 'p-0' : 'max-w-[95%] max-h-[90%] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5'}`}>
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=0&modestbranding=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        /* --- [Screen 2: Cover Mode] --- */
        <div className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(true)}>
          {/* 배경 블러 이미지 */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110 transition-transform duration-700 group-hover:scale-125" 
            style={{ backgroundImage: `url(${thumbnailSrc})` }} 
          />
          
          {/* 중앙 썸네일 카드 */}
          <div className="relative z-20 w-[80%] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 group-hover:border-white/50 transition-all duration-300 transform group-hover:scale-105">
             <img 
                src={thumbnailSrc} 
                alt="Video Thumbnail" 
                className="w-full h-full object-cover"
                // 이미지가 깨질 경우를 대비한 안전 장치 (onerror)
                onError={(e) => { e.target.src = `https://img.youtube.com/vi/${currentVideo.id}/mqdefault.jpg`; }}
             />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                    <Play size={32} className="text-white fill-white ml-2" />
                </div>
             </div>

             {/* AI 분석 요약 (데이터가 있을 때만) */}
             {currentVideo.ai_context && (
                <div className="absolute top-4 left-4 right-4 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-[-10px] group-hover:translate-y-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Analysis</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
                    {currentVideo.ai_context.summary}
                  </p>
                </div>
             )}
          </div>
          
          <div className="absolute bottom-12 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
             <p className="text-lg font-bold drop-shadow-lg">{currentVideo.title}</p>
          </div>
        </div>
      )}

      {/* --- [Playlist Zone] --- */}
      {videoList.length > 1 && showUI && (
        <div className="absolute bottom-0 left-0 w-full h-32 z-[210] flex items-end justify-center pb-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-3 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                {videoList.map((video, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentVideoIndex(idx); setIsPlaying(false); }}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden border transition-all duration-300 ${currentVideoIndex === idx ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                    >
                        {/* 여기도 hqdefault로 통일 */}
                        <img 
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} 
                          className="w-full h-full object-cover" 
                          alt="mini" 
                        />
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* --- [Top Controls] --- */}
      <div className={`absolute top-2 right-10 flex items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
        {currentVideo.ai_context?.best_moment && (
          <div className="px-3 py-2 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 rounded-full flex items-center gap-2">
            <Info size={12} className="text-blue-400" />
            <span className="text-[9px] text-blue-200 font-medium">Best: {currentVideo.ai_context.best_moment.time}</span>
          </div>
        )}
        <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl">
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayerView;