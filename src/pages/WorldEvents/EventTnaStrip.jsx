import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Loader2, Ticket } from 'lucide-react';
import {
  buildMrtTnaProductUrl,
  buildMrtTnaSearchMoreUrl,
  canShowMrtTnaStrip,
  fetchMrtTnas,
  fetchMrtTnasForLocation,
  MRT_TNA_FETCH_SIZE,
  resolveMrtTnaQuery,
} from '../../utils/fetchMrtTnas';
import { getKlookRentalUrlByLocation, getKlookSearchUrl } from '../../utils/affiliate';
import StripListLargeToggle from './StripListLargeToggle';

const klookChipClass =
  'inline-flex max-w-full items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 transition-colors hover:border-amber-300 hover:bg-amber-50';

function KlookOutboundChips({ klookSearchUrl, klookRentalUrl, place, t }) {
  if (!klookSearchUrl && !klookRentalUrl) return null;
  return (
    <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
      {klookSearchUrl ? (
        <a
          href={klookSearchUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={klookChipClass}
        >
          <span className="min-w-0 break-keep">
            {t('worldEventDetail.tnaStrip.klookActivities', { place })}
          </span>
          <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden />
        </a>
      ) : null}
      {klookRentalUrl ? (
        <a
          href={klookRentalUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={klookChipClass}
        >
          <span className="min-w-0 break-keep">
            {t('worldEventDetail.tnaStrip.klookRental', { place })}
          </span>
          <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function formatTnaPrice(item, locale = 'ko', t) {
  if (item?.priceDisplay) return String(item.priceDisplay);
  const n = Number(item?.salePrice);
  if (!Number.isFinite(n) || n <= 0) return null;
  const isEn = String(locale).startsWith('en');
  const formatted = n.toLocaleString(isEn ? 'en-US' : 'ko-KR');
  return t ? t('home.stayStrip.priceFrom', { price: formatted }) : (isEn ? `KRW ${formatted}` : `${formatted}원~`);
}

function TnaStripCard({ item, locale, t, large = false }) {
  const href = buildMrtTnaProductUrl(item);
  const price = formatTnaPrice(item, locale, t);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={
        large
          ? 'flex w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 sm:w-[252px]'
          : 'flex w-[148px] shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 sm:w-[168px]'
      }
    >
      <div className={`relative w-full bg-stone-100 ${large ? 'h-[132px]' : 'h-[88px]'}`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-stone-400">
            —
          </div>
        )}
        {item.category ? (
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded bg-stone-900/70 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-xs">
            {item.category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-1 p-2">
        <p
          className={`line-clamp-2 font-semibold leading-snug text-stone-900 ${
            large ? 'text-sm' : 'text-[11px]'
          }`}
        >
          {item.itemName}
        </p>
        <div
          className={`flex items-center justify-between gap-1 pt-0.5 ${
            large ? 'text-xs' : 'text-[10px]'
          }`}
        >
          {item.reviewScore != null && Number(item.reviewScore) > 0 ? (
            <span className="font-bold tabular-nums text-amber-700">
              ★ {Number(item.reviewScore).toFixed(1)}
              {item.reviewCount ? (
                <span className="ml-0.5 font-normal text-stone-400">
                  ({item.reviewCount})
                </span>
              ) : null}
            </span>
          ) : (
            <span />
          )}
          {price ? (
            <span className="truncate font-bold tabular-nums text-amber-900">
              {price}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

/**
 * @param {{
 *   location: Record<string, unknown>,
 *   keyword?: string,
 *   altKeywords?: string[],
 *   nearbyKeywords?: string[],
 *   locale?: string,
 *   placeLabel?: string,
 *   title?: string,
 *   hint?: string,
 *   hideWhenEmpty?: boolean,
 * }} props
 */
export default function EventTnaStrip({
  location,
  keyword: initialKeyword,
  altKeywords = [],
  nearbyKeywords = [],
  locale = 'ko',
  placeLabel,
  title,
  hint,
  hideWhenEmpty = false,
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('idle');
  const [listLarge, setListLarge] = useState(false);
  const fetchedKeyRef = useRef('');

  const eligible = canShowMrtTnaStrip(location);

  const resolvedQuery = useMemo(() => {
    if (!eligible) return null;
    if (initialKeyword) {
      return {
        keyword: initialKeyword,
        altKeywords,
        nearbyKeywords,
      };
    }
    return resolveMrtTnaQuery(location);
  }, [eligible, initialKeyword, altKeywords, nearbyKeywords, location]);

  const effectiveKeyword = resolvedQuery?.keyword || '';
  const fetchKey = `${location?.slug || ''}|${effectiveKeyword}|${(resolvedQuery?.nearbyKeywords || []).join(',')}`;

  useEffect(() => {
    if (!eligible || !effectiveKeyword) {
      setStatus('idle');
      setItems(null);
      return undefined;
    }

    if (fetchedKeyRef.current === fetchKey) return undefined;

    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        let result = null;
        if (resolvedQuery?.keyword) {
          result = await fetchMrtTnas({
            keyword: resolvedQuery.keyword,
            altKeywords: resolvedQuery.altKeywords,
            nearbyKeywords: resolvedQuery.nearbyKeywords,
            size: MRT_TNA_FETCH_SIZE,
          });
        } else {
          result = await fetchMrtTnasForLocation(location, { size: MRT_TNA_FETCH_SIZE });
        }

        if (cancelled) return;
        fetchedKeyRef.current = fetchKey;

        const listed = Array.isArray(result?.items) ? result.items : [];
        if (listed.length > 0) {
          setItems(listed);
          setStatus('ready');
        } else {
          setItems([]);
          setStatus('empty');
        }
      } catch {
        if (cancelled) return;
        setItems([]);
        setStatus('empty');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eligible, effectiveKeyword, fetchKey, location, resolvedQuery]);

  if (!eligible) return null;
  if (hideWhenEmpty && status === 'empty') return null;

  const searchKeyword = effectiveKeyword || placeLabel || '';
  const mrtSearchUrl = searchKeyword ? buildMrtTnaSearchMoreUrl(searchKeyword) : null;
  const klookPlace = placeLabel || searchKeyword || location?.name || '';
  const klookSearchUrl = searchKeyword ? getKlookSearchUrl(searchKeyword, locale) : '';
  const klookRentalUrl = getKlookRentalUrlByLocation(location) || '';

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Ticket size={16} className="shrink-0 text-amber-700" aria-hidden />
            <h2 className="text-sm font-extrabold text-stone-900">
              {title || t('worldEventDetail.tnaStrip.title')}
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {hint || t('worldEventDetail.tnaStrip.hint')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {status === 'ready' && items?.length ? (
            <StripListLargeToggle
              listLarge={listLarge}
              onToggle={() => setListLarge((v) => !v)}
            />
          ) : null}
          {mrtSearchUrl ? (
            <a
              href={mrtSearchUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="shrink-0 text-[11px] font-bold text-amber-800 hover:text-amber-900"
            >
              {t('worldEventDetail.tnaStrip.moreOnMrt')}
            </a>
          ) : null}
        </div>
      </div>

      {status === 'loading' ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500">
          <Loader2 size={18} className="animate-spin text-amber-600" aria-hidden />
          {t('worldEventDetail.tnaStrip.loading')}
        </div>
      ) : null}

      {status === 'empty' ? (
        <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-stone-50 px-3 py-6 text-center text-xs text-stone-500">
          <p>{t('worldEventDetail.tnaStrip.empty')}</p>
          {mrtSearchUrl ? (
            <a
              href={mrtSearchUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-2 inline-flex items-center gap-1 font-bold text-amber-800 hover:text-amber-900"
            >
              <span>{searchKeyword} 검색 결과 보기</span>
              <ExternalLink size={12} aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}

      {status === 'ready' && items?.length ? (
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {items.map((item) => (
            <TnaStripCard
              key={item.gid || item.productUrl || item.itemName}
              item={item}
              locale={locale}
              t={t}
              large={listLarge}
            />
          ))}
        </div>
      ) : null}

      <KlookOutboundChips
        klookSearchUrl={klookSearchUrl}
        klookRentalUrl={klookRentalUrl}
        place={klookPlace}
        t={t}
      />
    </section>
  );
}
