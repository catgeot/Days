import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';

// 🚨 [Fix] onAiModeChange 프로퍼티 추가 (부모 -> 자식 전달)
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
    onAiModeChange // 🚨 [New] 
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
                // 🚨 [Fix] AI 모드 신호 전달 연결
                onAiModeChange={onAiModeChange}
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