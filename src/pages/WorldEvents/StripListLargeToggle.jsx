import React from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function StripListLargeToggle({ listLarge, onToggle }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        listLarge
          ? t('korea.common.listDefaultAria')
          : t('korea.common.listLargeAria')
      }
      title={
        listLarge
          ? t('korea.common.listDefaultTitle')
          : t('korea.common.listLargeTitle')
      }
      aria-pressed={listLarge}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        listLarge
          ? 'border-amber-400/90 bg-amber-50 text-amber-950'
          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
      }`}
    >
      {listLarge ? (
        <Minimize2 size={13} aria-hidden="true" />
      ) : (
        <Maximize2 size={13} aria-hidden="true" />
      )}
      {listLarge ? t('korea.common.listDefault') : t('korea.common.listLarge')}
    </button>
  );
}
