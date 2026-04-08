import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { usePlaceChat } from './hooks/usePlaceChat';
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import SEO from '../SEO';

const TAB_METADATA = {
  wiki: {
    suffix: '여행 정보 & 위키',
    descTemplate: (name) => `${name}의 역사, 문화, 관광 명소 정보를 AI 도슨트와 함께 탐색하세요.`,
  },
  reviews: {
    suffix: '여행 후기 & 리뷰',
    descTemplate: (name) => `${name}을(를) 다녀온 여행자들의 생생한 후기와 평점을 확인하세요.`,
  },
  gallery: {
    suffix: '사진 갤러리',
    descTemplate: (name) => `${name}의 아름다운 풍경을 사진으로 만나보세요.`,
  },
  video: {
    suffix: '여행 영상',
    descTemplate: (name) => `${name}의 생생한 현장 영상을 통해 미리 경험해보세요.`,
  },
  planner: {
    suffix: '여행 준비 가이드',
    descTemplate: (name) => `${name} 여행에 필요한 모든 정보와 팁을 확인하세요.`,
  },
};

const PlaceCard = () => {
  const { slug, tab } = useParams();
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

  const currentTab = tab || 'gallery';
  const locationName = contextLocation.name || contextLocation.destination || contextLocation.name_en || '여행지';

  const metadata = TAB_METADATA[currentTab] || TAB_METADATA.gallery;
  const locationDesc = metadata.descTemplate(locationName);
  const locationImage = contextLocation.thumbnail || contextLocation.image || `https://source.unsplash.com/1200x630/?${encodeURIComponent(contextLocation.name_en || locationName)}`;

  return (
    <>
      <SEO
        title={`${locationName} ${metadata.suffix}`}
        description={locationDesc}
        url={`/place/${slug}${tab ? `/${tab}` : ''}`}
        image={locationImage}
      />
      <PlaceCardExpanded
        location={contextLocation}
        isBookmarked={isBookmarked}
        onClose={onClose}
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark}
        initialTab={currentTab.toUpperCase()}
      />
    </>
  );
};

export default PlaceCard;
