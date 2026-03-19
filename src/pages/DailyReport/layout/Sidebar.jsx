import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { useNavigate } from 'react-router-dom';

import HomeButton from './HomeButton';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';
import PublicNav from './PublicNav';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const navigate = useNavigate();

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

        // 1. 프로필 사진을 가장 먼저(index 0) 추가
        if (user.user_metadata?.avatar_url) {
          collectedImages.push(user.user_metadata.avatar_url);
        }

        if (reportData) {
          reportData.forEach(item => {
            if (Array.isArray(item.images)) collectedImages.push(...item.images);
          });
        }

        if (collectedImages.length > 0) {
          setSlides(collectedImages.slice(0, 50));
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
      <div className="hidden md:flex w-64 h-screen bg-white text-gray-700 flex-col border-r border-gray-200 flex-shrink-0 transition-all duration-300">
        <HomeButton />
        <PublicNav />
        {user && (
          <UserProfile
            user={user}
            onLogout={handleLogout}
            onOpenSlide={() => setIsSlideOpen(true)}
          />
        )}
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
