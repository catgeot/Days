// src/components/PlaceCard/panels/PlaceMediaPanel.jsx
// 🚨 [Fix/New] PlaceCardExpanded에서 내려준 비관적 UI 상태값(Loading, Error, FormUrl) Props 수용
// 🚨 [Fix/New] 수용된 상태값들을 YouTubePlayerView로 전달(Props Drilling)하여 데이터 부재 시 Fallback UI가 작동하도록 연결
// 🚨 [Performance] React.memo를 적용하여 불필요한 리렌더링 방지.

import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';
import PlaceWikiDetailsView from '../views/PlaceWikiDetailsView';

const PlaceMediaPanel = React.memo(({ 
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
    isWikiLoading,
    location,
    // 🚨 [New] 상위 컴포넌트에서 주입받은 비디오 상태 Props 추가
    isVideoLoading,
    videoError,
    googleFormUrl
}) => {
  return (
    <div className="w-full h-full relative bg-[#0a0a0a] rounded-none md:rounded-[2rem] overflow-hidden md:border md:border-white/10">
        
        {/* 🚨 [Fix] 컴포넌트를 삭제하지 않고 CSS로 숨겨서 상태(State) 보존 */}
        <div className={`w-full h-full ${mediaMode === 'GALLERY' ? 'block' : 'hidden'}`}>
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
        </div>

        <div className={`w-full h-full ${mediaMode === 'VIDEO' ? 'block' : 'hidden'}`}>
            <YouTubePlayerView 
                ref={playerRef}
                videos={videos}
                videoId={videoId} 
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                showUI={showUI}
                onVideoSelect={onVideoSelect}
                // 🚨 [New] YouTubePlayerView로 비관적 UI 제어용 Props 전달 (Wiring 완료)
                isLoading={isVideoLoading}
                error={videoError}
                googleFormUrl={googleFormUrl}
            />
        </div>

        <div className={`w-full h-full ${mediaMode === 'WIKI' ? 'block' : 'hidden'}`}>
            <PlaceWikiDetailsView 
                wikiData={wikiData} 
                isWikiLoading={isWikiLoading} 
                placeName={location?.name} 
            />
        </div>

    </div>
  );
});

export default PlaceMediaPanel;
