import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Play, Sparkles } from 'lucide-react';

const YouTubePlayerView = ({ videoId, videos, isFullScreen, toggleFullScreen, showUI }) => {
  // 1. 재생 상태 관리
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // 2. 데이터 호환성 처리
  const videoList = videos || (videoId ? [{ id: videoId, title: "Main Video" }] : []);
  const currentVideo = videoList[currentVideoIndex];
  
  useEffect(() => {
    setIsPlaying(false);
    setCurrentVideoIndex(0);
  }, [videoId, videos]);

  if (!currentVideo) return null;

  return (
    <div className={`flex-1 h-full bg-[#05070a] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {/* --- [Screen 1: Play Mode (Iframe)] --- */}
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
        /* --- [Screen 2: Cover Mode (Thumbnail)] --- */
        <div className="absolute inset-0 z-10 flex items-center justify-center group cursor-pointer" onClick={() => setIsPlaying(true)}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110 transition-transform duration-700 group-hover:scale-125" 
            style={{ backgroundImage: `url(https://img.youtube.com/vi/${currentVideo.id}/maxresdefault.jpg)` }} 
          />
          
          <div className="relative z-20 w-[80%] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 group-hover:border-white/50 transition-all duration-300 transform group-hover:scale-105">
             <img 
                src={`https://img.youtube.com/vi/${currentVideo.id}/maxresdefault.jpg`} 
                alt="Video Thumbnail" 
                className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                    <Play size={32} className="text-white fill-white ml-2" />
                </div>
             </div>
          </div>
          
          <div className="absolute bottom-12 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
             <p className="text-lg font-bold drop-shadow-lg">{currentVideo.title}</p>
             <p className="text-xs text-white/60 tracking-wider uppercase mt-1">Click to Play</p>
          </div>
        </div>
      )}

      {/* --- [Smart Hover Zone: Playlist] --- */}
      {videoList.length > 1 && showUI && (
        <div className="absolute bottom-0 left-0 w-full h-32 z-[210] flex items-end justify-center pb-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-3 p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                {videoList.map((video, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentVideoIndex(idx); setIsPlaying(false); }}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden border transition-all duration-300 ${currentVideoIndex === idx ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                    >
                        <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="mini" />
                        {currentVideoIndex === idx && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* --- [Top Controls: Position Adjusted] --- */}
      {/* 🚨 [Fix] top-8 -> top-4, right-8 -> right-5 로 위치 상향 조정 */}
      <div className={`absolute top-2 right-10 flex items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
            <Sparkles size={14} className="text-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-bold tracking-widest uppercase">4K Cinema</span>
        </div>
        <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl">
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20}/>}
        </button>
      </div>
    </div>
  );
};

export default YouTubePlayerView;