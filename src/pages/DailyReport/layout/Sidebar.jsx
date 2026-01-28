// 🚨 [Fix] Supabase 및 하위 부품들의 경로를 새로운 위치에 맞춰 수정했습니다.
// 🛡️ [Maintain] 메모 및 슬라이드쇼 로직은 기존 기능을 그대로 유지합니다.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../src/shared/api/supabase'; // 🚨 [Fix] 경로 최적화

// 🧩 부품 조립 (상대 경로 유지)
import HomeButton from './HomeButton';
import QuickMemo from './QuickMemo';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';

const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);

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
      navigate('/');
    }
  };

  return (
    <>
      <div className="w-64 h-screen bg-[#1a1c23] text-gray-400 flex flex-col border-r border-gray-800 flex-shrink-0 transition-all duration-300">
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