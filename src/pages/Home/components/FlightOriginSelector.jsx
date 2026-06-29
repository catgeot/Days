import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Loader2, LocateFixed, Search } from 'lucide-react';
import { getFlightCinemaOriginOption } from '../lib/flightCinemaOriginOptions.js';
import {
  resolveOriginFromGeolocation,
  searchFlightOriginHubs,
} from '../lib/flightCinemaOriginSearch.js';

const GEO_ERROR_MESSAGES = {
  unsupported: '이 기기에서는 위치 정보를 사용할 수 없어요.',
  denied: '위치 권한을 확인해 주세요.',
  unavailable: '현재 위치를 가져오지 못했어요.',
  not_found: '근처 공항을 찾지 못했어요.',
};

const LISTBOX_MAX_HEIGHT = 176;
const LISTBOX_Z_INDEX = 130;

/**
 * @param {{
 *   selectedIata?: string,
 *   disabled?: boolean,
 *   variant?: 'summary' | 'bar' | 'bar-header',
 *   browserOriginHint?: string | null,
 *   onSelect?: (iata: string) => void,
 *   onApplyBrowserOriginSuggestion?: () => void,
 *   onExpandRequest?: () => void,
 *   onCollapseRequest?: () => void,
 *   initialExpanded?: boolean,
 * }} props
 */
