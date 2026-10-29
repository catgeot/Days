import React, { useMemo } from 'react';
import PlaceGalleryView from '../views/PlaceGalleryView';
import YouTubePlayerView from '../views/YouTubePlayerView';
import PlaceWikiDetailsView from '../views/PlaceWikiDetailsView';
import PlaceWorldEventsTabView from '../views/PlaceWorldEventsTabView';
import ReviewsTab from '../tabs/ReviewsTab';
import PlannerTab from '../tabs/PlannerTab';
import PlaceMobileSecondaryNav from '../common/PlaceMobileSecondaryNav';
import { getPlaceUrlParam } from '../../../pages/Home/lib/formatUrlName';
import { isGateoPlaceWorldEventsTabEnabled } from '../../../shared/gateoFeatureFlags';
import { getWorldEventsForSlug } from '../../../utils/worldEvents';

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
    refetchPlannerFromDb,
    isPlannerRefreshing,
    location,
    displayPlaceName,
    isVideoLoading,
    videoFetchError,
    isVideoEmptyResult,
    onRetryVideoFetch,
    onRetryUnplayableVideos,
    onLoadMoreVideos,
    canLoadMoreVideos,
    isLoadingMoreVideos,
    loadMoreVideoError,
    loadMoreVideoLimitCode,
    videoFetchLimitCode = null,
    externalYouTubeUrl = '',
    placeYouTubeUrl = '',
    loadMoreVideoNoNew,
    onVideoUnplayable,
    googleFormUrl,
    matchedPackage,
    onOpenPackage,
    onNavigateToPlace,
}) => {
  const placeSlug = getPlaceUrlParam(location);
  const worldEventsTabOn = isGateoPlaceWorldEventsTabEnabled();
  const showWorldEventsTab = useMemo(() => {
    if (!worldEventsTabOn) return false;
    const slugKey = String(placeSlug || location?.slug || '')
      .trim()
      .toLowerCase();
    return slugKey ? getWorldEventsForSlug(slugKey).length > 0 : false;
  }, [worldEventsTabOn, placeSlug, location?.slug]);

  const mobileSecondaryNav = useMemo(
    () => (
      <PlaceMobileSecondaryNav
        placement="scroll"
        mediaMode={mediaMode}
        setMediaMode={setMediaMode}
        matchedPackage={matchedPackage}
        onOpenPackage={onOpenPackage}
        placeSlug={placeSlug}
        showWorldEventsTab={showWorldEventsTab}
      />
    ),
    [mediaMode, setMediaMode, matchedPackage, onOpenPackage, placeSlug, showWorldEventsTab]
  );

  return (
    <div className="w-full h-full relative bg-[#0a0a0a] rounded-none lg:rounded-[2rem] overflow-hidden lg:border lg:border-white/10">

        <div className={`w-full h-full ${mediaMode === 'GALLERY' ? 'block' : 'hidden'}`}>
            <PlaceGalleryView
                location={location}
                images={galleryData.images}
                isImgLoading={galleryData.isImgLoading}
                isRefreshing={galleryData.isRefreshing}
                selectedImg={galleryData.selectedImg}
                setSelectedImg={galleryData.setSelectedImg}
                isFullScreen={isFullScreen}
                toggleFullScreen={toggleFullScreen}
                closeImageKeepFullscreen={(e) => { e.stopPropagation(); galleryData.setSelectedImg(null); }}
                showUI={showUI}
                handleDownload={galleryData.handleDownload}
                handleRefresh={galleryData.handleRefresh}
                getRefreshCooldownRemaining={galleryData.getRefreshCooldownRemaining}
                refreshCooldownSec={galleryData.refreshCooldownSec}
                galleryAtMax={galleryData.galleryAtMax}
                handleHideGalleryImage={galleryData.handleHideGalleryImage}
                handleReportGalleryImage={galleryData.handleReportGalleryImage}
                handleAdminRemoveGalleryImage={galleryData.handleAdminRemoveGalleryImage}
                isGalleryAdmin={galleryData.isGalleryAdmin}
                handleDropBrokenImage={galleryData.handleDropBrokenImage}
                loadFailed={galleryData.loadFailed}
                handleRetryLoad={galleryData.handleRetryLoad}
                mobileSecondaryNav={mobileSecondaryNav}
                isGalleryPanelActive={mediaMode === 'GALLERY'}
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
                fetchError={videoFetchError}
                onRetry={onRetryVideoFetch}
                onRetryUnplayable={onRetryUnplayableVideos}
                isEmptyResult={isVideoEmptyResult}
                onLoadMore={onLoadMoreVideos}
                canLoadMore={canLoadMoreVideos}
                isLoadingMore={isLoadingMoreVideos}
                onVideoUnplayable={onVideoUnplayable}
                loadMoreError={loadMoreVideoError}
                loadMoreLimitCode={loadMoreVideoLimitCode}
                fetchLimitCode={videoFetchLimitCode}
                externalYouTubeUrl={externalYouTubeUrl}
                placeYouTubeUrl={placeYouTubeUrl}
                loadMoreNoNew={loadMoreVideoNoNew}
                mobileSecondaryNav={mobileSecondaryNav}
            />
        </div>

        <div className={`w-full h-full ${mediaMode === 'WIKI' ? 'block' : 'hidden'}`}>
            <PlaceWikiDetailsView
                wikiData={wikiData}
                isWikiLoading={isWikiLoading}
                placeName={displayPlaceName || location?.name}
                countryName={location?.country}
                location={location}
                galleryData={galleryData}
                isActive={mediaMode === 'WIKI'}
                matchedPackage={matchedPackage}
                onOpenPackage={onOpenPackage}
                onNavigateToPlace={onNavigateToPlace}
                mobileSecondaryNav={mobileSecondaryNav}
            />
        </div>

        <div className={`w-full h-full bg-[#f8f9fa] overflow-hidden ${mediaMode === 'PLANNER' ? 'block' : 'hidden'}`}>
            <PlannerTab
              location={location}
              plannerData={plannerData}
              isPlannerLoading={isPlannerLoading}
              refetchPlannerFromDb={refetchPlannerFromDb}
              isPlannerRefreshing={isPlannerRefreshing}
              isActive={mediaMode === 'PLANNER'}
              matchedPackage={matchedPackage}
              onOpenPackage={onOpenPackage}
              mobileSecondaryNav={mobileSecondaryNav}
            />
        </div>

        <div className={`w-full h-full bg-white overflow-hidden ${mediaMode === 'REVIEWS' ? 'block' : 'hidden'}`}>
            <ReviewsTab
              location={location}
              setMediaMode={setMediaMode}
              mobileSecondaryNav={mobileSecondaryNav}
              isActive={mediaMode === 'REVIEWS'}
            />
        </div>

        {showWorldEventsTab ? (
          <div className={`w-full h-full ${mediaMode === 'WORLD_EVENTS' ? 'block' : 'hidden'}`}>
            <PlaceWorldEventsTabView location={location} mobileSecondaryNav={mobileSecondaryNav} />
          </div>
        ) : null}

    </div>
  );
});

export default PlaceMediaPanel;
