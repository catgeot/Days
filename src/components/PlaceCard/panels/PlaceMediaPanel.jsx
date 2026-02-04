import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView'; // 🚨 신설 컴포넌트

const PlaceMediaPanel = ({ galleryData, isFullScreen, toggleFullScreen, showUI, mediaMode, videoId }) => {
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