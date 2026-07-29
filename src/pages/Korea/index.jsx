import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  CalendarDays,
  Home,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  Star,
  Undo2,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs';
import { isDomesticKoreaLocation } from '../../utils/tourApiMatch';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import { festivalLngLat } from './koreaFestivalCorridors';
import { filterByTimeTab } from './festivalTimeFilter';
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
import { nearbyHubsForFestival } from './nearbyFestivalHubs';
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

const TIME_TABS = [
  { id: 'now', label: '지금' },
  { id: 'weekend', label: '이번 주말' },
  { id: 'thisMonth', label: '이번 달' },
  { id: 'season', label: '시즌' },
];

/**
 * @param {{ timeTab: string, areaCode: string, cityName: string, tasteId: string }} p
 */
function buildIndexListHeadline({ timeTab, areaCode, cityName, tasteId }) {
  const time =
    TIME_TABS.find((t) => t.id === timeTab)?.label || '지금';
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
 *   capped: boolean,
 * }} p
 */
function buildPanelListMeta({ areaCode, cityName, count, capped }) {
  const sido = sidoListPhrase(areaCode);
  const city = cityListPhrase(cityName);
  const place = [sido, city].filter(Boolean).join(' · ');
  const bits = [];
  if (place) bits.push(place);
  bits.push(`${count}건`);
  if (place && !city) bits.push(`${subregionUnitLabel(areaCode)}별`);
  else if (!place) bits.push('지역 그룹');
  if (capped) bits.push(`${PANEL_LIMIT}건까지`);
  return bits.join(' · ');
}

/** @typedef {'time' | 'region' | 'taste'} ChipPanelId */

