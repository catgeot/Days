import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY } from '../../../logbookOfficialReviews/logbookReviewHubListCache.js';
import { buildLogbookReviewerFilterHref } from '../../../logbookOfficialReviews/logbookReviewFilterUrl.js';
import { trackEvent } from '../../../shared/analytics/trackEvent.js';
import {
  isGateoHomeWatchCardEnabled,
  isGateoSelfReelsEnabled,
} from '../../../shared/gateoFeatureFlags.js';
import {
  HOME_WATCH_CAPTION_BAND,
  HOME_WATCH_CARD_LAYOUT,
  buildHomeWatchMonthlyDestinations,
  buildHomeWatchSlots,
  dismissHomeWatchCard,
  homeWatchClickParams,
  homeWatchDismissParams,
  homeWatchSlotCountForWidth,
  homeWatchViewParams,
  isHomeWatchDismissed,
  resolveHomeWatchReelsPoster,
  shouldHideHomeWatchCard,
} from '../lib/homeWatchCardModel.js';
import { readHomeWatchContinueItems } from '../lib/homeWatchContinue.js';
import {
  HOME_WATCH_CONTINUE_FALLBACK_CLASS,
  continuePlaceSlugFromHref,
  fetchHomeWatchContinuePlacePhoto,
  homeWatchContinueDisplayUrl,
  resolveHomeWatchContinueLockedPhoto,
} from '../lib/homeWatchContinuePhoto.js';

