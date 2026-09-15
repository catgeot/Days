import React from 'react';
import { useTranslation } from 'react-i18next';
import { openFooterModal } from '../lib/footerModalEvents';

const LINKS = [
  { tab: 'about', key: 'home.footerModal.trustBar.about' },
  { tab: 'terms', key: 'home.footerModal.trustBar.terms' },
  { tab: 'privacy', key: 'home.footerModal.trustBar.privacy' },
  { tab: 'credits', key: 'home.footerModal.trustBar.credits' },
  { tab: 'contact', key: 'home.footerModal.trustBar.contact' },
];

const TrustLinkBar = () => {
  const { t } = useTranslation();

  return (
    <nav
      className="pointer-events-none fixed bottom-[max(0.4rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[50] w-[min(36rem,calc(100vw-5.5rem))] -translate-x-1/2"
      aria-label={t('home.footerModal.trustBar.aria')}
    >
      <div className="pointer-events-auto mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[9px] font-bold tracking-wide text-gray-400 shadow-sm backdrop-blur-sm">
        {LINKS.map((item, idx) => (
          <React.Fragment key={item.tab}>
            {idx > 0 ? (
              <span className="text-gray-700" aria-hidden="true">
                |
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => openFooterModal(item.tab)}
              className="hover:text-white transition-colors break-keep"
            >
              {t(item.key)}
            </button>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default TrustLinkBar;
