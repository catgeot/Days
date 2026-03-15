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
    isVideoLoading,
    videoError,
    googleFormUrl
}) => {
  return (
    <div className="w-full h-full relative bg-[#0a0a0a] rounded-none md:rounded-[2rem] overflow-hidden md:border md:border-white/10">
        
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
                handleRefresh={galleryData.handleRefresh}
                handleCurateImage={galleryData.handleCurateImage}
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
                countryName={location?.country}
            />
        </div>

    </div>
  );
});

export default PlaceMediaPanel;
