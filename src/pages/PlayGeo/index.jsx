import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Puzzle, RotateCcw } from 'lucide-react';
import { GLOBE_COUNTRY_CATALOG, getGlobeCountryById } from '../Home/lib/globeCountryCatalog.js';
import {
  GEO_PUZZLE_SCORE,
  getCampaignContinents,
  listContinentCountryIds,
} from './data/geoPuzzleTree.js';
import { isCorrectPieceDrop } from './lib/geoPuzzleHitTest.js';
import {
  clearGeoPuzzleProgress,
  defaultProgress,
  loadGeoPuzzleProgress,
  saveGeoPuzzleProgress,
} from './lib/geoPuzzleProgress.js';
import GeoPuzzleGlobe from './GeoPuzzleGlobe.jsx';
import CountrySilhouettePiece from './CountrySilhouettePiece.jsx';

const MOBILE_TAP_MQ = '(max-width: 1023px), (pointer: coarse)';

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function useMobileTapMode() {
  const [isMobileTap, setIsMobileTap] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(MOBILE_TAP_MQ).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_TAP_MQ);
    const sync = () => setIsMobileTap(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobileTap;
}

export default function GeoPuzzlePage() {
  const campaign = useMemo(() => getCampaignContinents(), []);
  const mapRef = useRef(null);
  const dragIdRef = useRef(null);
  const isMobileTap = useMobileTapMode();

  const [continentId, setContinentId] = useState(() => {
    const saved = loadGeoPuzzleProgress();
    return saved.continentId || campaign[0]?.id || '';
  });
  const [score, setScore] = useState(() => loadGeoPuzzleProgress().score || 0);
  const [filledIds, setFilledIds] = useState(() => loadGeoPuzzleProgress().filledIds || []);
  const [clearedSubregionIds, setClearedSubregionIds] = useState(
    () => loadGeoPuzzleProgress().clearedSubregionIds || [],
  );
  const [clearedContinentIds, setClearedContinentIds] = useState(
    () => loadGeoPuzzleProgress().clearedContinentIds || [],
  );
  const [trayOrder, setTrayOrder] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [flashMiss, setFlashMiss] = useState(false);

  const continent = useMemo(
    () => campaign.find((c) => c.id === continentId) || campaign[0],
    [campaign, continentId],
  );

  const continentCountryIds = useMemo(
    () => listContinentCountryIds(continent || { subregions: [] }),
    [continent],
  );

  const remainingIds = useMemo(
    () => continentCountryIds.filter((id) => !filledIds.includes(id)),
    [continentCountryIds, filledIds],
  );

  useEffect(() => {
    setTrayOrder(shuffle(remainingIds));
  }, [continentId]); // eslint-disable-line react-hooks/exhaustive-deps -- reshuffle on continent change only

  useEffect(() => {
    setTrayOrder((prev) => {
      const keep = prev.filter((id) => remainingIds.includes(id));
      const add = remainingIds.filter((id) => !keep.includes(id));
      return add.length ? [...keep, ...shuffle(add)] : keep;
    });
  }, [remainingIds]);

  useEffect(() => {
    saveGeoPuzzleProgress({
      score,
      filledIds,
      continentId: continent?.id || '',
      clearedSubregionIds,
      clearedContinentIds,
    });
  }, [score, filledIds, continent, clearedSubregionIds, clearedContinentIds]);

  useEffect(() => {
    setSelectedId(null);
  }, [continentId]);

  useEffect(() => {
    if (!isMobileTap) setSelectedId(null);
  }, [isMobileTap]);

  const onMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !continent) return;
    const ids = continentCountryIds;
    if (!ids.length) return;
    let lng = 0;
    let lat = 0;
    let n = 0;
    for (const id of ids) {
      const c = GLOBE_COUNTRY_CATALOG[id];
      if (!c) continue;
      lng += c.lng;
      lat += c.lat;
      n += 1;
    }
    if (!n) return;
    map.flyTo({
      center: [lng / n, lat / n],
      zoom: ids.length <= 8 ? 2.6 : 1.8,
      duration: 900,
      essential: true,
    });
  }, [continent, continentCountryIds]);

  const applyCorrect = useCallback((countryId) => {
    const country = getGlobeCountryById(countryId);
    const nextFilled = filledIds.includes(countryId) ? filledIds : [...filledIds, countryId];
    setFilledIds(nextFilled);

    let delta = GEO_PUZZLE_SCORE.country;
    const notes = [`+${GEO_PUZZLE_SCORE.country} ${country?.labelKo || countryId}`];

    const nextClearedSubs = [...clearedSubregionIds];
    for (const sub of continent?.subregions || []) {
      if (nextClearedSubs.includes(sub.id)) continue;
      const done = (sub.countryIds || []).every((id) => nextFilled.includes(id));
      if (done) {
        nextClearedSubs.push(sub.id);
        delta += GEO_PUZZLE_SCORE.subregion;
        notes.push(`중분류 +${GEO_PUZZLE_SCORE.subregion} (${sub.labelKo})`);
      }
    }
    setClearedSubregionIds(nextClearedSubs);

    const nextClearedContinents = [...clearedContinentIds];
    const continentDone = continentCountryIds.every((id) => nextFilled.includes(id));
    if (continentDone && continent && !nextClearedContinents.includes(continent.id)) {
      nextClearedContinents.push(continent.id);
      delta += GEO_PUZZLE_SCORE.continent;
      notes.push(`대륙 +${GEO_PUZZLE_SCORE.continent} (${continent.labelKo})`);
    }
    setClearedContinentIds(nextClearedContinents);

    setScore((s) => s + delta);
    setFeedback(notes.join(' · '));
    setSelectedId(null);
  }, [
    clearedContinentIds,
    clearedSubregionIds,
    continent,
    continentCountryIds,
    filledIds,
  ]);

  const applyMiss = useCallback(() => {
    setScore((s) => s - GEO_PUZZLE_SCORE.miss);
    setFeedback(`−${GEO_PUZZLE_SCORE.miss} 위치 불일치`);
    setFlashMiss(true);
    window.setTimeout(() => setFlashMiss(false), 420);
  }, []);

  const tryPlaceAt = useCallback((clientX, clientY, pieceId) => {
    const map = mapRef.current;
    if (!map || !pieceId) return;
    const container = map.getContainer?.() || map.getCanvas?.();
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setFeedback('지구본 위에 놓아 주세요');
      return;
    }
    let lng = NaN;
    let lat = NaN;
    try {
      const lngLat = map.unproject([x, y]);
      lng = lngLat.lng;
      lat = lngLat.lat;
    } catch {
      /* ignore */
    }
    const ok = isCorrectPieceDrop({
      map,
      point: { x, y },
      lngLat: { lng, lat },
      targetId: pieceId,
      candidateIds: continentCountryIds,
    });

    if (ok) {
      applyCorrect(pieceId);
    } else {
      applyMiss();
    }
  }, [applyCorrect, applyMiss, continentCountryIds]);

  const onMapClickPlace = useCallback((args) => {
    if (!isMobileTap || !selectedId) return;
    tryPlaceAt(args.clientX, args.clientY, selectedId);
  }, [isMobileTap, selectedId, tryPlaceAt]);

  const onSelectPiece = (id) => {
    setSelectedId((prev) => {
      const next = prev === id ? null : id;
      setFeedback(
        next
          ? `${getGlobeCountryById(next)?.labelKo || next} 선택 · 지구본 빈 칸을 탭하세요`
          : '',
      );
      return next;
    });
  };

  const onPointerDownPiece = (e, id) => {
    if (isMobileTap) return;
    e.preventDefault();
    dragIdRef.current = id;
    setDraggingId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
    const target = e.currentTarget;
    target.setPointerCapture?.(e.pointerId);

    const onMove = (ev) => {
      setDragPos({ x: ev.clientX, y: ev.clientY });
    };
    const onUp = (ev) => {
      target.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const pid = dragIdRef.current;
      dragIdRef.current = null;
      setDraggingId(null);
      setDragPos(null);
      if (pid) tryPlaceAt(ev.clientX, ev.clientY, pid);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleReset = () => {
    clearGeoPuzzleProgress();
    const fresh = defaultProgress();
    setScore(fresh.score);
    setFilledIds([]);
    setClearedSubregionIds([]);
    setClearedContinentIds([]);
    setContinentId(campaign[0]?.id || '');
    setSelectedId(null);
    setFeedback('진행을 초기화했습니다');
  };

  const handleSelectContinent = (id) => {
    setContinentId(id);
    setSelectedId(null);
    setFeedback('');
  };

  const filledInContinent = filledIds.filter((id) => continentCountryIds.includes(id)).length;
  const progressPct = continentCountryIds.length
    ? Math.round((filledInContinent / continentCountryIds.length) * 100)
    : 0;

  const hintText = isMobileTap
    ? selectedId
      ? '선택한 피스를 지구본 빈 칸에 탭하세요 · 맞으면 가점 · 틀리면 감점'
      : '나라 모양 피스를 탭해 선택한 뒤, 지구본 빈 칸을 탭하세요'
    : '나라 모양 피스를 빈 칸에 끌어다 놓으세요 · 맞으면 가점 · 틀리면 감점';

  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-black text-white">
      <header className="relative z-30 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/90 px-3 py-2.5 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/90"
            aria-label="홈으로"
          >
            <ArrowLeft size={14} />
            <span className="hidden xs:inline sm:inline">홈</span>
          </Link>
          <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2.5 py-1.5 text-xs font-bold text-cyan-100">
            <Puzzle size={14} className="shrink-0" />
            <span className="truncate">범지구적 퍼즐</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-right leading-tight">
            <div className="text-[9px] uppercase tracking-wider text-white/45">Score</div>
            <div className="text-lg font-bold tabular-nums">{score}</div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2 text-white/80"
            aria-label="초기화"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      <div className={`relative min-h-0 flex-1 transition-opacity ${flashMiss ? 'opacity-80' : 'opacity-100'}`}>
        <GeoPuzzleGlobe
          filledIds={filledIds}
          slotIds={continentCountryIds}
          dragPan={!draggingId}
          placeMode={isMobileTap && Boolean(selectedId)}
          onMapReady={onMapReady}
          onMapClick={onMapClickPlace}
        />

        {feedback ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 max-w-[90%] -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-center text-[11px] text-white backdrop-blur-md break-keep">
            {feedback}
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] text-white/70 backdrop-blur-sm">
          {continent?.labelKo} · {filledInContinent}/{continentCountryIds.length} · {progressPct}%
        </div>
      </div>

      {!isMobileTap && dragPos && draggingId ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          <CountrySilhouettePiece
            countryId={draggingId}
            labelKo={getGlobeCountryById(draggingId)?.labelKo}
            active
            size="drag"
          />
        </div>
      ) : null}

      <aside
        className="relative z-30 flex shrink-0 flex-col gap-2 border-t border-white/15 bg-zinc-950/95 px-3 pt-2.5 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {campaign.map((c) => {
            const count = listContinentCountryIds(c).length;
            const active = c.id === continent?.id;
            const cleared = clearedContinentIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectContinent(c.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium break-keep ${
                  active
                    ? 'border-cyan-400/70 bg-cyan-500/25 text-cyan-50'
                    : 'border-white/20 bg-white/5 text-white/80'
                }`}
              >
                {c.labelKo}
                <span className="ml-1 text-white/45">{count}</span>
                {cleared ? <span className="ml-1 text-amber-300">✓</span> : null}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] leading-snug text-white/50 break-keep">
          {hintText}
        </p>

        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {trayOrder.map((id) => {
            const country = getGlobeCountryById(id);
            const active = isMobileTap ? selectedId === id : draggingId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={isMobileTap ? () => onSelectPiece(id) : undefined}
                onPointerDown={isMobileTap ? undefined : (e) => onPointerDownPiece(e, id)}
                aria-pressed={isMobileTap ? selectedId === id : undefined}
                className={`select-none shrink-0 ${isMobileTap ? '' : 'touch-none'} ${
                  !isMobileTap && active ? 'opacity-40' : ''
                } ${isMobileTap && selectedId && selectedId !== id ? 'opacity-45' : ''}`}
              >
                <CountrySilhouettePiece
                  countryId={id}
                  labelKo={country?.labelKo}
                  active={active}
                  size="tray"
                />
              </button>
            );
          })}
          {!trayOrder.length ? (
            <p className="py-3 text-xs text-emerald-300 break-keep">
              {continent?.labelKo} 완료! 다음 대륙을 선택하세요.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
