// src/pages/DailyReport/layout/Sidebar.jsx
// 🚨 [Fix/New] 수정 이유:
// 1. [Subtraction] useReport 전역 상태 완전 제거 (좀비 코드 청산).
// 2. [Routing] 로그아웃 시 closeReport() 대신 useNavigate()를 사용하여 홈('/')으로 강제 이동(Deep Linking).

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase'; 
import { useNavigate } from 'react-router-dom'; // 🚨 [New] 라우터 훅 추가

// 🧩 부품 조립 (상대 경로 유지)
import HomeButton from './HomeButton';
import QuickMemo from './QuickMemo';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  
  const navigate = useNavigate(); // 🚨 [New] 네비게이션 인스턴스 생성

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: reportData } = await supabase
          .from('reports')
          .select('images')
          .eq('user_id', user.id)
          .not('images', 'is', null)
          .order('date', { ascending: false })
          .limit(20);

        let collectedImages = [];
        if (reportData) {
          reportData.forEach(item => {
            if (Array.isArray(item.images)) collectedImages.push(...item.images);
          });
        }
        if (collectedImages.length > 0) {
          setSlides(collectedImages.slice(0, 50));
        } else if (user.user_metadata?.avatar_url) {
          setSlides([user.user_metadata.avatar_url]);
        }
      }
    };
    initData();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      navigate('/'); // 🚨 [Fix] closeReport() 대신 URL 기반 라우팅으로 복귀
    }
  };

  return (
    <>
      {/* 🚨 [Fix/Subtraction] 모바일(md 미만)에서는 사이드바 UI를 완전히 제거(hidden). PC에서는 flex로 유지 */}
      <div className="hidden md:flex w-64 h-screen bg-[#1a1c23] text-gray-400 flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300">
        <HomeButton />
        <QuickMemo user={user} />
        <UserProfile 
          user={user} 
          onLogout={handleLogout} 
          onOpenSlide={() => setIsSlideOpen(true)} 
        />
      </div>

      <SlideViewer 
        isOpen={isSlideOpen} 
        onClose={() => setIsSlideOpen(false)} 
        slides={slides} 
        user={user}
      />
    </>
  );
};

export default Sidebar;