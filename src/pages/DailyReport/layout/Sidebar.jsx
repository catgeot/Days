// src/pages/DailyReport/layout/Sidebar.jsx
// ?š¨ [Fix/New] ?˜ì • ?´ìœ :
// 1. [Subtraction] useReport ?„ì—­ ?íƒœ ?„ì „ ?œê±° (ì¢€ë¹?ì½”ë“œ ì²?‚°).
// 2. [Routing] ë¡œê·¸?„ì›ƒ ??closeReport() ?€??useNavigate()ë¥??¬ìš©?˜ì—¬ ??'/')?¼ë¡œ ê°•ì œ ?´ë™(Deep Linking).

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabase'; 
import { useNavigate } from 'react-router-dom'; // ?š¨ [New] ?¼ìš°????ì¶”ê?

// ?§© ë¶€??ì¡°ë¦½ (?ë? ê²½ë¡œ ? ì?)
import HomeButton from './HomeButton';
import QuickMemo from './QuickMemo';
import UserProfile from './UserProfile';
import SlideViewer from './SlideViewer';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [slides, setSlides] = useState([]);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  
  const navigate = useNavigate(); // ?š¨ [New] ?¤ë¹„ê²Œì´???¸ìŠ¤?´ìŠ¤ ?ì„±

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
    if (window.confirm("ë¡œê·¸?„ì›ƒ ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
      await supabase.auth.signOut();
      navigate('/'); // ?š¨ [Fix] closeReport() ?€??URL ê¸°ë°˜ ?¼ìš°?…ìœ¼ë¡?ë³µê?
    }
  };

  return (
    <>
      {/* ?š¨ [Fix/Subtraction] ëª¨ë°”??md ë¯¸ë§Œ)?ì„œ???¬ì´?œë°” UIë¥??„ì „???œê±°(hidden). PC?ì„œ??flexë¡?? ì? */}
      <div className="hidden md:flex w-64 h-screen bg-white text-gray-700 flex-col border-r border-gray-200 flex-shrink-0 transition-all duration-300">
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
