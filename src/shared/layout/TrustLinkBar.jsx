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

const CHIP_BASE =
  'pointer-events-auto flex flex-wrap items-center border border-white/20 bg-slate-900/90 text-[11px] font-semibold leading-snug text-slate-100/95 shadow-[0_2px_14px_rgba(0,0,0,0.38)] backdrop-blur-md';

const TrustLinkBar = ({ variant = 'fixed', className = '' }) => {
  const { t } = useTranslation();
  const isStack = variant === 'stack';

  return (
    <nav
      className={
        isStack
          ? `pointer-events-none relative z-[1] w-auto max-w-[min(20rem,calc(100vw-0.5rem))] ${className}`.trim()
          : `pointer-events-none fixed bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] left-1/2 z-[50] w-[min(38rem,calc(100vw-1.25rem))] -translate-x-1/2 ${className}`.trim()
      }
      aria-label={t('home.footerModal.trustBar.aria')}
    >
      <div
        className={
          isStack
            ? `${CHIP_BASE} justify-start gap-x-2 gap-y-1 rounded-xl px-3 py-1.5`
            : `${CHIP_BASE} mx-auto justify-center gap-x-2 gap-y-1 rounded-full px-3.5 py-1.5`
        }
      >
        {LINKS.map((item, idx) => (
          <React.Fragment key={item.tab}>
            {idx > 0 ? (
              <span className="text-white/30 select-none" aria-hidden="true">
                |
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => openFooterModal(item.tab)}
              className="min-h-[1.75rem] break-keep rounded-sm px-0.5 text-slate-100/95 transition-colors hover:text-white active:text-white touch-manipulation"
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
