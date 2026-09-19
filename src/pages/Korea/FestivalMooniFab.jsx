import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mooniChar from '../../assets/MOONI_transparent.png';
import MooniBoundChatHost from '../Home/components/MooniBoundChatHost';
import { buildMooniBoundSpotFromLocation } from '../Home/lib/placeChatIntro';

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   location?: Record<string, unknown> | null,
 *   raised?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 * }} props
 */
export default function FestivalMooniFab({ item, location, raised = false, onOpenChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [boundSpot, setBoundSpot] = useState(null);

  const title = String(item?.title || '').trim();

  const openMooni = useCallback(
    (e) => {
      e?.stopPropagation?.();
      const loc = location && typeof location === 'object' ? location : null;
      const hubName = String(loc?.name || loc?.parentCity || '').trim();
      const spot = buildMooniBoundSpotFromLocation({
        ...loc,
        name: hubName || title,
        displayLabel: title && hubName ? `${title} · ${hubName}` : title || hubName,
      });
      if (!spot) return;
      setBoundSpot(spot);
      setOpen(true);
      onOpenChange?.(true);
    },
    [location, onOpenChange, title],
  );

  const closeMooni = useCallback(() => {
    setOpen(false);
    setBoundSpot(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (!title && !location?.name) return null;

  return (
    <>
      <button
        type="button"
        onClick={openMooni}
        className={`pointer-events-auto fixed right-3 z-[55] flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200 bg-gradient-to-br from-sky-200 via-cyan-200 to-teal-300 shadow-[0_8px_24px_rgba(34,211,238,0.35)] ring-2 ring-white/80 transition-[transform,bottom] duration-300 hover:scale-105 active:scale-95 sm:right-4 ${
          raised
            ? 'bottom-[max(7.35rem,calc(env(safe-area-inset-bottom)+6.6rem))] sm:bottom-[8.5rem]'
            : 'bottom-[max(3.6rem,calc(env(safe-area-inset-bottom)+2.85rem))] sm:bottom-24'
        }`}
        aria-label={t('worldEventDetail.askMooni')}
        title={t('worldEventDetail.askMooni')}
      >
        <img src={mooniChar} alt="" className="h-10 w-10 object-contain" draggable={false} />
      </button>
      <MooniBoundChatHost isOpen={open} boundSpot={boundSpot} onClose={closeMooni} />
    </>
  );
}
