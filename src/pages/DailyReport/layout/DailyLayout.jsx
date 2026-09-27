import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './Sidebar';
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PenNameProvider } from '../context/PenNameContext';
import { useAccountProfile } from '../../../shared/Auth/useAccountProfile';
import AccountProfile from '../../../shared/Auth/AccountProfile';

const DailyLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, avatarUrl, label } = useAccountProfile();
  const mainScrollRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) setProfileOpen(false);
  }, [user]);

  const hideMobileBlogChrome = (() => {
    if (location.pathname.startsWith('/blog/curation')) return true;
    const match = location.pathname.match(/^\/blog\/([^/]+)$/);
    if (!match) return false;
    const segment = match[1];
    return segment !== 'curation' && segment !== 'write';
  })();

  const handleLogout = async () => {
    if (window.confirm(t('logbook.common.logoutConfirm'))) {
      await supabase.auth.signOut();
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">

      <div
        className={`relative z-[60] md:hidden w-full min-h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] ${
          hideMobileBlogChrome ? 'hidden' : ''
        }`}
      >
        <button
          type="button"
          onClick={handleGoHome}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
        >
          <Globe size={20} />
          <span className="text-sm font-bold tracking-wider">GATEO</span>
        </button>

        {user && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex min-h-11 max-w-[min(100vw-7rem,14rem)] items-center gap-1.5 rounded-lg px-1 py-1 touch-manipulation active:opacity-80"
              aria-expanded={profileOpen}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : null}
              <span className="min-w-0 truncate text-xs text-gray-500">
                {label || user?.email?.split('@')[0]}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-blue-600">
                {t('authPage.account.open')}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors touch-manipulation hover:text-red-500 active:opacity-80"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {profileOpen && user
        ? createPortal(
            <AccountProfile onBack={() => setProfileOpen(false)} />,
            document.body,
          )
        : null}

      <PenNameProvider user={user}>
        <Sidebar user={user} />

        <div ref={mainScrollRef} className="flex-1 h-full overflow-y-auto relative">
          <Outlet />
        </div>
      </PenNameProvider>

    </div>
  );
};

export default DailyLayout;
