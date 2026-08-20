import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ExternalLink, LayoutGrid, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  buildMrtTnaProductUrl,
  buildMrtTnaSearchMoreUrl,
  canShowNearbyChips,
  fetchMrtTnasForLocation,
  fetchMrtTnasNearbyKeyword,
  isMrtTnaNearbyKeyword,
  MRT_TNA_FETCH_SIZE,
  MRT_TNA_PLANNER_SIZE,
  nextUnloadedNearbyKeyword,
  resolveMrtTnaQuery,
} from '../../../../../utils/fetchMrtTnas';

const LG_MQ = '(min-width: 1024px)';

const TOUR_SORT_OPTION_IDS = [
  { id: 'recommended', key: 'sortRecommended' },
  { id: 'price_asc', key: 'sortPriceAsc' },
  { id: 'price_desc', key: 'sortPriceDesc' },
  { id: 'rating_desc', key: 'sortRatingDesc' },
];

function useIsLg() {
  const [isLg, setIsLg] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(LG_MQ).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(LG_MQ);
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return isLg;
}

function salePriceNum(item) {
  const n = Number(item?.salePrice);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function reviewScoreNum(item) {
  const n = Number(item?.reviewScore);
  return Number.isFinite(n) ? n : -1;
}

function sortTourItems(list, sortMode) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (sortMode === 'price_asc') {
    arr.sort((a, b) => {
      const pa = salePriceNum(a);
      const pb = salePriceNum(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pa - pb;
    });
    return arr;
  }
  if (sortMode === 'price_desc') {
    arr.sort((a, b) => {
      const pa = salePriceNum(a);
      const pb = salePriceNum(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });
    return arr;
  }
  if (sortMode === 'rating_desc') {
    arr.sort((a, b) => reviewScoreNum(b) - reviewScoreNum(a));
    return arr;
  }
  return arr;
}

function formatPrice(item) {
  if (item?.priceDisplay) return String(item.priceDisplay);
  const n = Number(item?.salePrice);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${n.toLocaleString('ko-KR')}원`;
}

function TnaCard({ item, size = 'md', theme = 'dark', imageClassName }) {
  const large = size === 'lg';
  const light = theme === 'light';
  const href = buildMrtTnaProductUrl(item);
  const price = formatPrice(item);
  const imgBox = imageClassName || 'aspect-square';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      draggable={false}
      className={
        light
          ? 'rounded-xl border border-orange-200 bg-white overflow-hidden transition-colors hover:border-orange-300 hover:shadow-sm'
          : 'rounded-2xl border border-orange-400/30 bg-orange-500/10 overflow-hidden transition-colors hover:border-orange-300/45 hover:bg-orange-500/20'
      }
    >
      <div
        className={`relative w-full pointer-events-none overflow-hidden ${
          light ? 'bg-gray-50' : 'bg-white/5'
        } ${imgBox}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${
              light ? 'text-gray-300' : 'text-white/30'
            } ${large ? 'text-xs' : 'text-[10px]'}`}
          >
            No image
          </div>
        )}
      </div>
      <div
        className={`pointer-events-none ${
          large ? 'space-y-1.5 px-3 py-2.5' : 'space-y-1 px-2.5 py-2'
        }`}
      >
        {item.category ? (
          <p
            className={`break-keep ${
              light ? 'text-orange-600/80' : 'text-orange-100/70'
            } ${large ? 'text-[11px]' : 'text-[10px]'}`}
          >
            {item.category}
          </p>
        ) : null}
        <p
          className={`line-clamp-3 break-keep font-semibold leading-snug ${
            light ? 'text-gray-800' : 'text-white'
          } ${large ? 'text-[13px]' : 'text-[11px]'}`}
        >
          {item.itemName}
        </p>
        <div className="flex min-w-0 items-end justify-between gap-2">
          {item.reviewScore != null ? (
            <span
              className={`shrink-0 tabular-nums ${
                light ? 'text-amber-600' : 'text-orange-100/80'
              } ${large ? 'text-xs' : 'text-[10px]'}`}
            >
              ★ {item.reviewScore}
            </span>
          ) : (
            <span />
          )}
          {price ? (
            <span
              className={`min-w-0 text-right font-bold tabular-nums break-keep ${
                light ? 'text-gray-700' : 'text-white/90'
              } ${large ? 'text-xs' : 'text-[10px]'}`}
            >
              {price}
            </span>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function OpenTourToolbar({
  moreHref,
  count,
  sortMode,
  onSortChange,
  densityZoomed,
  onDensityToggle,
}) {
  const { t } = useTranslation();
  const ctrl =
    'rounded-lg border border-orange-200/55 bg-orange-500/15 text-orange-50/95 transition-colors hover:border-orange-100/75 hover:bg-orange-500/28 hover:text-orange-50';
  const ctrlOn =
    'rounded-lg border border-orange-100/80 bg-orange-500/40 text-orange-50 transition-colors';

  return (
    <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-1.5 px-0.5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {count ? (
          <p className="shrink-0 text-xs font-semibold tabular-nums text-orange-100/80">
            {t('place.planner.banners.mrtTna.itemCount', { count })}
          </p>
        ) : null}
        <a
          href={moreHref}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex shrink-0 items-center px-2.5 py-1 text-[11px] font-semibold active:scale-[0.98] ${ctrl}`}
        >
          {t('place.planner.banners.mrtTna.openOnMrt')}
        </a>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-pressed={densityZoomed}
          aria-label={densityZoomed ? t('place.planner.banners.mrtTna.gridDefault') : t('place.planner.banners.mrtTna.gridZoomIn')}
          title={densityZoomed ? t('place.planner.banners.mrtTna.gridDefault') : t('place.planner.banners.mrtTna.gridZoomIn')}
          onClick={(e) => {
            e.stopPropagation();
            onDensityToggle?.();
          }}
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center ${
            densityZoomed ? ctrlOn : ctrl
          }`}
        >
          <LayoutGrid size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <label className="relative flex shrink-0 items-center">
          <span className="sr-only">{t('place.planner.banners.mrtTna.sortTour')}</span>
          <ArrowUpDown
            size={11}
            className="pointer-events-none absolute left-1.5 text-orange-100/75"
            aria-hidden="true"
          />
          <select
            value={sortMode}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              onSortChange?.(e.target.value);
            }}
            className={`appearance-none py-1 pl-5 pr-5 text-[11px] font-semibold outline-none focus:border-orange-100/80 ${ctrl}`}
          >
            {TOUR_SORT_OPTION_IDS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                {t(`place.planner.banners.mrtTna.${opt.key}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

/**
 * 국내 TNA 투어·티켓 목록 — Edge fetch-mrt-tnas.
 * @param {{ location: object, variant?: 'open'|'planner', itemCount?: number, showMoreLink?: boolean, linkSponsoredLabel?: boolean }} props
 */
export default function MrtTnaActivitiesWidget({
  location,
  variant = 'open',
  itemCount,
  showMoreLink = true,
  linkSponsoredLabel = false,
}) {
  const { t } = useTranslation();
  const planner = variant === 'planner';
  const theme = planner ? 'light' : 'dark';
  const isLg = useIsLg();
  const limit = Math.max(
    1,
    Number(itemCount) || (planner ? MRT_TNA_PLANNER_SIZE : MRT_TNA_FETCH_SIZE),
  );
  const query = useMemo(
    () => resolveMrtTnaQuery(location),
    [
      location?.slug,
      location?.hubId,
      location?.name,
      location?.name_en,
      location?.name_ko,
      location?.parentCity,
      location?.originalQuery,
    ],
  );
  const placeKey = `${location?.slug || ''}|${location?.hubId || ''}|${query.keyword}|${(query.altKeywords || []).join(',')}|${(query.nearbyKeywords || []).join(',')}`;

  const [status, setStatus] = useState('idle');
  /** @type {[{ id: string, keyword: string, nearby: boolean, items: object[] }]} */
  const [sections, setSections] = useState([]);
  const [keywordUsed, setKeywordUsed] = useState(query.keyword);
  const [nearbyMoreLoading, setNearbyMoreLoading] = useState(false);
  const [sortMode, setSortMode] = useState('recommended');
  const [densityZoomed, setDensityZoomed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSections([]);
    setKeywordUsed(query.keyword);
    setNearbyMoreLoading(false);
    setSortMode('recommended');
    setDensityZoomed(false);

    (async () => {
      const result = await fetchMrtTnasForLocation(location, { size: limit });
      if (cancelled) return;
      if (!result) {
        setStatus('error');
        return;
      }
      const used = result.keywordUsed || query.keyword;
      const expanded = Boolean(result.nearbyExpanded);
      const listed = Array.isArray(result.items)
        ? result.items.slice(0, limit)
        : [];
      const isNearby = expanded || isMrtTnaNearbyKeyword(location, used);
      setSections([
        {
          id: `sec-0-${used}`,
          keyword: used,
          nearby: isNearby,
          items: listed,
        },
      ]);
      setKeywordUsed(used);
      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [placeKey, limit]);

  const loadedNearbyKws = useMemo(
    () =>
      sections
        .filter((s) => s.nearby)
        .map((s) => String(s.keyword || '').trim())
        .filter(Boolean),
    [sections],
  );
  const showChips = canShowNearbyChips(query.nearbyKeywords);
  /** 아직 안 붙인 SSOT 인근만 하단 칩 — 선택 시 append, 기존 섹션 유지 */
  const pendingNearbyKws = useMemo(() => {
    const list = Array.isArray(query.nearbyKeywords) ? query.nearbyKeywords : [];
    const loaded = new Set(loadedNearbyKws);
    return list.filter((kw) => {
      const k = String(kw || '').trim();
      return k && !loaded.has(k);
    });
  }, [query.nearbyKeywords, loadedNearbyKws]);
  const nextUnloadKw = nextUnloadedNearbyKeyword(
    query.nearbyKeywords,
    loadedNearbyKws,
  );
  /** 칩 UI가 있으면 하단 칩으로 대체 · 칩 없을 때만 순차 더보기 */
  const canShowNearbyMore = !showChips && Boolean(nextUnloadKw);
  const totalCount = useMemo(
    () => sections.reduce((n, s) => n + (s.items?.length || 0), 0),
    [sections],
  );
  const moreHref = buildMrtTnaSearchMoreUrl(keywordUsed || query.keyword);
  const empty = status === 'ok' && totalCount === 0;
  const showSectionLabels = sections.some((s) => s.nearby);
  const firstNearbySecId = useMemo(() => {
    const first = sections.find((s) => s.nearby);
    return first?.id || '';
  }, [sections]);
  const sortedSections = useMemo(
    () =>
      sections.map((sec) => ({
        ...sec,
        items: sortTourItems(sec.items, sortMode),
      })),
    [sections, sortMode],
  );

  const appendNearbySection = async (nextKw) => {
    const kw = String(nextKw || '').trim();
    if (!kw || nearbyMoreLoading) return null;
    setNearbyMoreLoading(true);
    try {
      const result = await fetchMrtTnasNearbyKeyword(kw, {
        size: Math.max(limit, MRT_TNA_FETCH_SIZE),
      });
      if (!result?.ok) return null;
      const incoming = Array.isArray(result.items) ? result.items : [];
      if (incoming.length === 0) return null;
      const used = result.keywordUsed || kw;
      const seen = new Set();
      const fresh = [];
      for (const it of incoming) {
        const gid = String(it?.gid || '').trim();
        if (gid) {
          if (seen.has(gid)) continue;
          seen.add(gid);
        }
        fresh.push(it);
        if (fresh.length >= MRT_TNA_FETCH_SIZE) break;
      }
      if (fresh.length === 0) return null;
      setSections((prev) => {
        if (prev.some((s) => s.nearby && (s.keyword === used || s.keyword === kw))) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `sec-${prev.length}-${used}`,
            keyword: used,
            nearby: true,
            items: fresh,
          },
        ];
      });
      setKeywordUsed(used);
      return used;
    } finally {
      setNearbyMoreLoading(false);
    }
  };

  const handleNearbyMore = async () => {
    if (!canShowNearbyMore || nearbyMoreLoading || !nextUnloadKw) return;
    await appendNearbySection(nextUnloadKw);
  };

  const handleNearbyChip = async (chipKw) => {
    const kw = String(chipKw || '').trim();
    if (!kw || nearbyMoreLoading) return;
    if (sections.some((s) => s.nearby && s.keyword === kw)) return;
    await appendNearbySection(kw);
  };

  const openToolbar =
    !planner ? (
      <OpenTourToolbar
        moreHref={moreHref}
        count={status === 'ok' ? totalCount : 0}
        sortMode={sortMode}
        onSortChange={setSortMode}
        densityZoomed={densityZoomed}
        onDensityToggle={() => setDensityZoomed((v) => !v)}
      />
    ) : null;

  const nearbyExploreFooter = (
    <>
      {showChips && pendingNearbyKws.length > 0 ? (
        <div
          role="group"
          aria-label={t('place.planner.banners.mrtTna.nearbyMoreAria')}
          className="mt-2 flex flex-col items-center gap-3 pt-3"
        >
          <p
            className={`text-[17px] font-bold break-keep ${
              planner ? 'text-orange-900' : 'text-orange-50'
            }`}
          >
            {t('place.planner.banners.mrtTna.nearbyExploreTitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nearbyMoreLoading ? (
              <span
                className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                  planner ? 'text-orange-800' : 'text-orange-50'
                }`}
              >
                <Loader2 size={15} className="animate-spin shrink-0" aria-hidden="true" />
                {t('place.planner.banners.mrtTna.loadingMore')}
              </span>
            ) : (
              pendingNearbyKws.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNearbyChip(kw);
                  }}
                  className={
                    planner
                      ? 'rounded-full border border-orange-400 bg-orange-400 px-7 py-1.5 text-[13px] font-bold text-white hover:bg-orange-500 hover:border-orange-500 active:scale-[0.98] transition-all'
                      : 'rounded-full border border-orange-300/55 bg-orange-500/45 px-7 py-1.5 text-[13px] font-bold text-orange-50 hover:bg-orange-500/60 hover:border-orange-200/70 active:scale-[0.98] transition-all'
                  }
                >
                  {kw}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
      {canShowNearbyMore ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            disabled={nearbyMoreLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleNearbyMore();
            }}
            className={
              planner
                ? 'inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-sm font-semibold text-orange-800 hover:bg-orange-100 disabled:opacity-60'
                : 'inline-flex items-center gap-1.5 rounded-xl border border-orange-300/40 bg-orange-500/20 px-3.5 py-2 text-sm font-semibold text-orange-50 hover:bg-orange-500/30 disabled:opacity-60'
            }
          >
            {nearbyMoreLoading ? (
              <>
                <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />
                {t('place.planner.banners.mrtTna.loadingMore')}
              </>
            ) : (
              t('place.planner.banners.mrtTna.nearbyMore')
            )}
          </button>
        </div>
      ) : null}
    </>
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <div>
        {openToolbar}
        <div
          className={`flex items-center justify-center gap-2 ${
            planner ? 'min-h-[120px] text-sm text-gray-500' : 'min-h-[200px] text-sm text-orange-100/80'
          }`}
        >
          <Loader2 size={18} className="animate-spin shrink-0" aria-hidden="true" />
          <span className="break-keep">{t('place.planner.banners.mrtTna.loadingTours')}</span>
        </div>
      </div>
    );
  }

  if (status === 'error' || empty) {
    return (
      <div>
        {openToolbar}
        <div
          className={`flex flex-col items-center justify-center gap-3 text-center ${
            planner ? 'min-h-[120px] px-2 py-4' : 'min-h-[200px] px-4 py-8'
          }`}
        >
          <p
            className={`text-sm break-keep ${
              planner ? 'text-gray-600' : 'text-white/75'
            }`}
          >
            {status === 'error'
              ? t('place.planner.banners.mrtTna.loadError')
              : t('place.planner.banners.mrtTna.empty')}
          </p>
          <a
            href={moreHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={
              planner
                ? 'inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100'
                : 'inline-flex items-center gap-1.5 rounded-xl border border-orange-300/40 bg-orange-500/25 px-3 py-2 text-sm font-semibold text-orange-50 hover:bg-orange-500/35'
            }
          >
            {t('place.planner.banners.mrtTna.searchOnMrt')}
            <ExternalLink size={14} className="shrink-0" aria-hidden="true" />
          </a>
          {linkSponsoredLabel ? (
            <p className={`text-[10px] ${planner ? 'text-gray-400' : 'text-white/40'}`}>
              Sponsored
            </p>
          ) : null}
        </div>
        {status === 'ok' && empty ? nearbyExploreFooter : null}
      </div>
    );
  }

  const openGridClass = densityZoomed
    ? isLg
      ? 'grid grid-cols-3 gap-2.5'
      : 'grid grid-cols-1 gap-2.5'
    : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4';
  // cover 유지 · 4:3보다 세로를 키운 1:1 (상하 잘림 완화)
  const openImageClass = 'aspect-square';

  return (
    <div
      className={
        planner
          ? 'space-y-4'
          : 'space-y-4 max-lg:flex max-lg:min-h-[calc(100dvh-8rem)] max-lg:flex-col'
      }
    >
      {openToolbar}
      <div className="space-y-8">
        {sortedSections
          .filter((sec) => (sec.items?.length || 0) > 0)
          .map((sec) => {
          const isFirstNearby = Boolean(sec.nearby && sec.id === firstNearbySecId);
          return (
            <section key={sec.id} className="space-y-5">
              {showSectionLabels && sec.nearby ? (
                <div
                  className={`flex items-stretch gap-3 pl-5 pr-2 pt-2 pb-5 ${
                    planner
                      ? 'border-b-[3px] border-orange-400'
                      : 'border-b-[3px] border-orange-200/80'
                  }`}
                >
                  <span
                    className={`w-1.5 shrink-0 rounded-full ${
                      planner ? 'bg-orange-500' : 'bg-orange-300'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 py-0.5">
                    <p
                      className={`font-semibold tracking-wide break-keep ${
                        isFirstNearby
                          ? planner
                            ? 'text-[13px] text-orange-800'
                            : 'text-[13px] text-orange-100/90'
                          : planner
                            ? 'text-[11px] text-orange-700/80'
                            : 'text-[11px] text-orange-100/70'
                      }`}
                    >
                      {isFirstNearby
                        ? t('place.planner.banners.mrtTna.nearbyToursHint')
                        : t('place.planner.banners.mrtTna.nearbyRegion')}
                    </p>
                    <h3
                      className={`mt-0.5 text-[18px] font-extrabold leading-snug break-keep ${
                        planner ? 'text-orange-950' : 'text-white'
                      }`}
                    >
                      {t('place.planner.banners.mrtTna.sectionThingsToDo', { keyword: sec.keyword })}
                    </h3>
                  </div>
                </div>
              ) : null}
              <div
                className={
                  planner ? 'grid grid-cols-1 gap-2 sm:grid-cols-3' : openGridClass
                }
              >
                {sec.items.map((item) => (
                  <TnaCard
                    key={`${sec.id}-${item.gid || item.productUrl}`}
                    item={item}
                    size={planner ? 'md' : 'lg'}
                    theme={theme}
                    imageClassName={planner ? undefined : openImageClass}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {nearbyExploreFooter}
      {showMoreLink ? (
        <div
          className={
            planner
              ? 'mt-3 flex flex-col items-start gap-1.5 px-0.5 pt-8 pb-4'
              : 'mt-3 flex flex-col items-start gap-1.5 px-0.5 pt-8 pb-4 max-lg:mt-auto max-lg:pb-0 max-lg:pt-6 lg:mt-3 lg:pb-4'
          }
        >
          <a
            href={moreHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={
              planner
                ? 'inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800 underline-offset-2 hover:underline'
                : 'inline-flex items-center gap-1.5 text-sm font-semibold text-orange-100/90 hover:text-orange-50 underline-offset-2 hover:underline'
            }
          >
            {t('place.planner.banners.mrtTna.moreOnMrt')}
            <ExternalLink size={14} className="shrink-0" aria-hidden="true" />
          </a>
          {linkSponsoredLabel ? (
            <p className={`text-[10px] ${planner ? 'text-gray-400' : 'text-white/40'}`}>
              Sponsored
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
