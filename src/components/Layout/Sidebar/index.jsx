import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase'; // 경로 주의

// 🧩 부품 조립
import HomeButton from './HomeButton';
import QuickMemo from './QuickMemo';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';

const Sidebar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  // 1. 유저 정보 & 슬라이드 이미지 로드 (데이터 페칭 로직만 여기에 남김)
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 일보에서 이미지 긁어오기
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
        {/* 1. 홈 버튼 구역 */}
        <HomeButton />

        {/* 2. 메모장 구역 (가변 높이) */}
        <QuickMemo user={user} />

        {/* 3. 프로필 구역 (하단 고정) */}
        <UserProfile 
          user={user} 
          onLogout={handleLogout} 
          onOpenSlide={() => setIsSlideOpen(true)} 
        />
      </div>

      {/* 4. 슬라이드 뷰어 (모달) */}
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