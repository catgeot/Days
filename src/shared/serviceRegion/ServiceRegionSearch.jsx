import React, { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedPlaceName } from '../../components/PlaceCard/common/locationDisplay.js';
import {
  MOBILE_INPUT_TEXT_CLASS,
  useDeferredViewportSyncOnBlur,
  useVisualViewportBottomAnchor,
} from '../hooks/useMobileInputViewport.js';
import { trackEvent } from '../analytics/trackEvent.js';
import { shouldConfirmHangulEntry } from '../../utils/hangulSearch.js';
import {
  buildServiceModalRegionResetEvent,
  buildServiceModalSearchEvent,
  buildServiceModalSearchOpenEvent,
  filterServiceRegions,
  isTourRegionSupported,
  listRecommendedServiceRegions,
  loadRecentServiceRegions,
  pickTypedServiceRegion,
  recordConfirmedTourRegionVisit,
} from './serviceRegionSearchModel.js';

/**
 * Shared region field for service modals. Tour is the first caller.
 * The list updates while typing. The parent widget updates only from onCommit.
 */
export default function ServiceRegionSearch({
  service = 'tour',
  tone = 'dark',
  layout = 'inline',
  originalLocation = null,
  activeLocation = null,
  changed = false,
  notice = null,
  onCommit,
  onReset,
  onSearchOpen,
  loadRecent = loadRecentServiceRegions,
  loadRecommended = listRecommendedServiceRegions,
  searchRegions = filterServiceRegions,
  now = () => new Date(),
}) {
  const { t, i18n } = useTranslation();
  const listId = useId();
  const rootRef = useRef(null);
  const openedOnce = useRef(false);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [recent, setRecent] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const syncViewport = useDeferredViewportSyncOnBlur(0);
  const keyboardAnchor = useVisualViewportBottomAnchor(layout === 'block' && open);
  const dark = tone !== 'light';
  const block = layout === 'block';

  const labelSource = notice || activeLocation;
  const committedLabel =
    getLocalizedPlaceName(labelSource, i18n.language) ||
    labelSource?.name ||
    labelSource?.name_en ||
    '';
  const originalName =
    getLocalizedPlaceName(originalLocation, i18n.language) ||
    originalLocation?.name ||
    originalLocation?.name_en ||
    '';
  const inputValue = dirty ? draft : committedLabel;
  const hits = dirty ? searchRegions(draft) || [] : [];
  const showRecent = open && !dirty && recent.length > 0;
  const showRecommended = open && !dirty && recommended.length > 0;
  const showHits = open && dirty && hits.length > 0;
  const showList = showRecent || showRecommended || showHits;

  const refreshQuiet = () => {
    const nextRecent = loadRecent() || [];
    const nextRecommended =
      loadRecommended({
        exclude: nextRecent,
        now: typeof now === 'function' ? now() : now,
      }) || [];
    setRecent(nextRecent);
    setRecommended(nextRecommended);
    return nextRecent;
  };

  const handleFocus = () => {
    const nextRecent = refreshQuiet();
    setOpen(true);
    if (openedOnce.current) return;
    openedOnce.current = true;
    if (onSearchOpen?.() === false) return;
    const event = buildServiceModalSearchOpenEvent({
      service,
      hasRecent: nextRecent.length > 0,
    });
    trackEvent(event.name, event.params);
  };

  const commit = (region, method) => {
    if (!region) return;
    const chars = method === 'typed' ? String(draft || '').trim().length : 0;
    const supported = isTourRegionSupported(region);
    const event = buildServiceModalSearchEvent({
      service,
      from: originalLocation?.slug || '',
      to: region.slug || '',
      method,
      result: supported ? 'ok' : 'no_partner',
      chars,
    });
    trackEvent(event.name, event.params);
    if (supported && service === 'tour') {
      recordConfirmedTourRegionVisit(region, i18n.language);
    }
    onCommit?.(region);
    setDirty(false);
    setDraft('');
    setOpen(false);
  };

  const handleReset = () => {
    const event = buildServiceModalRegionResetEvent({
      service,
      to: originalLocation?.slug || '',
    });
    trackEvent(event.name, event.params);
    onReset?.();
    setDirty(false);
    setDraft('');
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!shouldConfirmHangulEntry({ composing, key: 'Enter' })) return;
    if (!dirty) return;
    const picked = pickTypedServiceRegion(draft, hits);
    if (!picked) return;
    commit(picked, 'typed');
  };

  const listMaxHeight = keyboardAnchor?.bottom
    ? { maxHeight: `calc(100dvh - ${Number(keyboardAnchor.bottom) + 96}px)` }
    : undefined;

  const renderOption = (region, method) => {
    const supported = isTourRegionSupported(region);
    const label =
      getLocalizedPlaceName(region, i18n.language) || region.name || region.name_en || region.slug;
    return (
      <li key={`${method}-${region.slug || label}`} role="presentation">
        <button
          type="button"
          role="option"
          data-region-slug={region.slug || ''}
          data-region-support={supported ? 'ok' : 'no'}
          data-region-method={method}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            commit(region, method);
          }}
          className={`flex w-full min-w-0 items-center justify-between gap-2 px-2.5 py-1.5 text-left ${
            MOBILE_INPUT_TEXT_CLASS
          } ${
            supported
              ? dark
                ? 'text-orange-50 hover:bg-white/10'
                : 'text-gray-900 hover:bg-orange-50'
              : dark
                ? 'text-white/35 hover:bg-white/5'
                : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <span className="min-w-0 truncate">{label}</span>
          {supported ? null : (
            <span className="shrink-0 text-[11px]">
              {t('home.serviceRegion.tour.noList')}
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${block ? 'w-full' : 'w-[min(100%,18rem)]'}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <input
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t('home.serviceRegion.tour.inputAria')}
        data-service-region-search={service}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={t('home.serviceRegion.placeholder')}
        value={inputValue}
        onFocus={handleFocus}
        onClick={() => {
          if (!open) handleFocus();
        }}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        onChange={(event) => {
          setDirty(true);
          setDraft(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          window.setTimeout(() => {
            const root = rootRef.current;
            if (!root || !root.isConnected) return;
            if (root.contains(document.activeElement)) return;
            setOpen(false);
            setDirty(false);
            setDraft('');
            syncViewport();
          }, 120);
        }}
        className={`w-full min-w-0 rounded-md border px-2 py-1 outline-none ${MOBILE_INPUT_TEXT_CLASS} ${
          dark
            ? 'border-white/15 bg-white/10 text-orange-50 placeholder:text-orange-100/40 focus:border-orange-200/55'
            : 'border-orange-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-orange-400'
        }`}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('home.serviceRegion.tour.inputAria')}
          style={listMaxHeight}
          className={`absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-auto rounded-md border py-1 shadow-lg ${
            dark ? 'border-white/15 bg-zinc-950' : 'border-orange-100 bg-white'
          }`}
        >
          {showRecent ? (
            <li
              className={`px-2.5 pt-1 text-[10px] font-semibold ${
                dark ? 'text-orange-200/55' : 'text-orange-700/70'
              }`}
            >
              {t('home.serviceRegion.recent')}
            </li>
          ) : null}
          {showRecent ? recent.map((region) => renderOption(region, 'recent')) : null}
          {showRecommended ? (
            <li
              className={`px-2.5 pt-1 text-[10px] font-semibold ${
                dark ? 'text-orange-200/55' : 'text-orange-700/70'
              }`}
            >
              {t('home.serviceRegion.recommended')}
            </li>
          ) : null}
          {showRecommended
            ? recommended.map((region) => renderOption(region, 'recommended'))
            : null}
          {showHits ? hits.map((region) => renderOption(region, 'typed')) : null}
        </ul>
      ) : null}
      {notice ? (
        <p
          data-service-region-notice=""
          className={`mt-1 text-left text-[12px] leading-snug break-keep ${
            dark ? 'text-orange-100/70' : 'text-gray-600'
          }`}
        >
          {t('home.serviceRegion.tour.noPartner')}
        </p>
      ) : null}
      {changed && originalName ? (
        <button
          type="button"
          data-service-region-reset=""
          onClick={(event) => {
            event.stopPropagation();
            handleReset();
          }}
          className={`mt-1 block max-w-full text-left text-[12px] leading-snug underline-offset-2 break-keep hover:underline ${
            dark ? 'text-orange-100/80' : 'text-orange-800'
          }`}
        >
          {t('home.serviceRegion.tour.backTo', { name: originalName })}
        </button>
      ) : null}
    </div>
  );
}
