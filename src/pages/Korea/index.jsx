import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  LocateFixed,
  MapPin,
  Undo2,
  X,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs';
import { isDomesticKoreaLocation } from '../../utils/tourApiMatch';
import { hubIdsForArea } from './koreaHubSeeds';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import { festivalLngLat } from './koreaFestivalCorridors';
import { filterByTimeTab } from './festivalTimeFilter';
import { buildTasteTags, filterByTaste, tasteLabel } from './festivalTasteTags';
import {
  buildCityTags,
  buildSidoTags,
  filterByRegion,
  neighborSidoTags,
  sidoLabel,
} from './festivalRegionTags';
import { fetchKoreaFestivalsRolling12 } from './fetchKoreaFestivalsWindow';
import KoreaFestivalMap from './KoreaFestivalMap';
import FestivalDetailSheet from './FestivalDetailSheet';

const TIME_TABS = [
  { id: 'now', label: '지금' },
  { id: 'weekend', label: '이번 주말' },
  { id: 'thisMonth', label: '이번 달' },
  { id: 'season', label: '시즌' },
];

const PANEL_LIMIT = 48;
const NEAR_KM = 80;

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
      ? 'bg-amber-500/25 text-amber-50 border-amber-300/45 font-bold'
      : 'bg-black/45 text-gray-200 border-white/20 hover:bg-black/60'
  }`;
}

function flapChipClass(active) {
  return `flex w-full items-center justify-between gap-1 rounded-xl border px-2 py-1.5 text-left text-[11px] transition-all ${
    active
      ? 'border-amber-300/45 bg-amber-500/25 font-bold text-amber-50'
      : 'border-white/15 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08]'
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
  layout = 'side',
}) {
  const hasChild = childChips.length > 0;
  const hasNeighbor = neighborChips.length > 0;
  const hasTaste = tasteSiblingChips.length > 0;
  if (!hasChild && !hasNeighbor && !hasTaste) return null;

  const shell =
    layout === 'side'
      ? 'hidden md:flex w-[92px] shrink-0 flex-col gap-2 overflow-y-auto rounded-l-3xl border border-r-0 border-white/15 bg-black/65 px-1.5 py-2.5 custom-scrollbar'
      : 'flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-2 custom-scrollbar md:hidden';

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
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-white/45">
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
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-white/45">
            인근
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
          <p className="px-0.5 text-[9px] font-bold tracking-wide text-white/45">
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

function FestivalRow({ item, active, onSelect }) {
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`w-full flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
        active
          ? 'border-amber-400/45 bg-amber-500/15'
          : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07]'
      }`}
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/5">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-black/60" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-bold text-white truncate">{item.title}</p>
        {range && (
          <p className="text-[11px] text-amber-200/80 font-bold flex items-center gap-1">
            <CalendarDays size={11} aria-hidden="true" />
            {range}
          </p>
        )}
        {item.addr1 && (
          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
            <MapPin size={11} className="shrink-0 opacity-70" aria-hidden="true" />
            <span className="truncate">{item.addr1}</span>
          </p>
        )}
      </div>
    </button>
  );
}

