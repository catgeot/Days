// src/components/PlaceCard/panels/PlaceMediaPanel.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [New] galleryData에 탑재된 handleDownload 함수를 PlaceGalleryView로 브릿지 연결
// 2. [Subtraction] PlaceGalleryView에서 더 이상 사용하지 않는 onAiModeChange 프롭 전달 제거 (불필요한 의존성 제거)

import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';

const PlaceMediaPanel = ({ 
    galleryData, 
    isFullScreen, 
    toggleFullScreen, 
    showUI, 
    mediaMode, 
    videoId, 
    videos, 
    onVideoSelect, 
    playerRef,
    onAiModeChange 
}) => {
  return (
    <div className="w-full h-full">
        {mediaMode === 'GALLERY' ? (
            <PlaceGalleryView 
                images={galleryData.images}
                isImgLoading={galleryData.isImgLoading}
                selectedImg={galleryData.selectedImg}
                setSelectedImg={galleryData.setSelectedImg}
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                closeImageKeepFullscreen={(e) => { e.stopPropagation(); galleryData.setSelectedImg(null); }}
                showUI={showUI}
                // 🚨 [New] 트래킹 및 다운로드 실행 로직 연결
                handleDownload={galleryData.handleDownload}
            />
        ) : (
            <YouTubePlayerView 
                ref={playerRef}
                videos={videos}
                videoId={videoId} 
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                showUI={showUI}
                onVideoSelect={onVideoSelect}
            />
        )}
    </div>
  );
};

export default PlaceMediaPanel;