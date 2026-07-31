import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lightbulb, Puzzle, RotateCcw, Star } from 'lucide-react';
import { GLOBE_COUNTRY_CATALOG, getGlobeCountryById } from '../Home/lib/globeCountryCatalog.js';
import {
  getCampaignContinents,
  listContinentCountryIds,
} from './data/geoPuzzleTree.js';
import {
  PUZZLE_PHASE,
  applyCapitalAnswer,
  applyFindTap,
  buildCapitalChoices,
  clearPuzzleProgress,
  computePuzzleStars,
  createIdleSession,
  getPuzzleCapitalSeed,
  isPuzzleCountryPlayable,
  loadPuzzleProgress,
  markHintUsed,
  recordPuzzleClear,
  restartFindSession,
  savePuzzleProgress,
  startFindSession,
} from './lib/globalPuzzle/index.js';
import { isCorrectFindTap } from './lib/findCountryTap.js';
import GeoPuzzleGlobe from './GeoPuzzleGlobe.jsx';
import CountrySilhouettePiece from './CountrySilhouettePiece.jsx';

function StarsRow({ count = 0, max = 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`별 ${count}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < count ? 'fill-amber-300 text-amber-300' : 'text-white/25'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function flyMapToContinent(map, continentCountryIds) {
  if (!map || !continentCountryIds?.length) return;
  let lng = 0;
  let lat = 0;
  let n = 0;
  for (const id of continentCountryIds) {
    const c = GLOBE_COUNTRY_CATALOG[id];
    if (!c) continue;
    lng += c.lng;
    lat += c.lat;
    n += 1;
  }
  if (!n) return;
  try {
    map.flyTo({
      center: [lng / n, lat / n],
      zoom: continentCountryIds.length <= 8 ? 2.6 : 1.8,
      duration: 900,
      essential: true,
    });
  } catch {
    /* ignore */
  }
}

export default function GeoPuzzlePage() {
  const campaign = useMemo(() => getCampaignContinents(), []);
  const apiRef = useRef(null);

  const [continentId, setContinentId] = useState(() => campaign[0]?.id || '');
  const [progress, setProgress] = useState(() => loadPuzzleProgress());
  const [session, setSession] = useState(() => createIdleSession());
  const [hintCountryId, setHintCountryId] = useState(null);
  const [flashMiss, setFlashMiss] = useState(false);

  const continent = useMemo(
    () => campaign.find((c) => c.id === continentId) || campaign[0],
    [campaign, continentId],
  );

  const continentCountryIds = useMemo(
    () => listContinentCountryIds(continent || { subregions: [] }),
    [continent],
  );

  const playableIds = useMemo(
    () => continentCountryIds.filter((id) => isPuzzleCountryPlayable(id)),
    [continentCountryIds],
  );

  const clearedIds = useMemo(
    () => Object.keys(progress.countries || {}).filter((id) => progress.countries[id]?.cleared),
    [progress],
  );

  const clearedInContinent = useMemo(
    () => playableIds.filter((id) => progress.countries?.[id]?.cleared).length,
    [playableIds, progress],
  );

  const totalBestStars = useMemo(
    () => Object.values(progress.countries || {}).reduce(
      (sum, row) => sum + (Number(row?.bestStars) || 0),
      0,
    ),
    [progress],
  );

  useEffect(() => {
    setSession(createIdleSession());
    setHintCountryId(null);
  }, [continentId]);

  useEffect(() => {
    const map = apiRef.current?.map;
    if (!map || !continent) return;
    if (session.phase === PUZZLE_PHASE.FIND && hintCountryId) return;
    flyMapToContinent(map, continentCountryIds);
  }, [continent, continentCountryIds, hintCountryId, session.phase]);

  const onMapReady = useCallback((api) => {
    apiRef.current = api;
    flyMapToContinent(api.map, continentCountryIds);
  }, [continentCountryIds]);

  const beginFind = useCallback((countryId) => {
    if (!isPuzzleCountryPlayable(countryId)) return;
    const prefer = playableIds.filter((id) => id !== countryId);
    const choices = buildCapitalChoices(countryId, prefer, 4);
    setHintCountryId(null);
    setSession(startFindSession(countryId, choices));
    flyMapToContinent(apiRef.current?.map, continentCountryIds);
  }, [continentCountryIds, playableIds]);

  const handleMapClick = useCallback(({ point, lngLat }) => {
    if (session.phase !== PUZZLE_PHASE.FIND || !session.countryId) return;
    const iso = apiRef.current?.queryIsoAtPoint?.(point) || '';
    const correct = isCorrectFindTap({
      iso,
      lngLat,
      targetId: session.countryId,
      candidateIds: continentCountryIds.length ? continentCountryIds : [session.countryId],
    });
    if (!correct) {
      setFlashMiss(true);
      window.setTimeout(() => setFlashMiss(false), 420);
    }
    setSession((prev) => applyFindTap(prev, correct));
  }, [continentCountryIds, session.countryId, session.phase]);

  const handleHint = useCallback(() => {
    setSession((prev) => {
      if (prev.phase !== PUZZLE_PHASE.FIND || !prev.countryId) return prev;
      if (prev.hintUsed) return { ...prev, feedback: '힌트는 이미 사용했습니다' };
      setHintCountryId(prev.countryId);
      apiRef.current?.flyToCountry?.(prev.countryId);
      return markHintUsed(prev);
    });
  }, []);

  const handleCapitalPick = useCallback((choice) => {
    setSession((prev) => {
      if (prev.phase !== PUZZLE_PHASE.CAPITAL || !prev.countryId) return prev;
      const seed = getPuzzleCapitalSeed(prev.countryId);
      const correct = Boolean(seed && choice === seed.capitalKo);
      const next = applyCapitalAnswer(prev, correct, computePuzzleStars);
      if (next.phase === PUZZLE_PHASE.RESULT && Number.isFinite(next.stars)) {
        setProgress((prog) => {
          const updated = recordPuzzleClear(prog, prev.countryId, {
            stars: next.stars,
            hintUsed: next.hintUsed,
          });
          savePuzzleProgress(updated);
          return updated;
        });
        setHintCountryId(prev.countryId);
      }
      return next;
    });
  }, []);

  const handleRetry = useCallback(() => {
    setSession((prev) => {
      if (!prev.countryId) return createIdleSession();
      const prefer = playableIds.filter((id) => id !== prev.countryId);
      const choices = buildCapitalChoices(prev.countryId, prefer, 4);
      setHintCountryId(null);
      flyMapToContinent(apiRef.current?.map, continentCountryIds);
      return restartFindSession(prev, choices);
    });
  }, [continentCountryIds, playableIds]);

  const handleReset = () => {
    clearPuzzleProgress();
    setProgress(loadPuzzleProgress());
    setSession(createIdleSession());
    setHintCountryId(null);
    setContinentId(campaign[0]?.id || '');
  };

  const handleSelectContinent = (id) => {
    setContinentId(id);
  };

  const targetLabel = session.countryId
    ? getGlobeCountryById(session.countryId)?.labelKo || session.countryId
    : '';

  const progressPct = playableIds.length
    ? Math.round((clearedInContinent / playableIds.length) * 100)
    : 0;

  let hintText = '대륙을 고른 뒤 나라 피스를 탭하세요 · 지구본에서 찾기 → 수도 4지선다';
  if (session.phase === PUZZLE_PHASE.FIND) {
    hintText = `${targetLabel} — 지구본 빈 칸에서 위치를 탭하세요 · 힌트는 별 −1`;
  } else if (session.phase === PUZZLE_PHASE.CAPITAL) {
    hintText = `${targetLabel} — 수도를 고르세요`;
  } else if (session.phase === PUZZLE_PHASE.RESULT) {
    hintText = `${targetLabel} 클리어 · 다시 도전하거나 다른 나라를 선택하세요`;
  }

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
            <div className="text-[9px] uppercase tracking-wider text-white/45">Stars</div>
            <div className="text-lg font-bold tabular-nums">{totalBestStars}</div>
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
          filledIds={clearedIds}
          slotIds={continentCountryIds}
          hintCountryId={hintCountryId}
          findActive={session.phase === PUZZLE_PHASE.FIND}
          onMapReady={onMapReady}
          onMapClick={handleMapClick}
        />

        {session.feedback ? (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 max-w-[90%] -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 text-center text-[11px] text-white backdrop-blur-md break-keep">
            {session.feedback}
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[10px] text-white/70 backdrop-blur-sm">
          {continent?.labelKo} · {clearedInContinent}/{playableIds.length} · {progressPct}%
        </div>
      </div>

      <aside
        className="relative z-30 flex shrink-0 flex-col gap-2 border-t border-white/15 bg-zinc-950/95 px-3 pt-2.5 backdrop-blur-md"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {campaign.map((c) => {
            const ids = listContinentCountryIds(c).filter((id) => isPuzzleCountryPlayable(id));
            const active = c.id === continent?.id;
            const cleared = ids.length > 0 && ids.every((id) => progress.countries?.[id]?.cleared);
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
                <span className="ml-1 text-white/45">{ids.length}</span>
                {cleared ? <span className="ml-1 text-amber-300">✓</span> : null}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] leading-snug text-white/50 break-keep">
          {hintText}
        </p>

        {session.phase === PUZZLE_PHASE.FIND ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleHint}
              disabled={session.hintUsed}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                session.hintUsed
                  ? 'border-white/10 text-white/35'
                  : 'border-amber-400/40 bg-amber-500/15 text-amber-100'
              }`}
            >
              <Lightbulb size={12} aria-hidden="true" />
              힌트 (별 −1)
            </button>
          </div>
        ) : null}

        {session.phase === PUZZLE_PHASE.CAPITAL ? (
          <div className="grid grid-cols-2 gap-1.5 pb-1">
            {(session.capitalChoices || []).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => handleCapitalPick(choice)}
                className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-left text-[12px] font-bold break-keep hover:border-cyan-300/50 hover:bg-cyan-500/15"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : null}

        {session.phase === PUZZLE_PHASE.RESULT ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2">
            <div>
              <p className="text-[12px] font-bold break-keep">{targetLabel} 클리어</p>
              <div className="mt-0.5">
                <StarsRow count={session.stars || 0} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-[11px] font-medium"
            >
              <RotateCcw size={12} aria-hidden="true" />
              다시 도전
            </button>
          </div>
        ) : null}

        {session.phase === PUZZLE_PHASE.IDLE || session.phase === PUZZLE_PHASE.FIND || session.phase === PUZZLE_PHASE.RESULT ? (
          <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {playableIds.map((id) => {
              const country = getGlobeCountryById(id);
              const best = progress.countries?.[id]?.bestStars || 0;
              const active = session.countryId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => beginFind(id)}
                  aria-pressed={active}
                  className={`select-none shrink-0 ${active ? '' : ''} ${
                    session.countryId && session.countryId !== id ? 'opacity-45' : ''
                  }`}
                >
                  <CountrySilhouettePiece
                    countryId={id}
                    labelKo={country?.labelKo}
                    active={active}
                    size="tray"
                  />
                  {best > 0 ? (
                    <span className="mt-0.5 block text-center text-[9px] text-amber-200/90">
                      {'★'.repeat(Math.min(3, best))}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {!playableIds.length ? (
              <p className="py-3 text-xs text-white/50 break-keep">
                이 대륙 시드가 아직 없습니다.
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
