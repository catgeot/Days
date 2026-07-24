import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  LayoutGrid,
  Loader2,
  LocateFixed,
  MapPin,
} from 'lucide-react';
import SEO from '../../components/SEO';
import { fetchTourApiFestivals } from '../../utils/fetchTourApiFestivals';
import { fetchTourApiAreaCodes } from '../../utils/fetchTourApiArea';
import { listCityAttractionHubs } from '../Home/lib/cityAttractionHubs';
import { isDomesticKoreaLocation } from '../../utils/tourApiMatch';
import { hubIdsForArea } from './koreaHubSeeds';
import { resolveKoreaAreaFromCoords } from './resolveKoreaAreaFromCoords';
import FestivalCalendar, {
  buildDayFestivalMap,
  monthRangeYmd,
} from './FestivalCalendar';

const PERIODS = [
  { id: 'thisMonth', label: '이번 달' },
  { id: 'nextMonth', label: '다음 달' },
  { id: 'spring', label: '봄' },
  { id: 'summer', label: '여름' },
  { id: 'autumn', label: '가을' },
  { id: 'winter', label: '겨울' },
];

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function festivalImage(item) {
  return item?.firstimage || item?.imageUrl || item?.firstimage2 || '';
}

function chipClass(active) {
  return `flex items-center gap-1.5 px-4 py-2 rounded-2xl whitespace-nowrap text-xs transition-all border shrink-0 ${
    active
      ? 'bg-white/10 text-white border-white/20 font-bold'
      : 'bg-white/[0.02] text-gray-300 border-white/[0.15] hover:bg-white/[0.08]'
  }`;
}

function monthCursorForPeriod(periodId, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (periodId === 'nextMonth') {
    const n = new Date(y, m + 1, 1);
    return { year: n.getFullYear(), month0: n.getMonth() };
  }
  if (periodId === 'spring') return { year: y, month0: 2 };
  if (periodId === 'summer') return { year: y, month0: 5 };
  if (periodId === 'autumn') return { year: y, month0: 8 };
  if (periodId === 'winter') return { year: y, month0: 11 };
  return { year: y, month0: m };
}

