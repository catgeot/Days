import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { LOGBOOK_REVIEW_HUB_ROWS_STORAGE_KEY } from '../../../logbookOfficialReviews/logbookReviewHubListCache.js';
import { buildLogbookReviewerFilterHref } from '../../../logbookOfficialReviews/logbookReviewFilterUrl.js';
import { trackEvent } from '../../../shared/analytics/trackEvent.js';
import {
  isGateoHomeMonthlySwitchEnabled,
  isGateoHomeWatchCardEnabled,
  isGateoSelfReelsEnabled,
} from '../../../shared/gateoFeatureFlags.js';
import {
  HOME_WATCH_CAPTION_BAND,
  HOME_WATCH_CARD_LAYOUT,
  buildHomeWatchMonthlyDestinations,
  buildHomeWatchSlots,
  dismissHomeWatchCard,
  homeMonthlySwitchState,
  homeWatchClickParams,
  homeWatchDismissParams,
  homeWatchSlotCountForWidth,
  homeWatchViewParams,
  isHomeWatchDismissed,
  layoutHomeMonthlyCard,
  resolveHomeMonthlyPreviewStartDay,
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

/** Taste line plus the caption band's horizontal padding, the tile border, and 2px slack. */
function monthlyTileWidthPx(scroller, viewportWidth) {
  const lines = scroller.querySelectorAll('[data-caption-role="name"], [data-testid="home-watch-taste"]');
  let needed = 0;
  for (const el of lines) {
    const cs = getComputedStyle(el);
    const probe = document.createElement('span');
    probe.textContent = el.textContent || '';
    probe.style.cssText = `position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing};padding:${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft};`;
    document.body.appendChild(probe);
    needed = Math.max(needed, probe.getBoundingClientRect().width);
    probe.remove();
  }
  const gap = Number.parseFloat(getComputedStyle(scroller).columnGap) || 0;
  const peek = 16;
  const threeAcross = Math.floor((scroller.clientWidth - peek - gap * 2) / 3);
  const fit = Math.ceil(needed + 8);
  if (viewportWidth >= 1280) return Math.max(fit, 192);
  return Math.max(fit, threeAcross);
}

function snapMonthlyScroller(el) {
  const tile = el.querySelector('li');
  if (!tile) return;
  const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
  const step = tile.getBoundingClientRect().width + gap;
  if (step <= 0) return;
  const max = Math.max(0, el.scrollWidth - el.clientWidth);
  const index = Math.round(el.scrollLeft / step);
  const left = Math.min(max, Math.max(0, index * step));
  el.scrollTo({ left, behavior: 'auto' });
}

function useMonthlyTileDrag(element, enabled) {
  useEffect(() => {
    const el = element;
    if (!enabled || !el) return undefined;
    // Touch stays on the native scroller (pan-x, momentum, snap). Mouse has no
    // overflow drag, and this effect must rebind when the place route recreates the node.
    let pointerId = null;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const onDown = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (pointerId != null) return;
      if (!el.contains(event.target)) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startLeft = el.scrollLeft;
      moved = false;
    };
    const onMove = (event) => {
      if (pointerId == null || event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 4) {
        if (!moved) el.style.scrollSnapType = 'none';
        moved = true;
      }
      if (!moved) return;
      el.scrollLeft = startLeft - dx;
      event.preventDefault();
    };
    const end = (event) => {
      if (pointerId == null || event.pointerId !== pointerId) return;
      pointerId = null;
      el.style.scrollSnapType = '';
      if (moved) snapMonthlyScroller(el);
    };
    const onClick = (event) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };
    const onWheel = (event) => {
      if (!el.contains(event.target) && event.target !== el) return;
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      el.scrollLeft += event.deltaY;
      snapMonthlyScroller(el);
      event.preventDefault();
    };
    const onDragStart = (event) => {
      if (!el.contains(event.target)) return;
      event.preventDefault();
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    window.addEventListener('dragstart', onDragStart, true);
    el.addEventListener('click', onClick, true);
    el.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => {
      el.style.scrollSnapType = '';
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', end, true);
      window.removeEventListener('pointercancel', end, true);
      window.removeEventListener('dragstart', onDragStart, true);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('wheel', onWheel, true);
    };
  }, [element, enabled]);
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
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={onActivate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      to={slot.href}
      className={className}
      aria-label={ariaLabel}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      onClick={onActivate}
    >
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
  const { pathname, search } = useLocation();
  const { siteNotice, mooniChat } = useHomeWatchChromeFlags();
  const slotCount = useHomeWatchSlotCount();
  const cardRef = useRef(null);
  const [scrollerEl, setScrollerEl] = useState(null);
  const setScrollerNode = useCallback((node) => {
    setScrollerEl((current) => (current === node ? current : node));
  }, []);
  const viewedRef = useRef(false);
  const [dismissed, setDismissed] = useState(() => isHomeWatchDismissed());
  const [viewNext, setViewNext] = useState(false);
  const [globeDrag, setGlobeDrag] = useState(false);
  const enabled = isGateoHomeWatchCardEnabled();
  const monthly = enabled && isGateoHomeMonthlySwitchEnabled(search);
  const previewStartDay = resolveHomeMonthlyPreviewStartDay(search);
  const schedule = useMemo(
    () => homeMonthlySwitchState(new Date(), previewStartDay),
    [previewStartDay, viewNext, monthly],
  );
  const viewingNext = monthly && viewNext && schedule.previewOpen;
  const monthKey = viewingNext ? schedule.nextMonthKey : schedule.currentMonthKey;
  useMonthlyTileDrag(scrollerEl, monthly);

  const slots = useMemo(() => {
    if (!enabled) return [];
    const rows = readReviewRows();
    const continueItems = readHomeWatchContinueItems().map((item) => ({
      ...item,
      reviewerHref: item.reviewer ? buildLogbookReviewerFilterHref(item.reviewer) : '',
    }));
    return buildHomeWatchSlots({
      continueItems,
      destinations: buildHomeWatchMonthlyDestinations(new Date(), rows, monthly ? monthKey : undefined),
      reelsEnabled: isGateoSelfReelsEnabled(),
      slotCount,
      reelsPoster: isGateoSelfReelsEnabled() ? resolveHomeWatchReelsPoster() : '',
      limitDestinations: !monthly,
    });
  }, [enabled, monthly, monthKey, slotCount]);

  const hidden = shouldHideHomeWatchCard({
    placeCard: isPlaceCardVisible || pathname.startsWith('/place'),
    explore: pathname === '/explore' || pathname.startsWith('/explore/'),
    mooniChat,
    cinema: isTourCinema || isFlightCinema,
    siteNotice,
  });
  const shown = enabled && !hidden && !dismissed && slots.length > 0;

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!monthly || !shown || !card) {
      if (card) {
        card.style.left = '';
        card.style.right = '';
        card.style.bottom = '';
        delete card.dataset.monthlyPlaced;
      }
      return undefined;
    }
    let frame = 0;
    const apply = () => {
      const safeProbe = card.querySelector('[data-testid="safe-area-probe"]');
      const safeBottom = safeProbe ? safeProbe.getBoundingClientRect().height : 0;
      const obstacles = [];
      for (const sel of [
        '[data-testid="home-about-row"]',
        '[data-testid="home-category-bar"]',
        '[data-testid="home-bottom-chat"]',
        '[data-testid="home-bottom-account"]',
      ]) {
        for (const el of document.querySelectorAll(sel)) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) obstacles.push(rect);
        }
      }
      const place = layoutHomeMonthlyCard({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        safeBottom,
        obstacles,
      });
      const left = `${place.left}px`;
      const right = `${place.right}px`;
      const bottom = `${place.bottom}px`;
      if (card.style.left !== left) card.style.left = left;
      if (card.style.right !== right) card.style.right = right;
      if (card.style.bottom !== bottom) card.style.bottom = bottom;
      const scroller = scrollerEl;
      if (scroller) {
        const tile = `${monthlyTileWidthPx(scroller, window.innerWidth)}px`;
        for (const li of scroller.querySelectorAll(':scope > li')) {
          if (li.style.width !== tile) li.style.width = tile;
        }
      }
      card.dataset.monthlyPlaced = '1';
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };
    apply();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    for (const sel of [
      '[data-testid="home-about-row"]',
      '[data-testid="home-category-bar"]',
      '[data-testid="home-bottom-chat"]',
      '[data-testid="home-bottom-account"]',
    ]) {
      for (const el of document.querySelectorAll(sel)) observer.observe(el);
    }
    const mutation = new MutationObserver(schedule);
    mutation.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      mutation.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [monthly, shown, slots.length, monthKey, scrollerEl]);

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

  const viewedMonth = viewingNext ? schedule.nextMonth : schedule.month;
  const linkMonth = viewingNext ? schedule.month : schedule.nextMonth;
  const monthToken = (month) => t(`home.watchCard.months.${month}`);
  const title = monthly
    ? t('home.watchCard.monthTitle', { month: monthToken(viewedMonth) })
    : t('home.watchCard.title');
  const switchLabel = monthly && schedule.previewOpen
    ? t('home.watchCard.seeMonth', { month: monthToken(linkMonth) })
    : '';

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
      data-month-key={monthly ? monthKey : undefined}
      data-monthly-switch={monthly ? '1' : undefined}
      data-preview-open={monthly && schedule.previewOpen ? '1' : undefined}
      data-globe-drag-passthrough={globeDrag ? 'true' : 'false'}
      aria-label={title}
      className={`fixed z-[54] box-border h-[85px] ${
        globeDrag
          ? '!pointer-events-none [&_*]:!pointer-events-none'
          : monthly
            ? 'pointer-events-auto touch-pan-x'
            : 'pointer-events-none'
      } ${
        monthly
          ? 'home-monthly-card left-3 right-3 min-[1280px]:left-[300px]'
          : 'left-3 right-3 bottom-[14.25rem] min-[1280px]:left-[300px] min-[1280px]:right-[300px] min-[1280px]:bottom-[110px]'
      }`}
      style={{ height: HOME_WATCH_CARD_LAYOUT.mobile.height }}
    >
      {monthly ? (
        <div
          data-testid="safe-area-probe"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 w-px opacity-0"
          style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
        />
      ) : null}
      <div className="pointer-events-none relative flex h-full min-h-0 flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl border border-white/15 bg-black/55 shadow-lg backdrop-blur-md"
        />
        <div className="relative z-[1] flex h-full min-h-0 flex-col px-1.5 pb-1 pt-0.5">
        <div className="flex h-4 shrink-0 items-center justify-between gap-1 px-0.5">
          <h2 className={`${monthly ? 'min-w-0 ' : ''}truncate text-[10px] font-bold leading-none tracking-wide text-white/90`}>
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {switchLabel ? (
              <button
                type="button"
                data-testid="home-monthly-switch"
                className="pointer-events-auto shrink-0 border-0 bg-transparent p-0 text-[10px] font-semibold leading-none text-white/90 shadow-none rounded-none underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white"
                onClick={() => setViewNext((current) => !current)}
              >
                {switchLabel}
              </button>
            ) : null}
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
        </div>
        <ul
          ref={monthly ? setScrollerNode : undefined}
          data-testid={monthly ? 'home-monthly-scroller' : undefined}
          className={
            monthly
              ? 'home-monthly-scroller pointer-events-auto flex min-h-0 min-w-0 flex-1 gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'flex min-h-0 flex-1 gap-1'
          }
        >
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
                className={
                  monthly
                    ? 'relative h-full w-[6.5rem] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-black/40 min-[1280px]:w-[12rem]'
                    : 'relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/40'
                }
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
                        className={`inline-block max-w-full rounded-sm px-1 text-[8px] font-semibold leading-none text-amber-100 ${
                          monthly ? 'whitespace-nowrap' : 'truncate'
                        }`}
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
      </div>
    </section>
  );
};

export default HomeWatchCard;
