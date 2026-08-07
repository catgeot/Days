import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Undo2,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { ThemeFestivalBackLink } from '../KoreaTheme/ThemeModuleBackButton';
import { setPlaceReturnTo } from '../Home/lib/placeReturnTo';
import { resetIosZoomAfterInput } from '../../shared/lib/mobileViewport';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import { festivalLngLat } from './koreaFestivalCorridors';
import {
  buildFestivalTimeTabs,
  filterByTimeTab,
} from './festivalTimeFilter';
import { buildTasteTags, filterByTaste, tasteLabel } from './festivalTasteTags';
import {
  buildCityTags,
  buildSidoTags,
  cityListPhrase,
  filterByRegion,
  neighborSidoTags,
  sidoLabel,
  sidoListPhrase,
  subregionUnitLabel,
} from './festivalRegionTags';
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
import {
  DEFAULT_AREA_CODE,
  NEAR_FESTIVAL_KM,
} from './koreaFestivalDefaults';
import KoreaFestivalMap, {
  focusViewFromFestivalItems,
  KOREA_MAP_OVERVIEW,
} from './KoreaFestivalMap';
import FestivalDetailSheet from './FestivalDetailSheet';

/**
 * @param {{ timeTab: string, areaCode: string, cityName: string, tasteId: string, timeTabs: { id: string, label: string }[] }} p
 */
function buildIndexListHeadline({
  timeTab,
  areaCode,
  cityName,
  tasteId,
  timeTabs,
}) {
  const time =
    timeTabs.find((t) => t.id === timeTab)?.label || '지금';
  const sido = sidoListPhrase(areaCode);
  const city = cityListPhrase(cityName);
  const taste = tasteLabel(tasteId);
  const place = [sido, city].filter(Boolean).join(' ');

  if (place) {
    let sentence = `${place} · "${time}"`;
    if (taste) sentence += ` "${taste}" 관련`;
    sentence += ' 축제 리스트';
    return sentence;
  }

  let sentence = `"${time}"`;
  if (taste) sentence += ` "${taste}" 관련`;
  sentence += ' 축제 리스트';
  return sentence;
}

/**
 * @param {{
 *   areaCode: string,
 *   cityName: string,
 *   count: number,
 * }} p
 */
function buildPanelListMeta({ areaCode, cityName, count }) {
  const sido = sidoListPhrase(areaCode);
  const city = cityListPhrase(cityName);
  const place = [sido, city].filter(Boolean).join(' · ');
  const bits = [];
  if (place) bits.push(place);
  bits.push(`${count}건`);
  if (place && !city) bits.push(`${subregionUnitLabel(areaCode)}별`);
  else if (!place) bits.push('지역 그룹');
  return bits.join(' · ');
}

/**
 * @param {object} a
 * @param {object} b
 */
function compareFestivalsByStart(a, b) {
  const as = String(a?.eventStartDate || '');
  const bs = String(b?.eventStartDate || '');
  return (
    as.localeCompare(bs) ||
    String(a?.title || '').localeCompare(String(b?.title || ''), 'ko')
  );
}

/** @typedef {'time' | 'region' | 'taste'} ChipPanelId */

const NEAR_KM = NEAR_FESTIVAL_KM;

/** Strict Mode 재마운트에도 진입 GPS는 JS 세션당 1회(첫 시도) */
let koreaFestivalLocationBooted = false;

const LOC_HINT_DONE_KEY = 'korea-festival-loc-hint-done';

