// src/components/PlaceCard/index.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Routing] useParams를 도입하여 URL 파라미터 기반 작동
// 2. [Pessimistic First] 잘못된 URL 직접 접근 시 404 리다이렉트 (안전 경로 확보)
// 3. [Context] 부모(Home)에서 Outlet을 통해 내려준 데이터를 수신하여 결합

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';

// 독립적인 데이터 검증을 위한 원본 데이터 호출
import { TRAVEL_SPOTS } from '../../pages/Home/data/travelSpots'; 

const PlaceCard = () => {
  // 🚨 [New] 라우터 제어 및 ID 획득
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🚨 [New] 부모 라우트(Home)에서 전달한 컨텍스트 수신 (안전망 처리)
  const context = useOutletContext();
  const { 
    location: contextLocation, 
    isBookmarked, 
    onClose, 
    onTicket, 
    onChat, 
    onToggleBookmark, 
    initialExpanded, 
    onExpandChange, 
    isTickerExpanded 
  } = context || {};

  const [isExpanded, setIsExpanded] = useState(initialExpanded || false);
  const [verifiedLocation, setVerifiedLocation] = useState(contextLocation);

  // 🚨 [Fix] Pessimistic First (비관적 데이터 검증)
  useEffect(() => {
    if (!contextLocation && id) {
      // 부모로부터 받은 선택된 장소가 없다면 (URL 직접 치고 들어온 경우), 로컬 데이터에서 스스로 찾습니다.
      const target = TRAVEL_SPOTS.find(s => String(s.id) === id || s.name === id);
      
      if (target) {
        setVerifiedLocation(target);
      } else {
        console.warn("🚨 [Pessimistic First] 유효하지 않은 장소 데이터입니다. 메인 홈으로 안전하게 튕겨냅니다.");
        navigate('/', { replace: true });
      }
    } else {
      setVerifiedLocation(contextLocation);
    }
  }, [id, contextLocation, navigate]);

  useEffect(() => {
    if (initialExpanded !== undefined) {
      setIsExpanded(initialExpanded);
    }
  }, [initialExpanded]);

  const handleToggleExpand = (state) => {
    setIsExpanded(state);
    if (onExpandChange) onExpandChange(state);
  };

  const chatData = usePlaceChat(); 
  const galleryData = usePlaceGallery(verifiedLocation); 

  useEffect(() => {
    if (!isExpanded) {
      chatData.clearChat();
    }
  }, [isExpanded, chatData.clearChat]);

  // 검증된 장소가 없으면 렌더링을 차단합니다.
  if (!verifiedLocation) return null;

  if (isExpanded) {
    return (
      <PlaceCardExpanded
        location={verifiedLocation}
        isBookmarked={isBookmarked} 
        onClose={() => handleToggleExpand(false)} 
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  return (
    <PlaceCardSummary
      location={verifiedLocation}
      isBookmarked={isBookmarked} 
      onClose={onClose}
      onExpand={() => handleToggleExpand(true)} 
      onChat={onChat}
      onToggleBookmark={onToggleBookmark} 
      isTickerExpanded={isTickerExpanded} 
    />
  );
};

export default PlaceCard;