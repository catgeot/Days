// src/components/PlaceCard/panels/PlaceMediaPanel.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fix] isWikiLoading Props를 추가 수신하여 PlaceWikiDetailsView에 전달

import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';
import PlaceWikiDetailsView from '../views/PlaceWikiDetailsView';

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
    onAiModeChange,
    wikiData,
    isWikiLoading // 🚨 [Fix] 상태 수신
}) => {
  return (
    <div className="w-full h-full relative bg-[#0a0a0a] rounded-none md:rounded-[2rem] overflow-hidden md:border md:border-white/10">
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
                handleDownload={galleryData.handleDownload}
            />
        ) : mediaMode === 'VIDEO' ? (
            <YouTubePlayerView 
                ref={playerRef}
                videos={videos}
                videoId={videoId} 
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                showUI={showUI}
                onVideoSelect={onVideoSelect}
            />
        ) : (
            <PlaceWikiDetailsView 
                wikiData={wikiData} 
                isWikiLoading={isWikiLoading} // 🚨 [Fix] 상태 전달
            />
        )}
    </div>
  );
};

export default PlaceMediaPanel;