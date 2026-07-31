import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  Puzzle,
  RotateCcw,
  Star,
} from 'lucide-react';
import { getGlobeCountryById } from '../Home/lib/globeCountryCatalog.js';
import {
  GLOBE_CATEGORY_IDS,
  GLOBE_FACE_CENTER_BY_CATEGORY,
} from '../Home/lib/globeCategoryFocus.js';
import { GLOBE_FACE_PRIORITY } from '../Home/lib/globeFaceRegions.js';
import {
  PUZZLE_PHASE,
  applyCapitalAnswer,
  applyFindTap,
  buildCapitalChoices,
  computePuzzleStars,
  createIdleSession,
  getPuzzleCapitalSeed,
  isPuzzleCountryPlayable,
  listPuzzleCountryIds,
  loadPuzzleProgress,
  markHintUsed,
  recordPuzzleClear,
  restartFindSession,
  savePuzzleProgress,
  startFindSession,
} from '../Home/lib/globalPuzzle/index.js';
import { isCorrectFindTap } from './lib/findCountryTap.js';
import GeoPuzzleGlobe from './GeoPuzzleGlobe.jsx';

const FACE_LABEL_KO = {
  paradise: '아시아·남태평양',
  nature: '아프리카·서인도양',
  urban: '유럽·북극',
  culture: '북미·카리브',
  adventure: '남아메리카',
};

