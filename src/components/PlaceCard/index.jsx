// src/components/PlaceCard/index.jsx
// 🚨 [Fix/New] 수정 이유: Home 컨트롤 타워로부터 'isBookmarked(진실)'를 전달받아 하위 뷰로 수직 하달하는 통로 개통.

import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
import PlaceCardCompact from './modes/PlaceCardCompact';

// 🚨 [Fix] isBookmarked Props 추가 수신
const PlaceCard = ({ location, isBookmarked, onClose, onTicket, onChat, onToggleBookmark, isCompactMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
        isBookmarked={isBookmarked} // 🚨 진실 데이터 하달
        onClose={() => setIsExpanded(false)}
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
        isBookmarked={isBookmarked} // 🚨 진실 데이터 하달
        onClose={onClose} 
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  return (
    <PlaceCardSummary
      location={location}
      isBookmarked={isBookmarked} // 🚨 진실 데이터 하달
      onClose={onClose}
      onExpand={() => setIsExpanded(true)}
      onChat={onChat}
      onToggleBookmark={onToggleBookmark} 
    />
  );
};

export default PlaceCard;