const PANEL_LIMIT = 48;
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
}) {
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;
  const distanceLabel = formatDistanceKm(distanceKm);

  return (
    <div
      className={`w-full flex items-center gap-2 rounded-2xl border p-2.5 transition-colors ${
        active
          ? 'border-amber-400 bg-amber-50'
          : 'border-stone-200 bg-white hover:bg-stone-50'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="min-w-0 flex-1 flex items-center gap-3 text-left"
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-100">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 to-stone-200" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm font-bold text-stone-900 truncate">
              {item.title}
            </p>
            {distanceLabel ? (
              <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-600">
                {distanceLabel}
              </span>
            ) : null}
          </div>
          {range && (
            <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
              <CalendarDays size={11} aria-hidden="true" />
              {range}
            </p>
          )}
          {item.addr1 && (
            <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
              <MapPin size={11} className="shrink-0 opacity-70" aria-hidden="true" />
              <span className="truncate">{item.addr1}</span>
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
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 hover:bg-amber-50 hover:border-amber-300"
        >
          <Star
            size={15}
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
  const now = useMemo(() => new Date(), []);

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
  const [searchQuery, setSearchQuery] = useState('');
  /** @type {['favorites' | 'viewed' | null, function]} */
  const [personalTab, setPersonalTab] = useState(null);
  const [locHintDismissed, setLocHintDismissed] = useState(() =>
    readLocHintDone(),
  );
  const userRegionOverrideRef = useRef(false);
  const mountLocTriedRef = useRef(false);
  const mainScrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const krHubById = useMemo(() => {
    const map = new Map();
    for (const hub of listCityAttractionHubs()) {
      if (!isDomesticKoreaLocation(hub) || !hub.hubId) continue;
      map.set(String(hub.hubId).toLowerCase(), hub);
    }
    return map;
  }, []);

  const krHubList = useMemo(() => [...krHubById.values()], [krHubById]);

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

  const searchActive = searchQuery.trim().length > 0;

  const filteredItems = useMemo(
    () => filterBySearchQuery(tastedItems, searchQuery),
    [tastedItems, searchQuery],
  );

  const indexTitle = useMemo(() => {
    if (nearIds?.length && nearLabel) {
      return `${nearLabel} 주변`;
    }
    if (searchActive) {
      return `검색 · ${searchQuery.trim()}`;
    }
    return buildIndexListHeadline({
      timeTab,
      areaCode,
      cityName,
      tasteId,
    });
  }, [
    nearIds,
    nearLabel,
    searchActive,
    searchQuery,
    timeTab,
    areaCode,
    cityName,
    tasteId,
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

  /** 내 주변: 반경 결과 · 내 위치 기준 가까운 순 */
  const nearRanked = useMemo(() => {
    if (!nearIds?.length) return null;
    const ordered = [];
    const seen = new Set();
    for (const id of nearIds) {
      const key = String(id);
      const hit = byContentId.get(key);
      if (hit && !seen.has(key)) {
        seen.add(key);
        ordered.push(hit);
      }
    }
    if (nearOrigin) {
      return rankFestivalsByDistance(
        ordered,
        nearOrigin.lat,
        nearOrigin.lng,
      );
    }
    return ordered.map((item) => ({
      item,
      km: Number.POSITIVE_INFINITY,
    }));
  }, [nearIds, byContentId, nearOrigin]);

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
    if (nearBaseItems) {
      return nearBaseItems.slice(0, PANEL_LIMIT);
    }
    return filteredItems.slice(0, PANEL_LIMIT);
  }, [nearBaseItems, filteredItems]);

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
    return groupFestivalsForList(panelItems, { areaCode });
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
   */
  const mapScopeItems = useMemo(() => {
    const tasted = filterByTaste(timedItems, tasteId);
    return filterBySearchQuery(tasted, searchQuery);
  }, [timedItems, tasteId, searchQuery]);

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

  const selectedHubs = useMemo(() => {
    if (!selected) return [];
    return nearbyHubsForFestival(selected, krHubList);
  }, [selected, krHubList]);

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
      setTimeTab('now');
      setTasteId('all');
      setAreaCode(String(hubResolved.areaCode));
      setCityName('all');
      setChipPanel('region');
      setSelected(null);
      setPersonalTab(null);
      setSearchQuery('');
      setSearchOpen(false);
      setMapFocusView({ lng, lat, zoom: 9 });

      if (silent) {
        setNearIds(null);
        setNearOrigin(null);
        setNearLabel('');
        setNearMsg('');
        return true;
      }

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
      setNearIds(ids.length ? ids : null);
      setNearOrigin(ids.length ? { lat, lng } : null);
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

  const closeSearch = () => {
    setSearchQuery('');
    setSearchOpen(false);
    clearNear();
    setSelected(null);
  };

  const nearActive = Boolean(nearLabel || nearMsg);

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
      const n = panelItems.length;
      const total = nearBaseItems.length;
      return total > PANEL_LIMIT
        ? `${NEAR_KM}km 안 ${n}건 · ${PANEL_LIMIT}건까지`
        : `${NEAR_KM}km 안 ${n}건`;
    }
    if (nearActive && nearMsg) return nearMsg;
    return buildPanelListMeta({
      areaCode,
      cityName,
      count: panelItems.length,
      capped: filteredItems.length > PANEL_LIMIT,
    });
  }, [
    nearBaseItems,
    nearLabel,
    nearActive,
    nearMsg,
    areaCode,
    cityName,
    panelItems.length,
    filteredItems.length,
  ]);

  const selectTime = (id) => {
    setTimeTab(id);
    setChipPanel('time');
    clearNear();
    setSelected(null);
  };

  const selectTaste = (id) => {
    userRegionOverrideRef.current = true;
    setTasteId(id);
    setChipPanel('taste');
    clearNear();
    setSelected(null);
  };

  const selectSido = (id) => {
    userRegionOverrideRef.current = true;
    setAreaCode(id);
    setCityName('all');
    setChipPanel('region');
    clearNear();
    setSelected(null);
  };

  const selectCity = (id) => {
    userRegionOverrideRef.current = true;
    setCityName(id);
    setChipPanel('region');
    clearNear();
    setSelected(null);
  };

  const openTimeMajor = () => setChipPanel('time');
  const openRegionMajor = () => setChipPanel('region');
  const openTasteMajor = () => setChipPanel('taste');

  const timeMajorLabel =
    TIME_TABS.find((t) => t.id === timeTab)?.label || '지금';
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
                className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border ${
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
                className={`shrink-0 flex h-9 w-9 items-center justify-center rounded-full border ${
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
                  className="shrink-0 flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                >
                  <X size={14} aria-hidden="true" />
                  닫기
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  aria-label="홈으로"
                  title="홈으로"
                  className="shrink-0 flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Home size={14} aria-hidden="true" />
                  홈으로
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="mt-2 flex items-center gap-2">
                <label className="sr-only" htmlFor="korea-festival-search">
                  축제 검색
                </label>
                <input
                  id="korea-festival-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPersonalTab(null);
                    clearNear();
                    setSelected(null);
                  }}
                  placeholder="축제명·지역 검색"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-amber-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
                >
                  닫기
                </button>
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
                    aria-label={`시간 대분류 · ${timeMajorLabel}`}
                  >
                    {timeMajorLabel}
                  </button>
                  <button
                    type="button"
                    onClick={openRegionMajor}
                    className={majorChipClass(chipPanel === 'region')}
                    aria-pressed={chipPanel === 'region'}
                    aria-label={`지역 대분류 · ${regionMajorLabel}`}
                  >
                    {regionMajorLabel}
                  </button>
                  <button
                    type="button"
                    onClick={openTasteMajor}
                    className={majorChipClass(chipPanel === 'taste')}
                    aria-pressed={chipPanel === 'taste'}
                    aria-label={`테마 대분류 · ${tasteMajorLabel}`}
                  >
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
                  TIME_TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTime(t.id)}
                      className={chipClass(timeTab === t.id)}
                      aria-pressed={timeTab === t.id}
                    >
                      {t.label}
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
                  위치 허용이 없어 강원권 축제 리스트를 보여 드려요.
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
                className={`space-y-2 px-3 pt-3 pb-[max(10.5rem,calc(env(safe-area-inset-bottom,0px)+9rem))] md:pb-24 ${
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
                    historyKey={`${mapSessionKey}:${timeTab}:${tasteId}:${personalTab || ''}:${searchQuery.trim()}`}
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
            historyKey={`${mapSessionKey}:${timeTab}:${tasteId}:${personalTab || ''}:${searchQuery.trim()}`}
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
          hubs={selectedHubs}
          favorited={favoriteIds.has(String(selected.contentId))}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setSelected(null)}
          onOpenHub={(hubId) => navigate(`/place/${hubId}`)}
        />
      )}
    </div>
  );
}
