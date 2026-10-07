import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import mooniChar from '../../assets/MOONI_transparent.webp';
import MooniBoundChatHost from '../Home/components/MooniBoundChatHost';
import FestivalMooniInlineButton from './FestivalMooniInlineButton.jsx';
import { buildFestivalMooniBoundSpot } from './lib/festivalMooniBoundSpot.js';

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   intro?: Record<string, unknown> | null,
 *   location?: Record<string, unknown> | null,
 *   homepage?: string,
 *   summaryFields?: { dateText?: string, timeText?: string, fee?: { text?: string } },
 *   raised?: boolean,
 *   sheetRootRef?: React.RefObject<HTMLElement | null>,
 *   onOpenChange?: (open: boolean) => void,
 *   onOpenTrack?: (placement: 'festival_detail_inline' | 'festival_detail_fab') => void,
 * }} props
 */
export function useFestivalMooniEntry({
  item,
  intro,
  location,
  homepage,
  summaryFields,
  raised = false,
  sheetRootRef,
  onOpenChange,
  onOpenTrack,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [boundSpot, setBoundSpot] = useState(null);
  const [inlineVisible, setInlineVisible] = useState(true);

  const title = String(item?.title || '').trim();

  useEffect(() => {
    const root = sheetRootRef?.current;
    if (!root) return undefined;
    const inline = root.querySelector('[data-festival-mooni-inline]');
    if (!inline || typeof IntersectionObserver === 'undefined') {
      setInlineVisible(false);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInlineVisible(entry.isIntersecting);
      },
      { root: null, threshold: 0.15 },
    );
    observer.observe(inline);
    return () => observer.disconnect();
  }, [sheetRootRef, item?.contentId, title]);

  const openMooni = useCallback(
    (placement) => {
      return (e) => {
        e?.stopPropagation?.();
        const spot = buildFestivalMooniBoundSpot({
          item,
          intro,
          location,
          homepage,
          summaryFields,
        });
        if (!spot) return;
        onOpenTrack?.(placement);
        setBoundSpot(spot);
        setOpen(true);
        onOpenChange?.(true);
      };
    },
    [item, intro, location, homepage, summaryFields, onOpenChange, onOpenTrack],
  );

  const closeMooni = useCallback(() => {
    setOpen(false);
    setBoundSpot(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const enabled = Boolean(title || location?.name);
  const showFab = enabled && !inlineVisible;

  const inlineButton = enabled ? (
    <FestivalMooniInlineButton onClick={openMooni('festival_detail_inline')} />
  ) : null;

  const fabNode = showFab ? (
    <button
      type="button"
      onClick={openMooni('festival_detail_fab')}
      className={`pointer-events-auto z-[55] flex items-center justify-center border border-cyan-200 bg-gradient-to-br from-sky-200 via-cyan-200 to-teal-300 shadow-[0_8px_24px_rgba(34,211,238,0.35)] ring-2 ring-white/80 transition-[transform,opacity] duration-300 hover:scale-105 active:scale-95 fixed right-3 h-14 w-14 rounded-full md:absolute md:bottom-6 md:right-6 md:h-12 md:w-auto md:gap-2 md:rounded-xl md:px-4 md:from-teal-600 md:via-teal-600 md:to-teal-600 md:text-white md:ring-0 md:border-teal-700 ${
        raised
          ? 'bottom-[max(7.35rem,calc(env(safe-area-inset-bottom)+6.6rem))] md:bottom-24'
          : 'bottom-[max(3.6rem,calc(env(safe-area-inset-bottom)+2.85rem))] md:bottom-6'
      }`}
      aria-label={t('korea.festival.detail.askMooniFab')}
      title={t('korea.festival.detail.askMooniFab')}
    >
      <img
        src={mooniChar}
        alt=""
        className="h-10 w-10 object-contain md:h-7 md:w-7"
        draggable={false}
      />
      <span className="hidden md:inline text-sm font-bold">
        {t('korea.festival.detail.askMooniFab')}
      </span>
    </button>
  ) : null;

  const chatNode = (
    <MooniBoundChatHost isOpen={open} boundSpot={boundSpot} onClose={closeMooni} />
  );

  return { inlineButton, fabNode, chatNode, enabled };
}

/** @deprecated use useFestivalMooniEntry — kept for smoke import stability */
export default function FestivalMooniFab(props) {
  const { fabNode, chatNode } = useFestivalMooniEntry(props);
  return (
    <>
      {fabNode}
      {chatNode}
    </>
  );
}
