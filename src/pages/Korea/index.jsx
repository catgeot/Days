import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  LocateFixed,
  MapPin,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs';
import { isDomesticKoreaLocation } from '../../utils/tourApiMatch';
import { hubIdsForArea } from './koreaHubSeeds';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import { festivalLngLat } from './koreaFestivalCorridors';
import { filterByTimeTab } from './festivalTimeFilter';
import { fetchKoreaFestivalsRolling12 } from './fetchKoreaFestivalsWindow';
import { buildTasteTags, filterByTaste } from './festivalTasteTags';
import KoreaFestivalMap from './KoreaFestivalMap';
import FestivalDetailSheet from './FestivalDetailSheet';

const TIME_TABS = [
  { id: 'now', label: '지금' },
  { id: 'weekend', label: '이번 주말' },
  { id: 'thisMonth', label: '이번 달' },
  { id: 'season', label: '시즌' },
];

const HIGHLIGHT_LIMIT = 8;
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
  return `flex items-center gap-1.5 px-4 py-2 rounded-2xl whitespace-nowrap text-xs transition-all border shrink-0 ${
    active
      ? 'bg-white/10 text-white border-white/20 font-bold'
      : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08]'
  }`;
}

function FestivalCard({ item, onSelect }) {
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group relative flex flex-col text-left bg-white/[0.02] border border-white/[0.05] rounded-[1.5rem] overflow-hidden w-full aspect-[3/4] md:aspect-[4/5] snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      {img ? (
        <img
          src={img}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 to-black/80" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="relative z-[1] mt-auto p-4 space-y-1.5">
        {range && (
          <p className="text-[11px] font-bold tracking-wide text-amber-200/90 flex items-center gap-1">
            <CalendarDays size={12} aria-hidden="true" />
            {range}
          </p>
        )}
        <h3 className="text-base md:text-lg font-extrabold text-white leading-snug line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
          {item.title}
        </h3>
        {item.addr1 && (
          <p className="text-[11px] text-gray-300 line-clamp-1 flex items-center gap-1">
            <MapPin size={11} className="shrink-0 opacity-70" aria-hidden="true" />
            <span className="truncate">{item.addr1}</span>
          </p>
        )}
      </div>
    </button>
  );
}

function FestivalRow({ item, onSelect }) {
  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate);
  const range = start && end ? `${start} – ${end}` : start || end;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2.5 text-left hover:bg-white/[0.07] transition-colors"
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
          <p className="text-[11px] text-amber-200/80 font-bold">{range}</p>
        )}
        {item.addr1 && (
          <p className="text-[11px] text-gray-400 truncate">{item.addr1}</p>
        )}
      </div>
    </button>
  );
}

function HubRailCard({ hub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex-none snap-start w-[140px] md:w-[160px] rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-left hover:bg-white/[0.08] hover:border-amber-400/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
    >
      <p className="text-sm md:text-base font-bold text-white truncate">{hub.name}</p>
      <p className="mt-1 text-[10px] text-gray-400 tracking-wide truncate">
        {hub.name_en || hub.country}
      </p>
    </button>
  );
}

