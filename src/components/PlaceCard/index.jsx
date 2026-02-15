// src/components/PlaceCard/index.jsx
// 🚨 [Fix] onToggleBookmark 하위 뷰로 전달 통로 개통

import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
import PlaceCardCompact from './modes/PlaceCardCompact';

// 🚨 [Fix] onToggleBookmark 추가
const PlaceCard = ({ location, onClose, onTicket, onChat, onToggleBookmark, isCompactMode }) => {
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
        onClose={() => setIsExpanded(false)}
        chatData={chatData}
        galleryData={galleryData}
        onToggleBookmark={onToggleBookmark} // 🚨 연결
      />
    );
  }

  if (isCompactMode) {
    return (
      <PlaceCardCompact 
        location={location} 
        onClose={onClose} 
        onToggleBookmark={onToggleBookmark} // 🚨 연결
      />
    );
  }

  return (
    <PlaceCardSummary
      location={location}
      onClose={onClose}
      onExpand={() => setIsExpanded(true)}
      onChat={onChat}
      onToggleBookmark={onToggleBookmark} // 🚨 연결
    />
  );
};

export default PlaceCard;