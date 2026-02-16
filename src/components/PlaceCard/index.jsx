// src/components/PlaceCard/index.jsx
// 🚨 [Fix] 외부 제어권(Home의 isCardExpanded) 수신 및 동기화를 위한 initialExpanded, onExpandChange 통로 개통 (지구본 증발 버그 픽스)

import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
import PlaceCardCompact from './modes/PlaceCardCompact';

// 🚨 [Fix] initialExpanded, onExpandChange Props 추가
const PlaceCard = ({ location, isBookmarked, onClose, onTicket, onChat, onToggleBookmark, isCompactMode, initialExpanded, onExpandChange }) => {
  // 🚨 [Fix] 부모의 지시를 초기값으로 설정
  const [isExpanded, setIsExpanded] = useState(initialExpanded || false);
  
  // 🚨 [Fix] 부모의 상태 변경(다이렉트 오픈)을 감지하여 실시간 동기화
  useEffect(() => {
    if (initialExpanded !== undefined) {
      setIsExpanded(initialExpanded);
    }
  }, [initialExpanded]);

  // 🚨 [Fix] 내부에서 카드를 열고 닫을 때 부모에게도 알려서 isFocusMode(지구본 숨김) 상태를 동기화
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
        onClose={() => handleToggleExpand(false)} // 🚨 [Fix] 닫을 때 부모에게 알림
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  if (isCompactMode) {
    return (
      <PlaceCardCompact 
        location={location} 
        isBookmarked={isBookmarked} 
        onClose={onClose} 
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  return (
    <PlaceCardSummary
      location={location}
      isBookmarked={isBookmarked} 
      onClose={onClose}
      onExpand={() => handleToggleExpand(true)} // 🚨 [Fix] 열 때 부모에게 알림
      onChat={onChat}
      onToggleBookmark={onToggleBookmark} 
    />
  );
};

export default PlaceCard;