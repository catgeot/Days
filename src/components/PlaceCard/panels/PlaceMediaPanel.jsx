import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';

// 🚨 [Fix/New] playerRef prop 추가
const PlaceMediaPanel = ({ galleryData, isFullScreen, toggleFullScreen, showUI, mediaMode, videoId, videos, onVideoSelect, playerRef }) => {
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
            />
        ) : (
            <YouTubePlayerView 
                // 🚨 [Fix/New] Ref Forwarding
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