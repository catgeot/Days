import React, { useRef } from 'react';
import Sidebar from './Sidebar';
import { Globe, LogOut } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PenNameProvider } from '../context/PenNameContext';
import { useAccountProfile } from '../../../shared/Auth/useAccountProfile';
import ProfilePhotoCount from '../../../shared/Auth/ProfilePhotoCount';

const DailyLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, avatarUrl, label, photoCount } = useAccountProfile();
  const mainScrollRef = useRef(null);

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
        className={`md:hidden w-full min-h-14 shrink-0 border-b border-gray-200 z-50 bg-white flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] ${
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
          <div className="flex items-center gap-3">
            <Link to="/account" className="flex items-center gap-1.5 min-w-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              ) : null}
              <span className="text-xs text-gray-500 truncate max-w-[88px]">
                {label || user?.email?.split('@')[0]}
              </span>
              <ProfilePhotoCount count={photoCount} tone="text" />
              <span className="text-[11px] font-bold text-blue-600">
                {t('authPage.account.open')}
              </span>
            </Link>
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

        <div ref={mainScrollRef} className="flex-1 h-full overflow-y-auto relative">
          <Outlet />
        </div>
      </PenNameProvider>

    </div>
  );
};

export default DailyLayout;
