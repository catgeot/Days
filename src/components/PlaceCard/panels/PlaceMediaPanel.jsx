import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';

// 🚨 [Fix] videos prop 추가: 상위(PlaceCardExpanded)에서 내려오는 배열 데이터를 받습니다.
const PlaceMediaPanel = ({ galleryData, isFullScreen, toggleFullScreen, showUI, mediaMode, videoId, videos }) => {
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
                // 🚨 [Fix] Video Array 전달 및 기존 ID 호환성 유지
                videos={videos}
                videoId={videoId} 
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                showUI={showUI}
            />
        )}
    </div>
  );
};

export default PlaceMediaPanel;