import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUp,
  CalendarDays,
  Home,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { resolveListImageUrl } from '../../utils/listImageUrl';
import { ThemeFestivalBackLink } from '../KoreaTheme/ThemeModuleBackButton';
import { setPlaceReturnTo } from '../Home/lib/placeReturnTo';
import { resetIosZoomAfterInput } from '../../shared/lib/mobileViewport';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import { festivalLngLat } from './koreaFestivalCorridors';
import { fetchNearbyTourAttractions } from '../../utils/fetchNearbyTourAttractions';
import {
  readFestivalOpenDetail,
  writeFestivalOpenDetail,
} from './lib/festivalOpenDetailCache';
import {
  buildFestivalTimeTabs,
  compareFestivalsByOpenDate,
  filterByTimeTab,
  sortFestivalGroupsByOpenDate,
} from './festivalTimeFilter';
import {
  filterFestivalsByYmdRange,
  formatFestivalDetailDateRange,
  loadedFestivalDataEndYmd,
  seoulTodayYmd,
} from './festivalDateFilter';
import {
  festivalHubFlagOnPeriodTabs,
  festivalHubFlagOnRangeYmd,
  festivalHubPeriodMetaLabel,
  festivalHubTimeMajorDisplay,
  festivalHubTimeMajorLabel,
} from './festivalHubDefaultPeriod.js';
import FestivalDateSheet from './FestivalDateSheet';
import { isGateoFestivalDateChipEnabled, isGateoFestivalRoadEnabled } from '../../shared/gateoFeatureFlags';
import { defaultFestivalHubTimeTab } from './festivalHubDefaultTimeTab.js';
import { buildTasteTags, filterByTaste, tasteLabel } from './festivalTasteTags';
import {
  buildCityTags,
  buildSidoTags,
  filterByRegion,
  neighborSidoTags,
  sidoLabel,
  sidoListPhrase,
} from './festivalRegionTags';
import {
  buildFestivalPanelListMetaSegments,
  insertWindow30MetaPeriodSegment,
  omitFestivalMetaRegionDuplicatingHeading,
} from './festivalPanelListMeta.js';
import { isNationwideRegionFilter } from './socialPromoFestivalsLogic.js';
import {
  groupFestivalsByCity,
  groupFestivalsBySido,
  groupFestivalsForList,
  hydrateFestivalRefs,
  loadFavorites,
  loadViewed,
  pushViewed,
  toggleFavorite,
} from './festivalPersonalStore';
import { filterBySearchQuery } from './festivalSearch';
import { fetchKoreaFestivalsRolling12 } from './fetchKoreaFestivalsWindow';
import { fetchTourApiFestivalDetail } from '../../utils/fetchTourApiFestivals';
import { projectFestivalDeepLink } from './festivalDeepLinkItem';
import { FESTIVAL_PAGE_EVENT } from '../../shared/korea/mooniKoreaFestivalAssist.js';
import {
  festivalItemForSessionPin,
} from './festivalSessionPin';
import { festivalItemThumbSrc } from './festivalListThumb';
import { FestivalPhotoFrame } from './festivalPhotoFrame';
import SocialPromoFestivalRow, { SocialPromoNearLine } from './SocialPromoFestivalRow';
import {
  festivalItemFromDetailWithAsOf,
  mergeFestivalRowItem,
  mergeSocialPromoIntoFestivalItems,
  resolveSocialPromoPresentation,
  resolveSocialPromoRow,
  shouldShowSessionPinnedHomeRow,
  shouldShowSessionPinnedRow,
  socialPromoFestivals,
  socialPromoIdsNeedingDetailFetch,
  excludeFestivalsByContentId,
  contentIdsFromPromoCards,
} from './socialPromoFestivals';
import {
  buildInitialManualPromoMap,
  getManualFestivalEntry,
  isManualFestivalContentId,
  listManualFestivalContentIds,
  manualFestivalListItem,
  manualFestivalTourDetail,
} from './manualFestivalEntries';
import {
  DEFAULT_AREA_CODE,
  NEAR_FESTIVAL_KM,
} from './koreaFestivalDefaults';
import {
  KOREA_FILTER_CHIP_ACTIVE,
  koreaFilterChipClass,
  koreaFilterChipCountClass,
} from './koreaHubFilterChipStyles.js';
import {
  clearRecentSearches,
  FESTIVAL_RECENT_SEARCH_KEY,
  loadRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
} from './koreaRecentSearches';
import RecentSearchSuggestions from './RecentSearchSuggestions';
import KoreaFestivalMap, {
  focusViewFromFestivalItems,
  KOREA_MAP_OVERVIEW,
} from './KoreaFestivalMap';
import FestivalDetailSheet from './FestivalDetailSheet';
import {
  festivalIdFromSearchParams,
  searchParamsWithoutFestival,
  searchParamsWithFestival,
} from './koreaFestivalDetailUrl';
import {
  localizeCityChips,
  localizeSidoChips,
  localizedAreaCodeLabel,
  localizedSidoListPhrase,
  localizedSubregionLabel,
  localizedFestivalCityListLabel,
  localizeFestivalGroupLabel,
} from '../../i18n/koreaRegionLabels';
import {
  localizeFestivalTimeTabs,
  localizeTasteChips,
  localizedTasteLabel,
} from '../../i18n/koreaUi';
import { useLocale } from '../../i18n/LocaleProvider';
import { koreanApiTextProps } from '../../i18n/koreanApiText';
import {
  isHintDismissed,
  queryGeolocationPermission,
  readLocationSuccess,
  shouldShowDefaultLocHint,
  writeHintDismissed,
  writeLocationSuccess,
} from './festivalLocationHint.js';
import { useFestivalLocationBoot } from './useFestivalLocationBoot.js';
import {
  buildFestivalIndexHeadlineContent,
  festivalHubRegionHeading,
  festivalIndexTimePhrase,
} from './festivalIndexHeadline.js';

/**
 * @param {{ timeTab: string, areaCode: string, cityName: string, tasteId: string, timeTabs: { id: string, label: string }[], t: import('i18next').TFunction, locale?: string, regionOnly?: boolean }} p
 */
function buildIndexListHeadline({
  timeTab,
  areaCode,
  cityName,
  tasteId,
  timeTabs,
  t,
  locale = 'ko',
  regionOnly = false,
}) {
  const time = festivalIndexTimePhrase(locale, timeTab, timeTabs, t);
  const sido = localizedSidoListPhrase(
    locale,
    areaCode,
    sidoListPhrase(areaCode),
  );
  const city = localizedFestivalCityListLabel(locale, areaCode, cityName);
  const taste =
    tasteId && tasteId !== 'all'
      ? localizedTasteLabel(t, tasteId, tasteLabel(tasteId))
      : '';
  const tasteSuffix = taste
    ? t('korea.festival.headlineTasteSuffix', { taste })
    : '';
  const place = [sido, city].filter(Boolean).join(' ');

  if (regionOnly) {
    return {
      kind: 'text',
      text: festivalHubRegionHeading({ areaCode, cityName, place, t }),
    };
  }

  if (isNationwideRegionFilter(areaCode, cityName)) {
    const scope = t('korea.festival.panelNationwideScope', {
      defaultValue: 'Nationwide',
    });
    const text = t('korea.festival.headlineNationwide', {
      time,
      scope,
      tasteSuffix,
      defaultValue: `${scope} · ${time}${tasteSuffix}`,
    });
    return { kind: 'text', text };
  }

  return buildFestivalIndexHeadlineContent({
    locale,
    timeTab,
    place: place || undefined,
    time,
    tasteSuffix,
    t,
  });
}

/** @param {ReturnType<typeof buildFestivalIndexHeadlineContent>} headline */
function renderIndexListHeadline(headline) {
  if (!headline) return null;
  if (headline.kind === 'en') {
    if (headline.place) {
      return (
        <>
          {headline.place} · {headline.nowrap}
          {headline.tail}
        </>
      );
    }
    return (
      <>
        {headline.nowrap}
        {headline.tail}
      </>
    );
  }
  return headline.text;
}

function festivalListHeadingPlain(headline) {
  if (!headline) return '';
  if (typeof headline === 'string') return headline.replace(/\s+/g, ' ').trim();
  if (headline.kind === 'en') {
    const core = [headline.place, headline.nowrap].filter(Boolean).join(' · ');
    return `${core}${headline.tail || ''}`.replace(/\s+/g, ' ').trim();
  }
  return String(headline.text || '').replace(/\s+/g, ' ').trim();
}

/** Visible gap after · uses margin (flex parent collapses inter-span whitespace). */
const PANEL_META_MIDDOT_SUFFIX = ' ·';

/**
 * @param {{ segments: { id: string, text: string, wrap?: boolean, nowrap?: boolean }[] }} p
 */
function FestivalPanelListMetaLine({ segments }) {
  if (!segments?.length) return null;
  const last = segments.length - 1;
  return (
    <>
      {segments.map((seg, i) => (
        <span
          key={seg.id || String(i)}
          className={
            seg.nowrap
              ? 'whitespace-nowrap'
              : seg.wrap
                ? 'min-w-0 break-keep'
                : 'whitespace-nowrap'
          }
          style={i < last ? { marginRight: '0.25em' } : undefined}
        >
          {seg.text}
          {i < last ? PANEL_META_MIDDOT_SUFFIX : null}
        </span>
      ))}
    </>
  );
}

/** @typedef {'time' | 'region' | 'taste'} ChipPanelId */

const NEAR_KM = NEAR_FESTIVAL_KM;

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @param {number} maxKm
 */
function festivalsWithinKm(items, lat, lng, maxKm) {
  return (items || []).filter((item) => {
    const pt = festivalLngLat(item?.mapx, item?.mapy);
    if (!pt) return false;
    return haversineKm(lat, lng, pt.lat, pt.lng) <= maxKm;
  });
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @returns {{ item: object, km: number }[]}
 */
function rankFestivalsByDistance(items, lat, lng) {
  return (items || [])
    .map((item) => {
      const pt = festivalLngLat(item?.mapx, item?.mapy);
      const km = pt
        ? haversineKm(lat, lng, pt.lat, pt.lng)
        : Number.POSITIVE_INFINITY;
      return { item, km };
    })
    .sort(
      (a, b) =>
        a.km - b.km ||
        String(a.item?.title || '').localeCompare(String(b.item?.title || ''), 'ko'),
    );
}

function formatDistanceKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(0.1, Math.round(km * 10) / 10)}km`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

function festivalImage(item) {
  return festivalItemThumbSrc(item);
}

function festivalKey(item) {
  return String(item?.contentId || `${item?.title}-${item?.eventStartDate}`);
}

function chipClass(active) {
  return koreaFilterChipClass(active);
}

/** 대분류: 항상 현재 선택 라벨 · 열린 패널만 강조 */
function majorChipClass(panelOpen) {
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition-all border shrink-0 font-bold ${
    panelOpen
      ? KOREA_FILTER_CHIP_ACTIVE
      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
  }`;
}

/** 내 주변 — 필터 탭이 아닌 위치 액션(아웃라인) */
function nearMeChipClass(active) {
  return `flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 ${
    active
      ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-200/80'
      : 'border-stone-300 bg-white text-stone-700 hover:border-amber-300 hover:bg-stone-50 hover:text-amber-900'
  }`;
}

/** 시간·지역·테마 — 대분류·하위 칩이 같은 아이콘으로 종속 관계 표시 */
const CHIP_PANEL_ICONS = {
  time: CalendarDays,
  region: MapPin,
  taste: Sparkles,
};

function ChipPanelIcon({ panel, size = 12 }) {
  const Icon = CHIP_PANEL_ICONS[panel];
  if (!Icon) return null;
  return <Icon size={size} className="shrink-0 opacity-90" aria-hidden="true" />;
}

function flapChipClass(active) {
  return `flex w-full items-center justify-between gap-1 rounded-xl border px-2 py-1.5 text-left text-[11px] transition-all ${
    active
      ? 'border-amber-400 bg-amber-50 font-bold text-amber-900'
      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
  }`;
}

function parentRegionBackButtonClass() {
  return 'inline-flex min-h-11 shrink-0 items-center border-0 bg-transparent px-1 text-xs font-semibold text-amber-900 underline-offset-2 hover:text-amber-950 hover:underline';
}

function parentRegionSideBackClass() {
  return 'flex w-full min-h-11 items-center border-0 border-b border-stone-100 bg-transparent px-1 text-left text-[11px] font-semibold text-amber-900 hover:bg-amber-50/80 hover:text-amber-950';
}

