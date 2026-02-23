// src/components/PlaceCard/views/YouTubePlayerView.jsx
// 🚨 [Fix] 모바일 전용 재생목록 버튼을 '유리알(Glassmorphism)' 디자인으로 전면 교체 (bg-white/10, backdrop-blur)
// 🚨 [Fix] 불확실한 자동 숨김 로직을 제거하고, 직관적인 showUI 상태에 따라 노출되도록 정리
// 🚨 [New] 유리알 버튼에 호버/액티브 효과를 추가하여 터치 피드백 강화

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Maximize2, Minimize2, Play, Sparkles, List, X } from 'lucide-react';

const YouTubePlayerView = forwardRef(({ videoId, videos, isFullScreen, toggleFullScreen, showUI, onVideoSelect }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true); 
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const iframeRef = useRef(null);

  const videoList = videos || (videoId ? [{ id: videoId, title: "Main Video" }] : []);
  const currentVideo = videoList[currentVideoIndex];

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
      setIsPlaying(true);
      setIsPaused(false);
  };

  if (!currentVideo) return null;

  const showPlaylistForce = !isPlaying || isPaused;

  return (
    <div className={`flex-1 w-full h-full bg-[#05070a] md:rounded-[2rem] md:border md:border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <div className={`transition-all duration-500 mx-auto ${isFullScreen ? 'w-full h-full p-0 max-w-none' : 'w-full md:w-[98%] h-[100%] md:h-[95%] max-w-[1440px] md:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] md:border md:border-white/5'}`}>
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&mute=0&modestbranding=1&rel=0&enablejsapi=1&origin=${window.location.origin}`}
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
             <p className="text-sm md:text-lg font-bold drop-shadow-lg px-4">{currentVideo.title}</p>
             <p className="text-[10px] md:text-xs text-white/60 tracking-wider uppercase mt-1">Click to Play</p>
          </div>
        </div>
      )}

      {/* 데스크탑용 가로 재생 리스트 (숨김 로직 유지) */}
      {videoList.length > 1 && showUI && (
        <div className={`hidden md:flex absolute bottom-24 left-0 w-full z-[210] justify-center transition-opacity duration-500 pointer-events-none 
            ${showPlaylistForce ? '!opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
            <div className="flex gap-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl pointer-events-auto transform translate-y-0 transition-transform duration-300">
                {videoList.map((video, idx) => (
                    <button 
                        key={idx}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (onVideoSelect) onVideoSelect(video.id);
                            setCurrentVideoIndex(idx); 
                            handlePlay(); 
                        }}
                        className={`relative w-32 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 group/item ${currentVideoIndex === idx ? 'border-red-500 scale-110 shadow-[0_0_20px_rgba(220,38,38,0.5)] z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105 hover:border-white/50'}`}
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
                        <div className="absolute bottom-0 left-0 w-full bg-black/80 text-[9px] text-white p-1 truncate opacity-0 group-hover/item:opacity-100 transition-opacity">
                            {video.title}
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* 🚨 [Fix] 모바일 전용 유리알 플로팅 버튼 (Red에서 변경) */}
      {videoList.length > 1 && (
        <div className={`md:hidden absolute bottom-24 right-4 z-[210] transition-all duration-300 ${showUI || showPlaylistForce ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button 
                onClick={() => setIsMobileListOpen(true)}
                className="p-3 bg-white/10 text-white/80 rounded-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md border border-white/20 active:scale-90 active:bg-white/20 transition-all"
            >
                <List size={22} strokeWidth={2.5} />
            </button>
        </div>
      )}

      {/* 모바일 전용 투명 방어막 & 세로 재생 리스트 모달 (생략 없이 유지) */}
      {isMobileListOpen && videoList.length > 1 && (
        <div 
            className="md:hidden fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
            onClick={() => setIsMobileListOpen(false)}
        >
            <div 
                className="bg-[#05070a]/95 border border-white/10 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-black/50">
                    <div className="flex items-center gap-2">
                        <List size={16} className="text-red-500" />
                        <h3 className="text-white font-bold text-sm">재생 목록 ({videoList.length})</h3>
                    </div>
                    <button onClick={() => setIsMobileListOpen(false)} className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {videoList.map((video, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                if (onVideoSelect) onVideoSelect(video.id);
                                setCurrentVideoIndex(idx);
                                handlePlay();
                                setIsMobileListOpen(false); 
                            }}
                            className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all mb-1 ${currentVideoIndex === idx ? 'bg-red-500/20 border border-red-500/50' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 border border-white/10">
                                <img src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} className="w-full h-full object-cover" alt="thumb" />
                                {currentVideoIndex === idx && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Play size={12} className="text-red-500 fill-red-500" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0 pr-2">
                                <p className={`text-xs truncate ${currentVideoIndex === idx ? 'text-red-400 font-bold' : 'text-gray-300'}`}>{video.title}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Top Controls (모바일 숨김 유지) */}
      <div className={`hidden md:flex absolute top-6 right-6 items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
            <Sparkles size={14} className="text-red-500 animate-pulse" />
            <span className="text-[10px] text-white font-bold tracking-widest uppercase">Cinema</span>
        </div>
        <button onClick={toggleFullScreen} className="p-3 bg-black/50 border border-white/10 text-white/50 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl group">
          {isFullScreen ? <Minimize2 size={20} className="group-hover:scale-90 transition-transform"/> : <Maximize2 size={20} className="group-hover:scale-110 transition-transform"/>}
        </button>
      </div>
    </div>
  );
});

export default YouTubePlayerView;