import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { usePlaceChat } from './hooks/usePlaceChat';
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import SEO from '../SEO';

const PlaceCard = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const context = useOutletContext();
  const {
    location: contextLocation,
    isBookmarked,
    onToggleBookmark,
    onClose
  } = context || {};

  const chatData = usePlaceChat();
  const { clearChat } = chatData || {};
  const galleryData = usePlaceGallery(contextLocation);

  useEffect(() => {
    return () => {
      if (clearChat) clearChat();
    };
  }, [clearChat]);

  useEffect(() => {
    let timeoutId;
    if (!contextLocation && slug) {
      timeoutId = setTimeout(() => {
        console.warn(`[Safe Path] 유효하지 않은 장소 SLUG(${slug}) 접근. 메인으로 이동합니다.`);
        navigate('/', { replace: true });
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [contextLocation, slug, navigate]);

  if (!contextLocation) return null;

  const locationName = contextLocation.name || contextLocation.destination || contextLocation.name_en || '여행지';
  const locationDesc = contextLocation.ai_context?.summary || contextLocation.desc || `${locationName}의 여행 정보와 팁을 확인하세요.`;
  const locationImage = contextLocation.thumbnail || contextLocation.image || `https://source.unsplash.com/1200x630/?${encodeURIComponent(contextLocation.name_en || locationName)}`;

  return (
    <>
      <SEO
        title={locationName}
        description={locationDesc}
        url={`/place/${slug}`}
        image={locationImage}
      />
      <PlaceCardExpanded
        location={contextLocation}
        isBookmarked={isBookmarked}
        onClose={onClose}
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark}
      />
    </>
  );
};

export default PlaceCard;
