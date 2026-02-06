import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';

// 🚨 [Fix] onVideoSelect prop 추가: 비디오 변경 요청을 부모에게 전달
const PlaceMediaPanel = ({ galleryData, isFullScreen, toggleFullScreen, showUI, mediaMode, videoId, videos, onVideoSelect }) => {
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
                videos={videos}
                videoId={videoId} 
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                showUI={showUI}
                // 🚨 [Fix] 비디오 선택 이벤트 연결
                onVideoSelect={onVideoSelect}
            />
        )}
    </div>
  );
};

export default PlaceMediaPanel;