function readLocHintDone() {
  try {
    return sessionStorage.getItem(LOC_HINT_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeLocHintDone() {
  try {
    sessionStorage.setItem(LOC_HINT_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

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

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function festivalImage(item) {
  return item?.firstimage || item?.imageUrl || item?.firstimage2 || '';
}

function festivalKey(item) {
  return String(item?.contentId || `${item?.title}-${item?.eventStartDate}`);
}

function chipClass(active) {
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition-all border shrink-0 ${
    active
      ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
  }`;
}

/** 대분류: 항상 현재 선택 라벨 · 열린 패널만 강조 */
function majorChipClass(panelOpen) {
  return `flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-xs transition-all border shrink-0 font-bold ${
    panelOpen
      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
      : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
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

/**
 * 모바일 가로 칩 스크롤 — 하단 스크롤 트랙만(인지용 · 화살표 없음).
 * PC는 트랙 숨김.
 */
function ChipScrollRow({ children, className = '', ariaLabel = '칩 목록' }) {
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

  return (
    <div className={`min-w-0 ${className}`}>
      <div
        ref={scrollerRef}
        onScroll={updateScrollUi}
        aria-label={ariaLabel}
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
  neighborLabel = '인근',
  parentRegionLabel = '',
  layout = 'side',
}) {
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
        className="shrink-0 border-b border-stone-200 px-3 py-2 md:hidden"
        ariaLabel="지역 구분 칩"
      >
        {showParentUp && (
          <button
            type="button"
            onClick={() => onSelectCity('all')}
            className={chipClass(false)}
            aria-label={`${parentRegionLabel} 전체로`}
          >
            <Undo2 size={12} aria-hidden="true" />
            {parentRegionLabel}
          </button>
        )}
        {childChips.map((c) => (
          <button
            key={`m-child-${c.id}`}
            type="button"
            onClick={() => onSelectCity(c.id)}
            className={chipClass(cityName === c.id)}
          >
            {c.label}
            <span className="opacity-70">{c.count}</span>
          </button>
        ))}
      </ChipScrollRow>
    );
  }

  if (!hasChild && !hasNeighbor && !hasTaste && !showParentUp) return null;

  return (
    <div className={shell} aria-label="연관 색인 칩">
      {showParentUp && (
        <button
          type="button"
          onClick={() => onSelectCity('all')}
          className={flapChipClass(false)}
          aria-label={`${parentRegionLabel} 전체로`}
          title="상위 지역 목록"
        >
          <span className="flex min-w-0 items-center gap-0.5 truncate">
            <Undo2 size={11} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{parentRegionLabel}</span>
          </span>
        </button>
      )}
      {hasChild && (
        <div className="space-y-1">
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-stone-400">
            하위
          </p>
          {childChips.map((c) => (
            <button
              key={`child-${c.id}`}
              type="button"
              onClick={() => onSelectCity(c.id)}
              className={flapChipClass(cityName === c.id)}
            >
              <span className="truncate">{c.label}</span>
              <span className="shrink-0 opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      )}
      {hasNeighbor && (
        <div className="space-y-1">
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-stone-400">
            {neighborLabel}
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
            테마
          </p>
          {tasteSiblingChips.map((t) => (
            <button
              key={`taste-${t.id}`}
              type="button"
              onClick={() => onSelectTaste(t.id)}
              className={flapChipClass(tasteId === t.id)}
            >
              <span className="truncate">{t.label}</span>
              <span className="shrink-0 opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
      )}
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
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;
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
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-stone-200" />
          )}
        </div>
        <div className={`min-w-0 flex-1 ${large ? 'space-y-1' : 'space-y-0.5'}`}>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p
              className={`min-w-0 flex-1 font-bold text-stone-900 break-keep ${
                large
                  ? 'text-[15px] leading-snug line-clamp-2 sm:text-base'
                  : 'text-sm truncate'
              }`}
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
              <span className={large ? 'line-clamp-2' : 'truncate'}>
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
          aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기'}
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTheme = searchParams.get('from') === 'theme';
  /** 테마 크로스 레일 deep-link — 칩/지도 리팩터 없이 area만 수신 */
  const themeAreaParam = String(searchParams.get('area') || '').trim();
  /** 코스→축제 상세 deep-link — 칩/지도 리팩터 없이 contentId만 수신 */
  const festivalFromQuery = String(searchParams.get('festival') || '').trim();
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

  const [timeTab, setTimeTab] = useState('now');
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
  const [selected, setSelected] = useState(null);
  const [nearLabel, setNearLabel] = useState('');
  const [nearBusy, setNearBusy] = useState(false);
  const [nearMsg, setNearMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  /** 입력창 초안 */
  const [searchDraft, setSearchDraft] = useState('');
  /** 확정된 검색어 — 입력창을 비워도 리스트 필터 유지 · 칩 변경 시 해제 */
  const [searchApplied, setSearchApplied] = useState('');
  /** @type {['favorites' | 'viewed' | null, function]} */
  const [personalTab, setPersonalTab] = useState(null);
  const [locHintDismissed, setLocHintDismissed] = useState(() =>
    readLocHintDone(),
  );
  const userRegionOverrideRef = useRef(false);
  const mountLocTriedRef = useRef(false);
  const mainScrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const themeAreaAppliedRef = useRef(false);
  const festivalQueryAppliedRef = useRef('');

  useEffect(() => {
    if (themeAreaAppliedRef.current) return;
    if (!themeAreaParam || themeAreaParam === 'all') return;
    if (!/^\d{1,2}$/.test(themeAreaParam)) return;
    themeAreaAppliedRef.current = true;
    userRegionOverrideRef.current = true;
    setAreaCode(themeAreaParam);
    setCityName('all');
  }, [themeAreaParam]);

  useEffect(() => {
    if (!festivalFromQuery || loading || !items.length) return;
    if (festivalQueryAppliedRef.current === festivalFromQuery) return;
    const hit = items.find(
      (row) => String(row?.contentId || '') === festivalFromQuery,
    );
    if (!hit) return;
    festivalQueryAppliedRef.current = festivalFromQuery;
    setSelected(hit);
  }, [festivalFromQuery, loading, items]);

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

  const loadFestivals = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    setSelected(null);
    const result = await fetchKoreaFestivalsRolling12({ force, now });
    if (!result.ok) {
      setItems([]);
      setError(result.error || '축제 목록을 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    setItems(result.items);
    setLoading(false);
  }, [now]);

  useEffect(() => {
    loadFestivals(false);
  }, [loadFestivals]);

  const timeTabs = useMemo(() => buildFestivalTimeTabs(now), [now]);

  const timedItems = useMemo(
    () => filterByTimeTab(timeTab, items, now),
    [timeTab, items, now],
  );

  const sidoChips = useMemo(() => buildSidoTags(timedItems), [timedItems]);

  useEffect(() => {
    if (areaCode === 'all') return;
    if (sidoChips.length === 0) return;
    if (!sidoChips.some((s) => s.id === areaCode)) {
      if (areaCode === DEFAULT_AREA_CODE) return;
      setAreaCode(DEFAULT_AREA_CODE);
      setCityName('all');
    }
  }, [areaCode, sidoChips]);

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
    if (cityName === 'all') return;
    if (!cityChips.some((c) => c.id === cityName)) setCityName('all');
  }, [cityName, cityChips]);

  const afterRegion = useMemo(
    () => filterByRegion(timedItems, { areaCode, cityName }),
    [timedItems, areaCode, cityName],
  );

  const tasteChips = useMemo(() => buildTasteTags(afterRegion), [afterRegion]);

  useEffect(() => {
    if (tasteId === 'all') return;
    if (!tasteChips.some((t) => t.id === tasteId)) setTasteId('all');
  }, [tasteId, tasteChips]);

  const tastedItems = useMemo(
    () => filterByTaste(afterRegion, tasteId),
    [afterRegion, tasteId],
  );

  const searchFilter = searchDraft.trim() || searchApplied.trim();
  const searchActive = searchFilter.length > 0;

  /** 검색 중에는 시간·지역·테마 칩을 넘어 롤링 12개월 전체에서 매칭 */
  const searchPoolItems = useMemo(() => {
    if (!searchActive) return tastedItems;
    return items;
  }, [searchActive, tastedItems, items]);

  const filteredItems = useMemo(
    () => filterBySearchQuery(searchPoolItems, searchFilter),
    [searchPoolItems, searchFilter],
  );

  const indexTitle = useMemo(() => {
    if (nearOrigin && nearLabel) {
      return `${nearLabel} 주변`;
    }
    if (searchActive) {
      return `검색 · ${searchFilter}`;
    }
    return buildIndexListHeadline({
      timeTab,
      areaCode,
      cityName,
      tasteId,
      timeTabs,
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
  ]);

  const indexNeighborChips = useMemo(
    () => neighborSidoTags(areaCode, sidoChips),
    [areaCode, sidoChips],
  );

  const byContentId = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (item?.contentId != null) map.set(String(item.contentId), item);
    }
    return map;
  }, [items]);

  /**
   * 내 주변: 좌표·반경 유지 · 시간·테마 칩에 맞춰 재계산 (지역 칩만 내 주변 해제)
   */
  const nearRanked = useMemo(() => {
    if (!nearOrigin) return null;
    const timed = filterByTimeTab(timeTab, items, now);
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
  }, [nearOrigin, items, now, timeTab, tasteId]);

  const nearBaseItems = useMemo(
    () => (nearRanked ? nearRanked.map((row) => row.item) : null),
    [nearRanked],
  );

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
    return [...filteredItems].sort(compareFestivalsByStart);
  }, [nearBaseItems, filteredItems]);

  const timeChipCounts = useMemo(() => {
    /** @type {Record<string, number>} */
    const counts = {};
    const regionBase = filterByRegion(items, { areaCode, cityName });
    const pool = filterByTaste(regionBase, tasteId);
    for (const t of timeTabs) {
      counts[t.id] = filterByTimeTab(t.id, pool, now).length;
    }
    return counts;
  }, [items, areaCode, cityName, tasteId, timeTabs, now]);

  const panelGroups = useMemo(() => {
    if (nearBaseItems) {
      const groups = groupFestivalsByCity(panelItems, {});
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
    return groupFestivalsForList(panelItems, { areaCode }).map((g) => ({
      ...g,
      items: [...g.items].sort(compareFestivalsByStart),
    }));
  }, [nearBaseItems, panelItems, areaCode, nearKmByContentId]);

  const flapChildChips = useMemo(() => {
    if (nearBaseItems) {
      return panelGroups.map((g) => ({
        id: g.id,
        label: g.label,
        count: g.items.length,
      }));
    }
    if (areaCode === 'all') return [];
    return cityChips;
  }, [nearBaseItems, panelGroups, areaCode, cityChips]);

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
      ? sidoListPhrase(areaCode) || sidoLabel(areaCode) || ''
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
    () => groupFestivalsBySido(personalItems),
    [personalItems],
  );

  /**
   * 지도 마커 — 시간·테마·검색·내 주변은 반영.
   * 지역 칩은 숨기지 않고 카메라 포커스만 (전국 맥락 유지).
   * 검색 중에는 칩 필터 없이 롤링 12개월 전체에서 매칭.
   */
  const mapScopeItems = useMemo(() => {
    if (searchActive) return filterBySearchQuery(items, searchFilter);
    const tasted = filterByTaste(timedItems, tasteId);
    return filterBySearchQuery(tasted, searchFilter);
  }, [searchActive, items, timedItems, tasteId, searchFilter]);

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
    writeLocHintDone();
  }, []);

  const clearNear = useCallback(() => {
    setNearIds(null);
    setNearOrigin(null);
    setNearLabel('');
    setNearMsg('');
  }, []);

  /**
   * GPS 성공 시: 시도 칩 맞춤.
   * silent — 부트/재진입: 지역만 (반경 리스트 없음)
   * 명시적 내 주변 — 반경 리스트 + 포커스
   * @param {number} lat
   * @param {number} lng
   * @param {{ silent?: boolean, festivalItems?: object[] }} [opts]
   */
  const applyUserLocation = useCallback(
    (lat, lng, opts = {}) => {
      const silent = Boolean(opts.silent);
      const sourceItems = opts.festivalItems ?? items;
      const hubResolved = resolveKoreaAreaFromCoords(lat, lng);
      dismissLocHint();
      if (!hubResolved) {
        if (!silent) {
          setNearLabel('');
          setNearMsg('국내 위치를 찾지 못했습니다. 지역 칩으로 골라 보세요.');
        }
        return false;
      }

      // 진입 시 자동 GPS: 힌트만 닫고 전국 기본 유지 (지역 칩을 강원 등으로 덮지 않음)
      if (silent) {
        setNearIds(null);
        setNearOrigin(null);
        setNearLabel('');
        setNearMsg('');
        return true;
      }

      setTimeTab('now');
      setTasteId('all');
      setAreaCode(String(hubResolved.areaCode));
      setCityName('all');
      setChipPanel('region');
      setSelected(null);
      setPersonalTab(null);
      setSearchDraft('');
      setSearchApplied('');
      setSearchOpen(false);
      setMapFocusView({ lng, lat, zoom: 9 });

      const label = hubResolved.hubName || '';
      const nearby = rankFestivalsByDistance(
        festivalsWithinKm(
          filterByTimeTab('now', sourceItems, now),
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
          ? `${NEAR_KM}km 안 ${ids.length}건`
          : `${NEAR_KM}km 안 지금 축제가 없습니다. 시간 탭을 바꿔 보세요.`,
      );
      return true;
    },
    [items, now, dismissLocHint],
  );

  useEffect(() => {
    if (!nearOrigin || !nearLabel) return;
    const n = nearBaseItems?.length ?? 0;
    setNearMsg(
      n > 0
        ? `${NEAR_KM}km 안 ${n}건`
        : `${NEAR_KM}km 안 축제가 없습니다. 시간 탭을 바꿔 보세요.`,
    );
    setNearIds(
      (nearBaseItems || [])
        .map((item) => String(item?.contentId || ''))
        .filter(Boolean),
    );
  }, [nearOrigin, nearLabel, nearBaseItems]);

  const clearSearchFilter = () => {
    setSearchDraft('');
    setSearchApplied('');
    setSearchOpen(false);
  };

  const closeSearch = () => {
    clearSearchFilter();
    clearNear();
    setSelected(null);
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
    setSelected(null);
  };

  /** 검색 확정 — 입력창 비우고 확정어로 리스트만 유지 · 칩은 전국 */
  const commitSearch = () => {
    const q = searchDraft.trim() || searchApplied.trim();
    setSearchApplied(q);
    setSearchDraft('');
    setSearchOpen(false);
    if (q) {
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

  const nearActive = Boolean(nearOrigin && nearLabel);

  const showDefaultLocHint =
    personalTab == null &&
    !loading &&
    !error &&
    !nearActive &&
    !locHintDismissed &&
    areaCode === DEFAULT_AREA_CODE &&
    cityName === 'all' &&
    !searchActive;

  const panelListMeta = useMemo(() => {
    if (nearBaseItems && nearLabel) {
      return `${NEAR_KM}km 안 ${panelItems.length}건`;
    }
    if (nearActive && nearMsg) return nearMsg;
    return buildPanelListMeta({
      areaCode,
      cityName,
      count: panelItems.length,
    });
  }, [
    nearBaseItems,
    nearLabel,
    nearActive,
    nearMsg,
    areaCode,
    cityName,
    panelItems.length,
  ]);

  const selectTime = (id) => {
    setTimeTab(id);
    setChipPanel('time');
    clearSearchFilter();
    setSelected(null);
  };

  const selectTaste = (id) => {
    userRegionOverrideRef.current = true;
    setTasteId(id);
    setChipPanel('taste');
    clearSearchFilter();
    setSelected(null);
  };

  const selectSido = (id) => {
    userRegionOverrideRef.current = true;
    setAreaCode(id);
    setCityName('all');
    setChipPanel('region');
    clearSearchFilter();
    clearNear();
    setSelected(null);
  };

  const selectCity = (id) => {
    userRegionOverrideRef.current = true;
    setCityName(id);
    setChipPanel('region');
    clearSearchFilter();
    clearNear();
    setSelected(null);
  };

  const openTimeMajor = () => setChipPanel('time');
  const openRegionMajor = () => setChipPanel('region');
  const openTasteMajor = () => setChipPanel('taste');

  const timeMajorLabel =
    timeTabs.find((t) => t.id === timeTab)?.label || '지금';
  const regionMajorLabel =
    cityName !== 'all'
      ? cityName
      : areaCode !== 'all'
        ? sidoLabel(areaCode) || '지역'
        : '지역';
  const tasteMajorLabel = tasteLabel(tasteId) || '테마';

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

  const openItem = (item) => {
    if (!item) return;
    setSelected(item);
    setViewedList(pushViewed(item));
  };

  const openPersonal = (tab) => {
    setPersonalTab(tab);
    clearNear();
    setSelected(null);
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
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNearLabel('');
      setNearMsg('이 기기에서는 위치 정보를 사용할 수 없습니다.');
      return;
    }
    setNearBusy(true);
    setNearLabel('');
    setNearMsg('위치를 확인하는 중…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearBusy(false);
        applyUserLocation(pos.coords.latitude, pos.coords.longitude, {
          silent: false,
          festivalItems: items,
        });
      },
      (err) => {
        setNearBusy(false);
        setNearLabel('');
        const code = err?.code;
        if (code === 1) {
          setNearMsg('위치 권한이 필요합니다. 브라우저에서 위치를 허용해 주세요.');
        } else if (code === 3) {
          dismissLocHint();
          setNearMsg('위치 확인이 지연되었습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          dismissLocHint();
          setNearMsg('위치를 가져오지 못했습니다. 권한·네트워크를 확인해 주세요.');
        }
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 },
    );
  };

  useEffect(() => {
    if (loading) return;
    if (mountLocTriedRef.current) return;
    if (userRegionOverrideRef.current) {
      mountLocTriedRef.current = true;
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      mountLocTriedRef.current = true;
      return;
    }

    const opts = {
      enableHighAccuracy: false,
      timeout: 8_000,
      maximumAge: 300_000,
    };

    const onOk = (pos) => {
      dismissLocHint();
      if (userRegionOverrideRef.current) return;
      applyUserLocation(pos.coords.latitude, pos.coords.longitude, {
        silent: true,
        festivalItems: items,
      });
    };

    mountLocTriedRef.current = true;

    if (!koreaFestivalLocationBooted) {
      koreaFestivalLocationBooted = true;
      navigator.geolocation.getCurrentPosition(onOk, () => {}, opts);
      return;
    }

    const retryIfGranted = () => {
      navigator.geolocation.getCurrentPosition(onOk, () => dismissLocHint(), opts);
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state === 'granted') retryIfGranted();
          else if (status.state === 'prompt' && readLocHintDone()) {
            /* 이전에 허용·닫기 한 세션 — 잘못된 힌트만 유지 방지 */
            dismissLocHint();
          }
        })
        .catch(() => {
          if (readLocHintDone()) retryIfGranted();
        });
      return;
    }

    if (readLocHintDone()) retryIfGranted();
  }, [loading, items, applyUserLocation, dismissLocHint]);

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
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="국내 축제 · 시간·지역·테마"
        description="TourAPI 기반 국내 축제. 시간·지역·테마로 찾고, 필요 시 지도로 위치·동선을 확인하세요."
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
                  한국의 축제
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form
                  className="hidden w-64 xl:w-72 lg:block"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitSearch();
                  }}
                >
                  <label className="sr-only" htmlFor="korea-festival-search-pc">
                    축제 검색
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
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          if (searchActive) closeSearch();
                          else e.currentTarget.blur();
                        }
                      }}
                      placeholder={
                        searchApplied
                          ? `검색 · ${searchApplied}`
                          : '축제명·지역 검색'
                      }
                      autoComplete="off"
                      className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none"
                    />
                    {searchActive ? (
                      <button
                        type="button"
                        onClick={closeSearch}
                        aria-label="검색 지우기"
                        title="검색 지우기"
                        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    if (searchOpen || searchActive) closeSearch();
                    else setSearchOpen(true);
                  }}
                  aria-label={
                    searchOpen || searchActive ? '검색 닫기' : '축제 검색'
                  }
                  aria-pressed={searchOpen || searchActive}
                  title={searchOpen || searchActive ? '검색 닫기' : '축제 검색'}
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
                  aria-label="즐겨찾기·본 항목"
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
                    aria-label="지도 닫기 · 목록으로"
                    title="목록으로"
                    className="flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                  >
                    <X size={14} aria-hidden="true" />
                    닫기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goHome}
                    aria-label="홈으로"
                    title="홈으로"
                    className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                  >
                    <Home size={14} aria-hidden="true" />
                    홈으로
                  </button>
                )}
              </div>
            </div>

            {fromTheme && !mapImmersive ? (
              <p className="mt-1.5 text-xs leading-relaxed text-stone-600 break-keep">
                <ThemeFestivalBackLink />
                <span className="text-stone-400"> · </span>
                축제 일정·지도는 여기서 이어갑니다
              </p>
            ) : null}

            {searchOpen && (
              <form
                className="mt-2 flex items-center gap-2 lg:hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  commitSearch();
                }}
              >
                <label className="sr-only" htmlFor="korea-festival-search">
                  축제 검색
                </label>
                <input
                  id="korea-festival-search"
                  type="search"
                  value={searchDraft}
                  onChange={onSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (searchActive) closeSearch();
                      else setSearchOpen(false);
                    }
                  }}
                  placeholder={
                    searchApplied
                      ? `검색 · ${searchApplied}`
                      : '축제명·지역 검색'
                  }
                  autoComplete="off"
                  enterKeyHint="search"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-base text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
                >
                  검색
                </button>
              </form>
            )}

            <div className="mt-2.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar [scrollbar-gutter:stable]">
                  <button
                    type="button"
                    onClick={openTimeMajor}
                    className={majorChipClass(chipPanel === 'time')}
                    aria-pressed={chipPanel === 'time'}
                    aria-label={`시간 대분류 · ${timeMajorLabel}`}
                  >
                    <ChipPanelIcon panel="time" size={13} />
                    {timeMajorLabel}
                  </button>
                  <button
                    type="button"
                    onClick={openRegionMajor}
                    className={majorChipClass(chipPanel === 'region')}
                    aria-pressed={chipPanel === 'region'}
                    aria-label={`지역 대분류 · ${regionMajorLabel}`}
                  >
                    <ChipPanelIcon panel="region" size={13} />
                    {regionMajorLabel}
                  </button>
                  <button
                    type="button"
                    onClick={openTasteMajor}
                    className={majorChipClass(chipPanel === 'taste')}
                    aria-pressed={chipPanel === 'taste'}
                    aria-label={`테마 대분류 · ${tasteMajorLabel}`}
                  >
                    <ChipPanelIcon panel="taste" size={13} />
                    {tasteMajorLabel}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNearMe}
                  disabled={nearBusy}
                  aria-label="내 주변 축제 불러오기"
                  title="내 주변"
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
                >
                  {nearBusy ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <LocateFixed size={14} aria-hidden="true" />
                  )}
                  내 주변
                </button>
              </div>
              <ChipScrollRow ariaLabel="세부 칩">
                {chipPanel === 'time' &&
                  timeTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTime(t.id)}
                      className={chipClass(timeTab === t.id)}
                      aria-pressed={timeTab === t.id}
                    >
                      <ChipPanelIcon panel="time" />
                      {t.label}
                      <span className="opacity-70">
                        {timeChipCounts[t.id] ?? 0}
                      </span>
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
                      전국
                    </button>
                    {sidoChips.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSido(s.id)}
                        className={chipClass(areaCode === s.id)}
                        aria-pressed={areaCode === s.id}
                      >
                        <ChipPanelIcon panel="region" />
                        {s.label}
                        <span className="opacity-70">{s.count}</span>
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
                      테마 전체
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
                        <span className="opacity-70">{t.count}</span>
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
              : 'max-w-3xl overflow-y-auto overscroll-contain px-3 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3 md:flex md:max-w-3xl md:flex-col md:overflow-hidden md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl'
        }`}
      >
        {loading && !mapOpen && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            축제 일정을 불러오는 중…
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
              다시 시도
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
          aria-label={personalTab != null ? '내 축제 목록' : '축제 목록'}
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
              neighborLabel="인근"
              parentRegionLabel={parentRegionLabel}
            />
          )}
          <div
            className={`flex min-w-0 flex-col ${
              mapOpen ? 'min-h-0 flex-1' : 'md:min-h-0 md:flex-1'
            }`}
          >
            <div
              className={`shrink-0 items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 lg:px-5 lg:py-3.5 ${
                mapSplitActive ? 'hidden lg:flex' : mapOpen ? 'hidden' : 'flex'
              }`}
            >
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-stone-900 break-keep leading-snug lg:text-[15px]">
                  {personalTab != null
                    ? personalTab === 'favorites'
                      ? '즐겨찾기'
                      : '본 항목'
                    : indexTitle}
                </h2>
                <p className="truncate text-[11px] text-stone-500">
                  {personalTab != null
                    ? `${personalItems.length}건 · 지역 그룹`
                    : panelListMeta}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setListLarge((v) => !v)}
                  aria-label={
                    listLarge ? '리스트 기본 크기로' : '리스트 크게 보기'
                  }
                  title={listLarge ? '기본 크기' : '크게 보기'}
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
                  {listLarge ? '기본' : '크게'}
                </button>
                <button
                  type="button"
                  onClick={() => (mapOpen ? closeMap() : openMap())}
                  aria-label={
                    mapOpen ? '지도 닫기 · 목록으로' : '지도로 위치·동선 보기'
                  }
                  title={
                    mapOpen ? '지도 닫기 · 목록으로' : '지도로 위치·동선 보기'
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
                  {mapOpen ? '목록' : '지도'}
                </button>
                {personalTab == null &&
                  areaCode !== 'all' &&
                  cityName !== 'all' && (
                    <button
                      type="button"
                      onClick={() => selectCity('all')}
                      aria-label={`${sidoListPhrase(areaCode) || sidoLabel(areaCode) || '상위 지역'} 전체로`}
                      title="상위 지역 목록"
                      className="flex h-9 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 text-[11px] font-bold text-stone-700 hover:bg-stone-100"
                    >
                      <Undo2 size={14} aria-hidden="true" />
                      {sidoListPhrase(areaCode) ||
                        sidoLabel(areaCode) ||
                        '상위'}
                    </button>
                  )}
              </div>
            </div>
            {showDefaultLocHint && !mapOpen && (
              <div className="shrink-0 border-b border-amber-100 bg-amber-50/90 px-4 py-2.5">
                <p className="text-[12px] font-bold leading-snug text-amber-950 break-keep">
                  위치 허용이 없어 전국 축제 리스트를 보여 드려요.
                </p>
                <p className="mt-1 text-[11px] leading-snug text-amber-900/80 break-keep">
                  위치를 허용하면 현재 위치의 축제와 숙소 등 주변 정보를
                  맞춰 드릴게요.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNearMe}
                    disabled={nearBusy}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-950 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {nearBusy ? '확인 중…' : '위치 허용'}
                  </button>
                  <button
                    type="button"
                    onClick={dismissLocHint}
                    className="rounded-full px-2 py-1 text-[11px] font-semibold text-amber-800/70 hover:bg-amber-100/80"
                  >
                    닫기
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
                  즐겨찾기
                  <span className="opacity-70">{favoriteList.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => openPersonal('viewed')}
                  className={chipClass(personalTab === 'viewed')}
                >
                  본 항목
                  <span className="opacity-70">{viewedList.length}</span>
                </button>
              </div>
            )}
            {personalTab == null && flapHasRelated && !mapOpen && (
              <RelatedChipFlap
                layout="row"
                childChips={flapChildChips}
                neighborChips={flapNeighborChips}
                tasteSiblingChips={flapTasteChips}
                cityName={cityName}
                tasteId={tasteId}
                onSelectCity={selectCity}
                onSelectSido={selectSido}
                onSelectTaste={selectTaste}
                neighborLabel="인근"
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
                className={`${listLarge ? 'space-y-3' : 'space-y-2'} px-3 pt-3 pb-[max(10.5rem,calc(env(safe-area-inset-bottom,0px)+9rem))] md:pb-24 ${
                  mapSplitActive
                    ? 'hidden lg:block lg:custom-scrollbar lg:min-h-0 lg:w-[min(26rem,38%)] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-stone-200'
                    : mapOpen
                      ? 'hidden'
                      : 'md:custom-scrollbar md:min-h-0 md:flex-1 md:overflow-y-auto'
                }`}
              >
              {personalTab != null ? (
                personalItems.length === 0 ? (
                  <p className="px-1 py-4 text-sm text-stone-500">
                    {personalTab === 'favorites'
                      ? '즐겨찾은 축제가 없습니다. 상세에서 ★로 추가해 보세요.'
                      : '아직 본 축제가 없습니다. 카드를 열어 보면 여기에 쌓입니다.'}
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
              ) : panelItems.length === 0 ? (
                <p className="px-1 py-4 text-sm text-stone-500">
                  {loading
                    ? '불러오는 중…'
                    : searchActive
                      ? '검색과 맞는 축제가 없습니다.'
                      : '이 선택에 맞는 축제가 없습니다.'}
                </p>
              ) : (
                panelGroups.map((group) => (
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
                ))
              )}
              </div>
              {mapSplitActive && (
                <div className="relative min-h-0 flex-1 overflow-hidden bg-[#1b1410]">
                  <KoreaFestivalMap
                    className="absolute inset-0 h-full w-full"
                    items={mapItems}
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
                      setNearMsg(`지도에서 고른 ${ids.length}건`);
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
        aria-label="맨 위로"
        onClick={() => {
          mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-3 z-40 flex h-11 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500 px-3.5 text-white shadow-[0_4px_18px_rgba(245,158,11,0.45)] transition-all duration-300 md:hidden ${
          showScrollTop && !mapOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
        <span className="text-xs font-bold">위로</span>
      </button>

      {selected && (
        <FestivalDetailSheet
          item={selected}
          favorited={favoriteIds.has(String(selected.contentId))}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => {
            resetIosZoomAfterInput();
            setSelected(null);
          }}
          onOpenHub={(hubId) => {
            resetIosZoomAfterInput();
            setPlaceReturnTo('/korea');
            navigate(`/place/${hubId}`, { state: { returnTo: '/korea' } });
          }}
        />
      )}
    </div>
  );
}
