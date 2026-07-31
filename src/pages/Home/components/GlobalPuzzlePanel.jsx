import React from 'react';
import { Lightbulb, RotateCcw, Star, X } from 'lucide-react';
import { PUZZLE_PHASE } from '../lib/globalPuzzle/session.js';
import { getPuzzleCapitalSeed } from '../lib/globalPuzzle/capitalsSeed.js';
import { getGlobeCountryById } from '../lib/globeCountryCatalog.js';

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

/**
 * 게임 모드 오버레이 — 홈 레일/카테고리 레이아웃은 건드리지 않음.
 */
export default function GlobalPuzzlePanel({
  active = false,
  session,
  countryLabelKo = '',
  onHint,
  onCapitalPick,
  onRetry,
  onExit,
  onDismissFeedback,
}) {
  if (!active) return null;

  const phase = session?.phase || PUZZLE_PHASE.IDLE;
  const seed = session?.countryId ? getPuzzleCapitalSeed(session.countryId) : null;
  const country = session?.countryId ? getGlobeCountryById(session.countryId) : null;
  const label = countryLabelKo || country?.labelKo || '';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[5.5rem] z-[60] flex justify-center px-3 md:top-[6.5rem]">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-cyan-400/35 bg-black/75 px-3 py-2.5 shadow-[0_0_24px_rgba(34,211,238,0.18)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wide text-cyan-200/90">범지구적 퍼즐</p>
            {phase === PUZZLE_PHASE.IDLE ? (
              <p className="mt-0.5 text-xs text-white/85 break-keep">
                권역을 고른 뒤 나라를 선택하세요
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-bold text-white break-keep">
                {label}
                {phase === PUZZLE_PHASE.FIND ? ' — 지구본에서 찾기' : null}
                {phase === PUZZLE_PHASE.CAPITAL ? ' — 수도 고르기' : null}
                {phase === PUZZLE_PHASE.RESULT ? ' — 클리어' : null}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onExit}
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="퍼즐 모드 종료"
            title="퍼즐 모드 종료"
          >
            <X size={14} />
          </button>
        </div>

        {session?.feedback ? (
          <button
            type="button"
            onClick={onDismissFeedback}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left text-[11px] text-cyan-50/95 break-keep"
          >
            {session.feedback}
          </button>
        ) : null}

        {phase === PUZZLE_PHASE.FIND ? (
          <div className="mt-2 flex items-center gap-2">
            <p className="flex-1 text-[11px] text-white/70 break-keep">
              권역이 넓게 보이는 상태에서 목표 나라를 탭하세요
            </p>
            <button
              type="button"
              onClick={onHint}
              disabled={session?.hintUsed}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all ${
                session?.hintUsed
                  ? 'border-white/10 text-white/35'
                  : 'border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25'
              }`}
            >
              <Lightbulb size={12} aria-hidden="true" />
              힌트
            </button>
          </div>
        ) : null}

        {phase === PUZZLE_PHASE.CAPITAL && seed ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {(session.capitalChoices || []).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => onCapitalPick?.(choice)}
                className="rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-left text-[12px] font-bold text-white break-keep hover:border-cyan-300/50 hover:bg-cyan-500/15 active:scale-[0.98]"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : null}

        {phase === PUZZLE_PHASE.RESULT ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StarsRow count={session?.stars || 0} />
              <span className="text-[11px] text-white/75 break-keep">다시 도전할 수 있어요</span>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-2 py-1.5 text-[11px] font-bold text-cyan-50 hover:bg-cyan-500/25"
            >
              <RotateCcw size={12} aria-hidden="true" />
              다시 도전
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
