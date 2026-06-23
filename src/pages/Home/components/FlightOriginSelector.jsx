import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2, LocateFixed, Search } from 'lucide-react';
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

/**
 * @param {{
 *   selectedIata?: string,
 *   disabled?: boolean,
 *   variant?: 'summary' | 'bar',
 *   browserOriginHint?: string | null,
 *   onSelect?: (iata: string) => void,
 *   onApplyBrowserOriginSuggestion?: () => void,
 * }} props
 */
export default function FlightOriginSelector({
  selectedIata = 'ICN',
  disabled = false,
  variant = 'summary',
  browserOriginHint = null,
  onSelect,
  onApplyBrowserOriginSuggestion,
}) {
  const listboxId = useId();
  const rootRef = useRef(null);
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

  const isBar = variant === 'bar';

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
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
    },
    [onSelect]
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
    ? 'w-full rounded-md border border-white/15 bg-white/5 py-1.5 pl-7 pr-2 text-[11px] font-medium text-white placeholder:text-white/35 focus:border-sky-300/50 focus:outline-none focus:ring-1 focus:ring-sky-300/30'
    : 'w-full rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-7 pr-2 text-[11px] font-medium text-gray-100 placeholder:text-gray-500 focus:border-sky-400/40 focus:outline-none focus:ring-1 focus:ring-sky-400/25';

  const listClass = isBar
    ? 'absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-white/15 bg-black/95 py-1 shadow-xl backdrop-blur-xl'
    : 'absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-white/10 bg-black/95 py-1 shadow-xl backdrop-blur-xl';

  const itemClass = (active) =>
    isBar
      ? `flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
          active ? 'bg-sky-400/20 text-white' : 'text-white/85 hover:bg-white/10'
        }`
      : `flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors ${
          active ? 'bg-sky-500/15 text-sky-100' : 'text-gray-200 hover:bg-white/[0.08]'
        }`;

  const labelClass = isBar
    ? 'text-[10px] font-semibold uppercase tracking-wide text-white/45 break-keep'
    : 'text-[10px] font-semibold uppercase tracking-wide text-gray-400 break-keep';

  const selectedClass = isBar
    ? 'text-[11px] font-bold text-sky-100 tabular-nums'
    : 'text-[11px] font-bold text-sky-100 tabular-nums';

  return (
    <div
      ref={rootRef}
      className="min-w-0 space-y-1.5"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <p className={labelClass}>출발지</p>
        {selectedOption ? (
          <span className={`min-w-0 truncate ${selectedClass}`} title={selectedOption.officialKo || selectedOption.label}>
            {selectedOption.label} ({selectedOption.iata})
          </span>
        ) : (
          <span className={selectedClass}>{selectedIata}</span>
        )}
      </div>

      <div className="relative">
        <Search
          size={13}
          className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 ${
            isBar ? 'text-white/40' : 'text-gray-500'
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
          aria-expanded={isOpen}
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
            }
          }}
        />

        {isOpen && results.length > 0 ? (
          <ul id={listboxId} role="listbox" className={listClass}>
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
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || geoPending}
          onClick={handleUseMyLocation}
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors break-keep ${
            isBar
              ? 'border-violet-300/40 bg-violet-500/15 text-violet-100 hover:border-violet-200/55 hover:bg-violet-500/25'
              : 'border-violet-400/35 bg-violet-500/10 text-violet-200 hover:border-violet-300/50 hover:bg-violet-500/15'
          } ${disabled || geoPending ? 'opacity-60 cursor-wait' : ''}`}
        >
          {geoPending ? <Loader2 size={11} className="animate-spin" /> : <LocateFixed size={11} />}
          내 위치에서 출발
        </button>
      </div>

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
          className={`w-full text-left text-[10px] font-medium break-keep ${
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
