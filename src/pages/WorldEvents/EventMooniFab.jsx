import React from 'react';
import { useTranslation } from 'react-i18next';
import mooniChar from '../../assets/MOONI_transparent.webp';

/**
 * @param {{ onClick: () => void, raised?: boolean }} props
 */
export default function EventMooniFab({ onClick, raised = false }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto fixed right-3 z-[70] flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/90 shadow-lg ring-2 ring-cyan-300/40 backdrop-blur-sm transition-[transform,bottom] duration-300 hover:scale-105 active:scale-95 sm:right-4 ${
        raised
          ? 'bottom-[max(7.35rem,calc(env(safe-area-inset-bottom)+6.6rem))] sm:bottom-[10.75rem]'
          : 'bottom-[4.75rem] sm:bottom-24'
      }`}
      aria-label={t('worldEventDetail.askMooni')}
      title={t('worldEventDetail.askMooni')}
    >
      <img src={mooniChar} alt="" className="h-10 w-10 object-contain" draggable={false} />
    </button>
  );
}
