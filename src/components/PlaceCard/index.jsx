// src/components/PlaceCard/index.jsx
// 🚨 [Fix] onChat Prop 연결 누락 수정 (Home에서 넘어온 채팅 시작 함수를 하위로 전달)

import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
import PlaceCardCompact from './modes/PlaceCardCompact';

// 🚨 [Fix] onChat 추가
const PlaceCard = ({ location, onClose, onTicket, onChat, isCompactMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const chatData = usePlaceChat(); 
  const galleryData = usePlaceGallery(location); 

  // Reset logic
  useEffect(() => {
    if (!isExpanded) {
      chatData.clearChat();
    }
  }, [isExpanded, chatData.clearChat]);

  if (!location) return null;

  // 1. Expanded Mode (Full Modal)
  if (isExpanded) {
    return (
      <PlaceCardExpanded
        location={location}
        onClose={() => setIsExpanded(false)}
        chatData={chatData}
        galleryData={galleryData}
      />
    );
  }

  // 2. Compact Mode (Floating Pill)
  if (isCompactMode) {
    return (
      <PlaceCardCompact 
        location={location} 
        onClose={onClose} 
      />
    );
  }

  // 3. Summary Mode (Standard Card)
  return (
    <PlaceCardSummary
      location={location}
      onClose={onClose}
      onExpand={() => setIsExpanded(true)}
      // 🚨 [Fix] onTicket 제거 및 onChat 전달 (요구사항 3번에 따라 '여행 계획' 버튼 삭제를 위해)
      onChat={onChat}
    />
  );
};

export default PlaceCard;