import React from 'react';
import { useTranslation } from 'react-i18next';
import mooniChar from '../../assets/MOONI_transparent.webp';

/**
 * @param {{
 *   onClick: (e: React.MouseEvent) => void,
 *   disabled?: boolean,
 *   inlineRef?: (node: HTMLButtonElement | null) => void,
 * }} props
 */
export default function FestivalMooniInlineButton({ onClick, disabled = false, inlineRef }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      ref={inlineRef}
      data-festival-mooni-inline=""
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50"
    >
      <img
        src={mooniChar}
        alt=""
        className="h-7 w-7 shrink-0 object-contain"
        draggable={false}
      />
      {t('korea.festival.detail.askMooniAboutFestival')}
    </button>
  );
}
