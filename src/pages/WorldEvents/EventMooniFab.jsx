import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mooniChar from '../../assets/MOONI_transparent.png';
import MooniBoundChatHost from '../Home/components/MooniBoundChatHost';
import { buildMooniBoundSpotFromLocation } from '../Home/lib/placeChatIntro';
import { getWorldEventLocation, getWorldEventTitle } from '../../utils/worldEvents';

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventMooniFab({ event, locale = 'ko' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [boundSpot, setBoundSpot] = useState(null);

  const openMooni = useCallback(() => {
    if (!event?.slug) return;
    const location = getWorldEventLocation(event.slug);
    const title = getWorldEventTitle(event, locale);
    const spot = buildMooniBoundSpotFromLocation({
      ...location,
      displayLabel: title ? `${title} · ${location.name}` : location.name,
    });
    if (!spot) return;
    setBoundSpot(spot);
    setOpen(true);
  }, [event, locale]);

  const closeMooni = useCallback(() => {
    setOpen(false);
    setBoundSpot(null);
  }, []);

  if (!event?.slug) return null;

  return (
    <>
      <button
        type="button"
        onClick={openMooni}
        className="pointer-events-auto fixed bottom-[4.75rem] right-3 z-[70] flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/90 shadow-lg ring-2 ring-cyan-300/40 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 sm:bottom-24 sm:right-4"
        aria-label={t('worldEventDetail.askMooni')}
        title={t('worldEventDetail.askMooni')}
      >
        <img src={mooniChar} alt="" className="h-10 w-10 object-contain" draggable={false} />
      </button>
      <MooniBoundChatHost isOpen={open} boundSpot={boundSpot} onClose={closeMooni} />
    </>
  );
}
