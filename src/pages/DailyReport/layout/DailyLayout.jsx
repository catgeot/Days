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
import {
  describeHitElement,
  logLogbookHeaderDebug,
} from '../../../shared/cloudPreview/logbookHeaderDebug';

const MOBILE_HEADER_BAND_PX = 112;

const DailyLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, avatarUrl, label } = useAccountProfile();
  const mainScrollRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const hideMobileBlogChrome = (() => {
    if (location.pathname.startsWith('/blog/curation')) return true;
    const match = location.pathname.match(/^\/blog\/([^/]+)$/);
    if (!match) return false;
    const segment = match[1];
    return segment !== 'curation' && segment !== 'write';
  })();

  const openProfile = () => {
    setProfileOpen(true);
    logLogbookHeaderDebug('blog.header.profile.open', { open: true });
  };

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) setProfileOpen(false);
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!location.pathname.startsWith('/blog')) return undefined;

    const logLayout = () => {
      const header = document.querySelector('[data-logbook-mobile-header]');
      const main = mainScrollRef.current;
      if (!header || !main) return;
      const headerRect = header.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const x = Math.round(window.innerWidth * 0.82);
      const y = Math.round(headerRect.top + headerRect.height / 2);
      const hit = document.elementFromPoint(x, y);
      logLogbookHeaderDebug('blog.header.layout', {
        headerBottom: Math.round(headerRect.bottom),
        mainTop: Math.round(mainRect.top),
        overlap: mainRect.top < headerRect.bottom - 1,
        hit: describeHitElement(hit),
      });
    };

    logLayout();
    const t = window.setTimeout(logLayout, 800);
    return () => window.clearTimeout(t);
  }, [location.pathname, hideMobileBlogChrome]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!location.pathname.startsWith('/blog')) return undefined;

    const onPointerDown = (event) => {
      if (event.clientY > MOBILE_HEADER_BAND_PX) return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      logLogbookHeaderDebug('blog.header.tap', {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
        hit: describeHitElement(hit),
        onProfile: Boolean(event.target?.closest?.('[data-logbook-header-profile]')),
      });
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [location.pathname]);

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
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50 text-gray-900 md:flex-row">

      <div
        data-logbook-mobile-header
        className={`sticky top-0 z-[100] isolate md:hidden w-full min-h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] ${
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
              data-logbook-header-profile
              onClick={openProfile}
              className="relative z-[1] flex min-h-11 max-w-[min(100vw-7rem,14rem)] items-center gap-1.5 rounded-lg px-1 py-1 touch-manipulation active:opacity-80"
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
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <Sidebar user={user} />

          <div
            ref={mainScrollRef}
            data-logbook-main-scroll
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          >
            <Outlet />
          </div>
        </div>
      </PenNameProvider>

    </div>
  );
};

export default DailyLayout;