function readReviewRows() {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(sessionStorage.getItem(LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY) || 'null');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function useHomeWatchChromeFlags() {
  const [flags, setFlags] = useState({ siteNotice: false, mooniChat: false });
  useEffect(() => {
    const sync = () => {
      const next = {
        siteNotice: Boolean(document.querySelector('[data-site-update-notice]')),
        mooniChat: Boolean(document.querySelector('[data-testid="mooni-chat-close"]')),
      };
      setFlags((prev) => (
        prev.siteNotice === next.siteNotice && prev.mooniChat === next.mooniChat ? prev : next
      ));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return flags;
}

function useHomeWatchSlotCount() {
  const [count, setCount] = useState(() =>
    homeWatchSlotCountForWidth(typeof window === 'undefined' ? 390 : window.innerWidth),
  );
  useEffect(() => {
    const apply = () => setCount(homeWatchSlotCountForWidth(window.innerWidth));
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return count;
}

function WatchSlotLink({ slot, className, ariaLabel, onActivate, children }) {
  if (slot.external) {
    return (
      <a
        href={slot.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
        onClick={onActivate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={slot.href} className={className} aria-label={ariaLabel} onClick={onActivate}>
      {children}
    </Link>
  );
}

function useHomeWatchContinuePhoto(slug) {
  const locked = useMemo(() => resolveHomeWatchContinueLockedPhoto(slug), [slug]);
  const [remote, setRemote] = useState({ slug: '', status: 'loading', imageUrl: '' });

  useEffect(() => {
    if (!slug || locked.kind !== 'lookup') return undefined;
    let cancel = false;
    setRemote({ slug, status: 'loading', imageUrl: '' });
    fetchHomeWatchContinuePlacePhoto(slug)
      .then((imageUrl) => {
        if (cancel) return;
        setRemote({
          slug,
          status: imageUrl ? 'ready' : 'empty',
          imageUrl: imageUrl || '',
        });
      })
      .catch((error) => {
        if (cancel) return;
        console.error('home watch continue photo', slug, error);
        setRemote({ slug, status: 'error', imageUrl: '' });
      });
    return () => {
      cancel = true;
    };
  }, [slug, locked.kind]);

  if (!slug || locked.kind === 'skip') return { state: 'skip', src: '' };
  if (locked.kind === 'photo') {
    return { state: 'photo', src: homeWatchContinueDisplayUrl(locked.imageUrl) };
  }
  if (locked.kind === 'empty') return { state: 'fallback', src: '' };
  if (remote.slug !== slug || remote.status === 'loading') return { state: 'loading', src: '' };
  if (remote.status === 'ready') {
    return { state: 'photo', src: homeWatchContinueDisplayUrl(remote.imageUrl) };
  }
  if (remote.status === 'error') return { state: 'error', src: '' };
  return { state: 'fallback', src: '' };
}

function HomeWatchContinuePhoto({ href }) {
  const slug = continuePlaceSlugFromHref(href);
  const photo = useHomeWatchContinuePhoto(slug);
  const [broken, setBroken] = useState(false);
  const reportedRef = useRef(false);

  useEffect(() => {
    setBroken(false);
    reportedRef.current = false;
  }, [slug, photo.src, photo.state]);

  if (!slug || photo.state === 'loading' || photo.state === 'skip') return null;
  const failed = broken || photo.state === 'error';
  const imageState = failed ? 'error' : photo.state === 'photo' ? 'photo' : 'fallback';
  if (imageState !== 'photo' || !photo.src) {
    return (
      <div
        data-testid="home-watch-continue-photo"
        data-image-state={imageState}
        data-photo-slug={slug}
        data-photo-fallback="gradient"
        className={HOME_WATCH_CONTINUE_FALLBACK_CLASS}
      />
    );
  }

  return (
    <img
      src={photo.src}
      alt=""
      aria-hidden="true"
      data-testid="home-watch-continue-photo"
      data-image-state="photo"
      data-photo-slug={slug}
      className="absolute inset-0 h-full w-full object-cover"
      draggable={false}
      onError={() => {
        if (!reportedRef.current) {
          reportedRef.current = true;
          console.error('home watch continue photo failed to load', slug);
        }
        setBroken(true);
      }}
    />
  );
}

const HomeWatchCard = ({
  isPlaceCardVisible = false,
  isTourCinema = false,
  isFlightCinema = false,
}) => {
  const { t, i18n } = useTranslation();
  const isEnUi = String(i18n.language || '')
    .toLowerCase()
    .startsWith('en');
  const { pathname } = useLocation();
  const { siteNotice, mooniChat } = useHomeWatchChromeFlags();
  const slotCount = useHomeWatchSlotCount();
  const cardRef = useRef(null);
  const viewedRef = useRef(false);
  const [dismissed, setDismissed] = useState(() => isHomeWatchDismissed());
  const [globeDrag, setGlobeDrag] = useState(false);
  const enabled = isGateoHomeWatchCardEnabled();

  const slots = useMemo(() => {
    if (!enabled) return [];
    const rows = readReviewRows();
    const continueItems = readHomeWatchContinueItems().map((item) => ({
      ...item,
      reviewerHref: item.reviewer ? buildLogbookReviewerFilterHref(item.reviewer) : '',
    }));
    return buildHomeWatchSlots({
      continueItems,
      destinations: buildHomeWatchMonthlyDestinations(new Date(), rows),
      reelsEnabled: isGateoSelfReelsEnabled(),
      slotCount,
      reelsPoster: isGateoSelfReelsEnabled() ? resolveHomeWatchReelsPoster() : '',
    });
  }, [enabled, slotCount]);

  const hidden = shouldHideHomeWatchCard({
    placeCard: isPlaceCardVisible || pathname.startsWith('/place'),
    explore: pathname === '/explore' || pathname.startsWith('/explore/'),
    mooniChat,
    cinema: isTourCinema || isFlightCinema,
    siteNotice,
  });
  const shown = enabled && !hidden && !dismissed && slots.length > 0;

  useEffect(() => {
    if (!shown || viewedRef.current) return;
    viewedRef.current = true;
    trackEvent('home_watch_card_view', homeWatchViewParams(slots.length));
  }, [shown, slots.length]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onDown = (event) => {
      const card = cardRef.current;
      if (!card || card.contains(event.target)) return;
      setGlobeDrag(true);
    };
    const onUp = () => setGlobeDrag(false);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onUp, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
    };
  }, [enabled]);

  if (!shown) return null;

  const trackSlot = (slotType) => {
    trackEvent('home_watch_card_click', homeWatchClickParams(slotType));
  };

  const onDismiss = () => {
    dismissHomeWatchCard();
    setDismissed(true);
    trackEvent('home_watch_card_dismiss', homeWatchDismissParams());
  };

  return (
    <section
      ref={cardRef}
      data-testid="home-watch-card"
      data-slot-count={slots.length}
      data-globe-drag-passthrough={globeDrag ? 'true' : 'false'}
      aria-label={t('home.watchCard.title')}
      className={`pointer-events-none fixed z-[54] box-border h-[85px] ${
        globeDrag ? '[&_*]:!pointer-events-none' : ''
      } left-3 right-3 bottom-[14.25rem] min-[1280px]:left-[300px] min-[1280px]:right-[300px] min-[1280px]:bottom-[110px]`}
      style={{ height: HOME_WATCH_CARD_LAYOUT.mobile.height }}
    >
      <div className="pointer-events-none flex h-full min-h-0 flex-col rounded-2xl border border-white/15 bg-black/55 px-1.5 pb-1 pt-0.5 shadow-lg backdrop-blur-md motion-reduce:transition-none">
        <div className="flex h-4 shrink-0 items-center justify-between gap-1 px-0.5">
          <h2 className="truncate text-[10px] font-bold leading-none tracking-wide text-white/90">
            {t('home.watchCard.title')}
          </h2>
          <button
            type="button"
            data-testid="home-watch-dismiss"
            className="pointer-events-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white motion-reduce:transition-none"
            aria-label={t('home.watchCard.dismiss')}
            onClick={onDismiss}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
        <ul className="flex min-h-0 flex-1 gap-1">
          {slots.map((slot, index) => {
            const label = slot.name || (slot.nameKey ? t(slot.nameKey) : t('home.watchCard.reelsTitle'));
            const subtitle = slot.subtitleKey
              ? t(slot.subtitleKey)
              : slot.type === 'reels'
                ? t('home.watchCard.reelsSubtitle')
                : '';
            const ariaLabel = slot.type === 'reels'
              ? t('home.watchCard.reelsAria')
              : slot.type === 'continue'
                ? t('home.watchCard.continueAria', { name: label })
                : t('home.watchCard.destinationAria', { name: label });
            return (
              <li
                key={`${slot.type}-${slot.slug || slot.href || index}`}
                data-testid={`home-watch-slot-${slot.type}`}
                data-slot-type={slot.type}
                data-slug={slot.slug || undefined}
                className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/40"
              >
                <WatchSlotLink
                  slot={slot}
                  ariaLabel={ariaLabel}
                  onActivate={() => trackSlot(slot.type)}
                  className="pointer-events-auto absolute inset-0 z-[1] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                />
                <div className="pointer-events-none relative z-0 flex h-full min-w-0 flex-col justify-end">
                  {slot.type === 'continue' && continuePlaceSlugFromHref(slot.href) ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                      <HomeWatchContinuePhoto href={slot.href} />
                    </>
                  ) : null}
                  {slot.type === 'destination' || slot.type === 'reels' ? (
                    slot.poster || slot.imageUrl ? (
                      <img
                        src={slot.poster || slot.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
                    )
                  ) : null}
                  <div
                    className="relative z-[1] flex w-fit max-w-full flex-col items-start px-0.5"
                    data-testid="home-watch-caption-band"
                  >
                    {slot.type === 'continue' ? (
                      <p
                        data-caption-role="label"
                        className="max-w-full truncate rounded-sm px-1 text-[9px] font-semibold leading-none text-white"
                        style={{ backgroundColor: HOME_WATCH_CAPTION_BAND, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
                      >
                        {t('home.watchCard.continueLabel')}
                      </p>
                    ) : null}
                    <p
                      data-caption-role="name"
                      className="max-w-full truncate rounded-sm px-1 text-[11px] font-bold leading-none text-white"
                      style={{ backgroundColor: HOME_WATCH_CAPTION_BAND, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
                    >
                      {label}
                    </p>
                    {slot.type === 'destination' && (slot.reason || slot.reasonEn) ? (
                      <span
                        data-testid="home-watch-taste"
                        data-caption-role="chip"
                        className="inline-block max-w-full truncate rounded-sm px-1 text-[8px] font-semibold leading-none text-amber-100"
                        style={{ backgroundColor: HOME_WATCH_CAPTION_BAND, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
                        aria-label={t('home.watchCard.tasteAria', { name: label })}
                      >
                        {isEnUi ? slot.reasonEn || slot.reason : slot.reason}
                      </span>
                    ) : null}
                    {subtitle && slot.type !== 'destination' ? (
                      <p
                        data-caption-role="subtitle"
                        className={`max-w-full truncate rounded-sm px-1 text-[9px] leading-none ${
                          slot.type === 'continue' ? 'text-white' : 'text-white/80'
                        }`}
                        style={{ backgroundColor: HOME_WATCH_CAPTION_BAND, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
                      >
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                {slot.reviewer ? (
                  <Link
                    to={slot.reviewerHref || buildLogbookReviewerFilterHref(slot.reviewer)}
                    data-testid="home-watch-reviewer"
                    data-reviewer={slot.reviewer}
                    aria-label={t('home.watchCard.reviewerAria', { name: slot.reviewer })}
                    className="pointer-events-auto absolute left-1 top-1 z-[2] max-w-[calc(100%-0.5rem)] truncate rounded bg-black/70 px-1 py-0.5 text-[8px] font-bold leading-none text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      trackSlot('reviewer');
                    }}
                  >
                    {slot.reviewer}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default HomeWatchCard;
