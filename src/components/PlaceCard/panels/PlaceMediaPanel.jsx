import React from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';
import PlaceWikiDetailsView from '../views/PlaceWikiDetailsView';
import ReviewsTab from '../tabs/ReviewsTab';
import PlannerTab from '../tabs/PlannerTab';

const PlaceMediaPanel = React.memo(({
    galleryData,
    isFullScreen,
    toggleFullScreen,
    showUI,
    mediaMode,
    setMediaMode,
    videoId,
    videos,
    onVideoSelect,
    playerRef,
    onAiModeChange: _onAiModeChange,
    wikiData,
    isWikiLoading,
    plannerData,
    isPlannerLoading,
    location,
    isVideoLoading,
    videoError: _videoError,
    googleFormUrl,
    matchedPackage,
    onOpenPackage
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
                handleRemoveImage={galleryData.handleRemoveImage}
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
                googleFormUrl={googleFormUrl}
            />
        </div>

        <div className={`w-full h-full ${mediaMode === 'WIKI' ? 'block' : 'hidden'}`}>
            <PlaceWikiDetailsView
                wikiData={wikiData}
                isWikiLoading={isWikiLoading}
                placeName={location?.name}
                countryName={location?.country}
                location={location}
                galleryData={galleryData}
                isActive={mediaMode === 'WIKI'}
                matchedPackage={matchedPackage}
                onOpenPackage={onOpenPackage}
            />
        </div>

        <div className={`w-full h-full bg-[#f8f9fa] overflow-hidden ${mediaMode === 'PLANNER' ? 'block' : 'hidden'}`}>
            <PlannerTab location={location} plannerData={plannerData} isPlannerLoading={isPlannerLoading} isActive={mediaMode === 'PLANNER'} matchedPackage={matchedPackage} onOpenPackage={onOpenPackage} />
        </div>

        <div className={`w-full h-full bg-white overflow-hidden ${mediaMode === 'REVIEWS' ? 'block' : 'hidden'}`}>
            <ReviewsTab location={location} setMediaMode={setMediaMode} />
        </div>

    </div>
  );
});

export default PlaceMediaPanel;