export default function KoreaFestivalHub() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const [timeTab, setTimeTab] = useState('now');
  const [tasteId, setTasteId] = useState('all');
  const [areaCode, setAreaCode] = useState('all');
  const [cityName, setCityName] = useState('all');
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

  const krHubById = useMemo(() => {
    const map = new Map();
    for (const hub of listCityAttractionHubs()) {
      if (!isDomesticKoreaLocation(hub) || !hub.hubId) continue;
      map.set(String(hub.hubId).toLowerCase(), hub);
    }
    return map;
  }, []);

  const hubRail = useMemo(() => {
    const ids = hubIdsForArea('all');
    return ids.map((id) => krHubById.get(String(id).toLowerCase())).filter(Boolean);
  }, [krHubById]);

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

  const filteredItems = useMemo(
    () => filterByTaste(afterRegion, tasteId),
    [afterRegion, tasteId],
  );

  const indexActive =
    tasteId !== 'all' || areaCode !== 'all' || cityName !== 'all';

  const indexTitle = useMemo(() => {
    if (mapFocusIds?.length) {
      return nearLabel ? `${nearLabel} 주변` : '선택';
    }
    const parts = [];
    const sido = sidoLabel(areaCode);
    if (sido) parts.push(sido);
    if (cityName !== 'all') parts.push(cityName);
    const taste = tasteLabel(tasteId);
    if (taste) parts.push(taste);
    return parts.length ? parts.join(' · ') : '색인';
  }, [mapFocusIds, nearLabel, areaCode, cityName, tasteId]);

  const neighborChips = useMemo(
    () => neighborSidoTags(areaCode, sidoChips),
    [areaCode, sidoChips],
  );

  const flapChildChips = useMemo(() => {
    if (areaCode === 'all' || mapFocusIds?.length) return [];
    return cityChips;
  }, [areaCode, cityChips, mapFocusIds]);

  const flapTasteChips = useMemo(() => {
    if (mapFocusIds?.length) return [];
    if (!indexActive) return [];
    return tasteChips.filter((t) => t.id !== tasteId);
  }, [mapFocusIds, indexActive, tasteChips, tasteId]);

  const flapHasRelated =
    !mapFocusIds?.length &&
    (flapChildChips.length > 0 ||
      neighborChips.length > 0 ||
      flapTasteChips.length > 0);

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
    if (!indexActive) return [];
    return filteredItems.slice(0, PANEL_LIMIT);
  }, [mapFocusIds, byContentId, filteredItems, indexActive]);

  const showList =
    (mapFocusIds && mapFocusIds.length > 0) || indexActive;

  const selectedHubs = useMemo(() => {
    const code = selected?.areaCode || (areaCode !== 'all' ? areaCode : null);
    if (!code) return hubRail.slice(0, 4);
    return hubIdsForArea(code)
      .map((id) => krHubById.get(String(id).toLowerCase()))
      .filter(Boolean)
      .slice(0, 4);
  }, [selected, areaCode, hubRail, krHubById]);

  const clearMapFocus = () => {
    setMapFocusIds(null);
    setMapFocusView(null);
    setFocusStack([]);
    setNearLabel('');
    setNearMsg('');
  };

  const clearFocus = () => {
    clearMapFocus();
    setTasteId('all');
    setAreaCode('all');
    setCityName('all');
    setSelected(null);
    setViewResetKey((k) => k + 1);
  };

  const pushFocus = (nextIds) => {
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
    setTimeTab(id);
    clearFocus();
  };

  const selectTaste = (id) => {
    setTasteId(id);
    clearMapFocus();
    setSelected(null);
  };

  const selectSido = (id) => {
    setAreaCode(id);
    setCityName('all');
    clearMapFocus();
    setSelected(null);
  };

  const selectCity = (id) => {
    setCityName(id);
    clearMapFocus();
    setSelected(null);
  };

  const openItem = (item) => {
    if (!item) return;
    setSelected(item);
  };

  const handleNearMe = () => {
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

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1b1410] text-white">
      <SEO
        title="국내 축제 · 지금·지도"
        description="TourAPI 기반 국내 축제. 지금·주말·지도 클러스터로 찾고, 상세·인근 여행지로 이어가세요."
        url="/korea"
      />

      <div className="absolute inset-0 z-0">
        <KoreaFestivalMap
          items={filteredItems}
          activeContentId={
            selected?.contentId != null ? String(selected.contentId) : ''
          }
          focusView={mapFocusView}
          historyKey={`${timeTab}:${areaCode}:${cityName}:${tasteId}:${viewResetKey}`}
          backNonce={mapBackNonce}
          listOpen={!!showList}
          onViewBack={handleViewBack}
          onSelectPoint={(contentId) => {
            const id = String(contentId);
            const item = byContentId.get(id);
            const alreadyOne =
              mapFocusIds?.length === 1 && String(mapFocusIds[0]) === id;
            if (!alreadyOne) pushFocus([id]);
            else setMapFocusIds([id]);
            if (item) setSelected(item);
          }}
          onSelectCluster={(contentIds) => {
            setSelected(null);
            setNearLabel('');
            setNearMsg('');
            if (contentIds.length) pushFocus(contentIds);
            else setMapFocusIds(null);
          }}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 pt-[max(0.5rem,env(safe-area-inset-top,0px))]">
        <div className="pointer-events-auto mx-auto flex max-w-6xl items-start gap-2 px-3 md:px-5">
          <Link
            to="/"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/55 text-gray-100 shadow-lg backdrop-blur-md hover:border-amber-400/40 hover:bg-black/70"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/55 px-3 py-2.5 shadow-lg backdrop-blur-md md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-200/80">
                  Korea
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg">
                  국내 축제
                </h1>
              </div>
              <button
                type="button"
                onClick={handleNearMe}
                disabled={nearBusy}
                className="shrink-0 flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-50 hover:bg-amber-500/30 disabled:opacity-60"
              >
                {nearBusy ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <LocateFixed size={14} aria-hidden="true" />
                )}
                내 주변
              </button>
            </div>

            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
              {TIME_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTime(t.id)}
                  className={chipClass(timeTab === t.id)}
                >
                  {t.label}
                </button>
              ))}
              <span className="ml-auto shrink-0 self-center text-[10px] text-white/55">
                {loading ? '…' : `${filteredItems.length}건`}
              </span>
            </div>

            {sidoChips.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => selectSido('all')}
                  className={chipClass(areaCode === 'all')}
                >
                  전국
                </button>
                {sidoChips.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSido(s.id)}
                    className={chipClass(areaCode === s.id)}
                  >
                    {s.label}
                    <span className="opacity-70">{s.count}</span>
                  </button>
                ))}
              </div>
            )}

            {cityChips.length > 0 && (
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => selectCity('all')}
                  className={chipClass(cityName === 'all')}
                >
                  시·군 전체
                </button>
                {cityChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCity(c.id)}
                    className={chipClass(cityName === c.id)}
                  >
                    {c.label}
                    <span className="opacity-70">{c.count}</span>
                  </button>
                ))}
              </div>
            )}

            {tasteChips.length > 0 && (
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => selectTaste('all')}
                  className={chipClass(tasteId === 'all')}
                >
                  테마 전체
                </button>
                {tasteChips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTaste(t.id)}
                    className={chipClass(tasteId === t.id)}
                  >
                    {t.label}
                    <span className="opacity-70">{t.count}</span>
                  </button>
                ))}
              </div>
            )}

            {(nearLabel || nearMsg) && (
              <p className="mt-2 text-[11px] text-amber-100/85">
                {nearLabel ? (
                  <span className="font-bold text-amber-200">{nearLabel} 기준</span>
                ) : null}
                {nearLabel && nearMsg ? ' · ' : null}
                {nearMsg}
              </p>
            )}
          </div>
        </div>
      </header>

      {loading && (
        <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm text-gray-200 shadow-lg backdrop-blur-md">
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            축제 일정을 불러오는 중…
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-20 flex justify-center px-4">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-white/15 bg-black/70 px-4 py-4 text-center shadow-lg backdrop-blur-md">
            <p className="text-sm text-gray-200">{error}</p>
            <button
              type="button"
              onClick={() => loadFestivals(true)}
              className="mt-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}

      {showList && (
        <aside
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 md:inset-x-auto md:bottom-auto md:left-3 md:top-[8.5rem] lg:left-5 ${
            flapHasRelated ? 'md:w-[432px] lg:w-[452px]' : 'md:w-[340px] lg:w-[360px]'
          }`}
          aria-label="선택한 축제 목록"
        >
          <div className="pointer-events-auto flex max-h-[42vh] flex-col md:max-h-[calc(100dvh-10rem)] md:flex-row md:items-stretch">
            {flapHasRelated && (
              <RelatedChipFlap
                layout="side"
                childChips={flapChildChips}
                neighborChips={neighborChips}
                tasteSiblingChips={flapTasteChips}
                cityName={cityName}
                tasteId={tasteId}
                onSelectCity={selectCity}
                onSelectSido={selectSido}
                onSelectTaste={selectTaste}
              />
            )}
            <div
              className={`flex min-w-0 flex-1 flex-col border border-white/15 bg-black/70 shadow-2xl backdrop-blur-xl ${
                flapHasRelated
                  ? 'rounded-t-3xl md:rounded-l-none md:rounded-r-3xl'
                  : 'rounded-t-3xl md:rounded-3xl'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-white">
                    {indexTitle}
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    {panelItems.length}건
                    {(mapFocusIds?.length || filteredItems.length) > PANEL_LIMIT
                      ? ` · ${PANEL_LIMIT}건까지`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {(focusStack.length > 0 || mapFocusIds?.length) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleViewBack();
                        setMapBackNonce((n) => n + 1);
                      }}
                      aria-label="이전 지도 위치로"
                      className="flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11px] font-bold text-gray-100 hover:bg-white/10"
                    >
                      <Undo2 size={14} aria-hidden="true" />
                      뒤로
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearFocus}
                    aria-label="선택·색인 해제 · 전국 보기"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-200 hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {flapHasRelated && (
                <RelatedChipFlap
                  layout="row"
                  childChips={flapChildChips}
                  neighborChips={neighborChips}
                  tasteSiblingChips={flapTasteChips}
                  cityName={cityName}
                  tasteId={tasteId}
                  onSelectCity={selectCity}
                  onSelectSido={selectSido}
                  onSelectTaste={selectTaste}
                />
              )}
              <div className="custom-scrollbar space-y-2 overflow-y-auto px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
                {panelItems.length === 0 ? (
                  <p className="px-1 py-4 text-sm text-gray-400">
                    이 선택에 맞는 축제가 없습니다.
                  </p>
                ) : (
                  panelItems.map((item) => (
                    <FestivalRow
                      key={festivalKey(item)}
                      item={item}
                      active={
                        selected?.contentId != null &&
                        String(selected.contentId) === String(item.contentId)
                      }
                      onSelect={openItem}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      )}

      {selected && (
        <FestivalDetailSheet
          item={selected}
          hubs={selectedHubs}
          onClose={() => setSelected(null)}
          onOpenHub={(hubId) => navigate(`/place/${hubId}`)}
        />
      )}
    </div>
  );
}
