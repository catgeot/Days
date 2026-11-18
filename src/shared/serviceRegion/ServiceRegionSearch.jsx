import React, { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
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
  listKnownServiceRegions,
  listRecommendedServiceRegions,
  listTourSearchRegionHits,
  loadRecentServiceRegions,
  parseTourServiceSearchInput,
  pickTypedServiceRegion,
  recordConfirmedTourRegionVisit,
  regionIdentity,
  resolveTourSearchCommit,
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
  const inputId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
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

  const originalName =
    getLocalizedPlaceName(originalLocation, i18n.language) ||
    originalLocation?.name ||
    originalLocation?.name_en ||
    '';
  const inputValue = dirty ? draft : '';
  const showClear = Boolean(String(inputValue || '').trim());
  const parsedDraft =
    dirty && draft ? parseTourServiceSearchInput(draft, activeLocation) : { kind: 'empty' };
  const tourUsesCatalog = searchRegions === filterServiceRegions;
  const hits =
    dirty && service === 'tour'
      ? tourUsesCatalog
        ? listTourSearchRegionHits(draft, listKnownServiceRegions())
        : searchRegions(draft) || []
      : dirty
        ? searchRegions(draft) || []
        : [];
  const showRecent = open && !dirty && recent.length > 0;
  const showRecommended = open && !dirty && recommended.length > 0;
  const showHits = open && dirty && hits.length > 0;
  const showActivityHint =
    open && dirty && service === 'tour' && !showHits && parsedDraft.kind === 'activity_only';
  const showNoResults =
    open &&
    dirty &&
    service === 'tour' &&
    !showHits &&
    !showActivityHint &&
    parsedDraft.kind === 'no_match';
  const showList = showRecent || showRecommended || showHits || showActivityHint || showNoResults;

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

  const commit = (region, method, activityKeyword = '') => {
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
    onCommit?.(region, { activityKeyword, method });
    setDirty(false);
    setDraft('');
    setOpen(false);
  };

  const commitResolved = (resolved) => {
    if (!resolved || resolved.noMatch) return false;
    const { region, activityKeyword, method } = resolved;
    if (!region) return false;
    commit(region, method || 'typed', activityKeyword || '');
    return true;
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

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDirty(true);
    setDraft('');
    setOpen(true);
    refreshQuiet();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!shouldConfirmHangulEntry({ composing, key: 'Enter' })) return;
    if (!dirty) return;
    if (service === 'tour') {
      const resolved = resolveTourSearchCommit(draft, hits, activeLocation);
      commitResolved(resolved);
      return;
    }
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={(event) => {
            event.stopPropagation();
            let activityKeyword = '';
            if (service === 'tour' && dirty) {
              const parsed = parseTourServiceSearchInput(draft, activeLocation);
              if (
                parsed.kind === 'region_activity' &&
                regionIdentity(parsed.region) === regionIdentity(region)
              ) {
                activityKeyword = parsed.activityKeyword || '';
              }
            }
            commit(region, method, activityKeyword);
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

  const fieldLabel =
    service === 'tour' ? (
      <label
        htmlFor={inputId}
        className={`mb-1.5 block text-left text-[12px] font-semibold leading-snug break-keep ${
          dark ? 'text-orange-100/85' : 'text-gray-700'
        }`}
      >
        {t('home.serviceRegion.tour.fieldLabel')}
      </label>
    ) : null;

  const inputShell = (
    <div
      className={`relative flex min-w-0 items-center rounded-md border ${
        dark
          ? 'border-white/15 bg-white/10 focus-within:border-orange-200/55'
          : 'border-orange-200 bg-white focus-within:border-orange-400'
      }`}
    >
      <Search
        size={16}
        aria-hidden="true"
        className={`pointer-events-none absolute left-2.5 shrink-0 ${
          dark ? 'text-orange-100/55' : 'text-orange-600/70'
        }`}
        data-service-region-search-icon=""
      />
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        inputMode="search"
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
        className={`w-full min-w-0 rounded-md bg-transparent py-2 pl-9 outline-none ${
          showClear ? 'pr-9' : 'pr-2.5'
        } ${MOBILE_INPUT_TEXT_CLASS} ${
          dark ? 'text-orange-50 placeholder:text-orange-100/45' : 'text-gray-900 placeholder:text-gray-400'
        }`}
      />
      {showClear ? (
        <button
          type="button"
          data-service-region-clear=""
          aria-label={t('home.serviceRegion.tour.clearAria')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className={`absolute right-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
            dark ? 'text-orange-100/75 hover:bg-white/10 hover:text-orange-50' : 'text-gray-500 hover:bg-orange-50'
          }`}
        >
          <X size={15} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-service-region-root=""
      className={`relative min-w-0 ${block ? 'w-full' : 'w-[min(100%,22rem)]'}`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {fieldLabel}
      {inputShell}
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
          {showActivityHint ? (
            <li
              role="presentation"
              data-tour-search-activity-hint=""
              className={`px-2.5 py-2 text-left text-[12px] leading-snug break-keep ${
                dark ? 'text-orange-100/75' : 'text-gray-600'
              }`}
            >
              {t('home.serviceRegion.tour.searchInRegion', {
                keyword: parsedDraft.activityKeyword || draft,
              })}
            </li>
          ) : null}
          {showNoResults ? (
            <li
              role="presentation"
              data-tour-search-no-results=""
              className={`px-2.5 py-2 text-left ${
                dark ? 'text-orange-100/80' : 'text-gray-700'
              }`}
            >
              <p className="text-[12px] font-semibold leading-snug break-keep">
                {t('home.serviceRegion.tour.noResults')}
              </p>
              <p
                className={`mt-1 text-[11px] leading-snug break-keep ${
                  dark ? 'text-orange-100/55' : 'text-gray-500'
                }`}
              >
                {t('home.serviceRegion.tour.noResultsHint')}
              </p>
            </li>
          ) : null}
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