export default function KoreaFestivalHub() {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const [timeTab, setTimeTab] = useState('now');
  const [tasteId, setTasteId] = useState('all');
  const [mapFocusIds, setMapFocusIds] = useState(null);
  const [mapFocusView, setMapFocusView] = useState(null);
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

  const tasteChips = useMemo(() => buildTasteTags(timedItems), [timedItems]);

  useEffect(() => {
    if (tasteId === 'all') return;
    if (!tasteChips.some((t) => t.id === tasteId)) {
      setTasteId('all');
    }
  }, [tasteId, tasteChips]);

  const afterTaste = useMemo(
    () => filterByTaste(timedItems, tasteId),
    [timedItems, tasteId],
  );

  const resultItems = useMemo(() => {
    if (!mapFocusIds || mapFocusIds.length === 0) return afterTaste;
    const set = new Set(mapFocusIds.map(String));
    return afterTaste.filter((item) => set.has(String(item.contentId || '')));
  }, [afterTaste, mapFocusIds]);

  const highlightItems = useMemo(() => {
    const withImg = resultItems.filter((item) => festivalImage(item));
    const source = withImg.length ? withImg : resultItems;
    return source.slice(0, HIGHLIGHT_LIMIT);
  }, [resultItems]);

  const panelItems = useMemo(() => {
    const showPanel = tasteId !== 'all' || (mapFocusIds && mapFocusIds.length > 0);
    if (!showPanel) return [];
    return resultItems.slice(0, PANEL_LIMIT);
  }, [resultItems, tasteId, mapFocusIds]);

  const showResultPanel =
    tasteId !== 'all' || (mapFocusIds && mapFocusIds.length > 0);

  const byContentId = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      if (item?.contentId != null) map.set(String(item.contentId), item);
    }
    return map;
  }, [items]);

  const selectedHubs = useMemo(() => {
    if (!selected?.areaCode) return hubRail.slice(0, 4);
    return hubIdsForArea(selected.areaCode)
      .map((id) => krHubById.get(String(id).toLowerCase()))
      .filter(Boolean)
      .slice(0, 4);
  }, [selected, hubRail, krHubById]);

  const selectTime = (id) => {
    setTimeTab(id);
    setMapFocusIds(null);
    setMapFocusView(null);
    setTasteId('all');
    setNearLabel('');
    setNearMsg('');
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
        const nearby = festivalsWithinKm(
          filterByTimeTab('now', items, now),
          lat,
          lng,
          NEAR_KM,
        );
        const ids = nearby
          .map((item) => String(item?.contentId || ''))
          .filter(Boolean);
        setMapFocusIds(ids.length ? ids : null);
        setMapFocusView({ lng, lat, zoom: 9 });
        setNearLabel(label);
        setNearMsg(
          ids.length
            ? `${NEAR_KM}km 안 ${ids.length}건 · 지도에서 확인해 보세요.`
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

  const seoImage = highlightItems[0]
    ? festivalImage(highlightItems[0]) || undefined
    : undefined;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#1b1410] text-white custom-scrollbar">
      <SEO
        title="국내 축제 · 지금·지도"
        description="TourAPI 기반 국내 축제. 지금·주말·지도 클러스터로 찾고, 상세·인근 여행지로 이어가세요."
        url="/korea"
        image={seoImage}
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#1b1410]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-4 flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-amber-400/40 transition-all shrink-0"
            aria-label="홈으로"
          >
            <ArrowLeft size={18} className="text-gray-200" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-200/80">
              Korea
            </p>
            <h1 className="text-lg md:text-xl font-extrabold tracking-tight truncate">
              국내 축제
            </h1>
          </div>
          <button
            type="button"
            onClick={handleNearMe}
            disabled={nearBusy}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border border-amber-400/35 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25 disabled:opacity-60 transition-colors"
          >
            {nearBusy ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <LocateFixed size={14} aria-hidden="true" />
            )}
            내 주변
          </button>
        </div>
        {(nearLabel || nearMsg) && (
          <div className="mx-auto max-w-6xl px-4 md:px-6 pb-3">
            <p className="text-[11px] text-amber-100/80">
              {nearLabel ? (
                <span className="font-bold text-amber-200">{nearLabel} 기준</span>
              ) : null}
              {nearLabel && nearMsg ? ' · ' : null}
              {nearMsg}
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-6 py-6 space-y-6 pb-28">
        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
            언제
          </h2>
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
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
          </div>
        </section>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            축제 일정을 불러오는 중…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center space-y-3">
            <p className="text-sm text-gray-300">{error}</p>
            <button
              type="button"
              onClick={() => loadFestivals(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            <aside className="w-full md:w-[36%] lg:w-[34%] shrink-0 md:sticky md:top-[5.5rem] space-y-2">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-sm font-bold text-white">지도</h2>
                <p className="text-[11px] text-gray-500">줌 클러스터</p>
              </div>
              <div className="h-[min(62vh,520px)] md:h-[min(72vh,640px)]">
                <KoreaFestivalMap
                  items={afterTaste}
                  activeContentId={
                    selected?.contentId != null ? String(selected.contentId) : ''
                  }
                  focusView={mapFocusView}
                  onSelectPoint={(contentId) => {
                    const item = byContentId.get(String(contentId));
                    if (item) {
                      setSelected(item);
                      setMapFocusIds([contentId]);
                    } else {
                      setMapFocusIds([contentId]);
                    }
                  }}
                />
              </div>
              {mapFocusIds && (
                <button
                  type="button"
                  onClick={() => {
                    setMapFocusIds(null);
                    setMapFocusView(null);
                    setNearLabel('');
                    setNearMsg('');
                  }}
                  className="text-[11px] text-amber-200/90 underline-offset-2 hover:underline"
                >
                  지도 선택 해제
                </button>
              )}
            </aside>

            <div className="min-w-0 flex-1 space-y-8">
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-sm font-bold text-white">
                    {timeTab === 'now'
                      ? '지금 열리는 축제'
                      : timeTab === 'weekend'
                        ? '이번 주말'
                        : timeTab === 'season'
                          ? '시즌 하이라이트'
                          : '이번 달 하이라이트'}
                  </h2>
                  <p className="text-[11px] text-gray-500">{timedItems.length}건</p>
                </div>
                {highlightItems.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">
                    이 기간에 맞는 축제가 없습니다. 다른 시간 탭을 골라 보세요.
                  </p>
                ) : (
                  <div className="flex overflow-x-auto gap-3 pb-1 snap-x custom-scrollbar -mx-1 px-1">
                    {highlightItems.map((item) => (
                      <div
                        key={festivalKey(item)}
                        className="flex-none w-[150px] md:w-[160px] snap-start"
                      >
                        <FestivalCard item={item} onSelect={setSelected} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {tasteChips.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                    취향
                  </h2>
                  <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setTasteId('all');
                        setMapFocusIds(null);
                        setMapFocusView(null);
                      }}
                      className={chipClass(tasteId === 'all')}
                    >
                      전체
                    </button>
                    {tasteChips.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTasteId(t.id);
                          setMapFocusIds(null);
                          setMapFocusView(null);
                        }}
                        className={chipClass(tasteId === t.id)}
                      >
                        {t.label}
                        <span className="opacity-70">{t.count}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {showResultPanel && (
                <section className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <h2 className="text-sm font-bold text-white">선택 결과</h2>
                    <p className="text-[11px] text-gray-500">
                      {resultItems.length}건
                      {resultItems.length > PANEL_LIMIT
                        ? ` · ${PANEL_LIMIT}건까지`
                        : ''}
                    </p>
                  </div>
                  {panelItems.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4">
                      이 조건에 맞는 축제가 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {panelItems.map((item) => (
                        <FestivalRow
                          key={festivalKey(item)}
                          item={item}
                          onSelect={setSelected}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <h2 className="text-sm font-bold text-white">인근 여행지</h2>
                  <p className="text-[11px] text-gray-500">hub</p>
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 snap-x custom-scrollbar -mx-1 px-1">
                  {hubRail.map((hub) => (
                    <HubRailCard
                      key={hub.hubId}
                      hub={hub}
                      onClick={() => navigate(`/place/${hub.hubId}`)}
                    />
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {(loading || error) && (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-sm font-bold text-white">인근 여행지</h2>
              <p className="text-[11px] text-gray-500">hub</p>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x custom-scrollbar -mx-1 px-1">
              {hubRail.map((hub) => (
                <HubRailCard
                  key={hub.hubId}
                  hub={hub}
                  onClick={() => navigate(`/place/${hub.hubId}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

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
