import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Loader2,
  LocateFixed,
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
  buildMapFocusRegionChips,
  buildSidoTags,
  cityListPhrase,
  filterByRegion,
  neighborSidoTags,
  sidoLabel,
  sidoListPhrase,
} from './festivalRegionTags';
import { nearbyHubsForFestival } from './nearbyFestivalHubs';
import {
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
import KoreaFestivalMap from './KoreaFestivalMap';
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
  if (place && !city) bits.push('시·군별');
  else if (!place) bits.push('지역 그룹');
  if (capped) bits.push(`${PANEL_LIMIT}건까지`);
  return bits.join(' · ');
}

/** @typedef {'time' | 'region' | 'taste'} ChipPanelId */
/** @typedef {'idle' | 'region'} GuideKind */

const PANEL_LIMIT = 48;
const NEAR_KM = 80;
/** 헤더 하단과 본문(리스트·안내) 사이 고정 간격 */
const HEADER_BODY_GAP_PX = 12;
const HEADER_OFFSET_FALLBACK_PX = 140;

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

function flapChipClass(active) {
  return `flex w-full items-center justify-between gap-1 rounded-xl border px-2 py-1.5 text-left text-[11px] transition-all ${
    active
      ? 'border-amber-400 bg-amber-50 font-bold text-amber-900'
      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
  }`;
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
  layout = 'side',
}) {
  const hasChild = childChips.length > 0;
  const hasNeighbor = neighborChips.length > 0;
  const hasTaste = tasteSiblingChips.length > 0;
  if (!hasChild && !hasNeighbor && !hasTaste) return null;

  const shell =
    layout === 'side'
      ? 'hidden md:flex w-[92px] shrink-0 flex-col gap-2 overflow-y-auto rounded-l-3xl border border-r-0 border-stone-200 bg-white/95 px-1.5 py-2.5 backdrop-blur-xl custom-scrollbar'
      : 'flex shrink-0 gap-2 overflow-x-auto border-b border-stone-200 px-3 py-2 custom-scrollbar md:hidden';

  if (layout === 'row') {
    return (
      <div className={shell} aria-label="연관 색인 칩">
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
        {neighborChips.map((s) => (
          <button
            key={`m-near-${s.id}`}
            type="button"
            onClick={() => onSelectSido(s.id)}
            className={chipClass(false)}
          >
            {s.label}
            <span className="opacity-70">{s.count}</span>
          </button>
        ))}
        {tasteSiblingChips.map((t) => (
          <button
            key={`m-taste-${t.id}`}
            type="button"
            onClick={() => onSelectTaste(t.id)}
            className={chipClass(tasteId === t.id)}
          >
            {t.label}
            <span className="opacity-70">{t.count}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={shell} aria-label="연관 색인 칩">
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

function FestivalRow({ item, active, onSelect, favorited, onToggleFavorite }) {
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

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
          <p className="text-sm font-bold text-stone-900 truncate">{item.title}</p>
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
  const headerRef = useRef(null);
  const [headerOffsetPx, setHeaderOffsetPx] = useState(
    HEADER_OFFSET_FALLBACK_PX,
  );

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const update = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) setHeaderOffsetPx(h + HEADER_BODY_GAP_PX);
    };
    update();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(update)
        : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const [timeTab, setTimeTab] = useState('now');
  const [tasteId, setTasteId] = useState('all');
  const [areaCode, setAreaCode] = useState('all');
  const [cityName, setCityName] = useState('all');
  /** @type {[ChipPanelId, function]} */
  const [chipPanel, setChipPanel] = useState(/** @type {ChipPanelId} */ ('time'));
  const [mapFocusIds, setMapFocusIds] = useState(null);
  const [mapFocusView, setMapFocusView] = useState(null);
  const [focusStack, setFocusStack] = useState([]);
  const [viewResetKey, setViewResetKey] = useState(0);
  const [mapBackNonce, setMapBackNonce] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [nearLabel, setNearLabel] = useState('');
  const [nearBusy, setNearBusy] = useState(false);
  const [nearMsg, setNearMsg] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** @type {[GuideKind | null, function]} */
  const [guideKind, setGuideKind] = useState(/** @type {GuideKind | null} */ ('idle'));
  /** @type {['favorites' | 'viewed' | null, function]} */
  const [personalTab, setPersonalTab] = useState(null);
  /** 리스트가 한 번 열리면 X로 닫기 전까지 유지 (시간·대분류 변경 시 홈으로 튕김 방지) */
  const [indexListHeld, setIndexListHeld] = useState(false);
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
    if (!sidoChips.some((s) => s.id === areaCode)) {
      setAreaCode('all');
      setCityName('all');
    }
  }, [areaCode, sidoChips]);

  const afterSido = useMemo(
    () => filterByRegion(timedItems, { areaCode }),
    [timedItems, areaCode],
  );

  const cityChips = useMemo(
    () => (areaCode === 'all' ? [] : buildCityTags(afterSido)),
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

  const indexActive =
    tasteId !== 'all' ||
    areaCode !== 'all' ||
    cityName !== 'all' ||
    searchActive;

  const mapFocusActive = Boolean(mapFocusIds && mapFocusIds.length > 0);

  useEffect(() => {
    if (indexActive || mapFocusActive) setIndexListHeld(true);
  }, [indexActive, mapFocusActive]);

  const indexTitle = useMemo(() => {
    if (mapFocusIds?.length) {
      return nearLabel ? `${nearLabel} 주변` : '선택';
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
    mapFocusIds,
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

  const panelItems = useMemo(() => {
    if (mapFocusIds && mapFocusIds.length > 0) {
      const set = new Set(mapFocusIds.map(String));
      const ordered = [];
      for (const id of mapFocusIds) {
        const item = byContentId.get(String(id));
        if (item) ordered.push(item);
      }
      const base = ordered.length
        ? ordered
        : filteredItems.filter((item) => set.has(String(item.contentId || '')));
      return base.slice(0, PANEL_LIMIT);
    }
    if (!indexActive && !indexListHeld) return [];
    return filteredItems.slice(0, PANEL_LIMIT);
  }, [mapFocusIds, byContentId, filteredItems, indexActive, indexListHeld]);

  const panelGroups = useMemo(
    () => groupFestivalsForList(panelItems, { areaCode }),
    [panelItems, areaCode],
  );

  const mapFocusRegionChips = useMemo(() => {
    if (!mapFocusIds?.length) return [];
    return buildMapFocusRegionChips(panelItems, sidoChips);
  }, [mapFocusIds, panelItems, sidoChips]);

  const flapChildChips = useMemo(() => {
    if (mapFocusIds?.length || areaCode === 'all') return [];
    return cityChips;
  }, [areaCode, cityChips, mapFocusIds]);

  const flapNeighborChips = useMemo(() => {
    if (mapFocusIds?.length) return mapFocusRegionChips;
    return indexNeighborChips;
  }, [mapFocusIds, mapFocusRegionChips, indexNeighborChips]);

  const flapTasteChips = useMemo(() => {
    if (mapFocusIds?.length) return [];
    if (!indexActive && !indexListHeld) return [];
    return tasteChips.filter((t) => t.id !== tasteId);
  }, [mapFocusIds, indexActive, indexListHeld, tasteChips, tasteId]);

  const flapNeighborLabel = mapFocusIds?.length ? '지역' : '인근';

  const flapHasRelated =
    flapChildChips.length > 0 ||
    flapNeighborChips.length > 0 ||
    flapTasteChips.length > 0;

  const showIndexList =
    mapFocusActive || indexActive || indexListHeld;

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

  const showList = showIndexList || personalTab != null;

  const selectedHubs = useMemo(() => {
    if (!selected) return [];
    return nearbyHubsForFestival(selected, krHubList);
  }, [selected, krHubList]);

  const clearMapFocus = () => {
    setMapFocusIds(null);
    setMapFocusView(null);
    setFocusStack([]);
    setNearLabel('');
    setNearMsg('');
  };

  const dismissGuide = useCallback(() => {
    setGuideKind(null);
  }, []);

  const showRegionGuide = useCallback(() => {
    setGuideKind('region');
  }, []);

  const clearFocus = ({ restoreGuide = false } = {}) => {
    clearMapFocus();
    setTasteId('all');
    setAreaCode('all');
    setCityName('all');
    setSearchQuery('');
    setSearchOpen(false);
    setPersonalTab(null);
    setSelected(null);
    setIndexListHeld(false);
    setChipPanel('time');
    if (restoreGuide) setGuideKind('idle');
    setViewResetKey((k) => k + 1);
  };

  const closeSearch = () => {
    dismissGuide();
    setSearchQuery('');
    setSearchOpen(false);
    clearMapFocus();
    setSelected(null);
  };

  const nearActive = Boolean(nearLabel || nearMsg);

  const panelListMeta = useMemo(() => {
    if (nearActive && nearMsg) return nearMsg;
    return buildPanelListMeta({
      areaCode,
      cityName,
      count: panelItems.length,
      capped:
        (mapFocusIds?.length || filteredItems.length) > PANEL_LIMIT,
    });
  }, [
    nearActive,
    nearMsg,
    areaCode,
    cityName,
    panelItems.length,
    mapFocusIds,
    filteredItems.length,
  ]);

  const closeNearMe = () => {
    clearMapFocus();
    setSelected(null);
    if (!indexActive) setIndexListHeld(false);
    setGuideKind('idle');
    setViewResetKey((k) => k + 1);
  };

  const pushFocus = (nextIds) => {
    dismissGuide();
    setFocusStack((stack) => [...stack, mapFocusIds]);
    setMapFocusIds(nextIds);
  };

  const handleViewBack = () => {
    setSelected(null);
    setMapFocusView(null);
    setNearLabel('');
    setNearMsg('');
    setFocusStack((stack) => {
      if (stack.length === 0) {
        setMapFocusIds(null);
        return stack;
      }
      const next = stack.slice(0, -1);
      setMapFocusIds(stack[stack.length - 1] ?? null);
      return next;
    });
  };

  const selectTime = (id) => {
    dismissGuide();
    setTimeTab(id);
    clearMapFocus();
    setSelected(null);
  };

  const selectTaste = (id) => {
    dismissGuide();
    setTasteId(id);
    setChipPanel('taste');
    clearMapFocus();
    setSelected(null);
  };

  const selectSido = (id) => {
    dismissGuide();
    setAreaCode(id);
    setCityName('all');
    setChipPanel('region');
    clearMapFocus();
    setSelected(null);
  };

  const selectCity = (id) => {
    dismissGuide();
    setCityName(id);
    setChipPanel('region');
    clearMapFocus();
    setSelected(null);
  };

  const openTimeMajor = () => {
    dismissGuide();
    setChipPanel('time');
  };

  const openRegionMajor = () => {
    setChipPanel('region');
    if (!indexListHeld && !indexActive && !mapFocusActive) {
      showRegionGuide();
    } else {
      dismissGuide();
    }
  };

  const openTasteMajor = () => {
    dismissGuide();
    setChipPanel('taste');
  };

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
    dismissGuide();
    setSelected(item);
    setViewedList(pushViewed(item));
  };

  const openPersonal = (tab) => {
    dismissGuide();
    setPersonalTab(tab);
    clearMapFocus();
    setSelected(null);
    if (tab === 'favorites') refreshFavorites();
    else setViewedList(loadViewed());
  };

  const closePersonal = () => {
    setPersonalTab(null);
  };

  const handleNearMe = () => {
    dismissGuide();
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setNearBusy(false);
        const hubResolved = resolveKoreaAreaFromCoords(lat, lng);
        if (!hubResolved) {
          setNearLabel('');
          setNearMsg('국내 위치를 찾지 못했습니다. 지도를 직접 확대해 보세요.');
          return;
        }
        const label = hubResolved.hubName || '';
        setTimeTab('now');
        setTasteId('all');
        setAreaCode('all');
        setCityName('all');
        setSelected(null);
        const nearby = festivalsWithinKm(
          filterByTimeTab('now', items, now),
          lat,
          lng,
          NEAR_KM,
        );
        const ids = nearby
          .map((item) => String(item?.contentId || ''))
          .filter(Boolean);
        if (ids.length) pushFocus(ids);
        else {
          setFocusStack([]);
          setMapFocusIds(null);
        }
        setMapFocusView({ lng, lat, zoom: 9 });
        setNearLabel(label);
        setNearMsg(
          ids.length
            ? `${NEAR_KM}km 안 ${ids.length}건`
            : `${NEAR_KM}km 안 지금 축제가 없습니다. 시간 탭을 바꿔 보세요.`,
        );
      },
      (err) => {
        setNearBusy(false);
        setNearLabel('');
        const code = err?.code;
        if (code === 1) {
          setNearMsg('위치 권한이 필요합니다. 브라우저에서 위치를 허용해 주세요.');
        } else if (code === 3) {
          setNearMsg('위치 확인이 지연되었습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          setNearMsg('위치를 가져오지 못했습니다. 권한·네트워크를 확인해 주세요.');
        }
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 120_000 },
    );
  };

  const bodyTopStyle = useMemo(
    () => ({ top: headerOffsetPx }),
    [headerOffsetPx],
  );
  const listShellStyle = useMemo(
    () => ({
      paddingTop: headerOffsetPx,
      ['--korea-list-max-h']: `calc(100dvh - ${headerOffsetPx}px - 0.75rem)`,
    }),
    [headerOffsetPx],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1410] text-white">
      <SEO
        title="국내 축제 · 지금·지도"
        description="TourAPI 기반 국내 축제. 지금·주말·지도 클러스터로 찾고, 상세·인근 여행지로 이어가세요."
        url="/korea"
      />

      <div className="absolute inset-0 z-0 isolate">
        <KoreaFestivalMap
          items={filteredItems}
          activeContentId={
            selected?.contentId != null ? String(selected.contentId) : ''
          }
          focusView={mapFocusView}
          historyKey={`${timeTab}:${areaCode}:${cityName}:${tasteId}:${viewResetKey}`}
          backNonce={mapBackNonce}
          onSelectPoint={(contentId) => {
            dismissGuide();
            const id = String(contentId);
            const item = byContentId.get(id);
            const alreadyOne =
              mapFocusIds?.length === 1 && String(mapFocusIds[0]) === id;
            if (!alreadyOne) pushFocus([id]);
            else setMapFocusIds([id]);
            if (item) setSelected(item);
          }}
          onSelectCluster={(contentIds) => {
            dismissGuide();
            setSelected(null);
            setNearLabel('');
            setNearMsg('');
            if (contentIds.length) pushFocus(contentIds);
            else setMapFocusIds(null);
          }}
        />
      </div>

      <header
        ref={headerRef}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 pt-[max(0.5rem,env(safe-area-inset-top,0px))]"
      >
        <div className="pointer-events-auto mx-auto max-w-6xl px-3 md:px-5">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white/92 px-3 py-2.5 text-stone-900 shadow-lg backdrop-blur-md md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-700">
                  Korea
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg">
                  국내 축제
                </h1>
              </div>
              <span className="shrink-0 self-center text-[10px] text-stone-500">
                {loading ? '…' : `${filteredItems.length}건`}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (searchOpen || searchActive) closeSearch();
                  else {
                    dismissGuide();
                    setSearchOpen(true);
                  }
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
              <button
                type="button"
                onClick={() => (nearActive ? closeNearMe() : handleNearMe())}
                disabled={nearBusy}
                aria-label={nearActive ? '내 주변 닫기' : '내 주변'}
                aria-pressed={nearActive}
                title={nearActive ? '내 주변 닫기' : '내 주변'}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${
                  nearActive
                    ? 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'
                    : 'border-amber-500/40 bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                {nearBusy ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : nearActive ? (
                  <X size={14} aria-hidden="true" />
                ) : (
                  <LocateFixed size={14} aria-hidden="true" />
                )}
                {nearActive ? '닫기' : '내 주변'}
              </button>
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
                    clearMapFocus();
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
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar [scrollbar-gutter:stable]">
                <button
                  type="button"
                  onClick={openTimeMajor}
                  className={chipClass(chipPanel === 'time')}
                  aria-pressed={chipPanel === 'time'}
                  aria-label={`시간 대분류 · ${timeMajorLabel}`}
                >
                  {timeMajorLabel}
                </button>
                <button
                  type="button"
                  onClick={openRegionMajor}
                  className={chipClass(chipPanel === 'region')}
                  aria-pressed={chipPanel === 'region'}
                  aria-label={`지역 대분류 · ${regionMajorLabel}`}
                >
                  {regionMajorLabel}
                </button>
                <button
                  type="button"
                  onClick={openTasteMajor}
                  className={chipClass(chipPanel === 'taste')}
                  aria-pressed={chipPanel === 'taste'}
                  aria-label={`테마 대분류 · ${tasteMajorLabel}`}
                >
                  {tasteMajorLabel}
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar [scrollbar-gutter:stable]">
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
                    {cityChips.length > 0 && (
                      <>
                        <span
                          className="mx-0.5 h-4 w-px shrink-0 self-center bg-stone-300"
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => selectCity('all')}
                          className={chipClass(cityName === 'all')}
                          aria-pressed={cityName === 'all'}
                        >
                          시·군 전체
                        </button>
                        {cityChips.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCity(c.id)}
                            className={chipClass(cityName === c.id)}
                            aria-pressed={cityName === c.id}
                          >
                            {c.label}
                            <span className="opacity-70">{c.count}</span>
                          </button>
                        ))}
                      </>
                    )}
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
              </div>
            </div>
          </div>
        </div>
      </header>

      {loading && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
          style={bodyTopStyle}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-stone-200 bg-white/95 px-4 py-2 text-sm text-stone-700 shadow-lg backdrop-blur-md">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            축제 일정을 불러오는 중…
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
          style={bodyTopStyle}
        >
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-stone-200 bg-white/95 px-4 py-4 text-center shadow-lg backdrop-blur-md">
            <p className="text-sm text-stone-700">{error}</p>
            <button
              type="button"
              onClick={() => loadFestivals(true)}
              className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {!loading && !error && !showList && !nearActive && guideKind != null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
          style={bodyTopStyle}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white/95 px-4 py-3 text-stone-700 shadow-lg backdrop-blur-md"
            role="status"
          >
            {guideKind === 'region' ? (
              <>
                <p className="text-sm font-bold text-stone-900 break-keep">
                  지도의 지역을 선택해 주세요
                </p>
                <p className="mt-1 text-[12px] leading-snug text-stone-500 break-keep">
                  지도에서 축제가 있는 곳을 탭하거나 위 지역 칩을 고를 수 있어요
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-stone-900 break-keep">
                  오늘 축제 지역입니다.
                </p>
                <p className="mt-1 text-[12px] leading-snug text-stone-500 break-keep">
                  지도를 탭하거나 내 주변으로 찾을 수 있어요
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !showList && nearActive && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4"
          style={bodyTopStyle}
        >
          <div className="pointer-events-auto flex max-w-sm items-start gap-2 rounded-2xl border border-stone-200 bg-white/95 px-3 py-2.5 text-stone-700 shadow-lg backdrop-blur-md">
            <p className="min-w-0 flex-1 text-[12px] leading-snug">
              {nearLabel ? (
                <span className="font-bold text-amber-800">{nearLabel} 기준</span>
              ) : null}
              {nearLabel && nearMsg ? ' · ' : null}
              {nearMsg}
            </p>
            <button
              type="button"
              onClick={closeNearMe}
              aria-label="내 주변 닫기"
              className="shrink-0 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-600 hover:bg-stone-100"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showList && (
        <div
          className="absolute inset-0 z-20 flex items-start justify-center bg-stone-900/25 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-[1px] md:px-4 md:pb-4"
          style={listShellStyle}
          onClick={
            personalTab != null
              ? closePersonal
              : () => clearFocus({ restoreGuide: true })
          }
          role="presentation"
        >
          <aside
            className={`pointer-events-auto flex max-h-[var(--korea-list-max-h)] w-full flex-col md:flex-row md:items-stretch ${
              personalTab == null && flapHasRelated
                ? 'md:max-w-[520px]'
                : 'md:max-w-[420px]'
            }`}
            aria-label={
              personalTab != null ? '내 축제 목록' : '선택한 축제 목록'
            }
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            {personalTab == null && flapHasRelated && (
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
                neighborLabel={flapNeighborLabel}
              />
            )}
            <div
              className={`flex min-h-0 min-w-0 flex-1 flex-col border border-stone-200 bg-white/95 text-stone-900 shadow-2xl backdrop-blur-xl ${
                personalTab == null && flapHasRelated
                  ? 'rounded-3xl md:rounded-l-none md:rounded-r-3xl'
                  : 'rounded-3xl'
              }`}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-stone-900 break-keep leading-snug">
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
                  {personalTab == null &&
                    (focusStack.length > 0 || mapFocusIds?.length) && (
                      <button
                        type="button"
                        onClick={() => {
                          handleViewBack();
                          setMapBackNonce((n) => n + 1);
                        }}
                        aria-label="이전 지도 위치로"
                        className="flex h-9 items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 text-[11px] font-bold text-stone-700 hover:bg-stone-100"
                      >
                        <Undo2 size={14} aria-hidden="true" />
                        뒤로
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={
                      personalTab != null
                        ? closePersonal
                        : nearActive
                          ? closeNearMe
                          : () => clearFocus({ restoreGuide: true })
                    }
                    aria-label={
                      personalTab != null
                        ? '내 목록 닫기'
                        : nearActive
                          ? '내 주변 닫기 · 전국 보기'
                          : searchActive
                            ? '검색 닫기 · 전국 보기'
                            : '선택·색인 해제 · 전국 보기'
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {personalTab != null && (
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
              {personalTab == null && flapHasRelated && (
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
                  neighborLabel={flapNeighborLabel}
                />
              )}
              <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
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
                        <p className="sticky top-0 z-[1] bg-white/95 px-1 py-1 text-[11px] font-bold tracking-wide text-stone-500 backdrop-blur-sm">
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
                    {searchActive
                      ? '검색과 맞는 축제가 없습니다.'
                      : '이 선택에 맞는 축제가 없습니다.'}
                  </p>
                ) : (
                  panelGroups.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <p className="sticky top-0 z-[1] bg-white/95 px-1 py-1 text-[11px] font-bold tracking-wide text-stone-500 backdrop-blur-sm">
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
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

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
