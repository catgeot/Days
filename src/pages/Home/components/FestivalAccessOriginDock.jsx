import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  FESTIVAL_ORIGIN_DOCK_PRIMARY_IDS,
  festivalOriginLabel,
  visibleFestivalDomesticOrigins,
} from '../lib/festivalDomesticOrigins.js';
import {
  findKoreaOriginCityById,
  koreaOriginAskLabel,
  koreaOriginOptionLabel,
  koreaOriginRegionTag,
  readDomesticOriginCityId,
  suggestKoreaOriginCities,
} from '../lib/koreaOriginCityMatch.js';
import { arrivalAirportForAccessDestination, locateNearestOriginCity } from '../lib/koreaOriginGeolocation.js';
import { shouldResendPinnedOrigin, tryOriginKeyboardConfirm } from '../lib/festivalOriginConfirm.js';
import { shouldConfirmHangulEntry } from '../../../utils/hangulSearch.js';

const tone = (fresh, dark, light) => (fresh ? light : dark);

function chipCityId(row) {
  return row?.id ? `${row.ko}|${row.province}` : '';
}

function keepOriginFieldFocus(event) {
  event.preventDefault();
}

/**
 * Festival «가는 법» chips plus a local city field. Suggestions never call the network.
 */
export default function FestivalAccessOriginDock({
  fresh = false,
  locale = 'ko',
  hubLabel = '',
  address = '',
  selectedChipId = '',
  disabled = false,
  held = false,
  onBack,
  messageScrollRef = null,
  onConfirm,
  backLabel,
  title,
  destinationLat = null,
  destinationLng = null,
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [pinnedId, setPinnedId] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [locating, setLocating] = useState(false);
  const [overseasPin, setOverseasPin] = useState(null);
  const composingRef = useRef(false);
  const rememberedRef = useRef(false);
  const savedScrollTopRef = useRef(null);
  const confirmFlightRef = useRef(false);
  const submittedIdRef = useRef('');
  const suppressOpenUntilRef = useRef(0);

  const visible = useMemo(
    () => visibleFestivalDomesticOrigins(hubLabel, address),
    [hubLabel, address],
  );
  const primary = visible.filter((row) => FESTIVAL_ORIGIN_DOCK_PRIMARY_IDS.includes(row.id));
  const shown = expanded ? visible : primary;
  const compactChips = !expanded && String(locale).slice(0, 2) === 'en';
  const chipSize = compactChips ? 'px-1 text-[11px]' : 'px-2 text-xs';
  const suggestion = useMemo(() => suggestKoreaOriginCities(text), [text]);
  const blocked = disabled || held;

  const openSuggestions = () => {
    if (Date.now() < suppressOpenUntilRef.current) return;
    setSuggestionsOpen(true);
  };

  const closeSuggestions = () => {
    // A confirm click can return focus to the field and would otherwise reopen the list.
    suppressOpenUntilRef.current = Date.now() + 80;
    setSuggestionsOpen(false);
  };

  const emitConfirm = (payload) => {
    if (blocked || confirmFlightRef.current) return false;
    confirmFlightRef.current = true;
    closeSuggestions();
    try {
      const pending = onConfirm?.(payload);
      Promise.resolve(pending).finally(() => {
        confirmFlightRef.current = false;
      });
    } catch {
      confirmFlightRef.current = false;
    }
    return true;
  };

  useLayoutEffect(() => {
    if (savedScrollTopRef.current == null) return;
    const scroller = messageScrollRef?.current;
    if (scroller) scroller.scrollTop = savedScrollTopRef.current;
    savedScrollTopRef.current = null;
  }, [expanded, messageScrollRef]);

  useEffect(() => {
    if (rememberedRef.current) return;
    rememberedRef.current = true;
    const city = findKoreaOriginCityById(readDomesticOriginCityId());
    if (!city) return;
    const chip = visible.find((row) => row.ko === city.ko && row.province === city.province);
    if (chip && FESTIVAL_ORIGIN_DOCK_PRIMARY_IDS.includes(chip.id)) {
      onConfirm?.({ rememberOnly: true, chipId: chip.id });
      return;
    }
    setText(koreaOriginAskLabel(city, locale));
    setPinnedId(city.id);
  }, [locale, onConfirm, visible]);

  const confirmCity = (city) => {
    if (!city) return;
    const sent = emitConfirm({
      cityId: city.id,
      askLabel: koreaOriginAskLabel(city, 'ko'),
      askLabelEn: koreaOriginAskLabel(city, 'en'),
    });
    if (!sent) return;
    setText(koreaOriginAskLabel(city, locale));
    setPinnedId(city.id);
    setOverseasPin(null);
    setLocateError('');
    submittedIdRef.current = city.id;
  };

  const confirmOverseas = (pin) => {
    const found = pin || overseasPin;
    if (!found?.originIata) return;
    const arrival = arrivalAirportForAccessDestination({
      lat: destinationLat,
      lng: destinationLng,
    });
    const same = !arrival?.iata || arrival.iata === found.originIata;
    if (!found.city || !found.country) return;
    const sent = emitConfirm({
      overseas: {
        city: found.city,
        country: found.country,
        cityEn: found.cityEn || found.city,
        countryEn: found.countryEn || found.country,
        originIata: found.originIata,
        koreaIata: same ? found.originIata : arrival.iata,
        originLabelKo: found.originLabelKo,
        originLabelEn: found.originLabelEn || found.originIata,
        arrivalLabelKo: same ? '' : arrival.labelKo,
        arrivalLabelEn: same ? '' : arrival.labelEn,
      },
    });
    if (!sent) return;
    setLocateError('');
    submittedIdRef.current = 'overseas';
  };

  const onChip = (row) => {
    const sent = emitConfirm(row);
    if (!sent) return;
    setText('');
    setPinnedId('');
    setOverseasPin(null);
    setLocateError('');
    submittedIdRef.current = `chip:${row.id}`;
  };

  const onAskAnyway = () => {
    if (!suggestion.askRaw) return;
    const askRaw = suggestion.askRaw;
    const sent = emitConfirm({
      askLabel: askRaw,
      askLabelEn: askRaw,
    });
    if (!sent) return;
    submittedIdRef.current = `ask:${askRaw}`;
  };

  const onLocate = async () => {
    if (blocked || locating) return;
    setLocating(true);
    setLocateError('');
    try {
      const found = await locateNearestOriginCity();
      if (!found.ok || (!found.overseas && !found.city)) {
        setOverseasPin(null);
        setLocateError(t('mooni.chat.originLocateFail'));
        return;
      }
      if (found.overseas) {
        const en = String(locale).slice(0, 2) === 'en';
        const cityName = en ? (found.cityEn || found.city) : found.city;
        const countryName = en ? (found.countryEn || found.country) : found.country;
        setOverseasPin(found);
        setText(t('mooni.chat.originLocated', { city: cityName, province: countryName }));
        setPinnedId('overseas');
        submittedIdRef.current = '';
        closeSuggestions();
        return;
      }
      setOverseasPin(null);
      const city = found.city;
      const name = String(locale).slice(0, 2) === 'en' ? city.en : city.ko;
      setText(t('mooni.chat.originLocated', { city: name, province: koreaOriginRegionTag(city, locale) }));
      setPinnedId(city.id);
      submittedIdRef.current = '';
      closeSuggestions();
    } finally {
      setLocating(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    const composing = composingRef.current || event.nativeEvent?.isComposing === true;
    if (blocked) {
      event.preventDefault();
      return;
    }
    if (!composing && pinnedId === 'overseas' && overseasPin) {
      event.preventDefault();
      confirmOverseas(overseasPin);
      return;
    }
    if (shouldResendPinnedOrigin({
      suggestionsOpen,
      pinnedId,
      submittedId: submittedIdRef.current,
    })) {
      event.preventDefault();
      if (!shouldConfirmHangulEntry({ composing, key: 'Enter' })) return;
      if (pinnedId === 'overseas' && overseasPin) {
        confirmOverseas(overseasPin);
        return;
      }
      confirmCity(findKoreaOriginCityById(pinnedId));
      return;
    }
    if (!suggestionsOpen) {
      if (!composing) event.preventDefault();
      return;
    }
    const sent = tryOriginKeyboardConfirm({
      composing,
      key: 'Enter',
      suggestion,
      send: confirmCity,
    });
    if (sent || composing) event.preventDefault();
  };

  const showList = suggestionsOpen && (suggestion.kind === 'typo' || suggestion.cities.length > 0);
  const showGu = suggestionsOpen && suggestion.kind === 'gu';
  const showMissing = suggestionsOpen && !overseasPin && suggestion.kind === 'missing' && suggestion.askRaw;

  return (
    <div
      data-testid="mooni-festival-access-dock"
      data-origin-kind={overseasPin ? 'overseas' : 'domestic'}
      className={`px-3 md:px-4 pt-3 md:pt-2 pb-2 md:pb-1.5 space-y-2 md:space-y-1.5 ${tone(fresh, 'border-b border-gray-800/80', 'border-b border-cyan-100')}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className={tone(
            fresh,
            'inline-flex shrink-0 items-center gap-0.5 min-h-[32px] rounded-full border border-gray-500/55 bg-gray-800/90 px-2.5 py-1 text-[11px] font-semibold text-gray-100 touch-manipulation hover:border-gray-400 hover:bg-gray-700/90 transition-colors disabled:opacity-50 disabled:pointer-events-none',
            'inline-flex shrink-0 items-center gap-0.5 min-h-[32px] rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 touch-manipulation hover:border-cyan-300 hover:bg-cyan-50 transition-colors disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          {backLabel}
        </button>
        <span className={`text-[11px] font-semibold break-keep min-w-0 ${tone(fresh, 'text-cyan-200', 'text-cyan-900')}`}>
          {title}
        </span>
      </div>
      <div
        data-testid="mooni-origin-chips"
        className={expanded
          ? 'flex w-full max-w-full min-w-0 flex-wrap gap-1 max-h-[148px] overflow-y-auto overflow-x-hidden'
          : `flex w-full max-w-full min-w-0 flex-nowrap ${compactChips ? 'gap-0.5' : 'gap-1'} overflow-x-auto overflow-y-hidden`}
      >
        {shown.map((row) => {
          const selected = selectedChipId === row.id && !text;
          return (
            <button
              key={chipCityId(row) || row.id}
              type="button"
              data-festival-origin={row.id}
              disabled={blocked}
              aria-pressed={selected}
              onClick={() => onChip(row)}
              className={tone(
                fresh,
                `inline-flex shrink-0 items-center justify-center min-h-11 rounded-full border ${chipSize} py-1 font-medium touch-manipulation disabled:opacity-50 ${selected ? 'border-cyan-300 bg-cyan-500/30 text-cyan-50' : 'border-cyan-500/35 bg-cyan-950/30 text-cyan-100'}`,
                `inline-flex shrink-0 items-center justify-center min-h-11 rounded-full border ${chipSize} py-1 font-medium touch-manipulation disabled:opacity-50 ${selected ? 'border-cyan-400 bg-cyan-50 text-cyan-800' : 'border-cyan-200 bg-white text-cyan-700'}`,
              )}
            >
              {festivalOriginLabel(row, locale)}
            </button>
          );
        })}
        <button
          type="button"
          data-testid={expanded ? 'mooni-origin-collapse' : 'mooni-origin-more'}
          disabled={disabled}
          onClick={() => {
            const scroller = messageScrollRef?.current;
            savedScrollTopRef.current = scroller ? scroller.scrollTop : 0;
            setExpanded((open) => !open);
          }}
          className={tone(
            fresh,
            `inline-flex shrink-0 items-center justify-center min-h-11 rounded-full border border-gray-500/55 bg-gray-800/90 ${chipSize} py-1 font-semibold text-gray-100 touch-manipulation disabled:opacity-50`,
            `inline-flex shrink-0 items-center justify-center min-h-11 rounded-full border border-cyan-200 bg-white ${chipSize} py-1 font-semibold text-slate-600 touch-manipulation disabled:opacity-50`,
          )}
        >
          {expanded ? t('mooni.chat.originCollapse') : t('mooni.chat.originMore')}
        </button>
      </div>
      <div className="relative">
        {showList || showGu || showMissing ? (
          <div
            data-testid="mooni-origin-options"
            className={tone(
              fresh,
              'absolute bottom-full left-0 right-0 z-20 mb-1 max-h-40 overflow-y-auto rounded-xl border border-cyan-500/40 bg-gray-900 p-1 shadow-lg',
              'absolute bottom-full left-0 right-0 z-20 mb-1 max-h-40 overflow-y-auto rounded-xl border border-cyan-200 bg-white p-1 shadow-lg',
            )}
          >
            {showGu ? (
              <p data-testid="mooni-origin-gu" className={`px-2 py-1.5 text-xs ${tone(fresh, 'text-cyan-100', 'text-slate-600')}`}>
                {t('mooni.chat.originGuHint')}
              </p>
            ) : null}
            {showMissing ? (
              <div className="px-1 py-1">
                <p className={`px-1 pb-1 text-xs ${tone(fresh, 'text-cyan-100', 'text-slate-600')}`}>{t('mooni.chat.originMissing')}</p>
                <button
                  type="button"
                  data-testid="mooni-origin-ask"
                  disabled={blocked}
                  onMouseDown={keepOriginFieldFocus}
                  onClick={onAskAnyway}
                  className={tone(
                    fresh,
                    'w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-cyan-50 hover:bg-cyan-500/20 disabled:opacity-50',
                    'w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-cyan-800 hover:bg-cyan-50 disabled:opacity-50',
                  )}
                >
                  {t('mooni.chat.originAskAnyway', { name: suggestion.askRaw })}
                </button>
              </div>
            ) : null}
            {showList && suggestion.kind === 'typo' ? (
              <button
                type="button"
                data-testid="mooni-origin-option"
                disabled={blocked}
                onMouseDown={keepOriginFieldFocus}
                onClick={() => confirmCity(suggestion.cities[0])}
                className={tone(
                  fresh,
                  'w-full rounded-lg px-2 py-2 text-left text-sm text-cyan-50 hover:bg-cyan-500/20 disabled:opacity-50',
                  'w-full rounded-lg px-2 py-2 text-left text-sm text-slate-800 hover:bg-cyan-50 disabled:opacity-50',
                )}
              >
                {t('mooni.chat.originTypo', { name: koreaOriginAskLabel(suggestion.cities[0], locale) })}
              </button>
            ) : null}
            {showList && suggestion.kind !== 'typo'
              ? suggestion.cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  data-testid="mooni-origin-option"
                  disabled={blocked}
                  onMouseDown={keepOriginFieldFocus}
                  onClick={() => confirmCity(city)}
                  className={tone(
                    fresh,
                    'w-full rounded-lg px-2 py-2 text-left text-sm text-cyan-50 hover:bg-cyan-500/20 disabled:opacity-50',
                    'w-full rounded-lg px-2 py-2 text-left text-sm text-slate-800 hover:bg-cyan-50 disabled:opacity-50',
                  )}
                >
                  {koreaOriginOptionLabel(city, locale)}
                </button>
              ))
              : null}
          </div>
        ) : null}
        <div className="flex items-center gap-1">
          <input
            data-testid="mooni-origin-input"
            type="text"
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={text}
            disabled={disabled}
            placeholder={t('mooni.chat.originCityPlaceholder')}
            onFocus={openSuggestions}
            onClick={openSuggestions}
            onChange={(event) => {
              setText(event.target.value);
              setPinnedId('');
              setOverseasPin(null);
              setLocateError('');
              submittedIdRef.current = '';
            }}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            onKeyDown={onKeyDown}
            className={tone(
              fresh,
              'h-11 min-w-0 flex-1 rounded-full border border-gray-600 bg-gray-800 px-3 text-[16px] text-white placeholder:text-gray-500 focus:border-cyan-400 focus:outline-none disabled:opacity-50',
              'h-11 min-w-0 flex-1 rounded-full border border-cyan-200 bg-white px-3 text-[16px] text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none disabled:opacity-50',
            )}
          />
          <button
            type="button"
            data-testid="mooni-origin-locate"
            aria-label={t('mooni.chat.originLocate')}
            disabled={blocked || locating}
            onClick={onLocate}
            className={tone(
              fresh,
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-500/40 text-cyan-100 touch-manipulation disabled:opacity-50',
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cyan-200 text-cyan-700 touch-manipulation disabled:opacity-50',
            )}
          >
            <MapPin size={18} aria-hidden />
          </button>
        </div>
      </div>
      {locateError ? (
        <p data-testid="mooni-origin-locate-error" className={`text-xs ${tone(fresh, 'text-amber-200', 'text-amber-700')}`}>
          {locateError}
        </p>
      ) : null}
    </div>
  );
}
