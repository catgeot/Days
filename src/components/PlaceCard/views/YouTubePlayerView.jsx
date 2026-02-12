import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Maximize2, Minimize2, Play, Sparkles } from 'lucide-react';

const YouTubePlayerView = forwardRef(({ videoId, videos, isFullScreen, toggleFullScreen, showUI, onVideoSelect }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(true); 
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
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
              // 🚨 [Fix] 재생 중(1)과 버퍼링(3) 이외의 모든 상태에서 UI를 노출하도록 원천 논리 복구
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

  // 🚨 [Logic] 최초 코드의 안정적인 노출 로직으로 회귀
  const showPlaylistForce = !isPlaying || isPaused;

  return (
    <div className={`flex-1 h-full bg-[#05070a] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* 🚨 [Fix] 사용자 선호 디자인(98%/95%) 유지 */}
          <div className={`transition-all duration-500 ${isFullScreen ? 'w-full h-full p-0' : 'w-[98%] h-[95%] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5'}`}>
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
          <div className="relative z-20 w-[80%] aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20 group-hover:border-white/50 transition-all duration-300 transform group-hover:scale-105 bg-black/50">
             <img 
               key={thumbnailUrl} 
               src={thumbnailUrl}
               alt="Video Thumbnail" 
               className="w-full h-full object-cover"
               onError={handleImageError}
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

      {/* 🚨 [Fix] Playlist Section: 
          1. pointer-events-none을 적용하여 리스트 배경이 재생바를 가로막지 않도록 수정
          2. hover 시에만 노출되는 UI와 강제 노출 로직 통합 */}
      {videoList.length > 1 && showUI && (
        <div className={`absolute bottom-24 left-0 w-full z-[210] flex justify-center transition-opacity duration-500 pointer-events-none 
            ${showPlaylistForce ? '!opacity-100' : 'opacity-0 hover:opacity-100'}`}
        >
            {/* 🚨 [New] 실제 버튼 영역에만 pointer-events-auto를 주어 클릭 가능하게 설정 */}
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
                        <img 
                            src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} 
                            className="w-full h-full object-cover" 
                            alt="mini" 
                        />
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

      {/* Top Controls */}
      <div className={`absolute top-6 right-6 flex items-center gap-3 z-[220] transition-opacity ${(!showUI && isFullScreen) ? 'opacity-0' : 'opacity-100'}`}>
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