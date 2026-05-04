import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { useNavigate } from 'react-router-dom';

import HomeButton from './HomeButton';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';
import PublicNav from './PublicNav';

const Sidebar = ({ user }) => {
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadSlides = async () => {
      if (!user) {
        setSlides([]);
        return;
      }

      const { data: reportData } = await supabase
        .from('reports')
        .select('images')
        .eq('user_id', user.id)
        .not('images', 'is', null)
        .order('date', { ascending: false })
        .limit(20);

      let collectedImages = [];

      if (user.user_metadata?.avatar_url) {
        collectedImages.push(user.user_metadata.avatar_url.replace(/^http:\/\//i, 'https://'));
      }

      if (reportData) {
        reportData.forEach(item => {
          if (Array.isArray(item.images)) collectedImages.push(...item.images);
        });
      }

      if (collectedImages.length > 0) {
        setSlides(collectedImages.slice(0, 50));
      } else {
        setSlides([]);
      }
    };
    void loadSlides();
  }, [user?.id]);

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
        <div className="mt-auto">
          {user ? (
            <UserProfile
              user={user}
              onLogout={handleLogout}
              onOpenSlide={() => setIsSlideOpen(true)}
            />
          ) : (
            <div className="p-4 border-t border-gray-100">
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center flex flex-col items-center">
                <h4 className="text-[13px] font-bold text-gray-800 mb-2">나만의 여행 기록</h4>
                <p className="text-[11px] text-gray-600 mb-5 leading-relaxed break-keep">
                  로그인하고 전 세계 명소 리뷰와<br/>생생한 여행기를 작성해보세요.
                </p>
                <button
                  onClick={() => navigate('/auth/login')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95"
                >
                  로그인 / 회원가입
                </button>
              </div>
            </div>
          )}
        </div>
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
