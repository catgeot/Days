import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getWorldEventTitle } from '../../utils/worldEvents';
import { getWorldEventHeroImages } from '../../utils/worldEventGlossary';
import { fetchEventHeroGallery } from '../../utils/fetchEventHeroGallery';
import EventHeroGalleryModal from './EventHeroGalleryModal';

const PHOTO_SWIPE_THRESHOLD_PX = 40;
const PHOTO_SWIPE_DIRECTION_RATIO = 1.2;

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventDetailHero({ event, locale = 'ko' }) {
  const { t } = useTranslation();
  const seedImages = useMemo(() => getWorldEventHeroImages(event), [event]);
  const [displayImages, setDisplayImages] = useState(seedImages);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const galleryFetchRef = useRef(null);
  const swipeStartRef = useRef(null);

  const title = getWorldEventTitle(event, locale);

  useEffect(() => {
    setDisplayImages(seedImages);
    setActiveIndex(0);
  }, [event.id, seedImages]);

  const loadExtendedGallery = useCallback(async () => {
    if (galleryFetchRef.current) return galleryFetchRef.current;

    galleryFetchRef.current = (async () => {
      setGalleryLoading(true);
      try {
        const result = await fetchEventHeroGallery(event, locale);
        if (result.images.length > 0) {
          setDisplayImages(result.images);
        }
        return result;
      } finally {
        setGalleryLoading(false);
        galleryFetchRef.current = null;
      }
    })();

    return galleryFetchRef.current;
  }, [event, locale]);

  useEffect(() => {
    void loadExtendedGallery();
  }, [loadExtendedGallery]);

  const openGallery = useCallback(() => {
    setGalleryOpen(true);
    void loadExtendedGallery();
  }, [loadExtendedGallery]);

  const step = useCallback(
    (delta) => {
      if (displayImages.length < 2) return;
      setActiveIndex((index) => (index + delta + displayImages.length) % displayImages.length);
    },
    [displayImages.length],
  );

  const consumeHorizontalSwipe = useCallback(
    (start, endX, endY) => {
      if (!start || displayImages.length < 2) return false;
      const dx = endX - start.x;
      const dy = endY - start.y;
      if (Math.abs(dx) < PHOTO_SWIPE_THRESHOLD_PX) return false;
      if (Math.abs(dx) < Math.abs(dy) * PHOTO_SWIPE_DIRECTION_RATIO) return false;
      step(dx > 0 ? -1 : 1);
      return true;
    },
    [displayImages.length, step],
  );

  const onHeroTouchStart = useCallback((touchEvent) => {
    if (touchEvent.touches.length !== 1) return;
    const touch = touchEvent.touches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onHeroTouchEnd = useCallback(
    (touchEvent) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      const touch = touchEvent.changedTouches?.[0];
      if (!touch) return;
      consumeHorizontalSwipe(start, touch.clientX, touch.clientY);
    },
    [consumeHorizontalSwipe],
  );

  const onHeroTouchCancel = useCallback(() => {
    swipeStartRef.current = null;
  }, []);

  if (!displayImages.length) return null;

  const activeImage = displayImages[activeIndex] || displayImages[0];

  return (
    <>
      <div className="mb-4 space-y-3">
        <section
          className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 shadow-sm"
          aria-label={t('worldEventDetail.media.heroAlt', { title })}
        >
          <div
            className="relative aspect-[4/3] w-full touch-pan-y sm:aspect-[16/9] lg:aspect-[21/9]"
            onTouchStart={onHeroTouchStart}
            onTouchEnd={onHeroTouchEnd}
            onTouchCancel={onHeroTouchCancel}
          >
            <img
              src={activeImage.url}
              alt={t('worldEventDetail.media.heroAlt', { title })}
              className="h-full w-full object-cover select-none"
              loading="eager"
              decoding="async"
              draggable={false}
            />
            {displayImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/45 p-1.5 text-white hover:bg-black/65"
                  aria-label={t('worldEventDetail.heroGallery.prev')}
                >
                  <ChevronLeft size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/25 bg-black/45 p-1.5 text-white hover:bg-black/65"
                  aria-label={t('worldEventDetail.heroGallery.next')}
                >
                  <ChevronRight size={18} aria-hidden />
                </button>
                <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  {activeIndex + 1}/{displayImages.length}
                </span>
              </>
            ) : null}

            {displayImages.length > 1 ? (
              <button
                type="button"
                onClick={openGallery}
                className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/70"
              >
                <Images size={13} aria-hidden />
                {t('worldEventDetail.heroGallery.viewMore')}
              </button>
            ) : null}
          </div>
        </section>

        {displayImages.length > 1 ? (
          <section
            className="rounded-2xl border border-stone-200 bg-white p-2.5 shadow-sm"
            aria-label={t('worldEventDetail.heroGallery.thumbnailsAria')}
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-stone-500">
                {t('worldEventDetail.heroGallery.thumbnailsAria')}
              </p>
              <button
                type="button"
                onClick={openGallery}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900"
              >
                <Images size={12} aria-hidden />
                {t('worldEventDetail.heroGallery.viewMore')}
              </button>
            </div>
            <div
              className="flex gap-2 overflow-x-auto px-0.5 py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="listbox"
            >
              {displayImages.map((image, index) => {
                const selected = index === activeIndex;
                const thumbCaption =
                  locale === 'en' && image.captionEn ? image.captionEn : image.captionKo || '';
                return (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={t('worldEventDetail.heroGallery.imageAlt', {
                      title,
                      index: index + 1,
                    })}
                    onClick={() => setActiveIndex(index)}
                    className={[
                      'relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white shadow-sm transition-colors sm:h-[4.5rem] sm:w-[4.5rem]',
                      selected ? 'border-amber-400 ring-2 ring-amber-300/70' : 'border-stone-200',
                    ].join(' ')}
                  >
                    <img
                      src={image.url}
                      alt={thumbCaption || ''}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {galleryOpen ? (
        <EventHeroGalleryModal
          images={displayImages}
          activeIndex={Math.min(activeIndex, Math.max(displayImages.length - 1, 0))}
          locale={locale}
          title={title}
          loading={galleryLoading}
          onClose={() => setGalleryOpen(false)}
          onIndexChange={setActiveIndex}
        />
      ) : null}
    </>
  );
}
