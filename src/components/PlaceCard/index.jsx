// src/components/PlaceCard/index.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Routing] useParams 및 Outlet Context 도입 (기존 설계 유지).
// 2. [Safe Path] 레이스 컨디션 대기 + 영구적 404 방어막 구축 (유효하지 않은 주소일 경우 홈으로 강제 회귀).
// 3. [Subtraction] 써머리 뷰(Summary)가 Home 컴포넌트의 순수 모달로 편입됨에 따라, 더 이상 이 컴포넌트에서 isExpanded 상태를 관리할 필요가 없습니다. 관련 로직(토글, 렌더링 분기)을 전면 삭제하고 오직 PlaceCardExpanded만을 반환하는 깔끔한 라우팅 껍데기로 다이어트했습니다.

import React, { useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { usePlaceChat } from './hooks/usePlaceChat'; 
import { usePlaceGallery } from './hooks/usePlaceGallery';
import PlaceCardExpanded from './modes/PlaceCardExpanded';

const PlaceCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const context = useOutletContext();
  const { 
    location: contextLocation, 
    isBookmarked, 
    onToggleBookmark,
    onClose // Home의 Outlet에서 주입받은 onClose (navigate('/'))
  } = context || {};

  const chatData = usePlaceChat(); 
  const { clearChat } = chatData || {}; 
  const galleryData = usePlaceGallery(contextLocation); 

  // 컴포넌트 언마운트(장소 카드 닫힘) 시 채팅 초기화 
  useEffect(() => {
    return () => {
      if (clearChat) clearChat();
    };
  }, [clearChat]);

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

  // 더 이상 isExpanded를 묻지 않고 무조건 확장 카드를 렌더링합니다.
  return (
    <PlaceCardExpanded
      location={contextLocation}
      isBookmarked={isBookmarked} 
      onClose={onClose} // 부모가 준 안전한 라우팅 닫기 함수 그대로 사용
      chatData={chatData}
      galleryData={galleryData}
      onToggleBookmark={onToggleBookmark} 
    />
  );
};

export default PlaceCard;