export default function FlightOriginSelector({
  selectedIata = 'ICN',
  disabled = false,
  variant = 'summary',
  browserOriginHint = null,
  onSelect,
  onApplyBrowserOriginSuggestion,
  onExpandRequest,
  onCollapseRequest,
  initialExpanded = false,
}) {
  const listboxId = useId();
  const rootRef = useRef(null);
  const inputWrapRef = useRef(null);
  const listboxPortalRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(
    () => getFlightCinemaOriginOption(selectedIata),
    [selectedIata]
  );

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [geoPending, setGeoPending] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [barExpanded, setBarExpanded] = useState(initialExpanded);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  const isBar = variant === 'bar' || variant === 'bar-header';
  const isBarHeader = variant === 'bar-header';
  const isSummary = variant === 'summary';
  const showSearchUi = !isBar || barExpanded;

  const updateDropdownPosition = useCallback(() => {
    const anchor = inputWrapRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp = spaceBelow < LISTBOX_MAX_HEIGHT + 12 && rect.top > LISTBOX_MAX_HEIGHT + 12;

    setDropdownStyle({
      left: rect.left,
      width: rect.width,
      top: flipUp ? rect.top - 4 : rect.bottom + 4,
      flipUp,
    });
  }, []);

  useEffect(() => {
    if (!isOpen || results.length === 0) {
      setDropdownStyle(null);
      return undefined;
    }

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, results.length, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (rootRef.current?.contains(target)) return;
      if (listboxPortalRef.current?.contains(target)) return;
      setIsOpen(false);
      setQuery('');
      setResults([]);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResults(searchFlightOriginHubs(trimmed));
    }, 120);

    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (iata) => {
      const code = String(iata ?? '').trim().toUpperCase();
      if (code.length !== 3) return;
      onSelect?.(code);
      setIsOpen(false);
      setQuery('');
      setResults([]);
      setGeoError(null);
      if (isBar) setBarExpanded(false);
      onCollapseRequest?.();
    },
    [isBar, onCollapseRequest, onSelect]
  );

  const handleUseMyLocation = useCallback(async () => {
    if (disabled || geoPending) return;
    setGeoError(null);
    setGeoPending(true);
    try {
      const resolved = await resolveOriginFromGeolocation();
      handleSelect(resolved.iata);
    } catch (err) {
      const code = err?.code && GEO_ERROR_MESSAGES[err.code] ? err.code : 'unavailable';
      setGeoError(GEO_ERROR_MESSAGES[code] || GEO_ERROR_MESSAGES.unavailable);
    } finally {
      setGeoPending(false);
    }
  }, [disabled, geoPending, handleSelect]);

  const inputClass = isBar
    ? 'min-h-[44px] w-full rounded-md border border-white/15 bg-white/5 py-2 pl-7 pr-11 text-xs font-medium text-white placeholder:text-white/35 focus:border-sky-300/50 focus:outline-none focus:ring-1 focus:ring-sky-300/30'
    : isSummary
      ? 'min-h-[40px] w-full rounded-lg border border-sky-400/35 bg-black/40 py-2 pl-8 pr-12 text-sm font-medium text-white placeholder:text-white/45 shadow-inner shadow-black/20 focus:border-sky-300/55 focus:outline-none focus:ring-1 focus:ring-sky-400/35'
      : 'min-h-[44px] w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-7 pr-11 text-xs font-medium text-gray-100 placeholder:text-gray-500 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/25';

  const listPortalClass = isBar
    ? 'overflow-y-auto rounded-md border border-white/15 bg-black/95 py-1 shadow-xl backdrop-blur-xl'
    : 'overflow-y-auto rounded-lg border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-xl';

  const itemClass = (active) =>
    isBar
      ? `flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
          active ? 'bg-sky-400/20 text-white' : 'text-white/85 hover:bg-white/10'
        }`
      : `flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs transition-colors ${
          active ? 'bg-sky-500/15 text-sky-100' : 'text-gray-200 hover:bg-white/[0.08]'
        }`;

  const labelClass = isBar
    ? 'text-[10px] font-semibold uppercase tracking-wide text-white/45 break-keep'
    : isSummary
      ? 'text-[11px] font-bold text-sky-100 break-keep'
      : 'text-[10px] font-semibold uppercase tracking-wide text-gray-400 break-keep';

  const summarySelectedClass =
    'inline-flex max-w-[58%] shrink-0 items-center rounded-md border border-sky-400/40 bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-50 tabular-nums truncate';

  const barSearchLabelClass = 'text-[11px] font-bold text-sky-100 break-keep';

  const barCollapseClass =
    'inline-flex shrink-0 items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90 transition-colors hover:border-sky-300/45 hover:bg-sky-500/15 hover:text-white motion-safe:active:scale-[0.98]';

  const selectedClass = isBar
    ? 'text-xs font-bold text-sky-100 tabular-nums'
    : 'text-xs font-bold text-sky-100 tabular-nums';

  const geoButtonClass = isBar
    ? 'inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-violet-300/40 bg-violet-500/15 px-3 text-sm font-semibold text-violet-100 transition-colors hover:border-violet-200/55 hover:bg-violet-500/25'
    : 'inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-lg border border-violet-400/35 bg-violet-500/10 px-2.5 text-xs font-semibold text-violet-200 transition-colors hover:border-violet-300/50 hover:bg-violet-500/15';

  const geoInlineClass = isSummary
    ? `${geoButtonClass} absolute right-1 top-1/2 h-10 min-h-0 w-10 -translate-y-1/2 border-sky-400/35 bg-sky-500/15 p-0 text-sky-100`
    : `${geoButtonClass} absolute right-1 top-1/2 h-10 min-h-0 w-10 -translate-y-1/2 p-0`;

  const geoIconSize = isBar ? 16 : 18;

  const selectedLabel = selectedOption
    ? `${selectedOption.label} (${selectedOption.iata})`
    : selectedIata;

  const listboxPortal =
    isOpen && results.length > 0 && dropdownStyle && typeof document !== 'undefined'
      ? createPortal(
          <ul
            id={listboxId}
            ref={listboxPortalRef}
            role="listbox"
            className={listPortalClass}
            style={{
              position: 'fixed',
              zIndex: LISTBOX_Z_INDEX,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              maxHeight: LISTBOX_MAX_HEIGHT,
              ...(dropdownStyle.flipUp
                ? { bottom: window.innerHeight - dropdownStyle.top }
                : { top: dropdownStyle.top }),
            }}
          >
            {results.map((row) => {
              const active = row.iata === selectedIata;
              return (
                <li key={row.iata} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={itemClass(active)}
                    onClick={() => handleSelect(row.iata)}
                  >
                    <span className="min-w-0 truncate font-semibold break-keep">{row.label}</span>
                    <span className="shrink-0 font-bold tabular-nums opacity-80">{row.iata}</span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  const chipButtonClass = isBarHeader
    ? `inline-flex min-h-0 max-w-[9.5rem] items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-bold text-sky-100 transition-colors hover:border-sky-300/40 hover:bg-white/10 ${
        disabled ? 'opacity-60 cursor-wait' : ''
      }`
    : `inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-sky-100 transition-colors hover:border-sky-300/40 hover:bg-white/10 ${
        disabled ? 'opacity-60 cursor-wait' : ''
      }`;

  if (isBarHeader) {
    return (
      <div
        ref={rootRef}
        className="flex shrink-0 items-center gap-1.5"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45 break-keep">
          출발
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onExpandRequest?.()}
          className={chipButtonClass}
          aria-expanded={false}
          title={selectedOption?.officialKo || selectedLabel}
        >
          <span className="min-w-0 truncate tabular-nums">{selectedLabel}</span>
          <ChevronDown size={14} className="shrink-0 opacity-70" aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (isBar && !isBarHeader && !showSearchUi) {
    return (
      <div
        ref={rootRef}
        className="min-w-0"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <p className={labelClass}>출발지</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setBarExpanded(true)}
            className={chipButtonClass}
            aria-expanded={false}
            title={selectedOption?.officialKo || selectedLabel}
          >
            <span className="min-w-0 truncate tabular-nums">{selectedLabel}</span>
            <ChevronDown size={16} className="shrink-0 opacity-70" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`min-w-0 ${
        isSummary
          ? 'space-y-2 rounded-xl border border-sky-400/25 bg-gradient-to-b from-sky-500/12 to-sky-950/25 p-2.5'
          : isBar
            ? 'space-y-1.5'
            : 'space-y-1'
      }`}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <p className={isBar ? barSearchLabelClass : labelClass}>
          {isSummary || isBar ? '출발지 검색' : '출발지'}
        </p>
        {!isBar && selectedOption ? (
          <span
            className={isSummary ? summarySelectedClass : `min-w-0 truncate ${selectedClass}`}
            title={selectedOption.officialKo || selectedOption.label}
          >
            {selectedOption.label} ({selectedOption.iata})
          </span>
        ) : isBar ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen(false);
              setQuery('');
              setResults([]);
              if (onCollapseRequest) {
                onCollapseRequest();
                return;
              }
              setBarExpanded(false);
            }}
            className={barCollapseClass}
            aria-label="출발지 검색 접기"
          >
            <ChevronUp size={15} aria-hidden="true" />
            접기
          </button>
        ) : (
          <span className={selectedClass}>{selectedIata}</span>
        )}
      </div>

      <div className={`flex gap-1.5 ${isBar ? 'flex-col' : 'items-stretch'}`}>
        <div ref={inputWrapRef} className="relative min-w-0 flex-1">
          <Search
            size={14}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
              isBar
                ? 'left-2.5 text-white/40'
                : isSummary
                  ? 'left-3 text-sky-300/75'
                  : 'left-2.5 text-gray-500'
            }`}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            disabled={disabled}
            placeholder="도시·공항 검색 (예: 마닐라, ICN)"
            autoComplete="off"
            aria-expanded={isOpen && results.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className={`${inputClass} ${disabled ? 'opacity-60 cursor-wait' : ''}`}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
              setGeoError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                setResults([]);
                inputRef.current?.blur();
                if (isBar) setBarExpanded(false);
                onCollapseRequest?.();
              }
            }}
          />
          {!isBar ? (
            <button
              type="button"
              disabled={disabled || geoPending}
              onClick={handleUseMyLocation}
              className={`${geoInlineClass} ${disabled || geoPending ? 'opacity-60 cursor-wait' : ''}`}
              title="내 위치에서 출발"
              aria-label="내 위치에서 출발"
            >
              {geoPending ? (
                <Loader2 size={geoIconSize} className="animate-spin" />
              ) : (
                <LocateFixed size={geoIconSize} />
              )}
            </button>
          ) : null}
        </div>

        {isBar ? (
          <button
            type="button"
            disabled={disabled || geoPending}
            onClick={handleUseMyLocation}
            className={`${geoButtonClass} w-full ${disabled || geoPending ? 'opacity-60 cursor-wait' : ''}`}
          >
            {geoPending ? <Loader2 size={geoIconSize} className="animate-spin" /> : <LocateFixed size={geoIconSize} />}
            내 위치에서 출발
          </button>
        ) : null}
      </div>

      {listboxPortal}

      {geoError ? (
        <p className={`text-[10px] font-medium break-keep ${isBar ? 'text-rose-200/90' : 'text-rose-300/90'}`}>
          {geoError}
        </p>
      ) : null}

      {browserOriginHint && onApplyBrowserOriginSuggestion ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onApplyBrowserOriginSuggestion}
          className={`min-h-[44px] w-full text-left text-xs font-medium break-keep ${
            isBar ? 'text-violet-200/85 hover:text-violet-100' : 'text-violet-300/90 hover:text-violet-200'
          } ${disabled ? 'opacity-60 cursor-wait' : ''}`}
          title={browserOriginHint}
        >
          {browserOriginHint}
        </button>
      ) : null}
    </div>
  );
}
