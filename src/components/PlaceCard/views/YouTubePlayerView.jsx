import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Maximize2, Minimize2, Play, Sparkles, List, X, ChevronLeft, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';

const YouTubePlayerView = forwardRef(({ 
  videoId, 
  videos, 
  isFullScreen, 
  toggleFullScreen, 
  showUI, 
  onVideoSelect,
  isLoading = false, 
  error = null,      
  googleFormUrl = "https://forms.gle/QgofLDzzYD6NfWYN7"
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true); 
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  
  const iframeRef = useRef(null);
  const scrollContainerRef = useRef(null); 

  const videoList = videos || [];
  const currentVideo = videoList[currentVideoIndex];

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      if (!isPlaying) {
          setIsPlaying(true);
          setIsPaused(false);
          setTimeout(() => {
            if (iframeRef.current) {
               iframeRef.current.contentWindow.postMessage(
                   JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*'
               );
               iframeRef.current.contentWindow.postMessage(
                   JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
               );
            }
          }, 500);
          return;
      }
      if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*'
          );
          iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
          );
      }
    },
    playVideo: () => {
        if (!isPlaying) {
            setIsPlaying(true);
            setIsPaused(false);
        }
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
            );
        }
    }
  }));

  useEffect(() => {
      const handleMessage = (event) => {
          if (!event.data) return;
          let data = event.data;
          if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch (e) { return; }
          }
          if (data?.event === 'infoDelivery' && data.info && data.info.playerState !== undefined) {
              const state = data.info.playerState;
              const isActive = state === 1 || state === 3;
              setIsPaused(!isActive);
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setIsPaused(true);
    if (videoId && videoList.length > 0) {
      const targetIndex = videoList.findIndex(v => v.id === videoId);
      setCurrentVideoIndex(targetIndex >= 0 ? targetIndex : 0);
    } else {
      setCurrentVideoIndex(0);
    }
  }, [videoId, videos]);

  useEffect(() => {
    if (currentVideo) {
      setThumbnailUrl(`https://img.youtube.com/vi/${currentVideo.id}/hqdefault.jpg`);
    }
  }, [currentVideo]);

  const handleImageError = () => {
    if (currentVideo && thumbnailUrl && !thumbnailUrl.includes('mqdefault')) {
      setThumbnailUrl(`https://img.youtube.com/vi/${currentVideo.id}/mqdefault.jpg`);
    }
  };

  const handlePlay = () => {
      if (!currentVideo) return;
      setIsPlaying(true);
      setIsPaused(false);
  };

  const isEmpty = !isLoading && videoList.length === 0;

  return (
    <div className={`flex-1 w-full h-full bg-[#05070a] md:rounded-[2rem] md:border md:border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {/* 1. Main Content Area */}
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
           <p className="text-white/40 text-sm animate-pulse">관련 영상을 불러오는 중...</p>
        </div>
      ) : isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <AlertCircle size={40} className="text-white/20" />
          </div>
          <h3 className="text-white text-xl font-bold mb-2">아직 등록된 영상이 없습니다</h3>
          <p className="text-white/50 text-sm max-w-xs mb-8">
            이 장소에 멋진 영상을 알고 계신가요? <br/> 직접 추천해주시면 서비스에 반영됩니다.
          </p>
          <a 
            href={googleFormUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
          >
            <Sparkles size={18} />
            영상 추천하기
            <ExternalLink size={14} className="opacity-50" />
          </a>
        </div>
      ) : isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <div className={`transition-all duration-500 mx-auto ${isFullScreen ? 'w-full h-full p-0 max-w-none' : 'w-full md:w-[98%] h-[100%] md:h-[95%] max-w-[1440px] md:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] md:border md:border-white/5'}`}>
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideo?.id}?autoplay=1&mute=0&modestbranding=1&rel=0&enablejsapi=1&origin=${window.location.origin}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group" onClick={handlePlay}>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110 transition-transform duration-700 group-hover:scale-125" 
            style={{ backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none' }} 
          />
          <div className="relative z-20 w-[90%] md:w-[80%] max-w-[1200px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 group-hover:border-white/50 transition-all duration-300 transform group-hover:scale-105 bg-black/50">
             <img 
               key={thumbnailUrl} 
               src={thumbnailUrl}
               alt="Video Thumbnail" 
               className="w-full h-full object-cover"
               onError={handleImageError}
             />
             <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
                    <Play size={24} className="md:w-8 md:h-8 text-white fill-white ml-1 md:ml-2" />
                </div>
             </div>
          </div>
          <div className="absolute bottom-12 text-white text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
             <p className="text-sm md:text-lg font-bold drop-shadow-lg px-4">{currentVideo?.title}</p>
             <p className="text-[10px] md:text-xs text-white/60 tracking-wider uppercase mt-1">Click to Play</p>
          </div>
        </div>
      )}

      {!isEmpty && videoList.length > 0 && showUI && (
        <div className={`hidden md:block absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[1000px] z-[210] transition-opacity duration-500 
            ${(!isPlaying || isPaused) ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
          <div className="relative group/playlist">
            {/* Left Arrow Overlay */}
            <button 
              onClick={(e) => { e.stopPropagation(); scroll('left'); }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover/playlist:opacity-100 transition-opacity hover:bg-red-600"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Scroll Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 p-4 overflow-x-auto scrollbar-hide snap-x no-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {videoList.map((video, idx) => (
                  <button 
                      key={video.id + idx}
                      onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onVideoSelect) onVideoSelect(video.id);
                          setCurrentVideoIndex(idx); 
                          handlePlay(); 
                      }}
                      className={`relative flex-shrink-0 w-36 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 snap-center group/item ${currentVideoIndex === idx ? 'border-red-500 scale-105 shadow-[0_0_20px_rgba(220,38,38,0.5)] z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/50'}`}
                  >
                      <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="mini" />
                      {currentVideoIndex === idx && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="flex gap-1 items-end h-3">
                                 <div className="w-1 bg-red-500 animate-[bounce_1s_infinite] h-full" />
                                 <div className="w-1 bg-red-500 animate-[bounce_1.2s_infinite] h-2/3" />
                                 <div className="w-1 bg-red-500 animate-[bounce_0.8s_infinite] h-full" />
                              </div>
                          </div>
                      )}
                      <div className="absolute bottom-0 left-0 w-full bg-black/80 text-[9px] text-white p-1.5 truncate opacity-0 group-hover/item:opacity-100 transition-opacity font-medium">
                          {video.title}
                      </div>
                  </button>
              ))}
            </div>

            {/* Right Arrow Overlay */}
            <button 
              onClick={(e) => { e.stopPropagation(); scroll('right'); }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white opacity-0 group-hover/playlist:opacity-100 transition-opacity hover:bg-red-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {!isFullScreen && (
        <div className={`md:hidden absolute bottom-32 right-4 z-[210] flex flex-col gap-3 transition-all duration-300 
            ${(showUI || !isPlaying || isPaused) ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
            
            {!isEmpty && videoList.length > 1 && (
              <button 
                  onClick={(e) => { e.stopPropagation(); setIsMobileListOpen(true); }}
                  className="p-4 bg-white/10 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/20 active:scale-90 transition-all"
              >
                  <List size={24} strokeWidth={2.5} />
              </button>
            )}

            {isEmpty && (
              <a 
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-red-600/20 text-red-500 rounded-full shadow-2xl backdrop-blur-md border border-red-500/30 active:scale-90 transition-all"
              >
                <Sparkles size={24} strokeWidth={2.5} />
              </a>
            )}
        </div>
      )}

      {isMobileListOpen && videoList.length > 1 && (
        <div 
            className="md:hidden fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
            onClick={() => setIsMobileListOpen(false)}
        >
            <div 
                className="bg-[#05070a]/95 border border-white/10 rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0 bg-black/50">
                    <div className="flex items-center gap-2">
                        <List size={18} className="text-red-500" />
                        <h3 className="text-white font-bold">?�생 목록 ({videoList.length})</h3>
                    </div>
                    <button onClick={() => setIsMobileListOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                    {videoList.map((video, idx) => (
                        <button 
                            key={video.id + idx}
                            onClick={() => {
                                if (onVideoSelect) onVideoSelect(video.id);
                                setCurrentVideoIndex(idx);
                                handlePlay();
                                setIsMobileListOpen(false); 
                            }}
                            className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all mb-2 ${currentVideoIndex === idx ? 'bg-red-500/20 border border-red-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10">
                                <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumb" />
                                {currentVideoIndex === idx && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Play size={14} className="text-red-500 fill-red-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm line-clamp-2 leading-snug ${currentVideoIndex === idx ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{video.title}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      <div className={`hidden md:flex absolute top-6 right-6 items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
        {!isEmpty && (
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
              <Sparkles size={14} className="text-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-bold tracking-widest uppercase">Cinema Mode</span>
          </div>
        )}
        <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl group">
          {isFullScreen ? <Minimize2 size={20} className="group-hover:scale-90 transition-transform"/> : <Maximize2 size={20} className="group-hover:scale-110 transition-transform"/>}
        </button>
      </div>
    </div>
  );
});

export default YouTubePlayerView;
