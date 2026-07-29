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

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GeoPuzzlePage() {
  const campaign = useMemo(() => getCampaignContinents(), []);
  const mapRef = useRef(null);
  const dragIdRef = useRef(null);

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

  const tryDropAt = useCallback((clientX, clientY, pieceId) => {
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

  const onPointerDownPiece = (e, id) => {
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
      if (pid) tryDropAt(ev.clientX, ev.clientY, pid);
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
    setFeedback('진행을 초기화했습니다');
  };

  const handleSelectContinent = (id) => {
    setContinentId(id);
    setFeedback('');
  };

  const progressPct = continentCountryIds.length
    ? Math.round((filledIds.filter((id) => continentCountryIds.includes(id)).length / continentCountryIds.length) * 100)
    : 0;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white">
      <div className={`absolute inset-0 transition-opacity ${flashMiss ? 'opacity-80' : 'opacity-100'}`}>
        <GeoPuzzleGlobe
          filledIds={filledIds}
          previewIso={draggingId ? GLOBE_COUNTRY_CATALOG[draggingId]?.iso : null}
          dragPan={!draggingId}
          onMapReady={onMapReady}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className="pointer-events-auto flex max-w-[min(100%,28rem)] flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs text-white/90 backdrop-blur-md hover:bg-black/70"
            >
              <ArrowLeft size={14} />
              홈
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-100 backdrop-blur-md">
              <Puzzle size={14} />
              범지구적 퍼즐
            </div>
          </div>
          <p className="break-keep rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[11px] leading-relaxed text-white/80 backdrop-blur-md md:text-xs">
            지명·국경 없는 지구본에 나라 피스를 끌어다 놓으세요. 맞으면 가점, 틀리면 감점(종료 없음).
            공식 대륙명 · 국가 수가 적은 대륙부터.
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="rounded-xl border border-white/15 bg-black/60 px-4 py-2 text-right backdrop-blur-md">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Score</div>
            <div className="text-2xl font-bold tabular-nums text-white">{score}</div>
            <div className="text-[10px] text-white/55">{progressPct}% · {continent?.labelKo}</div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[11px] text-white/80 hover:bg-black/70"
          >
            <RotateCcw size={12} />
            초기화
          </button>
        </div>
      </header>

      {dragPos && draggingId ? (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-cyan-300 bg-cyan-500/40 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm"
          style={{ left: dragPos.x, top: dragPos.y }}
        >
          {getGlobeCountryById(draggingId)?.labelKo || draggingId}
        </div>
      ) : null}

      {feedback ? (
        <div className="pointer-events-none absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-xs text-white backdrop-blur-md break-keep">
          {feedback}
        </div>
      ) : null}

      <aside className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/75 p-3 backdrop-blur-md md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-2xl md:border">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {campaign.map((c) => {
            const count = listContinentCountryIds(c).length;
            const active = c.id === continent?.id;
            const cleared = clearedContinentIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectContinent(c.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] break-keep ${
                  active
                    ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-50'
                    : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                {c.labelKo}
                <span className="ml-1 text-white/45">{count}</span>
                {cleared ? <span className="ml-1 text-amber-300">✓</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mb-2 text-[11px] text-white/55 break-keep">
          {continent?.labelKo} · 남은 피스 {remainingIds.length} · 드래그해서 지구본에 놓기
        </div>

        <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 md:max-h-56">
          {trayOrder.map((id) => {
            const country = getGlobeCountryById(id);
            const active = draggingId === id;
            return (
              <button
                key={id}
                type="button"
                onPointerDown={(e) => onPointerDownPiece(e, id)}
                className={`touch-none select-none rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold break-keep ${
                  active
                    ? 'border-cyan-300 bg-cyan-400/30 text-white scale-105'
                    : 'border-white/20 bg-white/10 text-white hover:border-cyan-400/50 hover:bg-white/15'
                }`}
              >
                {country?.labelKo || id}
              </button>
            );
          })}
          {!trayOrder.length ? (
            <p className="text-xs text-emerald-300 break-keep">
              {continent?.labelKo} 완료! 다음 대륙을 선택하세요.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
