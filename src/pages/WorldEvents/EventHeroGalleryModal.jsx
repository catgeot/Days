import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PHOTO_SWIPE_THRESHOLD_PX = 40;
const PHOTO_SWIPE_DIRECTION_RATIO = 1.2;

/**
 * @param {{
 *   images: Array<{ url: string, captionKo?: string, captionEn?: string }>,
 *   activeIndex: number,
 *   locale?: string,
 *   title: string,
 *   onClose: () => void,
 *   onIndexChange: (index: number) => void,
 * }} props
 */
export default function EventHeroGalleryModal({
  images,
  activeIndex,
  locale = 'ko',
  title,
  onClose,
  onIndexChange,
}) {
  const { t } = useTranslation();
  const swipeStartRef = useRef(null);

  const step = useCallback(
    (delta) => {
      if (images.length < 2) return;
      onIndexChange((activeIndex + delta + images.length) % images.length);
    },
    [activeIndex, images.length, onIndexChange],
  );

  const consumeHorizontalSwipe = useCallback(
    (start, endX, endY) => {
      if (!start || images.length < 2) return false;
      const dx = endX - start.x;
      const dy = endY - start.y;
      if (Math.abs(dx) < PHOTO_SWIPE_THRESHOLD_PX) return false;
      if (Math.abs(dx) < Math.abs(dy) * PHOTO_SWIPE_DIRECTION_RATIO) return false;
      step(dx > 0 ? -1 : 1);
      return true;
    },
    [images.length, step],
  );

  const onTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      consumeHorizontalSwipe(start, touch.clientX, touch.clientY);
    },
    [consumeHorizontalSwipe],
  );

  const onTouchCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, step]);

  if (!images.length) return null;

  const activeImage = images[activeIndex] || images[0];
  const caption =
    locale === 'en' && activeImage.captionEn
      ? activeImage.captionEn
      : activeImage.captionKo || '';

  const modal = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-stone-950/95">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label={t('worldEventDetail.heroGallery.close')}
      />
      <div className="relative z-10 flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <p className="min-w-0 truncate text-sm font-bold text-white/90">
          {title}
          {images.length > 1 ? (
            <span className="ml-2 tabular-nums text-white/60">
              {activeIndex + 1}/{images.length}
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label={t('worldEventDetail.heroGallery.close')}
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div
        className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3"
        role="dialog"
        aria-modal="true"
        aria-label={t('worldEventDetail.heroGallery.modalAria')}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => step(-1)}
            className="absolute left-2 z-20 inline-flex rounded-full border border-white/20 bg-black/40 p-2 text-white hover:bg-black/60 sm:left-4"
            aria-label={t('worldEventDetail.heroGallery.prev')}
          >
            <ChevronLeft size={22} aria-hidden />
          </button>
        ) : null}

        <img
          src={activeImage.url}
          alt={t('worldEventDetail.heroGallery.imageAlt', { title, index: activeIndex + 1 })}
          className="max-h-[min(72dvh,42rem)] w-full max-w-4xl object-contain"
          draggable={false}
        />

        {images.length > 1 ? (
          <button
            type="button"
            onClick={() => step(1)}
            className="absolute right-2 z-20 inline-flex rounded-full border border-white/20 bg-black/40 p-2 text-white hover:bg-black/60 sm:right-4"
            aria-label={t('worldEventDetail.heroGallery.next')}
          >
            <ChevronRight size={22} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="relative z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 text-center">
        {caption ? <p className="text-sm font-semibold text-white/90">{caption}</p> : null}
        {images.length > 1 ? (
          <p className="mt-1 text-xs text-white/50">{t('worldEventDetail.heroGallery.swipeHint')}</p>
        ) : null}
        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const selected = index === activeIndex;
              const thumbCaption =
                locale === 'en' && image.captionEn ? image.captionEn : image.captionKo || '';
              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => onIndexChange(index)}
                  aria-label={t('worldEventDetail.heroGallery.imageAlt', {
                    title,
                    index: index + 1,
                  })}
                  className={[
                    'h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2',
                    selected ? 'border-amber-400' : 'border-white/20 opacity-70 hover:opacity-100',
                  ].join(' ')}
                >
                  <img
                    src={image.url}
                    alt={thumbCaption}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
