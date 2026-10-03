import { usePlaceGallery } from '../../components/PlaceCard/hooks/usePlaceGallery';
import PlaceGalleryView from '../../components/PlaceCard/views/PlaceGalleryView';

const LOCATION = {
  slug: 'qa-gallery-writer',
  id: 'qa-gallery-writer',
  name: 'QA Gallery Writer',
  name_en: 'QA Gallery Writer',
  lat: -40.2,
  lng: -20.5,
  country: 'Testland',
};

/** 로컬 모의 응답 전용. VITE_GALLERY_WRITER_HARNESS=1 빌드에서만 라우트에 붙는다. */
export default function GallerySingleWriterHarness() {
  const gallery = usePlaceGallery(LOCATION, { enabled: true });
  return (
    <div className="h-[100dvh] w-screen bg-black">
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
