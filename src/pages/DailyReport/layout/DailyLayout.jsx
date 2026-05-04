import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { Outlet, useNavigate } from 'react-router-dom';
import { PenNameProvider } from '../context/PenNameContext';

const DailyLayout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">

      <div className="md:hidden w-full h-14 bg-white flex items-center justify-between px-4 shrink-0 border-b border-gray-200 z-50">
        <button
          onClick={handleGoHome}
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

      <PenNameProvider user={user}>
        <Sidebar user={user} />

        <div className="flex-1 h-full overflow-y-auto relative">
          <Outlet />
        </div>
      </PenNameProvider>

    </div>
  );
};

export default DailyLayout;
