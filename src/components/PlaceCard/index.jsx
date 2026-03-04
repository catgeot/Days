// src/components/PlaceCard/index.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Routing] useParams 및 Outlet Context 도입 (기존 설계 유지).
// 2. [Subtraction] 중복 데이터 검색 로직 제거: Home에서 데이터 병합을 수행하므로 자식은 context만 신뢰.
// 3. [Safe Path] 레이스 컨디션 대기 + 영구적 404 방어막 구축 (유효하지 않은 주소일 경우 홈으로 강제 회귀).

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';

const PlaceCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
  const galleryData = usePlaceGallery(contextLocation); 

  useEffect(() => {
    if (!isExpanded) {
      chatData.clearChat();
    }
  }, [isExpanded, chatData]);

  // 🚨 [Fix/New] Pessimistic First (비관적 방어선)
  // 부모(Home)가 DB나 Data Lake에서 장소를 찾는 찰나의 시간은 대기하되,
  // 일정 시간(1.5초)이 지나도 contextLocation이 내려오지 않는다면 존재하지 않는 장소로 간주하고 튕겨냅니다.
  useEffect(() => {
    let timeoutId;
    if (!contextLocation && id) {
      timeoutId = setTimeout(() => {
        console.warn(`[Safe Path] 유효하지 않은 장소 ID(${id}) 접근. 메인으로 회귀합니다.`);
        navigate('/', { replace: true });
      }, 1500); 
    }
    return () => clearTimeout(timeoutId);
  }, [contextLocation, id, navigate]);

  // 부모가 데이터를 확정하기 전까지 렌더링 차단 (레이아웃 붕괴 방지)
  if (!contextLocation) return null;

  if (isExpanded) {
    return (
      <PlaceCardExpanded
        location={contextLocation}
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
      location={contextLocation}
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