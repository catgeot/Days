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

  // 🚨 [Fix] 외부 제어 메서드 확장 (playVideo 추가 및 seekTo 강화)
  useImperativeHandle(ref, () => ({
    seekTo: (seconds) => {
      // 1. 커버 모드(정지 상태)인 경우 -> iframe 모드로 전환 후 지연 실행
      if (!isPlaying) {
          setIsPlaying(true);
          setIsPaused(false);
          
          // 🚨 iframe이 DOM에 그려질 때까지 0.5초 대기 후 명령 전송
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
      
      // 2. 이미 재생 모드(iframe 존재)인 경우 -> 즉시 실행
      if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*'
          );
          // 🚨 이동 후 확실하게 재생하도록 playVideo 명령 추가 전송
          iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
          );
      }
    },
    // 🚨 [New] 부모 컴포넌트(PlaceCardExpanded)가 호출할 playVideo 함수 노출
    playVideo: () => {
        if (!isPlaying) {
            setIsPlaying(true);
            setIsPaused(false);
        }
        // iframe이 있다면 재생 명령 전송
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'
            );
        }
    }
  }));

  // 메시지 수신 로직 (기존 유지)
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

  // 비디오 변경 시 초기화 (기존 유지)
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
    <div className={`flex-1 h-full bg-[#05070a] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl transition-all duration-500 caret-transparent select-none outline-none ${isFullScreen ? 'fixed inset-0 z-[200] w-screen h-screen rounded-none border-none' : ''}`}>
      
      {isPlaying ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <div className={`w-full h-full transition-all duration-500 ${isFullScreen ? 'p-0' : 'max-w-[95%] max-h-[90%] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5'}`}>
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

      {/* Playlist Section (기존 유지) */}
      {videoList.length > 1 && showUI && (
        <div className={`absolute bottom-24 left-0 w-full z-[210] flex justify-center transition-opacity duration-500 pointer-events-none 
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

      {/* Top Controls (기존 유지) */}
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