function periodIdForMonth(year, month0, now = new Date()) {
  const thisM = { year: now.getFullYear(), month0: now.getMonth() };
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  if (year === thisM.year && month0 === thisM.month0) return 'thisMonth';
  if (year === next.getFullYear() && month0 === next.getMonth()) return 'nextMonth';
  if (month0 >= 2 && month0 <= 4) return 'spring';
  if (month0 >= 5 && month0 <= 7) return 'summer';
  if (month0 >= 8 && month0 <= 10) return 'autumn';
  return 'winter';
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
  const initialMonth = monthCursorForPeriod('thisMonth', now);

  const [period, setPeriod] = useState('thisMonth');
  const [areaCode, setAreaCode] = useState('all');
  const [areas, setAreas] = useState([]);
  const [calYear, setCalYear] = useState(initialMonth.year);
  const [calMonth0, setCalMonth0] = useState(initialMonth.month0);
  const [viewMode, setViewMode] = useState('list');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedYmd, setSelectedYmd] = useState(null);
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
    const ids = hubIdsForArea(areaCode);
    return ids.map((id) => krHubById.get(String(id).toLowerCase())).filter(Boolean);
  }, [areaCode, krHubById]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchTourApiAreaCodes({ numOfRows: 50 });
      if (cancelled) return;
      const list = Array.isArray(data?.items) ? data.items : [];
      setAreas(
        list
          .filter((a) => a?.code != null && a?.name)
          .map((a) => ({ code: String(a.code), name: String(a.name) })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFestivals = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelected(null);
    const range = monthRangeYmd(calYear, calMonth0);
    /** @type {Parameters<typeof fetchTourApiFestivals>[0]} */
    const opts = {
      eventStartDate: range.eventStartDate,
      eventEndDate: range.eventEndDate,
      numOfRows: 100,
      pageNo: 1,
    };
    if (areaCode !== 'all') opts.areaCode = areaCode;

    const data = await fetchTourApiFestivals(opts);
    if (!data?.ok) {
      setItems([]);
      setError('축제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setLoading(false);
      return;
    }

    const next = (Array.isArray(data.items) ? data.items : []).filter(
      (item) => item?.title && /^\d{8}$/.test(String(item.eventStartDate || '')),
    );
    setItems(next);
    setLoading(false);
  }, [calYear, calMonth0, areaCode]);

  useEffect(() => {
    loadFestivals();
  }, [loadFestivals]);

  useEffect(() => {
    setSelectedYmd(null);
  }, [calYear, calMonth0, areaCode]);

  const listItems = useMemo(
    () => items.filter((item) => festivalImage(item)),
    [items],
  );

  const dayMap = useMemo(
    () => buildDayFestivalMap(items, calYear, calMonth0),
    [items, calYear, calMonth0],
  );

  const dayList = selectedYmd ? dayMap.get(selectedYmd) || [] : [];

  const selectedHubs = useMemo(() => {
    if (!selected?.areaCode) return hubRail.slice(0, 4);
    return hubIdsForArea(selected.areaCode)
      .map((id) => krHubById.get(String(id).toLowerCase()))
      .filter(Boolean)
      .slice(0, 4);
  }, [selected, hubRail, krHubById]);

  const applyPeriod = (periodId) => {
    setPeriod(periodId);
    const cursor = monthCursorForPeriod(periodId);
    setCalYear(cursor.year);
    setCalMonth0(cursor.month0);
  };

  const shiftMonth = (delta) => {
    const d = new Date(calYear, calMonth0 + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth0(d.getMonth());
    setPeriod(periodIdForMonth(d.getFullYear(), d.getMonth()));
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
        const resolved = resolveKoreaAreaFromCoords(lat, lng);
        setNearBusy(false);
        if (!resolved) {
          setNearLabel('');
          setNearMsg('국내 위치를 찾지 못했습니다. 지역 칩으로 선택해 주세요.');
          return;
        }
        setAreaCode(String(resolved.areaCode));
        applyPeriod('thisMonth');
        setNearLabel(resolved.hubName);
        setNearMsg(`${resolved.hubName} 근처 축제를 보여 줍니다.`);
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
    <div className="h-full w-full overflow-y-auto bg-[#1b1410] text-white custom-scrollbar">
      <SEO
        title="국내 축제"
        description="이번 달·시즌별 국내 축제와 인근 여행지를 한곳에서 살펴보세요."
        url="/korea"
      />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#1b1410]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-4 flex items-center gap-3">
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
          <div className="mx-auto max-w-5xl px-4 md:px-6 pb-3">
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

      <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 space-y-8 pb-28">
        <section className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={chipClass(viewMode === 'list')}
          >
            <LayoutGrid size={14} aria-hidden="true" />
            목록
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={chipClass(viewMode === 'calendar')}
          >
            <CalendarDays size={14} aria-hidden="true" />
            달력
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">기간</h2>
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPeriod(p.id)}
                className={chipClass(period === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-gray-400 uppercase">지역</h2>
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                setAreaCode('all');
                setNearLabel('');
                setNearMsg('');
              }}
              className={chipClass(areaCode === 'all')}
            >
              전체
            </button>
            {areas.map((a) => (
              <button
                key={a.code}
                type="button"
                onClick={() => {
                  setAreaCode(a.code);
                  setNearLabel('');
                  setNearMsg('');
                }}
                className={chipClass(areaCode === a.code)}
              >
                {a.name}
              </button>
            ))}
          </div>
        </section>

        {viewMode === 'calendar' && (
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-sm font-bold text-white">축제 달력</h2>
              {!loading && (
                <p className="text-[11px] text-gray-500">{items.length}건</p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                불러오는 중…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center space-y-3">
                <p className="text-sm text-gray-300">{error}</p>
                <button
                  type="button"
                  onClick={loadFestivals}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10"
                >
                  다시 시도
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <FestivalCalendar
                  year={calYear}
                  month0={calMonth0}
                  dayMap={dayMap}
                  selectedYmd={selectedYmd}
                  onSelectDay={setSelectedYmd}
                  onPrevMonth={() => shiftMonth(-1)}
                  onNextMonth={() => shiftMonth(1)}
                />

                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                    {selectedYmd
                      ? `${formatYmdLabel(selectedYmd)} 축제`
                      : '날짜를 선택하세요'}
                  </h3>
                  {selectedYmd && dayList.length === 0 && (
                    <p className="text-sm text-gray-400 py-4">
                      이 날 진행 중인 축제가 없습니다.
                    </p>
                  )}
                  {selectedYmd && dayList.length > 0 && (
                    <div className="space-y-2">
                      {dayList.map((item) => (
                        <FestivalRow
                          key={item.contentId || `${item.title}-${item.eventStartDate}`}
                          item={item}
                          onSelect={setSelected}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {viewMode === 'list' && (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-sm font-bold text-white">
                축제 · {calYear}.{calMonth0 + 1}
              </h2>
              {!loading && (
                <p className="text-[11px] text-gray-500">{listItems.length}건</p>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                불러오는 중…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center space-y-3">
                <p className="text-sm text-gray-300">{error}</p>
                <button
                  type="button"
                  onClick={loadFestivals}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10"
                >
                  다시 시도
                </button>
              </div>
            )}

            {!loading && !error && listItems.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                <p className="text-sm text-gray-300">이 조건에 맞는 축제가 없습니다.</p>
                <p className="mt-1 text-[11px] text-gray-500">기간이나 지역을 바꿔 보세요.</p>
              </div>
            )}

            {!loading && !error && listItems.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {listItems.map((item) => (
                  <FestivalCard
                    key={item.contentId || `${item.title}-${item.eventStartDate}`}
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
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-t-3xl md:rounded-3xl border border-white/10 bg-[#1b1410] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="korea-festival-sheet-title"
          >
            {festivalImage(selected) && (
              <div className="relative h-40 md:h-48 overflow-hidden">
                <img
                  src={festivalImage(selected)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b1410] via-transparent to-transparent" />
              </div>
            )}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-amber-200/90 flex items-center gap-1">
                  <CalendarDays size={12} aria-hidden="true" />
                  {[
                    formatYmdLabel(selected.eventStartDate),
                    formatYmdLabel(selected.eventEndDate),
                  ]
                    .filter(Boolean)
                    .join(' – ')}
                </p>
                <h3
                  id="korea-festival-sheet-title"
                  className="text-xl font-extrabold leading-snug"
                >
                  {selected.title}
                </h3>
                {selected.addr1 && (
                  <p className="text-xs text-gray-400 flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{selected.addr1}</span>
                  </p>
                )}
              </div>

              {selectedHubs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                    인근 여행지
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedHubs.map((hub) => (
                      <button
                        key={hub.hubId}
                        type="button"
                        onClick={() => navigate(`/place/${hub.hubId}`)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border border-white/15 bg-white/[0.06] hover:bg-amber-500/20 hover:border-amber-400/40 transition-colors"
                      >
                        {hub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full py-3 rounded-2xl text-sm font-bold border border-white/15 bg-white/5 hover:bg-white/10"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
