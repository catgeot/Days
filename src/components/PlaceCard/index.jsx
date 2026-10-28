import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlaceGallery } from './hooks/usePlaceGallery';
import { usePlaceReviewSeoStats } from '../../hooks/usePlaceReviewSeoStats';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import SEO from '../SEO';
import { useLocale } from '../../i18n/LocaleProvider';
import {
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
  getPlaceTabSeoTitle,
} from '../../pages/Home/lib/placeSeoText.js';
import { isGateoPlaceWorldEventsTabEnabled } from '../../shared/gateoFeatureFlags';
import { mediaModeFromUrlTab } from './common/placeMediaTabRoutes';

const PlaceCard = () => {
  const { slug, tab } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { locale } = useLocale();

  const context = useOutletContext();
  const {
    location: contextLocation,
    isBookmarked,
    onToggleBookmark,
    onClose,
    onOpenMooni,
    onNavigateToPlace,
    onGoHome,
    isMooniChatOpen = false,
  } = context || {};

  const galleryData = usePlaceGallery(contextLocation);

  const currentTab = tab || 'gallery';
  const allowedUrlTabs = ['wiki', 'reviews', 'gallery', 'video', 'planner'];
  if (isGateoPlaceWorldEventsTabEnabled()) {
    allowedUrlTabs.push('events');
  }
  const tabKey = allowedUrlTabs.includes(currentTab) ? currentTab : 'gallery';
  const initialTabForExpanded =
    tabKey === 'events' ? 'WORLD_EVENTS' : mediaModeFromUrlTab(tabKey);

  const reviewPlaceSlug =
    contextLocation?.id != null &&
    (String(contextLocation.id).startsWith('search-') ||
      String(contextLocation.id).startsWith('loc-'))
      ? String(contextLocation.id)
      : contextLocation?.slug || String(contextLocation?.id ?? '');
  const reviewSeoStats = usePlaceReviewSeoStats(
    tabKey === 'reviews' && reviewPlaceSlug ? reviewPlaceSlug : null,
  );

  useEffect(() => {
    if (!contextLocation || !slug) return;
    if (currentTab === tabKey) return;
    const path = tabKey === 'gallery' ? `/place/${slug}` : `/place/${slug}/${tabKey}`;
    navigate({ pathname: path, search: window.location.search }, { replace: true });
  }, [contextLocation, slug, currentTab, tabKey, navigate]);

  useEffect(() => {
    let timeoutId;
    if (!contextLocation && slug) {
      timeoutId = setTimeout(() => {
        console.warn(`[Safe Path] 유효하지 않은 장소 SLUG(${slug}) 접근. 메인으로 이동합니다.`);
        navigate('/', { replace: true });
      }, 3500);
    }
    return () => clearTimeout(timeoutId);
  }, [contextLocation, slug, navigate]);

  if (!contextLocation) return null;

  const locationDesc = getPlaceTabSeoDescription(contextLocation, locale, tabKey, t);
  const seoTitle = getPlaceTabSeoTitle(contextLocation, locale, tabKey);
  const seoKeywords = getPlaceSeoKeywords(contextLocation, locale, tabKey);
  const seoPath = `/place/${slug}/${tabKey}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={locationDesc}
        keywords={seoKeywords}
        url={seoPath}
        location={contextLocation}
        tab={tabKey}
        galleryImages={tabKey === 'gallery' ? galleryData?.images : null}
        reviewStats={tabKey === 'reviews' ? reviewSeoStats : null}
      />
      <PlaceCardExpanded
        location={contextLocation}
        isBookmarked={isBookmarked}
        onClose={onClose}
        onOpenMooni={onOpenMooni}
        onNavigateToPlace={onNavigateToPlace}
        onGoHome={onGoHome}
        isMooniChatOpen={isMooniChatOpen}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark}
        initialTab={initialTabForExpanded}
      />
    </>
  );
};

export default PlaceCard;
