import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import SEO from '../SEO';
import { getLocalizedPlaceName } from './common/locationDisplay';
import { useLocale } from '../../i18n/LocaleProvider';
import {
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
  getPlaceTabSeoTitle,
} from '../../pages/Home/lib/placeSeoText.js';

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

  const currentTab = tab || 'gallery';
  const locationName =
    getLocalizedPlaceName(contextLocation, locale) || t('place.fallback.destination');

  const tabKey = ['wiki', 'reviews', 'gallery', 'video', 'planner'].includes(currentTab)
    ? currentTab
    : 'gallery';
  const locationDesc = getPlaceTabSeoDescription(contextLocation, locale, tabKey, t);
  const seoTitle = getPlaceTabSeoTitle(contextLocation, locale, tabKey);
  const locationImage = contextLocation.thumbnail || contextLocation.image || `https://source.unsplash.com/1200x630/?${encodeURIComponent(contextLocation.name_en || locationName)}`;
  const seoKeywords = getPlaceSeoKeywords(contextLocation, locale, tabKey);
  const seoPath = `/place/${slug}/${tabKey}`;

  return (
    <>
      <SEO
        title={seoTitle}
        description={locationDesc}
        keywords={seoKeywords}
        url={seoPath}
        image={locationImage}
        location={contextLocation}
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
        initialTab={currentTab.toUpperCase()}
      />
    </>
  );
};

export default PlaceCard;