function StarsRow({ count = 0, max = 3 }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`별 ${count}`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={i < count ? 'fill-amber-300 text-amber-300' : 'text-white/25'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function playableIdsForFace(faceId) {
  const priority = GLOBE_FACE_PRIORITY[faceId] || [];
  const fromPriority = priority.filter((id) => isPuzzleCountryPlayable(id));
  if (fromPriority.length) return fromPriority;
  // 시드가 우선표에 없을 때 폴백 없음 — 면별 시드만
  return [];
}

export default function GeoPuzzlePage() {
  const apiRef = useRef(null);
  const [faceId, setFaceId] = useState(GLOBE_CATEGORY_IDS[0]);
  const [progress, setProgress] = useState(() => loadPuzzleProgress());
  const [session, setSession] = useState(() => createIdleSession());
  const [hintCountryId, setHintCountryId] = useState(null);

  const playableIds = useMemo(() => playableIdsForFace(faceId), [faceId]);
  const allSeedIds = useMemo(() => listPuzzleCountryIds(), []);

  const clearedIds = useMemo(
    () => allSeedIds.filter((id) => progress.countries?.[id]?.cleared),
    [allSeedIds, progress],
  );

  useEffect(() => {
    setSession(createIdleSession());
    setHintCountryId(null);
  }, [faceId]);

  const onMapReady = useCallback((api) => {
    apiRef.current = api;
    if (faceId) api.flyToFace?.(faceId);
  }, [faceId]);

  const beginFind = useCallback((countryId) => {
    if (!isPuzzleCountryPlayable(countryId)) return;
    const prefer = playableIds.filter((id) => id !== countryId);
    const choices = buildCapitalChoices(countryId, prefer, 4);
    setHintCountryId(null);
    setSession(startFindSession(countryId, choices));
    apiRef.current?.flyToFace?.(faceId);
  }, [faceId, playableIds]);

  const handleMapClick = useCallback(({ point, lngLat }) => {
    if (session.phase !== PUZZLE_PHASE.FIND || !session.countryId) return;
    const iso = apiRef.current?.queryIsoAtPoint?.(point) || '';
    const correct = isCorrectFindTap({
      iso,
      lngLat,
      targetId: session.countryId,
      candidateIds: playableIds.length ? playableIds : [session.countryId],
    });
    setSession((prev) => applyFindTap(prev, correct));
  }, [playableIds, session.countryId, session.phase]);

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
      apiRef.current?.flyToFace?.(faceId);
      return restartFindSession(prev, choices);
    });
  }, [faceId, playableIds]);

  const targetLabel = session.countryId
    ? getGlobeCountryById(session.countryId)?.labelKo || session.countryId
    : '';

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <GeoPuzzleGlobe
          clearedIds={clearedIds}
          hintCountryId={hintCountryId}
          faceCategory={faceId}
          findActive={session.phase === PUZZLE_PHASE.FIND}
          onMapReady={onMapReady}
          onMapClick={handleMapClick}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 md:p-4">
        <div className="pointer-events-auto flex max-w-3xl flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/65 px-2.5 py-2 text-[12px] font-bold text-white/90 backdrop-blur-md hover:bg-black/80"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              홈
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/35 bg-black/65 px-2.5 py-2 backdrop-blur-md">
              <Puzzle size={14} className="text-cyan-300" aria-hidden="true" />
              <span className="text-[12px] font-bold tracking-wide">범지구적 퍼즐</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GLOBE_CATEGORY_IDS.map((id) => {
              const active = id === faceId;
              const center = GLOBE_FACE_CENTER_BY_CATEGORY[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFaceId(id)}
                  title={center ? FACE_LABEL_KO[id] : id}
                  className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all ${
                    active
                      ? 'border-cyan-300/60 bg-cyan-500/25 text-cyan-50'
                      : 'border-white/15 bg-black/55 text-white/75 hover:border-white/30'
                  }`}
                >
                  {FACE_LABEL_KO[id] || id}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-2 p-3 md:flex-row md:items-end md:justify-between md:p-4">
        <div className="pointer-events-auto max-h-[40vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-black/70 p-2 backdrop-blur-md md:max-h-[50vh]">
          <p className="px-1 pb-1.5 text-[10px] font-bold text-white/55">나라 선택 · 시드만</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {playableIds.map((id) => {
              const c = getGlobeCountryById(id);
              const best = progress.countries?.[id]?.bestStars || 0;
              const selected = session.countryId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => beginFind(id)}
                  className={`rounded-xl border px-2 py-2 text-left transition-all active:scale-[0.98] ${
                    selected
                      ? 'border-cyan-300/55 bg-cyan-500/20'
                      : 'border-white/12 bg-white/5 hover:border-white/25'
                  }`}
                >
                  <span className="block text-[12px] font-bold break-keep">{c?.labelKo || id}</span>
                  {best > 0 ? (
                    <span className="mt-0.5 block text-[9px] font-bold text-amber-200/90">
                      {'★'.repeat(Math.min(3, best))}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-[9px] text-white/35">도전</span>
                  )}
                </button>
              );
            })}
          </div>
          {!playableIds.length ? (
            <p className="px-1 py-2 text-[11px] text-white/50 break-keep">이 권역 시드가 아직 없습니다.</p>
          ) : null}
        </div>

        <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-cyan-400/35 bg-black/75 px-3 py-2.5 shadow-[0_0_24px_rgba(34,211,238,0.16)] backdrop-blur-md">
          {session.phase === PUZZLE_PHASE.IDLE ? (
            <p className="text-[12px] text-white/80 break-keep">
              권역을 고른 뒤 나라를 선택하세요. 지구본에서 위치를 찾고 수도를 맞춥니다.
            </p>
          ) : null}

          {session.phase === PUZZLE_PHASE.FIND ? (
            <>
              <p className="text-sm font-bold break-keep">{targetLabel} — 지구본에서 찾기</p>
              <p className="mt-1 text-[11px] text-white/65 break-keep">
                권역이 넓게 보이는 상태에서 목표 나라를 탭하세요 (미리 하이라이트하지 않음)
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleHint}
                  disabled={session.hintUsed}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold ${
                    session.hintUsed
                      ? 'border-white/10 text-white/35'
                      : 'border-amber-400/40 bg-amber-500/15 text-amber-100'
                  }`}
                >
                  <Lightbulb size={12} aria-hidden="true" />
                  힌트 (별 −1)
                </button>
              </div>
            </>
          ) : null}

          {session.phase === PUZZLE_PHASE.CAPITAL ? (
            <>
              <p className="text-sm font-bold break-keep">{targetLabel} — 수도 고르기</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(session.capitalChoices || []).map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleCapitalPick(choice)}
                    className="rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-left text-[12px] font-bold break-keep hover:border-cyan-300/50 hover:bg-cyan-500/15"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {session.phase === PUZZLE_PHASE.RESULT ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold break-keep">{targetLabel} 클리어</p>
                <div className="mt-1">
                  <StarsRow count={session.stars || 0} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2 py-1.5 text-[11px] font-bold"
              >
                <RotateCcw size={12} aria-hidden="true" />
                다시 도전
              </button>
            </div>
          ) : null}

          {session.feedback ? (
            <p className="mt-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] text-cyan-50/95 break-keep">
              {session.feedback}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
