import React from 'react';
import PlaceGalleryView from '../../components/PlaceCard/views/PlaceGalleryView';
import { usePlaceGallery } from '../../components/PlaceCard/hooks/usePlaceGallery';

/** pickPlaceStats vs canonical(tour-128113) 검증용 — DB는 모의, 라우트는 QA 전용 빌드만 */
const LOCATION = {
  slug: 'tour-128113',
  id: '128113',
  name: '공주 우금치 전적',
  name_en: 'Ugeumchi Battlefield',
  lat: 36.45,
  lng: 127.12,
  country: 'South Korea',
};

export default function GalleryPlaceIdMismatchHarness() {
  const gallery = usePlaceGallery(LOCATION, { enabled: true });
  return (
    <div className="h-[100dvh] w-screen bg-black">
      <p className="sr-only">QA gallery place_id mismatch harness</p>
      <PlaceGalleryView
        location={LOCATION}
        images={gallery.images}
        isImgLoading={gallery.isImgLoading}
        isRefreshing={gallery.isRefreshing}
        selectedImg={gallery.selectedImg}
        setSelectedImg={gallery.setSelectedImg}
        isFullScreen={false}
        toggleFullScreen={() => {}}
        closeImageKeepFullscreen={() => gallery.setSelectedImg(null)}
        showUI
        handleDownload={gallery.handleDownload}
        handleRefresh={gallery.handleRefresh}
        getRefreshCooldownRemaining={gallery.getRefreshCooldownRemaining}
        refreshCooldownSec={gallery.refreshCooldownSec}
        galleryAtMax={gallery.galleryAtMax}
        handleHideGalleryImage={gallery.handleHideGalleryImage}
        handleReportGalleryImage={gallery.handleReportGalleryImage}
        handleAdminRemoveGalleryImage={gallery.handleAdminRemoveGalleryImage}
        isGalleryAdmin={gallery.isGalleryAdmin}
        handleDropBrokenImage={gallery.handleDropBrokenImage}
        loadFailed={gallery.loadFailed}
        handleRetryLoad={gallery.handleRetryLoad}
      />
    </div>
  );
}
