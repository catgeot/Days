// src/components/PlaceCard/index.jsx
// 🚨 [Fix] 외부 제어권 수신 및 동기화 유지, 컴팩트 모드 완전 폐지

import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
// 🚨 [Fix] PlaceCardCompact 임포트 삭제 (컴팩트 모드 폐지)

// 🚨 [Fix] isCompactMode prop을 제거하고, isTickerExpanded prop을 새로 추가
const PlaceCard = ({ location, isBookmarked, onClose, onTicket, onChat, onToggleBookmark, initialExpanded, onExpandChange, isTickerExpanded }) => {
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
  const galleryData = usePlaceGallery(location); 

  useEffect(() => {
    if (!isExpanded) {
      chatData.clearChat();
    }
  }, [isExpanded, chatData.clearChat]);

  if (!location) return null;

  if (isExpanded) {
    return (
      <PlaceCardExpanded
        location={location}
        isBookmarked={isBookmarked} 
        onClose={() => handleToggleExpand(false)} 
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  // 🚨 [Fix] if (isCompactMode) { ... } 렌더링 블록 완전 삭제

  return (
    <PlaceCardSummary
      location={location}
      isBookmarked={isBookmarked} 
      onClose={onClose}
      onExpand={() => handleToggleExpand(true)} 
      onChat={onChat}
      onToggleBookmark={onToggleBookmark} 
      // 🚨 [New] 트래블 티커의 열림 상태를 Summary 카드로 전달
      isTickerExpanded={isTickerExpanded} 
    />
  );
};

export default PlaceCard;