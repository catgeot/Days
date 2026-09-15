import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import FooterModal from '../../pages/Home/components/FooterModal';
import { FOOTER_MODAL_OPEN_EVENT } from '../lib/footerModalEvents';
import TrustLinkBar from './TrustLinkBar';

const MainLayout = () => {
  const location = useLocation();
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [footerTab, setFooterTab] = useState('about');
  const isHomeGlobe =
    location.pathname === '/' || location.pathname.startsWith('/explore');
  const hideTrustBar = location.pathname.startsWith('/place/');

  useEffect(() => {
    const onOpen = (event) => {
      const tab = event.detail?.tab || 'about';
      setFooterTab(tab);
      setIsFooterOpen(true);
    };
    window.addEventListener(FOOTER_MODAL_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(FOOTER_MODAL_OPEN_EVENT, onOpen);
  }, []);

  return (
    <div className="w-full h-screen relative bg-black overflow-hidden flex flex-col">
      <Outlet />
      {hideTrustBar ? null : (
        <TrustLinkBar className={isHomeGlobe ? 'max-md:hidden' : undefined} />
      )}
      <FooterModal
        isOpen={isFooterOpen}
        onClose={() => setIsFooterOpen(false)}
        initialTab={footerTab}
      />
    </div>
  );
};

export default MainLayout;
