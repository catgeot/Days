// src/components/PlaceCard/index.jsx
import React, { useState, useEffect } from 'react';
import { usePlaceChat } from './hooks/usePlaceChat'; // 🚨 경로 주의
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';
import PlaceCardSummary from './modes/PlaceCardSummary';
import PlaceCardCompact from './modes/PlaceCardCompact';

// 🚨 [New] Container Component: 오직 로직과 상태만 관리합니다.
const PlaceCard = ({ location, onClose, onTicket, isCompactMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 🚨 [Fix] Hook Connection: 객체(location) 전체 전달로 데이터 활용도 증대
  const chatData = usePlaceChat(); // { chatHistory, isAiLoading, sendMessage, clearChat }
  const galleryData = usePlaceGallery(location); // { images, isImgLoading, selectedImg, setSelectedImg }

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
      onTicket={onTicket}
    />
  );
};

export default PlaceCard;