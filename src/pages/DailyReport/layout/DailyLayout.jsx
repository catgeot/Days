// src/pages/DailyReport/layout/DailyLayout.jsx
// ?š¨ [Fix/New] ?˜ì • ?´ìœ :
// 1. [Routing] {children} ?Œë”ë§?ë°©ì‹??React Router v6??<Outlet />?¼ë¡œ êµì²´?˜ì—¬ ì¤‘ì²© ?¼ìš°???•ìƒ??
// 2. [Subtraction] useReport ?„ì—­ ?íƒœ ?˜ì¡´??closeReport) ?„ì „ ?œê±°.
// 3. [Safe Path] ?íƒœ ë³€ê²??€??useNavigateë¥??¬ìš©?˜ì—¬ ??'/')?¼ë¡œ ê°•ì œ ?Œêµ°(Deep Linking).

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar'; // ê¸°ì¡´ ?¬ì´?œë°” ì»´í¬?ŒíŠ¸ ? ì?
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase'; 
// ?š¨ [New] ?¼ìš°???œì–´?????„í¬??
import { Outlet, useNavigate } from 'react-router-dom';

const DailyLayout = () => {
  const navigate = useNavigate(); // ?š¨ [New] URL ?¤ë¹„ê²Œì´????
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("ë¡œê·¸?„ì›ƒ ?˜ì‹œê² ìŠµ?ˆê¹Œ?")) {
      await supabase.auth.signOut();
      navigate('/'); // ?š¨ [Fix] ë¡œê·¸?„ì›ƒ ??closeReport() ?€????URLë¡??¼ìš°??
    }
  };

  const handleGoHome = () => {
    navigate('/'); // ?š¨ [Fix] ??ë²„íŠ¼ ?´ë¦­ ??closeReport() ?€????URLë¡??¼ìš°??
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      
      <div className="md:hidden w-full h-14 bg-white flex items-center justify-between px-4 shrink-0 border-b border-gray-200 z-50">
        <button 
          onClick={handleGoHome} // ?š¨ [Fix] ?¨ìˆ˜ êµì²´
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
        >
          <Globe size={20} />
          <span className="text-sm font-bold tracking-wider">GATEO</span>
        </button>
        
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {user?.email?.split('@')[0]}
            </span>
            <button 
              onClick={handleLogout} 
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 1. ?¼ìª½ ê³ ì • ?¬ì´?œë°” (DailyReport ?„ìš©) */}
      <Sidebar />

      {/* 2. ?¤ë¥¸ìª?ì»¨í…ì¸??ì—­ */}
      <div className="flex-1 h-full overflow-y-auto relative">
        {/* ?š¨ [Fix] {children}?ì„œ <Outlet />?¼ë¡œ ?„ë©´ êµì²´ (?ì‹ ?¼ìš°???Œë”ë§?ê³µê°„) */}
        <Outlet />
      </div>

    </div>
  );
};

export default DailyLayout;