function ParentRegionBackButton({ parentRegionLabel, onBack, layout = 'row' }) {
  const { t } = useTranslation();
  if (!parentRegionLabel) return null;
  const label = t('korea.common.parentRegionBack', { label: parentRegionLabel });
  const aria = t('korea.common.parentRegionBackAria', { label: parentRegionLabel });
  if (layout === 'side') {
    return (
      <button
        type="button"
        data-festival-region-back=""
        onClick={onBack}
        className={parentRegionSideBackClass()}
        aria-label={aria}
        title={t('korea.common.parentRegionList')}
      >
        <span className="truncate">{label}</span>
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        data-festival-region-back=""
        onClick={onBack}
        className={parentRegionBackButtonClass()}
        aria-label={aria}
      >
        {label}
      </button>
      <span
        role="separator"
        aria-hidden="true"
        className="mx-0.5 h-6 w-px shrink-0 self-center bg-stone-200"
      />
    </>
  );
}

/**
 * 모바일 가로 칩 스크롤 — 하단 스크롤 트랙만(인지용 · 화살표 없음).
 * PC는 트랙 숨김.
 * @param {{ panelKey?: string, activeKey?: string }} p — 패널 전환 시 스크롤 초기화·선택 칩 가시화
 */
function ChipScrollRow({
  children,
  className = '',
  ariaLabel,
  panelKey = '',
  activeKey = '',
}) {
  const { t } = useTranslation();
  const resolvedAriaLabel = ariaLabel ?? t('korea.common.chipList');
  const scrollerRef = useRef(null);
  const [scrollable, setScrollable] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 100 });

  const updateScrollUi = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setScrollable(false);
      setThumb({ left: 0, width: 100 });
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const overflow = maxScroll > 4;
    const thumbWidth = overflow
      ? Math.min(92, Math.max(16, (clientWidth / scrollWidth) * 100))
      : 100;
    const thumbLeft =
      overflow && maxScroll > 0
        ? (scrollLeft / maxScroll) * (100 - thumbWidth)
        : 0;
    setScrollable((v) => (v === overflow ? v : overflow));
    setThumb((prev) =>
      Math.abs(prev.left - thumbLeft) < 0.2 &&
      Math.abs(prev.width - thumbWidth) < 0.2
        ? prev
        : { left: thumbLeft, width: thumbWidth },
    );
  }, []);

  useEffect(() => {
    updateScrollUi();
    const el = scrollerRef.current;
    if (!el) return undefined;
    const onWin = () => updateScrollUi();
    window.addEventListener('resize', onWin);
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateScrollUi())
        : null;
    ro?.observe(el);
    const mo =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => updateScrollUi())
        : null;
    mo?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      window.removeEventListener('resize', onWin);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, [updateScrollUi]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const frame = requestAnimationFrame(() => {
      const active = el.querySelector('[aria-pressed="true"]');
      if (active) {
        active.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        });
      } else {
        el.scrollLeft = 0;
      }
      updateScrollUi();
    });
    return () => cancelAnimationFrame(frame);
  }, [panelKey, activeKey, updateScrollUi]);

  return (
    <div className={`min-w-0 ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={updateScrollUi}
        aria-label={resolvedAriaLabel}
        className="flex min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {scrollable ? (
        <div
          aria-hidden="true"
          className="relative mt-1 h-1 w-full rounded-full bg-stone-200/90 md:hidden"
        >
          <div
            className="absolute top-0 bottom-0 rounded-full bg-amber-500/70"
            style={{
              left: `${thumb.left}%`,
              width: `${thumb.width}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function RelatedChipFlap({
  childChips,
  neighborChips,
  tasteSiblingChips,
  cityName,
  tasteId,
  onSelectCity,
  onSelectSido,
  onSelectTaste,
  neighborLabel,
  parentRegionLabel = '',
  layout = 'side',
  rowCompanionSidePanel = false,
}) {
  const { t } = useTranslation();
  const neighbor = neighborLabel ?? t('korea.common.neighbor');
  const hasChild = childChips.length > 0;
  const hasNeighbor = neighborChips.length > 0;
  const hasTaste = tasteSiblingChips.length > 0;
  const showParentUp = Boolean(parentRegionLabel) && cityName !== 'all';

  const shell =
    layout === 'side'
      ? 'hidden md:flex w-[92px] shrink-0 flex-col gap-2 overflow-y-auto rounded-l-3xl border border-r-0 border-stone-200 bg-white/95 px-1.5 py-2.5 backdrop-blur-xl custom-scrollbar lg:w-[128px] lg:px-2'
      : 'flex shrink-0 gap-2 overflow-x-auto border-b border-stone-200 px-3 py-2 custom-scrollbar md:hidden';

  if (layout === 'row') {
    if (!hasChild && !showParentUp) return null;
    return (
      <ChipScrollRow
        className={`shrink-0 border-b border-stone-200 px-3 py-2${
          rowCompanionSidePanel ? ' lg:hidden' : ''
        }`}
        ariaLabel={t('korea.common.regionChips')}
      >
        {showParentUp && (
          <ParentRegionBackButton
            parentRegionLabel={parentRegionLabel}
            onBack={() => onSelectCity('all')}
            layout="row"
          />
        )}
        {childChips.map((c) => (
          <button
            key={`m-child-${c.id}`}
            type="button"
            onClick={() => onSelectCity(c.id)}
            className={chipClass(cityName === c.id)}
          >
            {c.label}
            <span className={koreaFilterChipCountClass(cityName === c.id)}>
              {c.count}
            </span>
          </button>
        ))}
      </ChipScrollRow>
    );
  }

  if (!hasChild && !hasNeighbor && !hasTaste && !showParentUp) return null;

  return (
    <div className={shell} aria-label={t('korea.common.relatedChips')}>
      {showParentUp && (
        <ParentRegionBackButton
          parentRegionLabel={parentRegionLabel}
          onBack={() => onSelectCity('all')}
          layout="side"
        />
      )}
      {hasChild && (
        <div className="space-y-1">
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-stone-400">
            {t('korea.common.subRegion')}
          </p>
          {childChips.map((c) => (
            <button
              key={`child-${c.id}`}
              type="button"
              onClick={() => onSelectCity(c.id)}
              className={flapChipClass(cityName === c.id)}
            >
              <span className="truncate">{c.label}</span>
              <span
                className={`shrink-0 ${koreaFilterChipCountClass(cityName === c.id)}`}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>
      )}
      {hasNeighbor && (
        <div className="space-y-1">
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-stone-400">
            {neighbor}
          </p>
          {neighborChips.map((s) => (
            <button
              key={`near-${s.id}`}
              type="button"
              onClick={() => onSelectSido(s.id)}
              className={flapChipClass(false)}
            >
              <span className="truncate">{s.label}</span>
              <span className="shrink-0 opacity-70">{s.count}</span>
            </button>
          ))}
        </div>
      )}
      {hasTaste && (
        <div className="space-y-1">
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-stone-400">
            {t('korea.common.theme')}
          </p>
          {tasteSiblingChips.map((t) => (
            <button
              key={`taste-${t.id}`}
              type="button"
              onClick={() => onSelectTaste(t.id)}
              className={flapChipClass(tasteId === t.id)}
            >
              <span className="truncate">{t.label}</span>
              <span
                className={`shrink-0 ${koreaFilterChipCountClass(tasteId === t.id)}`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FestivalThumbFallback({ large = false }) {
  return (
    <div
      data-thumb-fallback="1"
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-stone-200 text-amber-800/50"
      aria-hidden="true"
    >
      <MapPin size={large ? 22 : 16} strokeWidth={1.75} />
    </div>
  );
}

function FestivalRowSkeleton({ large = false }) {
  return (
    <div
      className={`w-full flex items-center rounded-2xl border border-stone-200 bg-white ${
        large ? 'gap-3 p-3.5' : 'gap-2 p-2.5'
      }`}
      aria-hidden="true"
    >
      <div
        className={`animate-pulse rounded-xl shrink-0 bg-stone-200 ${
          large ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-14 w-14'
        }`}
      />
      <div className={`min-w-0 flex-1 ${large ? 'space-y-2' : 'space-y-1.5'}`}>
        <div
          className={`animate-pulse rounded bg-stone-200 ${
            large ? 'h-4 w-3/4' : 'h-3.5 w-2/3'
          }`}
        />
        <div className="h-3 w-1/3 animate-pulse rounded bg-amber-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-stone-100" />
      </div>
    </div>
  );
}

function FestivalRow({
  item,
  active,
  onSelect,
  favorited,
  onToggleFavorite,
  distanceKm,
  large = false,
}) {
  const { t } = useTranslation();
  const { isEnglish } = useLocale();
  const koText = koreanApiTextProps(isEnglish);
  const img = festivalImage(item);
  const range = formatFestivalDetailDateRange(
    item.eventStartDate,
    item.eventEndDate,
    undefined,
    isEnglish ? 'en' : 'ko',
  );
  const distanceLabel = formatDistanceKm(distanceKm);

  return (
    <div
      className={`w-full flex items-center gap-2 rounded-2xl border transition-colors ${
        large ? 'gap-3 p-3.5' : 'p-2.5'
      } ${
        active
          ? 'border-amber-400 bg-amber-50'
          : 'border-stone-200 bg-white hover:bg-stone-50'
      }`}
    >
      <button
        type="button"
        data-festival-id={String(item?.contentId || '')}
        onClick={() => onSelect(item)}
        className={`min-w-0 flex-1 flex items-center text-left ${
          large ? 'gap-3.5' : 'gap-3'
        }`}
      >
        <div
          className={`rounded-xl overflow-hidden shrink-0 bg-stone-100 ${
            large ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-14 w-14'
          }`}
        >
          <FestivalPhotoFrame
            src={img}
            alt={item.title || ''}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            lang={koText.lang}
            translate={koText.translate}
            pendingShimmer={isGateoFestivalDateChipEnabled()}
            fallback={<FestivalThumbFallback large={large} />}
          />
        </div>
        <div className={`min-w-0 flex-1 ${large ? 'space-y-1' : 'space-y-0.5'}`}>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              className={`min-w-0 flex-1 font-bold text-stone-900 break-keep ${
                large
                  ? 'text-[15px] leading-snug line-clamp-2 sm:text-base'
                  : 'text-sm truncate'
              }`}
              {...koText}
            >
              {item.title}
            </p>
            {distanceLabel ? (
              <span
                className={`shrink-0 rounded-full bg-stone-100 font-bold tabular-nums text-stone-600 ${
                  large
                    ? 'px-2 py-0.5 text-[11px]'
                    : 'px-1.5 py-0.5 text-[10px]'
                }`}
              >
                {distanceLabel}
              </span>
            ) : null}
          </div>
          {range && (
            <p
              className={`text-amber-700 font-bold flex items-center gap-1 ${
                large ? 'text-xs' : 'text-[11px]'
              }`}
            >
              <CalendarDays size={large ? 13 : 11} aria-hidden="true" />
              {range}
            </p>
          )}
          {item.addr1 && (
            <p
              className={`text-stone-500 flex items-center gap-1 ${
                large ? 'text-xs line-clamp-2' : 'text-[11px] truncate'
              }`}
            >
              <MapPin
                size={large ? 13 : 11}
                className="shrink-0 opacity-70"
                aria-hidden="true"
              />
              <span className={large ? 'line-clamp-2' : 'truncate'} {...koText}>
                {item.addr1}
              </span>
            </p>
          )}
        </div>
      </button>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item);
          }}
          aria-label={
            favorited
              ? t('korea.common.favoriteRemove')
              : t('korea.common.favoriteAdd')
          }
          aria-pressed={favorited}
          className={`shrink-0 flex items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:bg-amber-50 hover:border-amber-300 ${
            large ? 'h-10 w-10' : 'h-9 w-9'
          }`}
        >
          <Star
            size={large ? 17 : 15}
            className={
              favorited ? 'fill-amber-400 text-amber-500' : 'text-stone-400'
            }
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

export default function KoreaFestivalHub() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromTheme = searchParams.get('from') === 'theme';
  /** 테마 크로스 레일 deep-link — 칩/지도 리팩터 없이 area만 수신 */
  const themeAreaParam = String(searchParams.get('area') || '').trim();
  const festivalId = festivalIdFromSearchParams(searchParams);
  const festivalDetailPushedRef = useRef(false);
  const festivalDeepLinkSeededForRef = useRef('');
  const festivalHistoryTimerRef = useRef(null);
  const festivalViewedPushedRef = useRef('');
  const socialPromoDetailInflightRef = useRef(
    /** @type {Set<string>} */ (new Set()),
  );
  const socialPromoByIdRef = useRef(
    /** @type {Map<string, Record<string, unknown>>} */ (new Map()),
  );
  const now = useMemo(() => new Date(), []);

  const goHome = useCallback(() => {
    try {
      sessionStorage.setItem('gateo_reset_viewport', '1');
    } catch {
      /* ignore quota / private mode */
    }
    resetIosZoomAfterInput();
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    return () => {
      try {
        sessionStorage.setItem('gateo_reset_viewport', '1');
      } catch {
        /* ignore */
      }
    };
  }, []);

  const dateChipEnabled = isGateoFestivalDateChipEnabled();
  const [timeTab, setTimeTab] = useState(defaultFestivalHubTimeTab);
  const [customRange, setCustomRange] = useState(
    /** @type {{ start: string, end: string } | null} */ (null),
  );
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [tasteId, setTasteId] = useState('all');
  const [areaCode, setAreaCode] = useState(DEFAULT_AREA_CODE);
  const [cityName, setCityName] = useState('all');
  /** @type {[ChipPanelId, function]} */
  const [chipPanel, setChipPanel] = useState(/** @type {ChipPanelId} */ ('region'));
  /** @type {[string[] | null, function]} */
  const [nearIds, setNearIds] = useState(null);
  const [mapFocusView, setMapFocusView] = useState(null);
  /** @type {[{ lat: number, lng: number } | null, function]} */
  const [nearOrigin, setNearOrigin] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  /** 축제 리스트 행·썸네일 확대 */
  const [listLarge, setListLarge] = useState(false);
  const [mapSessionKey, setMapSessionKey] = useState(0);
  /** PC 분할(lg+) — 리스트·지도 동기화 */
  const [isMapSplit, setIsMapSplit] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false,
  );
  /** PC 분할 유지 중(전체화면 아님) */
  const mapSplitActive = mapOpen && isMapSplit && !mapFullscreen;
  /** 모바일 지도 · PC 전체화면 — 글라스 헤더·뷰포트 몰입(분할 카드 밖) */
  const mapImmersive = mapOpen && !mapSplitActive;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nearLabel, setNearLabel] = useState('');
  const [nearBusy, setNearBusy] = useState(false);
  const [nearMsg, setNearMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  /** 입력창 초안 */
  const [searchDraft, setSearchDraft] = useState('');
  /** 확정된 검색어 — 입력창을 비워도 리스트 필터 유지 · 칩 변경 시 해제 */
  const [searchApplied, setSearchApplied] = useState('');
  const [recentSearches, setRecentSearches] = useState(() =>
    loadRecentSearches(FESTIVAL_RECENT_SEARCH_KEY),
  );
  const [searchSuggestOpen, setSearchSuggestOpen] = useState(false);
  /** @type {['favorites' | 'viewed' | null, function]} */
  const [personalTab, setPersonalTab] = useState(null);
  /** 상세를 닫은 뒤 세션 동안 목록 맨 위에 유지 */
  const [sessionPinnedItem, setSessionPinnedItem] = useState(
    /** @type {Record<string, unknown> | null} */ (null),
  );
  const [socialPromoById, setSocialPromoById] = useState(
    () => buildInitialManualPromoMap(),
  );
  socialPromoByIdRef.current = socialPromoById;
  const [locHintDismissed, setLocHintDismissed] = useState(() =>
    isHintDismissed(
      typeof localStorage !== 'undefined' ? localStorage : null,
    ),
  );
  const [geoPermission, setGeoPermission] = useState('unsupported');
  const userRegionOverrideRef = useRef(false);
  /** 내 주변 진입 직전 필터 — 재탭 시 복원 */
  const preNearSnapshotRef = useRef(
    /** @type {null | { timeTab: string, tasteId: string, areaCode: string, cityName: string, chipPanel: ChipPanelId }} */ (
      null
    ),
  );
  const mobileSearchInputRef = useRef(null);
  const pcSearchRootRef = useRef(null);
  const mobileSearchRootRef = useRef(null);
  const mobileSearchToggleRef = useRef(null);
  const mainScrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deepLinkForId, setDeepLinkForId] = useState('');
  const [deepLinkPhase, setDeepLinkPhase] = useState(/** @type {'idle' | 'loading' | 'ok' | 'miss'} */ ('idle'));
  const [deepLinkDetail, setDeepLinkDetail] = useState(/** @type {object | null} */ (null));
  const [festivalToast, setFestivalToast] = useState('');
  const deepLinkGenRef = useRef(0);
  const deepLinkInflightRef = useRef('');
  const deepLinkDetailForId =
    deepLinkForId === festivalId ? deepLinkDetail : null;
  const deepLinkPhaseForId =
    deepLinkForId === festivalId ? deepLinkPhase : 'idle';
  const deepLinkSupplementalItems = useMemo(() => {
    const rows = [];
    for (const entry of socialPromoFestivals) {
      const id = String(entry.contentId);
      const windowItem = items.find((row) => String(row?.contentId || '') === id);
      const detailItem = socialPromoById.get(id);
      if (
        id === festivalId &&
        deepLinkPhaseForId !== 'ok' &&
        !detailItem
      ) {
        continue;
      }
      if (!windowItem && !detailItem) continue;
      rows.push(mergeFestivalRowItem(windowItem, detailItem));
    }
    for (const id of listManualFestivalContentIds()) {
      if (rows.some((row) => String(row?.contentId || '') === id)) continue;
      const manual = manualFestivalListItem(getManualFestivalEntry(id));
      if (manual) rows.push(manual);
    }
    return rows;
  }, [items, socialPromoById, festivalId, deepLinkPhaseForId]);

  const festivalDeepLink = useMemo(
    () =>
      projectFestivalDeepLink({
        festivalId,
        items,
        supplementalItems: deepLinkSupplementalItems,
        listLoading: loading,
        phase: deepLinkPhaseForId,
        detail: deepLinkDetailForId,
      }),
    [
      festivalId,
      items,
      deepLinkSupplementalItems,
      loading,
      deepLinkPhaseForId,
      deepLinkDetailForId,
    ],
  );
  const selected = festivalDeepLink.selected;
  const promoDeeplinkIdSet = useMemo(
    () => new Set(socialPromoFestivals.map((entry) => String(entry.contentId))),
    [],
  );
  const selectedForSheet = useMemo(() => {
    if (!selected || !festivalId) return selected;
    const id = String(selected.contentId || '');
    if (festivalId !== id || !promoDeeplinkIdSet.has(id)) return selected;
    const listedInWindow = items.some(
      (row) => String(row?.contentId || '') === id,
    );
    if (listedInWindow) return selected;
    if (deepLinkPhaseForId === 'ok' && deepLinkDetail) return selected;
    if (socialPromoById.get(id)) return selected;
    return null;
  }, [
    selected,
    festivalId,
    promoDeeplinkIdSet,
    items,
    deepLinkPhaseForId,
    deepLinkDetail,
    socialPromoById,
  ]);

  useEffect(() => {
    const pt = festivalLngLat(selectedForSheet?.mapx, selectedForSheet?.mapy);
    if (!pt) return undefined;
    fetchNearbyTourAttractions({
      lat: pt.lat,
      lng: pt.lng,
      radiusKm: 8,
      limit: 8,
    });
    return undefined;
  }, [selectedForSheet?.contentId, selectedForSheet?.mapx, selectedForSheet?.mapy]);

  const clearFestivalFromUrl = useCallback(() => {
    festivalDetailPushedRef.current = false;
    const next = searchParamsWithoutFestival(searchParams);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const closeFestivalDetail = useCallback(() => {
    resetIosZoomAfterInput();
    const pin = festivalItemForSessionPin(selected);
    if (pin) setSessionPinnedItem(pin);
    if (festivalDetailPushedRef.current) {
      festivalDetailPushedRef.current = false;
      navigate(-1);
      return;
    }
    clearFestivalFromUrl();
  }, [clearFestivalFromUrl, navigate, selected]);

  // 테마「이 지역 축제」— festival 딥링크가 있으면 상세를 열고 URL을 지우지 않음
  useEffect(() => {
    if (!fromTheme) return;
    if (festivalId) {
      userRegionOverrideRef.current = false;
      setAreaCode(DEFAULT_AREA_CODE);
      setCityName('all');
      setChipPanel('region');
      return;
    }
    if (!themeAreaParam || themeAreaParam === 'all') return;
    if (!/^\d{1,2}$/.test(themeAreaParam)) return;
    userRegionOverrideRef.current = true;
    setAreaCode(themeAreaParam);
    setCityName('all');
    setChipPanel('region');
    clearFestivalFromUrl();
    setPersonalTab(null);
    setNearIds(null);
    setNearOrigin(null);
    setNearLabel('');
    setNearMsg('');
    mainScrollRef.current?.scrollTo({ top: 0 });
  }, [fromTheme, themeAreaParam, festivalId, location.key, clearFestivalFromUrl]);

  useEffect(() => {
    if (!festivalToast) return undefined;
    const timer = window.setTimeout(() => setFestivalToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [festivalToast]);

  useEffect(() => {
    if (!festivalId) {
      festivalDeepLinkSeededForRef.current = '';
      deepLinkInflightRef.current = '';
      return undefined;
    }

    const inFestivalList = items.some(
      (row) => String(row?.contentId || '') === festivalId,
    );
    if (
      !inFestivalList &&
      deepLinkPhaseForId !== 'ok' &&
      !socialPromoById.get(festivalId) &&
      !isManualFestivalContentId(festivalId)
    ) {
      const cachedOpen = readFestivalOpenDetail(festivalId);
      const built = cachedOpen ? festivalItemFromDetailWithAsOf(cachedOpen) : null;
      if (built) {
        setSocialPromoById((prev) => {
          if (prev.get(festivalId)) return prev;
          const next = new Map(prev);
          next.set(festivalId, built);
          socialPromoByIdRef.current = next;
          return next;
        });
        return undefined;
      }
    }

    if (loading) {
      return undefined;
    }

    const promoOutOfWindow =
      promoDeeplinkIdSet.has(festivalId) &&
      !items.some((row) => String(row?.contentId || '') === festivalId);
    const needsPromoDetailFetch =
      promoOutOfWindow &&
      deepLinkPhaseForId !== 'ok' &&
      !deepLinkDetail &&
      !socialPromoById.get(festivalId) &&
      deepLinkInflightRef.current !== festivalId;

    if (
      festivalDeepLink.selected &&
      festivalDeepLink.sheet === 'open' &&
      !festivalDeepLink.fetch &&
      !needsPromoDetailFetch
    ) {
      deepLinkInflightRef.current = '';
      return undefined;
    }

    if (!festivalDeepLink.fetch && !needsPromoDetailFetch) {
      return undefined;
    }

    if (deepLinkInflightRef.current === festivalId) {
      return undefined;
    }

    const requestedId = festivalId;
    const gen = ++deepLinkGenRef.current;
    deepLinkInflightRef.current = requestedId;
    setDeepLinkForId(requestedId);
    setDeepLinkPhase('loading');

    const applyDeepLinkDetail = (detail) => {
      if (deepLinkGenRef.current !== gen) return;
      deepLinkInflightRef.current = '';
      setDeepLinkForId(requestedId);
      setDeepLinkDetail(detail);
      setDeepLinkPhase(detail ? 'ok' : 'miss');
      if (detail && !detail.manual) writeFestivalOpenDetail(requestedId, detail);
      const built =
        detail?.manual
          ? manualFestivalListItem(getManualFestivalEntry(requestedId))
          : festivalItemFromDetailWithAsOf(detail);
      if (!built) return;
      setSocialPromoById((prev) => {
        if (prev.get(requestedId)) return prev;
        const next = new Map(prev);
        next.set(requestedId, built);
        socialPromoByIdRef.current = next;
        return next;
      });
    };

    if (isManualFestivalContentId(requestedId)) {
      applyDeepLinkDetail(manualFestivalTourDetail(getManualFestivalEntry(requestedId)));
      return undefined;
    }

    fetchTourApiFestivalDetail({ contentId: requestedId })
      .then((detail) => {
        applyDeepLinkDetail(detail);
      })
      .catch(() => {
        if (deepLinkGenRef.current !== gen) return;
        deepLinkInflightRef.current = '';
        setDeepLinkForId(requestedId);
        setDeepLinkDetail(null);
        setDeepLinkPhase('miss');
      });

    return undefined;
  }, [
    festivalId,
    loading,
    items,
    promoDeeplinkIdSet,
    deepLinkPhaseForId,
    deepLinkDetail,
    festivalDeepLink.fetch,
    festivalDeepLink.sheet,
    festivalDeepLink.selected,
  ]);

  useEffect(() => {
    if (!festivalId || !festivalDeepLink.clearUrl) return undefined;
    if (festivalDeepLinkSeededForRef.current !== '__invalid__') {
      festivalDeepLinkSeededForRef.current = '__invalid__';
      setFestivalToast(t('korea.festival.notFound'));
      clearFestivalFromUrl();
    }
    return undefined;
  }, [festivalId, festivalDeepLink.clearUrl, clearFestivalFromUrl, t]);

  useEffect(() => {
    if (loading) return undefined;
    if (!festivalId) return undefined;

    if (festivalDeepLink.clearUrl) {
      return undefined;
    }

    if (!festivalDeepLink.selected || festivalDeepLink.sheet === 'loading') {
      return undefined;
    }

    const listed = items.some(
      (row) => String(row?.contentId || '') === festivalId,
    );
    if (!listed) return undefined;

    if (
      !festivalDetailPushedRef.current &&
      festivalDeepLinkSeededForRef.current !== festivalId
    ) {
      festivalDeepLinkSeededForRef.current = festivalId;
      const listParams = searchParamsWithoutFestival(searchParams);
      const listQs = listParams.toString();
      const detailParams = searchParamsWithFestival(searchParams, festivalId);
      const detailQs = detailParams.toString();
      const lodgingHash = window.location.hash === '#festival-lodging' ? '#festival-lodging' : '';
      navigate(
        { pathname: location.pathname, search: listQs ? `?${listQs}` : '' },
        { replace: true },
      );
      // Replace updates searchParams and re-runs this effect. Clearing the timer
      // there drops the history push, so only a later id change or unmount cancels it.
      if (festivalHistoryTimerRef.current != null) {
        window.clearTimeout(festivalHistoryTimerRef.current);
      }
      festivalHistoryTimerRef.current = window.setTimeout(() => {
        festivalHistoryTimerRef.current = null;
        navigate(
          {
            pathname: location.pathname,
            search: detailQs ? `?${detailQs}` : '',
            hash: lodgingHash,
          },
          { replace: false },
        );
      }, 0);
    }

    return undefined;
  }, [
    loading,
    items,
    festivalId,
    festivalDeepLink.clearUrl,
    festivalDeepLink.sheet,
    festivalDeepLink.selected,
    searchParams,
    location.pathname,
    navigate,
    clearFestivalFromUrl,
    t,
  ]);

  useEffect(() => () => {
    if (festivalHistoryTimerRef.current != null) {
      window.clearTimeout(festivalHistoryTimerRef.current);
      festivalHistoryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onFestivalPageLink = (event) => {
      const id = String(event.detail?.contentId || '').trim();
      if (!/^\d+$/.test(id)) return;
      if (event.detail?.nationwide) {
        userRegionOverrideRef.current = false;
        setAreaCode(DEFAULT_AREA_CODE);
        setCityName('all');
        setChipPanel('region');
        setPersonalTab(null);
        setNearIds(null);
        setNearOrigin(null);
        setNearLabel('');
        setNearMsg('');
      }
      if (id === festivalId && festivalDeepLink.sheet === 'open') {
        return;
      }
      const hadOpen = Boolean(festivalId);
      const next = searchParamsWithFestival(searchParams, id);
      festivalDetailPushedRef.current = true;
      setSearchParams(next, { replace: hadOpen });
    };
    window.addEventListener(FESTIVAL_PAGE_EVENT, onFestivalPageLink);
    return () => window.removeEventListener(FESTIVAL_PAGE_EVENT, onFestivalPageLink);
  }, [festivalId, festivalDeepLink.sheet, searchParams, setSearchParams]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsMapSplit(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [favoriteIds, setFavoriteIds] = useState(() =>
    new Set(loadFavorites().map((r) => String(r.contentId))),
  );
  const [favoriteList, setFavoriteList] = useState(() => loadFavorites());
  const [viewedList, setViewedList] = useState(() => loadViewed());

  useEffect(() => {
    if (!festivalId || festivalDeepLink.sheet !== 'open' || !selected?.contentId) {
      return;
    }
    const id = String(selected.contentId);
    if (festivalViewedPushedRef.current === id) return;
    festivalViewedPushedRef.current = id;
    setViewedList(pushViewed(selected));
  }, [festivalId, festivalDeepLink.sheet, selected]);

  const loadFestivals = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    const result = await fetchKoreaFestivalsRolling12({ force, now, locale });
    if (!result.ok) {
      setItems([]);
      setError(result.error || t('korea.festival.loadError'));
      setLoading(false);
      return;
    }
    setItems(result.items);
    setLoading(false);
  }, [now, t, locale]);

  useEffect(() => {
    loadFestivals(false);
  }, [loadFestivals]);

  useEffect(() => {
    if (loading) return undefined;
    if (
      festivalId &&
      festivalDeepLink.sheet !== 'open' &&
      !festivalDeepLink.clearUrl
    ) {
      return undefined;
    }
    let cancelled = false;
    const skipPromoDetailForId = String(festivalId || '').trim();
    const failedPromoIds = new Set();

    const pump = async () => {
      while (!cancelled) {
        const needFetch = socialPromoIdsNeedingDetailFetch(
          items,
          socialPromoFestivals,
          socialPromoByIdRef.current,
        )
          .filter((id) => !isManualFestivalContentId(id))
          .filter((id) => id !== skipPromoDetailForId)
          .filter((id) => !socialPromoDetailInflightRef.current.has(id))
          .filter((id) => !failedPromoIds.has(id));
        if (!needFetch.length) break;
        for (const id of needFetch) socialPromoDetailInflightRef.current.add(id);
        await Promise.all(
          needFetch.map(async (contentId) => {
            const id = String(contentId);
            try {
              const detail = await fetchTourApiFestivalDetail({ contentId: id });
              if (cancelled) return;
              const built = festivalItemFromDetailWithAsOf(detail);
              if (!built) {
                failedPromoIds.add(id);
                return;
              }
              const prev = socialPromoByIdRef.current;
              if (prev.get(id)) return;
              const next = new Map(prev);
              next.set(id, built);
              socialPromoByIdRef.current = next;
              setSocialPromoById(next);
            } finally {
              socialPromoDetailInflightRef.current.delete(id);
            }
          }),
        );
      }
    };

    pump();
    return () => {
      cancelled = true;
    };
  }, [
    loading,
    items,
    festivalId,
    festivalDeepLink.sheet,
    festivalDeepLink.clearUrl,
  ]);

  const socialPromoItemById = useMemo(() => {
    const map = new Map();
    for (const entry of socialPromoFestivals) {
      const id = String(entry.contentId);
      const windowItem = items.find((row) => String(row?.contentId || '') === id);
      const detailItem = socialPromoById.get(id);
      if (!windowItem && !detailItem) continue;
      const entryTitleEn = String(entry?.titleEn || '').trim();
      const merged = mergeFestivalRowItem(windowItem, detailItem);
      map.set(
        id,
        entryTitleEn ? { ...merged, titleEn: entryTitleEn } : merged,
      );
    }
    return map;
  }, [items, socialPromoById]);

  const socialPromoRow = useMemo(
    () => resolveSocialPromoRow(socialPromoFestivals, socialPromoItemById, now, 2),
    [socialPromoItemById, now],
  );

  const itemsWithSocialPromo = useMemo(() => {
    const promoIds = new Set(
      socialPromoFestivals.map((entry) => String(entry.contentId)),
    );
    const merged = mergeSocialPromoIntoFestivalItems(
      items,
      socialPromoFestivals,
      socialPromoItemById,
      now,
    );
    return merged.map((item) => {
      const id = String(item?.contentId || '');
      if (!promoIds.has(id)) return item;
      return mergeFestivalRowItem(item, socialPromoItemById.get(id));
    });
  }, [items, socialPromoItemById, now]);

  const seoulToday = useMemo(() => seoulTodayYmd(now), [now]);
  const dataEndYmd = useMemo(
    () => loadedFestivalDataEndYmd(itemsWithSocialPromo, seoulToday),
    [itemsWithSocialPromo, seoulToday],
  );

  const filterItemsByTime = useCallback((timeId, source) => {
    const list = source || [];
    if (dateChipEnabled) {
      const range = festivalHubFlagOnRangeYmd(timeId, now, customRange);
      if (range) {
        if (!range.eventStartDate || !range.eventEndDate) return [];
        return filterFestivalsByYmdRange(
          list,
          range.eventStartDate,
          range.eventEndDate,
        );
      }
    }
    return filterByTimeTab(timeId, list, now);
  }, [dateChipEnabled, now, customRange]);

  const timeTabs = useMemo(() => {
    const base = localizeFestivalTimeTabs(t, buildFestivalTimeTabs(now));
    if (!dateChipEnabled) return base;
    const monthPhrase = t('korea.festival.window30Short');
    return festivalHubFlagOnPeriodTabs(base, {
      window30Label: monthPhrase,
      window30Headline: monthPhrase,
      dateLabel: t('korea.festival.dateChip'),
    });
  }, [now, t, dateChipEnabled]);

  const timedItems = useMemo(
    () => filterItemsByTime(timeTab, itemsWithSocialPromo),
    [filterItemsByTime, timeTab, itemsWithSocialPromo],
  );

  const sidoChips = useMemo(() => buildSidoTags(timedItems), [timedItems]);

  useEffect(() => {
    if (dateChipEnabled) return;
    if (areaCode === 'all') return;
    if (sidoChips.length === 0) return;
    if (!sidoChips.some((s) => s.id === areaCode)) {
      if (areaCode === DEFAULT_AREA_CODE) return;
      setAreaCode(DEFAULT_AREA_CODE);
      setCityName('all');
    }
  }, [areaCode, sidoChips, dateChipEnabled]);

  const afterSido = useMemo(
    () => filterByRegion(timedItems, { areaCode }),
    [timedItems, areaCode],
  );

  const cityChips = useMemo(
    () =>
      areaCode === 'all' ? [] : buildCityTags(afterSido, { areaCode }),
    [areaCode, afterSido],
  );

  useEffect(() => {
    if (dateChipEnabled) return;
    if (cityName === 'all') return;
    if (!cityChips.some((c) => c.id === cityName)) setCityName('all');
  }, [cityName, cityChips, dateChipEnabled]);

  const afterRegion = useMemo(
    () => filterByRegion(timedItems, { areaCode, cityName }),
    [timedItems, areaCode, cityName],
  );

  const tasteChips = useMemo(
    () => localizeTasteChips(t, buildTasteTags(afterRegion)),
    [afterRegion, t],
  );

  useEffect(() => {
    if (dateChipEnabled) return;
    if (tasteId === 'all') return;
    if (!tasteChips.some((chip) => chip.id === tasteId)) setTasteId('all');
  }, [tasteId, tasteChips, dateChipEnabled]);

  const tastedItems = useMemo(
    () => filterByTaste(afterRegion, tasteId),
    [afterRegion, tasteId],
  );

  const searchFilter = searchDraft.trim() || searchApplied.trim();
  const searchActive = searchFilter.length > 0;
  const nearActive = Boolean(nearOrigin && nearLabel);

  const socialPromoPresentation = useMemo(
    () =>
      resolveSocialPromoPresentation(socialPromoRow, {
        searchActive,
        areaCode,
        cityName,
        timeTab,
        nearActive,
        nearOrigin,
      }),
    [socialPromoRow, searchActive, areaCode, cityName, timeTab, nearActive, nearOrigin],
  );

  const showSocialPromoRow = socialPromoPresentation.show;

  const visiblePromoContentIds = useMemo(() => {
    if (!showSocialPromoRow || socialPromoPresentation.loading) return new Set();
    return contentIdsFromPromoCards(socialPromoPresentation.cards);
  }, [showSocialPromoRow, socialPromoPresentation.loading, socialPromoPresentation.cards]);

  const itemsForChipCounts = useMemo(
    () => excludeFestivalsByContentId(itemsWithSocialPromo, visiblePromoContentIds),
    [itemsWithSocialPromo, visiblePromoContentIds],
  );

  const sidoChipsForDisplay = useMemo(() => {
    if (!visiblePromoContentIds.size) return sidoChips;
    const timed = filterItemsByTime(timeTab, itemsForChipCounts);
    return buildSidoTags(timed);
  }, [
    visiblePromoContentIds,
    sidoChips,
    timeTab,
    itemsForChipCounts,
    filterItemsByTime,
  ]);

  const cityChipsForDisplay = useMemo(() => {
    if (!visiblePromoContentIds.size) return cityChips;
    const timed = filterItemsByTime(timeTab, itemsForChipCounts);
    const after = filterByRegion(timed, { areaCode });
    return areaCode === 'all' ? [] : buildCityTags(after, { areaCode });
  }, [
    visiblePromoContentIds,
    cityChips,
    timeTab,
    itemsForChipCounts,
    areaCode,
    filterItemsByTime,
  ]);

  const localizedSidoChips = useMemo(
    () => localizeSidoChips(locale, sidoChipsForDisplay),
    [locale, sidoChipsForDisplay],
  );

  const localizedCityChips = useMemo(
    () => localizeCityChips(locale, cityChipsForDisplay),
    [locale, cityChipsForDisplay],
  );

  /** 검색 중에는 시간·지역·테마 칩을 넘어 롤링 12개월 전체에서 매칭 */
  const searchPoolItems = useMemo(() => {
    if (!searchActive) return tastedItems;
    return itemsWithSocialPromo;
  }, [searchActive, tastedItems, itemsWithSocialPromo]);

  const filteredItems = useMemo(
    () => filterBySearchQuery(searchPoolItems, searchFilter),
    [searchPoolItems, searchFilter],
  );

  const indexTitle = useMemo(() => {
    if (nearOrigin && nearLabel) {
      return t('korea.common.nearAround', { label: nearLabel });
    }
    if (searchActive) {
      if (dateChipEnabled) {
        return { kind: 'text', text: t('korea.festival.searchAllPeriod') };
      }
      return t('korea.common.searchPrefix', { query: searchFilter });
    }
    return buildIndexListHeadline({
      timeTab,
      areaCode,
      cityName,
      tasteId,
      timeTabs,
      t,
      locale,
      regionOnly: dateChipEnabled,
    });
  }, [
    nearOrigin,
    nearLabel,
    searchActive,
    searchFilter,
    timeTab,
    areaCode,
    cityName,
    tasteId,
    timeTabs,
    t,
    locale,
    dateChipEnabled,
  ]);

  const indexNeighborChips = useMemo(
    () => localizeSidoChips(locale, neighborSidoTags(areaCode, sidoChips)),
    [locale, areaCode, sidoChips],
  );

  const byContentId = useMemo(() => {
    const map = new Map();
    for (const item of itemsWithSocialPromo) {
      if (item?.contentId != null) map.set(String(item.contentId), item);
    }
    return map;
  }, [itemsWithSocialPromo]);

  /**
   * 내 주변: 좌표·반경 유지 · 시간·테마 칩에 맞춰 재계산 (지역 칩만 내 주변 해제)
   */
  const nearRanked = useMemo(() => {
    if (!nearOrigin) return null;
    const timed = filterItemsByTime(timeTab, itemsWithSocialPromo);
    const tasted = filterByTaste(timed, tasteId);
    return rankFestivalsByDistance(
      festivalsWithinKm(
        tasted,
        nearOrigin.lat,
        nearOrigin.lng,
        NEAR_KM,
      ),
      nearOrigin.lat,
      nearOrigin.lng,
    );
  }, [nearOrigin, itemsWithSocialPromo, filterItemsByTime, timeTab, tasteId]);

  const nearBaseItems = useMemo(
    () => (nearRanked ? nearRanked.map((row) => row.item) : null),
    [nearRanked],
  );

  const socialPromoNearLine = useMemo(() => {
    const line = socialPromoPresentation.nearLine;
    if (!line?.item?.contentId) return null;
    const id = String(line.item.contentId);
    const listed = (nearBaseItems || []).some((item) => String(item?.contentId || '') === id);
    return listed ? null : line;
  }, [socialPromoPresentation.nearLine, nearBaseItems]);

  const nearKmByContentId = useMemo(() => {
    const map = new Map();
    if (!nearRanked) return map;
    for (const { item, km } of nearRanked) {
      if (item?.contentId == null || !Number.isFinite(km)) continue;
      map.set(String(item.contentId), km);
    }
    return map;
  }, [nearRanked]);

  const panelItems = useMemo(() => {
    if (nearBaseItems) return nearBaseItems;
    return [...filteredItems].sort((a, b) =>
      compareFestivalsByOpenDate(a, b, now),
    );
  }, [nearBaseItems, filteredItems, now]);

  const sessionPinnedDisplay = useMemo(() => {
    if (!sessionPinnedItem?.contentId) return null;
    const id = String(sessionPinnedItem.contentId);
    const live = byContentId.get(id) || socialPromoItemById.get(id) || sessionPinnedItem;
    return mergeFestivalRowItem(live, socialPromoItemById.get(id));
  }, [sessionPinnedItem, byContentId, socialPromoItemById]);

  const showSessionPinnedRow = useMemo(
    () =>
      shouldShowSessionPinnedHomeRow(searchActive, areaCode, cityName) &&
      sessionPinnedDisplay &&
      shouldShowSessionPinnedRow(
        sessionPinnedDisplay.contentId,
        socialPromoRow.status === 'ready' ? socialPromoRow.cards : [],
      ),
    [searchActive, sessionPinnedDisplay, socialPromoRow, areaCode, cityName],
  );

  /** Promo strip already surfaces these festivals — keep them out of the list and chip counts on this screen. */
  const panelItemsForList = useMemo(
    () => excludeFestivalsByContentId(panelItems, visiblePromoContentIds),
    [panelItems, visiblePromoContentIds],
  );

  const timeChipCounts = useMemo(() => {
    /** @type {Record<string, number>} */
    const counts = {};
    const regionBase = filterByRegion(itemsForChipCounts, {
      areaCode,
      cityName,
    });
    const pool = filterByTaste(regionBase, tasteId);
    for (const tab of timeTabs) {
      counts[tab.id] = filterItemsByTime(tab.id, pool).length;
    }
    return counts;
  }, [itemsForChipCounts, areaCode, cityName, tasteId, timeTabs, filterItemsByTime]);

  const panelGroups = useMemo(() => {
    if (nearBaseItems) {
      const groups = groupFestivalsByCity(panelItemsForList, {});
      return groups
        .map((g) => {
          const items = [...g.items].sort((a, b) => {
            const ka =
              nearKmByContentId.get(String(a.contentId)) ??
              Number.POSITIVE_INFINITY;
            const kb =
              nearKmByContentId.get(String(b.contentId)) ??
              Number.POSITIVE_INFINITY;
            return (
              ka - kb ||
              String(a.title || '').localeCompare(String(b.title || ''), 'ko')
            );
          });
          let minKm = Number.POSITIVE_INFINITY;
          for (const item of items) {
            const k =
              nearKmByContentId.get(String(item.contentId)) ??
              Number.POSITIVE_INFINITY;
            if (k < minKm) minKm = k;
          }
          return { ...g, items, minKm };
        })
        .sort(
          (a, b) =>
            a.minKm - b.minKm || a.label.localeCompare(b.label, 'ko'),
        );
    }
    return sortFestivalGroupsByOpenDate(
      groupFestivalsForList(panelItemsForList, { areaCode }),
      now,
    );
  }, [nearBaseItems, panelItemsForList, areaCode, nearKmByContentId, now]);

  const localizedPanelGroups = useMemo(
    () =>
      panelGroups.map((g) => ({
        ...g,
        label: localizeFestivalGroupLabel(locale, g),
      })),
    [panelGroups, locale],
  );

  const flapChildChips = useMemo(() => {
    if (nearBaseItems) {
      return localizedPanelGroups.map((g) => ({
        id: g.id,
        label: g.label,
        count: g.items.length,
      }));
    }
    if (areaCode === 'all') return [];
    return localizedCityChips;
  }, [nearBaseItems, localizedPanelGroups, areaCode, localizedCityChips]);

  const flapNeighborChips = useMemo(() => {
    if (nearBaseItems) return [];
    return indexNeighborChips;
  }, [nearBaseItems, indexNeighborChips]);

  const flapTasteChips = useMemo(() => {
    if (nearBaseItems) {
      return buildTasteTags(nearBaseItems).filter((t) => t.id !== tasteId);
    }
    return tasteChips.filter((t) => t.id !== tasteId);
  }, [nearBaseItems, tasteChips, tasteId]);

  const parentRegionLabel =
    areaCode !== 'all'
      ? localizedSidoListPhrase(
          locale,
          areaCode,
          sidoListPhrase(areaCode) || sidoLabel(areaCode) || '',
        )
      : '';

  const flapHasRelated =
    flapChildChips.length > 0 ||
    flapNeighborChips.length > 0 ||
    flapTasteChips.length > 0 ||
    (Boolean(parentRegionLabel) && cityName !== 'all');

  const personalItems = useMemo(() => {
    if (personalTab === 'favorites') {
      return hydrateFestivalRefs(favoriteList, byContentId);
    }
    if (personalTab === 'viewed') {
      return hydrateFestivalRefs(viewedList, byContentId);
    }
    return [];
  }, [personalTab, favoriteList, viewedList, byContentId]);

  const personalGroups = useMemo(
    () =>
      sortFestivalGroupsByOpenDate(groupFestivalsBySido(personalItems), now),
    [personalItems, now],
  );

  /**
   * 지도 마커 — 시간·테마·검색·내 주변은 반영.
   * 지역 칩은 숨기지 않고 카메라 포커스만 (전국 맥락 유지).
   * 검색 중에는 칩 필터 없이 롤링 12개월 전체에서 매칭.
   */
  const mapScopeItems = useMemo(() => {
    if (searchActive) {
      return filterBySearchQuery(itemsWithSocialPromo, searchFilter);
    }
    const tasted = filterByTaste(timedItems, tasteId);
    return filterBySearchQuery(tasted, searchFilter);
  }, [searchActive, itemsWithSocialPromo, timedItems, tasteId, searchFilter]);

  const mapItems = useMemo(() => {
    if (personalTab != null) return personalItems;
    if (nearBaseItems) return nearBaseItems;
    return mapScopeItems;
  }, [personalTab, personalItems, nearBaseItems, mapScopeItems]);

  useEffect(() => {
    if (!mapOpen) return;
    if (personalTab != null) return;

    if (nearBaseItems) {
      const nearView = focusViewFromFestivalItems(nearBaseItems);
      if (nearView) {
        setMapFocusView(nearView);
        return;
      }
      if (
        nearOrigin &&
        Number.isFinite(nearOrigin.lat) &&
        Number.isFinite(nearOrigin.lng)
      ) {
        setMapFocusView({
          lng: nearOrigin.lng,
          lat: nearOrigin.lat,
          zoom: 9,
        });
      }
      return;
    }

    if (areaCode === 'all' && cityName === 'all') {
      setMapFocusView(KOREA_MAP_OVERVIEW);
      return;
    }

    const view = focusViewFromFestivalItems(afterRegion);
    if (view) setMapFocusView(view);
  }, [
    mapOpen,
    personalTab,
    nearBaseItems,
    nearOrigin,
    areaCode,
    cityName,
    afterRegion,
  ]);

  const dismissLocHint = useCallback(() => {
    setLocHintDismissed(true);
    writeHintDismissed(
      typeof localStorage !== 'undefined' ? localStorage : null,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    queryGeolocationPermission().then((state) => {
      if (!cancelled) setGeoPermission(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearNear = useCallback(() => {
    setNearIds(null);
    setNearOrigin(null);
    setNearLabel('');
    setNearMsg('');
    preNearSnapshotRef.current = null;
  }, []);

  const restorePreNearState = useCallback(() => {
    const snap = preNearSnapshotRef.current;
    preNearSnapshotRef.current = null;
    clearNear();
    if (snap) {
      setTimeTab(snap.timeTab);
      setTasteId(snap.tasteId);
      setAreaCode(snap.areaCode);
      setCityName(snap.cityName);
      setChipPanel(snap.chipPanel);
    }
    clearFestivalFromUrl();
    setMapFocusView(null);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearNear, clearFestivalFromUrl]);

  /**
   * GPS 성공 시: 시도 칩 맞춤.
   * boot — 재진입·자동 GPS: 시도 칩만 (반경 리스트 없음)
   * 명시적 내 주변 — 반경 리스트 + 포커스
   * @param {number} lat
   * @param {number} lng
   * @param {{ boot?: boolean, festivalItems?: object[] }} [opts]
   */
  const applyUserLocation = useCallback(
    (lat, lng, opts = {}) => {
      const boot = Boolean(opts.boot);
      const sourceItems = opts.festivalItems ?? items;
      const hubResolved = resolveKoreaAreaFromCoords(lat, lng);
      dismissLocHint();
      writeLocationSuccess(
        typeof localStorage !== 'undefined' ? localStorage : null,
        lat,
        lng,
      );
      if (!hubResolved) {
        if (!boot) {
          setNearLabel('');
          setNearMsg(t('korea.common.locDomesticMiss'));
        }
        return false;
      }

      if (boot) {
        userRegionOverrideRef.current = true;
        setTasteId('all');
        setAreaCode(String(hubResolved.areaCode));
        setCityName('all');
        setChipPanel('region');
        setNearIds(null);
        setNearOrigin(null);
        setNearLabel('');
        setNearMsg('');
        return true;
      }

      setTasteId('all');
      setAreaCode(String(hubResolved.areaCode));
      setCityName('all');
      setChipPanel('region');
      clearFestivalFromUrl();
      setPersonalTab(null);
      setSearchDraft('');
      setSearchApplied('');
      setSearchOpen(false);
      setMapFocusView({ lng, lat, zoom: 9 });

      const label = hubResolved.hubName || '';
      const nearby = rankFestivalsByDistance(
        festivalsWithinKm(
          filterItemsByTime(timeTab, sourceItems),
          lat,
          lng,
          NEAR_KM,
        ),
        lat,
        lng,
      ).map((row) => row.item);
      const ids = nearby
        .map((item) => String(item?.contentId || ''))
        .filter(Boolean);
      setNearIds(ids.length ? ids : []);
      setNearOrigin({ lat, lng });
      setNearLabel(label);
      setNearMsg(
        ids.length
          ? t('korea.festival.nearPanelMeta', { km: NEAR_KM, count: ids.length })
          : t('korea.festival.nearEmpty', { km: NEAR_KM }),
      );
      return true;
    },
    [items, timeTab, dismissLocHint, t, filterItemsByTime],
  );

  useFestivalLocationBoot({
    loading,
    itemsLength: items.length,
    applyUserLocation,
    dismissLocHint,
  });

  useEffect(() => {
    if (!nearOrigin || !nearLabel) return;
    const n = nearBaseItems?.length ?? 0;
    setNearMsg(
      n > 0
        ? t('korea.festival.nearPanelMeta', { km: NEAR_KM, count: n })
        : t('korea.festival.nearEmpty', { km: NEAR_KM }),
    );
    setNearIds(
      (nearBaseItems || [])
        .map((item) => String(item?.contentId || ''))
        .filter(Boolean),
    );
  }, [nearOrigin, nearLabel, nearBaseItems, t]);

  const clearSearchFilter = () => {
    setSearchDraft('');
    setSearchApplied('');
    setSearchOpen(false);
    setSearchSuggestOpen(false);
  };

  const closeSearch = () => {
    clearSearchFilter();
    clearNear();
    clearFestivalFromUrl();
  };

  const onSearchInputChange = (e) => {
    const next = e.target.value;
    setSearchDraft(next);
    if (next.trim()) {
      setAreaCode('all');
      setCityName('all');
      setTasteId('all');
    }
    setPersonalTab(null);
    clearNear();
    clearFestivalFromUrl();
  };

  /** 검색 확정 — 입력창 비우고 확정어로 리스트만 유지 · 칩은 전국 */
  const commitSearch = (raw) => {
    const q = String(raw ?? searchDraft)
      .trim() || searchApplied.trim();
    setSearchApplied(q);
    setSearchDraft('');
    setSearchOpen(false);
    setSearchSuggestOpen(false);
    if (q) {
      setRecentSearches(pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, q));
      setAreaCode('all');
      setCityName('all');
      setTasteId('all');
    }
    if (typeof document !== 'undefined') {
      const el =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      el?.blur?.();
    }
  };

  const openSearchSuggestions = () => {
    setRecentSearches(loadRecentSearches(FESTIVAL_RECENT_SEARCH_KEY));
    setSearchSuggestOpen(true);
  };

  /** 칩·빈 영역 등 검색 UI 밖 탭 — 최근 목록 + 모바일 검색바 함께 닫기 */
  const dismissSearchUi = useCallback(() => {
    setSearchSuggestOpen(false);
    setSearchOpen(false);
    const q = searchDraft.trim();
    if (q) {
      setSearchApplied(q);
      setRecentSearches(pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, q));
      setAreaCode('all');
      setCityName('all');
      setTasteId('all');
    }
    setSearchDraft('');
    if (typeof document !== 'undefined') {
      const el =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      el?.blur?.();
    }
  }, [searchDraft]);

  useEffect(() => {
    if (!searchOpen && !searchSuggestOpen) return undefined;
    const onPointerDown = (e) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (pcSearchRootRef.current?.contains(target)) return;
      if (mobileSearchRootRef.current?.contains(target)) return;
      if (mobileSearchToggleRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[data-festival-id]')
      ) {
        return;
      }
      dismissSearchUi();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [searchOpen, searchSuggestOpen, dismissSearchUi]);

  const closeSearchSuggestionsSoon = () => {
    window.setTimeout(() => setSearchSuggestOpen(false), 120);
  };

  const recentLocationSuccess = readLocationSuccess(
    typeof localStorage !== 'undefined' ? localStorage : null,
  );

  const showDefaultLocHint = shouldShowDefaultLocHint({
    hintDismissed: locHintDismissed,
    recentSuccess: recentLocationSuccess,
    permission: geoPermission,
    loading,
    error: Boolean(error),
    nearActive,
    personalTab,
    areaCode,
    cityName,
    defaultAreaCode: DEFAULT_AREA_CODE,
    searchActive,
  });

  const panelListMetaText = useMemo(() => {
    if (nearBaseItems && nearLabel) {
      return t('korea.festival.nearPanelMeta', {
        km: NEAR_KM,
        count: panelItemsForList.length,
      });
    }
    if (nearActive && nearMsg) return nearMsg;
    return null;
  }, [nearBaseItems, nearLabel, nearActive, nearMsg, panelItemsForList.length, t]);

  const panelListMetaSegments = useMemo(() => {
    if (panelListMetaText != null) return null;
    const base = buildFestivalPanelListMetaSegments({
      areaCode,
      cityName,
      count: panelItemsForList.length,
      t,
      locale,
      listLoading: loading,
    });
    let segments = base;
    if (dateChipEnabled && !searchActive) {
      const periodLabel = festivalHubPeriodMetaLabel({
        timeTab,
        now,
        seoulToday,
        customRange,
        locale,
      });
      if (periodLabel) {
        segments = insertWindow30MetaPeriodSegment(base, periodLabel);
      }
    }
    return omitFestivalMetaRegionDuplicatingHeading(
      segments,
      festivalListHeadingPlain(indexTitle),
    );
  }, [
    panelListMetaText,
    areaCode,
    cityName,
    panelItemsForList.length,
    t,
    locale,
    loading,
    dateChipEnabled,
    searchActive,
    timeTab,
    now,
    seoulToday,
    customRange,
    indexTitle,
  ]);

  const resetListFilters = () => {
    userRegionOverrideRef.current = true;
    setTimeTab(defaultFestivalHubTimeTab());
    setCustomRange(null);
    setTasteId('all');
    setAreaCode(DEFAULT_AREA_CODE);
    setCityName('all');
    setChipPanel('region');
    clearSearchFilter();
    clearNear();
    clearFestivalFromUrl();
    setPersonalTab(null);
  };

  const selectTime = (id) => {
    if (dateChipEnabled && id === 'date') {
      setDateSheetOpen(true);
      setChipPanel('time');
      return;
    }
    if (dateChipEnabled && id !== 'date') {
      setCustomRange(null);
    }
    setTimeTab(id);
    setChipPanel('time');
    clearSearchFilter();
    clearFestivalFromUrl();
  };

  const applyCustomRange = (range) => {
    setCustomRange(range);
    setTimeTab('date');
    setChipPanel('time');
    setDateSheetOpen(false);
    clearSearchFilter();
    clearFestivalFromUrl();
  };

  const clearPeriod = () => {
    setTimeTab('now');
    setCustomRange(null);
    setDateSheetOpen(false);
    setChipPanel('time');
  };

  const selectTaste = (id) => {
    userRegionOverrideRef.current = true;
    setTasteId(id);
    setChipPanel('taste');
    clearSearchFilter();
    clearFestivalFromUrl();
  };

  const selectSido = (id) => {
    userRegionOverrideRef.current = true;
    setAreaCode(id);
    setCityName('all');
    setChipPanel('region');
    clearSearchFilter();
    clearNear();
    clearFestivalFromUrl();
  };

  const selectCity = (id) => {
    userRegionOverrideRef.current = true;
    setCityName(String(id) === 'all' ? 'all' : id);
    setChipPanel('region');
    clearSearchFilter();
    clearNear();
    clearFestivalFromUrl();
  };

  const openTimeMajor = () => {
    dismissSearchUi();
    setChipPanel('time');
  };
  const openRegionMajor = () => {
    dismissSearchUi();
    setChipPanel('region');
  };
  const openTasteMajor = () => {
    dismissSearchUi();
    setChipPanel('taste');
  };

  const activeTimeTab = timeTabs.find((tab) => tab.id === timeTab) || null;
  const timeMajorLabel = festivalHubTimeMajorLabel({
    dateChipEnabled,
    activeTab: activeTimeTab,
    timeTab,
    t,
  });
  const regionMajorLabel =
    cityName !== 'all'
      ? localizedFestivalCityListLabel(locale, areaCode, cityName)
      : areaCode !== 'all'
        ? localizedAreaCodeLabel(locale, areaCode, sidoLabel(areaCode)) ||
          t('korea.common.region')
        : t('korea.common.region');
  const tasteMajorLabel =
    localizedTasteLabel(t, tasteId, tasteLabel(tasteId)) ||
    t('korea.common.theme');

  const majorTimeDisplay = festivalHubTimeMajorDisplay({
    dateChipEnabled,
    locale,
    timeMajorLabel,
    t,
  });
  const majorRegionDisplay =
    locale === 'en' ? t('korea.common.region') : regionMajorLabel;
  const majorTasteDisplay =
    locale === 'en' ? t('korea.common.theme') : tasteMajorLabel;

  const detailChipPanelKey = chipPanel;
  const detailChipActiveKey =
    chipPanel === 'time'
      ? timeTab
      : chipPanel === 'region'
        ? `${areaCode}:${cityName}`
        : tasteId;

  const refreshFavorites = useCallback(() => {
    const list = loadFavorites();
    setFavoriteList(list);
    setFavoriteIds(new Set(list.map((r) => String(r.contentId))));
  }, []);

  const handleToggleFavorite = useCallback(
    (item) => {
      toggleFavorite(item);
      refreshFavorites();
    },
    [refreshFavorites],
  );

  const openItem = useCallback(
    (item) => {
      if (!item?.contentId) return;
      const id = String(item.contentId);
      const hadOpen = Boolean(festivalId);
      const next = searchParamsWithFestival(searchParams, id);
      if (hadOpen) {
        festivalDetailPushedRef.current = true;
        setSearchParams(next, { replace: true });
      } else {
        festivalDetailPushedRef.current = true;
        setSearchParams(next, { replace: false });
      }
      setViewedList(pushViewed(item));
    },
    [festivalId, searchParams, setSearchParams],
  );

  const openPersonal = (tab) => {
    setPersonalTab(tab);
    clearNear();
    clearFestivalFromUrl();
    if (tab === 'favorites') refreshFavorites();
    else setViewedList(loadViewed());
  };

  const closePersonal = () => {
    setPersonalTab(null);
  };

  const openMap = () => {
    setMapSessionKey((k) => k + 1);
    setMapFullscreen(false);
    setMapOpen(true);
    requestAnimationFrame(() => {
      mainScrollRef.current?.scrollTo({ top: 0 });
    });
  };

  const closeMap = () => {
    setMapFullscreen(false);
    setMapOpen(false);
  };

  const toggleMapFullscreen = () => {
    setMapFullscreen((v) => !v);
  };

  const handleNearMe = () => {
    userRegionOverrideRef.current = true;
    if (nearActive) {
      restorePreNearState();
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNearLabel('');
      setNearMsg(t('korea.common.locOffPickRegion'));
      return;
    }
    preNearSnapshotRef.current = {
      timeTab,
      tasteId,
      areaCode,
      cityName,
      chipPanel,
    };
    setNearBusy(true);
    setNearLabel('');
    setNearMsg(t('korea.common.locChecking'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearBusy(false);
        const ok = applyUserLocation(pos.coords.latitude, pos.coords.longitude, {
          festivalItems: items,
        });
        if (!ok) preNearSnapshotRef.current = null;
      },
      () => {
        setNearBusy(false);
        preNearSnapshotRef.current = null;
        setNearLabel('');
        dismissLocHint();
        setNearMsg(t('korea.common.locOffPickRegion'));
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 },
    );
  };

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el || mapOpen) {
      setShowScrollTop(false);
      return undefined;
    }
    const onScroll = () => setShowScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [mapOpen]);

  return (
    <div
      className={`relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900 ${
        mapOpen
          ? ''
          : 'pb-[calc(1.5rem+max(0.4rem,env(safe-area-inset-bottom,0px)))]'
      }`}
    >
      <SEO
        title={t('korea.festival.title')}
        description={t('korea.festival.seoDescription')}
        url="/korea"
      />

      <header
        className={`z-30 pt-[max(0.5rem,env(safe-area-inset-top,0px))] ${
          mapImmersive
            ? 'pointer-events-none absolute inset-x-0 top-0 border-0 bg-transparent'
            : 'relative shrink-0 border-b border-stone-200/80 bg-stone-100/95 backdrop-blur-md'
        }`}
      >
        <div
          className={`pointer-events-auto mx-auto w-full px-3 pb-2.5 ${
            mapImmersive
              ? 'max-w-none md:px-5'
              : mapOpen
                ? 'max-w-none md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl'
                : 'max-w-3xl md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl'
          }`}
        >
          <div
            className={`min-w-0 rounded-2xl px-3 py-2.5 md:px-4 ${
              mapImmersive
                ? 'border border-white/35 bg-white/45 shadow-[0_8px_32px_rgba(27,20,16,0.12)] backdrop-blur-xl'
                : 'border border-stone-200/90 bg-white shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700">
                  Korea
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  {t('korea.festival.title')}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form
                  ref={pcSearchRootRef}
                  className="relative hidden w-64 xl:w-72 lg:block"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitSearch();
                  }}
                >
                  <label className="sr-only" htmlFor="korea-festival-search-pc">
                    {t('korea.festival.searchLabel')}
                  </label>
                  <div
                    className={`flex w-full items-center gap-2 rounded-full border px-3 py-1.5 ${
                      searchActive
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 bg-stone-50 focus-within:border-amber-400 focus-within:bg-white'
                    }`}
                  >
                    <Search
                      size={15}
                      className="shrink-0 text-stone-500"
                      aria-hidden="true"
                    />
                    <input
                      id="korea-festival-search-pc"
                      type="search"
                      value={searchDraft}
                      onChange={onSearchInputChange}
                      onFocus={openSearchSuggestions}
                      onBlur={closeSearchSuggestionsSoon}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setSearchSuggestOpen(false);
                          if (searchActive) closeSearch();
                          else e.currentTarget.blur();
                        }
                      }}
                      placeholder={
                        searchApplied
                          ? t('korea.common.searchPrefix', { query: searchApplied })
                          : t('korea.festival.searchPlaceholder')
                      }
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none"
                    />
                    {searchActive ? (
                      <button
                        type="button"
                        onClick={closeSearch}
                        aria-label={t('korea.common.searchClear')}
                        title={t('korea.common.searchClear')}
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  <RecentSearchSuggestions
                    items={recentSearches}
                    draft={searchDraft}
                    visible={searchSuggestOpen}
                    onSelect={(keyword) => commitSearch(keyword)}
                    onRemove={(keyword) =>
                      setRecentSearches(
                        removeRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, keyword),
                      )
                    }
                    onClearAll={() =>
                      setRecentSearches(
                        clearRecentSearches(FESTIVAL_RECENT_SEARCH_KEY),
                      )
                    }
                    className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50"
                  />
                </form>
                <button
                  ref={mobileSearchToggleRef}
                  type="button"
                  onClick={() => {
                    if (searchOpen || searchActive) {
                      closeSearch();
                      return;
                    }
                    flushSync(() => {
                      setSearchOpen(true);
                      openSearchSuggestions();
                    });
                    mobileSearchInputRef.current?.focus();
                  }}
                  aria-label={
                    searchOpen || searchActive
                      ? t('korea.common.searchClose')
                      : t('korea.festival.searchOpen')
                  }
                  aria-pressed={searchOpen || searchActive}
                  title={
                    searchOpen || searchActive
                      ? t('korea.common.searchClose')
                      : t('korea.festival.searchOpen')
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-full border lg:hidden ${
                    searchOpen || searchActive
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {searchOpen || searchActive ? (
                    <X size={15} aria-hidden="true" />
                  ) : (
                    <Search size={15} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    personalTab ? closePersonal() : openPersonal('favorites')
                  }
                  aria-label={t('korea.common.favoritesViewed')}
                  aria-pressed={personalTab != null}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    personalTab != null
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Star
                    size={15}
                    className={
                      personalTab != null || favoriteIds.size > 0
                        ? 'fill-amber-400 text-amber-500'
                        : ''
                    }
                    aria-hidden="true"
                  />
                </button>
                {mapImmersive ? (
                  <button
                    type="button"
                    onClick={closeMap}
                    aria-label={t('korea.common.mapCloseList')}
                    title={t('korea.common.mapToList')}
                    className="flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <X size={14} aria-hidden="true" />
                    {t('korea.common.close')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goHome}
                    aria-label={t('korea.common.home')}
                    title={t('korea.common.home')}
                    className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                  >
                    <Home size={14} aria-hidden="true" />
                    {t('korea.common.home')}
                  </button>
                )}
              </div>
            </div>

            {fromTheme && !mapImmersive ? (
              <p className="mt-1.5 text-xs leading-relaxed text-stone-600 break-keep">
                <ThemeFestivalBackLink />
                <span className="text-stone-400"> · </span>
                {t('korea.festival.fromThemeHint')}
              </p>
            ) : null}

            {searchOpen && (
              <div ref={mobileSearchRootRef} className="relative mt-2 lg:hidden">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitSearch();
                  }}
                >
                  <label className="sr-only" htmlFor="korea-festival-search">
                    {t('korea.festival.searchLabel')}
                  </label>
                  <input
                    ref={mobileSearchInputRef}
                    id="korea-festival-search"
                    type="search"
                    value={searchDraft}
                    onChange={onSearchInputChange}
                    onFocus={openSearchSuggestions}
                    onBlur={closeSearchSuggestionsSoon}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setSearchSuggestOpen(false);
                        if (searchActive) closeSearch();
                        else setSearchOpen(false);
                      }
                    }}
                    placeholder={
                      searchApplied
                        ? t('korea.common.searchPrefix', { query: searchApplied })
                        : t('korea.festival.searchPlaceholder')
                    }
                    autoComplete="off"
                    enterKeyHint="search"
                    className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
                  >
                    {t('korea.common.searchSubmit')}
                  </button>
                </form>
                <RecentSearchSuggestions
                  items={recentSearches}
                  draft={searchDraft}
                  visible={searchSuggestOpen}
                  onSelect={(keyword) => commitSearch(keyword)}
                  onRemove={(keyword) =>
                    setRecentSearches(
                      removeRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, keyword),
                    )
                  }
                  onClearAll={() =>
                    setRecentSearches(
                      clearRecentSearches(FESTIVAL_RECENT_SEARCH_KEY),
                    )
                  }
                  className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50"
                />
              </div>
            )}

            <div className="mt-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar [scrollbar-gutter:stable]">
                  <button
                    type="button"
                    onClick={openTimeMajor}
                    className={majorChipClass(chipPanel === 'time')}
                    aria-pressed={chipPanel === 'time'}
                    aria-label={t('korea.common.majorTime', { label: timeMajorLabel })}
                  >
                    <ChipPanelIcon panel="time" size={13} />
                    {majorTimeDisplay}
                  </button>
                  <button
                    type="button"
                    onClick={openRegionMajor}
                    className={majorChipClass(chipPanel === 'region')}
                    aria-pressed={chipPanel === 'region'}
                    aria-label={t('korea.common.majorRegion', { label: regionMajorLabel })}
                  >
                    <ChipPanelIcon panel="region" size={13} />
                    {majorRegionDisplay}
                  </button>
                  <button
                    type="button"
                    onClick={openTasteMajor}
                    className={majorChipClass(chipPanel === 'taste')}
                    aria-pressed={chipPanel === 'taste'}
                    aria-label={t('korea.common.majorTheme', { label: tasteMajorLabel })}
                  >
                    <ChipPanelIcon panel="taste" size={13} />
                    {majorTasteDisplay}
                  </button>
                </div>
                <div className="flex shrink-0 items-center border-l border-stone-200 pl-3">
                  <button
                    type="button"
                    onClick={handleNearMe}
                    disabled={nearBusy}
                    aria-label={
                      nearActive
                        ? t('korea.festival.nearOff')
                        : t('korea.festival.nearLoad')
                    }
                    title={
                      nearActive
                        ? t('korea.festival.nearOff')
                        : t('korea.common.nearMe')
                    }
                    aria-pressed={nearActive}
                    className={nearMeChipClass(nearActive)}
                  >
                    {nearBusy ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <LocateFixed
                        size={14}
                        className={
                          nearActive ? 'text-amber-700' : 'text-amber-600'
                        }
                        aria-hidden="true"
                      />
                    )}
                    <span className={locale === 'en' ? 'hidden md:inline' : undefined}>
                      {t('korea.common.nearMe')}
                    </span>
                  </button>
                </div>
              </div>
              {!nearActive && nearMsg ? (
                <p
                  className="text-[11px] leading-snug text-stone-600 break-keep"
                  data-near-me-hint
                >
                  {nearMsg}
                </p>
              ) : null}
              <ChipScrollRow
                ariaLabel={t('korea.common.detailChips')}
                panelKey={detailChipPanelKey}
                activeKey={detailChipActiveKey}
              >
                {chipPanel === 'time' &&
                  timeTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      data-period-id={tab.id}
                      onClick={() => selectTime(tab.id)}
                      className={chipClass(timeTab === tab.id)}
                      aria-pressed={timeTab === tab.id}
                    >
                      <ChipPanelIcon panel="time" />
                      {tab.label}
                      {tab.id === 'window30' || tab.id === 'date'
                        ? null
                        : (
                        <span
                          data-period-count=""
                          className={koreaFilterChipCountClass(timeTab === tab.id)}
                        >
                          {timeChipCounts[tab.id] ?? 0}
                        </span>
                      )}
                    </button>
                  ))}
                {chipPanel === 'region' && (
                  <>
                    <button
                      type="button"
                      onClick={() => selectSido('all')}
                      className={chipClass(areaCode === 'all')}
                      aria-pressed={areaCode === 'all'}
                    >
                      <ChipPanelIcon panel="region" />
                      {t('korea.common.nationwide')}
                    </button>
                    {localizedSidoChips.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSido(s.id)}
                        className={chipClass(areaCode === s.id)}
                        aria-pressed={areaCode === s.id}
                      >
                        <ChipPanelIcon panel="region" />
                        {s.label}
                        <span
                          className={koreaFilterChipCountClass(
                            areaCode === s.id,
                          )}
                        >
                          {s.count}
                        </span>
                      </button>
                    ))}
                  </>
                )}
                {chipPanel === 'taste' && (
                  <>
                    <button
                      type="button"
                      onClick={() => selectTaste('all')}
                      className={chipClass(tasteId === 'all')}
                      aria-pressed={tasteId === 'all'}
                    >
                      <ChipPanelIcon panel="taste" />
                      {t('korea.common.themeAll')}
                    </button>
                    {tasteChips.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTaste(t.id)}
                        className={chipClass(tasteId === t.id)}
                        aria-pressed={tasteId === t.id}
                      >
                        <ChipPanelIcon panel="taste" />
                        {t.label}
                        <span
                          className={koreaFilterChipCountClass(
                            tasteId === t.id,
                          )}
                        >
                          {t.count}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </ChipScrollRow>
            </div>
          </div>
        </div>
      </header>

      <main
        ref={mainScrollRef}
        className={`mx-auto min-h-0 w-full flex-1 ${
          mapImmersive
            ? 'pointer-events-none flex max-w-none flex-col overflow-hidden px-0 pb-0 pt-0'
            : mapOpen
              ? 'flex max-w-none flex-col overflow-hidden px-0 pb-0 pt-0 lg:max-w-6xl lg:px-8 lg:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] lg:pt-3 xl:max-w-7xl'
              : 'max-w-3xl overflow-y-auto overscroll-contain px-3 pb-[max(8.25rem,calc(env(safe-area-inset-bottom)+6.75rem))] pt-3 md:flex md:max-w-3xl md:flex-col md:overflow-hidden md:px-5 md:pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] lg:max-w-6xl lg:px-8 xl:max-w-7xl'
        }`}
      >
        {loading && !mapOpen && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            {t('korea.festival.loadingSchedule')}
          </div>
        )}

        {!loading && error && !mapOpen && (
          <div className="mb-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-center shadow-sm">
            <p className="text-sm text-stone-700">{error}</p>
            <button
              type="button"
              onClick={() => loadFestivals(true)}
              className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
            >
              {t('korea.common.retry')}
            </button>
          </div>
        )}

        <div
          className={`flex flex-col bg-white ${
            mapImmersive
              ? 'min-h-0 flex-1 overflow-hidden border-0 shadow-none'
              : mapOpen
                ? 'min-h-0 flex-1 overflow-hidden border-0 shadow-none max-lg:rounded-none lg:rounded-3xl lg:border lg:border-stone-200 lg:shadow-sm'
                : `border border-stone-200 shadow-sm ${
                    personalTab == null && flapHasRelated
                      ? 'rounded-3xl md:flex-row'
                      : 'rounded-3xl'
                  } md:min-h-0 md:flex-1 md:overflow-hidden`
          } ${
            mapSplitActive && personalTab == null && flapHasRelated
              ? 'lg:flex-row'
              : ''
          }`}
          aria-label={
            personalTab != null
              ? t('korea.festival.myListAria')
              : t('korea.festival.listAria')
          }
        >
          {mapSplitActive && personalTab == null && flapHasRelated && (
            <RelatedChipFlap
              layout="side"
              childChips={flapChildChips}
              neighborChips={flapNeighborChips}
              tasteSiblingChips={flapTasteChips}
              cityName={cityName}
              tasteId={tasteId}
              onSelectCity={selectCity}
              onSelectSido={selectSido}
              onSelectTaste={selectTaste}
              neighborLabel={t('korea.common.neighbor')}
              parentRegionLabel={parentRegionLabel}
            />
          )}
          <div
            className={`flex min-w-0 flex-col ${
              mapOpen ? 'min-h-0 flex-1' : 'md:min-h-0 md:flex-1'
            }`}
          >
            <div
              className={`shrink-0 flex-col gap-1.5 border-b border-stone-200 px-4 py-3 lg:px-5 lg:py-3.5 ${
                mapSplitActive ? 'hidden lg:flex' : mapOpen ? 'hidden' : 'flex'
              }`}
              data-festival-list-heading=""
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-sm font-bold text-stone-900 break-keep leading-snug lg:text-[15px]">
                  {personalTab != null
                    ? personalTab === 'favorites'
                      ? t('korea.common.favorites')
                      : t('korea.common.viewed')
                    : renderIndexListHeadline(indexTitle)}
                </h2>
                <div className="flex shrink-0 items-center gap-1.5">
                {personalTab != null ? (
                  <button
                    type="button"
                    onClick={closePersonal}
                    aria-label={t('korea.common.close')}
                    className="flex h-9 items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-900 shadow-sm hover:bg-amber-100"
                  >
                    <X size={14} aria-hidden="true" />
                    {t('korea.common.close')}
                  </button>
                ) : nearActive ? (
                  <button
                    type="button"
                    onClick={restorePreNearState}
                    aria-label={t('korea.common.close')}
                    className="flex h-9 items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-900 shadow-sm hover:bg-amber-100"
                  >
                    <X size={14} aria-hidden="true" />
                    {t('korea.common.close')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setListLarge((v) => !v)}
                  aria-label={
                    listLarge
                      ? t('korea.common.listDefaultAria')
                      : t('korea.common.listLargeAria')
                  }
                  title={
                    listLarge
                      ? t('korea.common.listDefaultTitle')
                      : t('korea.common.listLargeTitle')
                  }
                  aria-pressed={listLarge}
                  className={`flex h-9 items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold ${
                    listLarge
                      ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {listLarge ? (
                    <Minimize2 size={14} aria-hidden="true" />
                  ) : (
                    <Maximize2 size={14} aria-hidden="true" />
                  )}
                  {listLarge ? t('korea.common.listDefault') : t('korea.common.listLarge')}
                </button>
                <button
                  type="button"
                  onClick={() => (mapOpen ? closeMap() : openMap())}
                  aria-label={
                    mapOpen
                      ? t('korea.common.mapCloseList')
                      : t('korea.common.mapOpenRoute')
                  }
                  title={
                    mapOpen
                      ? t('korea.common.mapCloseList')
                      : t('korea.common.mapOpenRoute')
                  }
                  aria-pressed={mapOpen}
                  className={`flex h-9 items-center gap-1 rounded-full border px-2.5 text-[11px] font-bold ${
                    mapOpen
                      ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {mapOpen ? (
                    <X size={14} aria-hidden="true" />
                  ) : (
                    <MapIcon size={14} aria-hidden="true" />
                  )}
                  {mapOpen ? t('korea.common.list') : t('korea.common.map')}
                </button>
              </div>
              </div>
              <p
                className={`w-full min-w-0 leading-snug ${
                  dateChipEnabled
                    ? 'text-xs font-medium text-stone-700'
                    : 'text-[11px] text-stone-500'
                }`}
                data-festival-list-meta=""
              >
                {personalTab != null
                  ? `${personalItems.length} · ${t('korea.common.regionGroup')}`
                  : panelListMetaSegments
                    ? (
                        <FestivalPanelListMetaLine
                          segments={panelListMetaSegments}
                        />
                      )
                    : panelListMetaText}
              </p>
            </div>
            {showDefaultLocHint && !mapOpen && (
              <div className="shrink-0 border-b border-amber-100 bg-amber-50/90 px-4 py-2.5">
                <p className="text-[12px] font-bold leading-snug text-amber-950 break-keep">
                  {t('korea.festival.locHintTitle')}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-amber-900/80 break-keep">
                  {t('korea.festival.locHintBody')}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNearMe}
                    disabled={nearBusy}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {nearBusy
                      ? t('korea.common.nearMeLoading')
                      : t('korea.common.allowLocation')}
                  </button>
                  <button
                    type="button"
                    onClick={dismissLocHint}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-amber-800/70 hover:bg-amber-100/80"
                  >
                    {t('korea.common.close')}
                  </button>
                </div>
              </div>
            )}
            {personalTab != null && !mapOpen && (
              <div className="flex shrink-0 gap-1.5 border-b border-stone-200 px-3 py-2">
                <button
                  type="button"
                  onClick={() => openPersonal('favorites')}
                  className={chipClass(personalTab === 'favorites')}
                >
                  {t('korea.common.favorites')}
                  <span
                    className={koreaFilterChipCountClass(
                      personalTab === 'favorites',
                    )}
                  >
                    {favoriteList.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openPersonal('viewed')}
                  className={chipClass(personalTab === 'viewed')}
                >
                  {t('korea.common.viewed')}
                  <span
                    className={koreaFilterChipCountClass(
                      personalTab === 'viewed',
                    )}
                  >
                    {viewedList.length}
                  </span>
                </button>
              </div>
            )}
            {personalTab == null && flapHasRelated && !mapOpen && (
              <RelatedChipFlap
                layout="row"
                rowCompanionSidePanel={mapSplitActive}
                childChips={flapChildChips}
                neighborChips={flapNeighborChips}
                tasteSiblingChips={flapTasteChips}
                cityName={cityName}
                tasteId={tasteId}
                onSelectCity={selectCity}
                onSelectSido={selectSido}
                onSelectTaste={selectTaste}
                neighborLabel={t('korea.common.neighbor')}
                parentRegionLabel={parentRegionLabel}
              />
            )}
            <div
              className={`flex ${
                mapSplitActive
                  ? 'min-h-0 flex-1 flex-col lg:flex-row'
                  : mapOpen
                    ? 'min-h-0 flex-1 flex-col'
                    : 'flex-col md:min-h-0 md:flex-1'
              }`}
            >
              <div
                className={`${listLarge ? 'space-y-3' : 'space-y-2'} page-scroll-end-pad px-3 pt-3 ${
                  mapSplitActive
                    ? 'hidden lg:block lg:custom-scrollbar lg:min-h-0 lg:w-[min(26rem,38%)] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-stone-200'
                    : mapOpen
                      ? 'hidden'
                      : 'md:custom-scrollbar md:min-h-0 md:flex-1 md:overflow-y-auto'
                }`}
              >
              {personalTab == null && socialPromoNearLine ? (
                <SocialPromoNearLine card={socialPromoNearLine} onSelect={openItem} />
              ) : null}
              {personalTab != null ? (
                personalItems.length === 0 ? (
                  <p className="px-1 py-4 text-sm text-stone-500">
                    {personalTab === 'favorites'
                      ? t('korea.festival.emptyFavorites')
                      : t('korea.festival.emptyViewed')}
                  </p>
                ) : (
                  personalGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <p className="px-1 py-1 text-[11px] font-bold tracking-wide text-stone-500">
                        {group.label}
                        <span className="ml-1 font-normal opacity-70">
                          {group.items.length}
                        </span>
                      </p>
                      {group.items.map((item) => (
                        <FestivalRow
                          key={`p-${festivalKey(item)}`}
                          item={item}
                          large={listLarge}
                          active={
                            selected?.contentId != null &&
                            String(selected.contentId) ===
                              String(item.contentId)
                          }
                          favorited={favoriteIds.has(String(item.contentId))}
                          onToggleFavorite={handleToggleFavorite}
                          onSelect={openItem}
                        />
                      ))}
                    </div>
                  ))
                )
              ) : panelItemsForList.length === 0 && !showSessionPinnedRow ? (
                loading ? (
                  <div
                    className={listLarge ? 'space-y-3' : 'space-y-2'}
                    aria-busy="true"
                    aria-label={t('korea.festival.loadingSchedule')}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <FestivalRowSkeleton key={`sk-${i}`} large={listLarge} />
                    ))}
                  </div>
                ) : dateChipEnabled && !searchActive ? (
                  <div className="px-1 py-4" data-festival-period-empty="">
                    <p className="text-sm text-stone-500">
                      {t('korea.festival.emptyPeriod')}
                    </p>
                    <button
                      type="button"
                      onClick={clearPeriod}
                      className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
                    >
                      {t('korea.festival.clearPeriod')}
                    </button>
                  </div>
                ) : (
                  <div className="px-1 py-4">
                    <p className="text-sm text-stone-500">
                      {searchActive
                        ? t('korea.festival.emptySearch')
                        : t('korea.festival.emptyFilter')}
                    </p>
                    <button
                      type="button"
                      onClick={resetListFilters}
                      className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
                    >
                      {t('korea.festival.resetFilters')}
                    </button>
                  </div>
                )
              ) : (
                <>
                  {showSocialPromoRow ? (
                    <SocialPromoFestivalRow
                      cards={socialPromoPresentation.cards}
                      loading={socialPromoPresentation.loading}
                      onSelect={openItem}
                    />
                  ) : null}
                  {showSessionPinnedRow ? (
                    <div
                      className="mb-2 space-y-2"
                      data-session-pinned-festival=""
                    >
                      <p className="px-1 py-1 text-[11px] font-bold tracking-wide text-stone-500">
                        {t('korea.festival.sessionPinnedSectionTitle')}
                        <span className="ml-1 font-normal opacity-70">1</span>
                      </p>
                      <FestivalRow
                        item={sessionPinnedDisplay}
                        large={listLarge}
                        active={
                          selected?.contentId != null &&
                          String(selected.contentId) ===
                            String(sessionPinnedDisplay.contentId)
                        }
                        favorited={favoriteIds.has(
                          String(sessionPinnedDisplay.contentId),
                        )}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={openItem}
                        distanceKm={
                          nearKmByContentId.get(
                            String(sessionPinnedDisplay.contentId),
                          ) ?? undefined
                        }
                      />
                    </div>
                  ) : null}
                  {localizedPanelGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <p className="px-1 py-1 text-[11px] font-bold tracking-wide text-stone-500">
                      {group.label}
                      <span className="ml-1 font-normal opacity-70">
                        {group.items.length}
                      </span>
                    </p>
                    {group.items.map((item) => (
                      <FestivalRow
                        key={festivalKey(item)}
                        item={item}
                        large={listLarge}
                        active={
                          selected?.contentId != null &&
                          String(selected.contentId) ===
                            String(item.contentId)
                        }
                        favorited={favoriteIds.has(String(item.contentId))}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={openItem}
                        distanceKm={
                          nearKmByContentId.get(String(item.contentId)) ??
                          undefined
                        }
                      />
                    ))}
                  </div>
                ))}
                </>
              )}
              </div>
              {mapSplitActive && (
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1b1410]">
                  <KoreaFestivalMap
                    className="absolute inset-0 h-full w-full"
                    items={mapItems}
                    locale={locale}
                    activeContentId={
                      selected?.contentId != null
                        ? String(selected.contentId)
                        : ''
                    }
                    focusView={mapFocusView}
                    historyKey={`${mapSessionKey}:${timeTab}:${tasteId}:${personalTab || ''}:${searchFilter}`}
                    layoutKey={`split:${isMapSplit ? 'lg' : 'sm'}`}
                    fullscreen={false}
                    onToggleFullscreen={toggleMapFullscreen}
                    onSelectPoint={(contentId) => {
                      const id = String(contentId);
                      const item =
                        byContentId.get(id) ||
                        mapItems.find((row) => String(row?.contentId) === id);
                      if (item) openItem(item);
                    }}
                    onSelectCluster={(contentIds) => {
                      const ids = (contentIds || [])
                        .map(String)
                        .filter(Boolean);
                      if (!ids.length) return;
                      setPersonalTab(null);
                      setNearOrigin(null);
                      setNearIds(ids);
                      setNearLabel('');
                      setNearMsg(
                        t('korea.festival.mapPicked', { count: ids.length }),
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {mapImmersive && (
        <div className="fixed inset-0 z-20 overflow-hidden bg-[#1b1410]">
          <KoreaFestivalMap
            className="absolute inset-0 h-full w-full"
            items={mapItems}
            locale={locale}
            activeContentId={
              selected?.contentId != null ? String(selected.contentId) : ''
            }
            focusView={mapFocusView}
            historyKey={`${mapSessionKey}:${timeTab}:${tasteId}:${personalTab || ''}:${searchFilter}`}
            layoutKey={`immersive:${mapFullscreen ? 'pc-full' : 'mobile'}`}
            fullscreen={mapFullscreen}
            onToggleFullscreen={
              isMapSplit || mapFullscreen ? toggleMapFullscreen : undefined
            }
            onSelectPoint={(contentId) => {
              const id = String(contentId);
              const item =
                byContentId.get(id) ||
                mapItems.find((row) => String(row?.contentId) === id);
              if (item) openItem(item);
            }}
          />
        </div>
      )}

      <button
        type="button"
        aria-label={t('korea.common.scrollToTop')}
        onClick={() => {
          mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`fixed bottom-[max(3.6rem,calc(env(safe-area-inset-bottom)+2.85rem))] right-3 z-40 flex h-11 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500 px-3.5 text-white shadow-[0_4px_18px_rgba(245,158,11,0.45)] transition-all duration-300 md:hidden ${
          showScrollTop && !mapOpen && !selected
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
        <span className="text-xs font-bold">{t('korea.common.scrollUp')}</span>
      </button>

      {festivalToast ? (
        <div
          role="status"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[60] max-w-[90vw] -translate-x-1/2 rounded-full border border-stone-700 bg-stone-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg"
        >
          {festivalToast}
        </div>
      ) : null}

      {(selectedForSheet || selected || festivalDeepLink.sheet === 'loading') && (
        <FestivalDetailSheet
          key={festivalId || 'sheet'}
          item={selectedForSheet}
          pending={
            festivalDeepLink.sheet === 'loading' ||
            (Boolean(festivalId) &&
              !selectedForSheet &&
              promoDeeplinkIdSet.has(festivalId))
          }
          prefetchedTourDetail={
            isManualFestivalContentId(festivalId)
              ? manualFestivalTourDetail(getManualFestivalEntry(festivalId))
              : deepLinkForId === festivalId && deepLinkDetail
                ? deepLinkDetail
                : null
          }
          favorited={Boolean(selected) && favoriteIds.has(String(selected.contentId))}
          onToggleFavorite={handleToggleFavorite}
          onClose={closeFestivalDetail}
          festivalPool={isGateoFestivalRoadEnabled() ? itemsWithSocialPromo : undefined}
          onOpenHub={(hubId) => {
            resetIosZoomAfterInput();
            setPlaceReturnTo('/korea');
            navigate(`/place/${hubId}`, { state: { returnTo: '/korea' } });
          }}
        />
      )}

      {dateChipEnabled ? (
        <FestivalDateSheet
          open={dateSheetOpen}
          todayYmd={seoulToday}
          maxYmd={dataEndYmd}
          initialStart={timeTab === 'date' ? customRange?.start || '' : ''}
          initialEnd={timeTab === 'date' ? customRange?.end || '' : ''}
          onApply={applyCustomRange}
          onClose={() => setDateSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}
