import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import mooniChar from '../../../assets/MOONI_transparent.png';
import mooniText from '../../../assets/MONNI_text.png';
import { PERSONA_TYPES } from '../lib/prompts';

const INTRO_GREETING = '안녕! MOONi예요.';
const HOVER_HINTS = [
  'MOONi와 이야기해 봐요',
  '어서 오세요',
  '떠나고 싶은 곳이 어디인가요?',
  '여행 이야기 들려주세요',
  '궁금한 게 있으면 눌러보세요',
];
const NUDGE_WHISPERS = [
  '안녕하세요, MOONi입니다.',
  'Z Z Z…',
  '떠나고 싶어요…',
  '오늘은 어디로 갈까요?',
  '구름 위를 걸어볼까…',
  '바람 냄새가 여행 같아요.',
  '지도만 봐도 마음이 가요.',
  '멀리 있는 섬이 보여요.',
  '다음 휴가는 언제죠…',
  '여기저기 구경 중…',
  '궁금한 게 있으면 불러주세요.',
  '별빛 여행, 떠올려 볼까요?',
];
const POSITION_KEY = 'gateo_mooni_fab_pos';
const HINT_NUDGE_MS = 45_000;
const NUDGE_AUTO_DISMISS_MS = 4_500;
const DRAG_THRESHOLD = 6;
const FAB_ESTIMATE = { width: 96, height: 120 };
const EDGE_PADDING = 8;

const DEFAULT_POS = { right: 12, bottom: 16 };

function loadPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.right === 'number' && typeof parsed?.bottom === 'number') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function savePosition(pos) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

function clampPosition(pos) {
  const maxRight = Math.max(EDGE_PADDING, window.innerWidth - FAB_ESTIMATE.width - EDGE_PADDING);
  const maxBottom = Math.max(EDGE_PADDING, window.innerHeight - FAB_ESTIMATE.height - EDGE_PADDING);
  return {
    right: Math.min(Math.max(pos.right, EDGE_PADDING), maxRight),
    bottom: Math.min(Math.max(pos.bottom, EDGE_PADDING), maxBottom),
  };
}

function pickRandomFromPool(pool, lastIndex) {
  if (pool.length <= 1) return { text: pool[0], index: 0 };
  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (index === lastIndex);
  return { text: pool[index], index };
}

function pickRandomNudge(lastIndex) {
  return pickRandomFromPool(NUDGE_WHISPERS, lastIndex);
}

export default function MooniAgentFab({ onOpenChat, isChatOpen, isZenMode }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const hintTimerRef = useRef(null);
  const nudgeDismissTimerRef = useRef(null);
  const lastNudgeIndexRef = useRef(-1);
  const lastHoverIndexRef = useRef(-1);

  const [pos, setPos] = useState(() => clampPosition(loadPosition() ?? DEFAULT_POS));
  const [hintPhase, setHintPhase] = useState('intro');
  const [showHint, setShowHint] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [hoverHintText, setHoverHintText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const clearNudgeDismissTimer = useCallback(() => {
    if (nudgeDismissTimerRef.current) {
      clearTimeout(nudgeDismissTimerRef.current);
      nudgeDismissTimerRef.current = null;
    }
  }, []);

  const scheduleNextNudge = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      const { text, index } = pickRandomNudge(lastNudgeIndexRef.current);
      lastNudgeIndexRef.current = index;
      setNudgeMessage(text);
      setHintPhase('nudge');
      setShowHint(true);

      clearNudgeDismissTimer();
      nudgeDismissTimerRef.current = setTimeout(() => {
        setShowHint(false);
        setHintPhase(null);
        scheduleNextNudge();
      }, NUDGE_AUTO_DISMISS_MS);
    }, HINT_NUDGE_MS);
  }, [clearNudgeDismissTimer]);

  useEffect(() => {
    if (isChatOpen) {
      setShowHint(false);
      clearNudgeDismissTimer();
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    }
  }, [isChatOpen, clearNudgeDismissTimer]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPosition(prev));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    clearNudgeDismissTimer();
  }, [clearNudgeDismissTimer]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    setHintPhase(null);
    clearNudgeDismissTimer();
    scheduleNextNudge();
  }, [clearNudgeDismissTimer, scheduleNextNudge]);

  const openChat = useCallback(() => {
    setShowHint(false);
    setHintPhase(null);
    clearNudgeDismissTimer();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    onOpenChat?.({ persona: PERSONA_TYPES.GENERAL });
  }, [clearNudgeDismissTimer, onOpenChat]);

  const onFabPointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRight: pos.right,
      startBottom: pos.bottom,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onFabPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.moved = true;
      setIsDragging(true);
      setHoverHintText('');
    }

    if (!drag.moved) return;

    const next = clampPosition({
      right: drag.startRight - dx,
      bottom: drag.startBottom - dy,
    });
    setPos(next);
  };

  const onFabPointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (drag.moved) {
      setPos((current) => {
        const clamped = clampPosition(current);
        savePosition(clamped);
        return clamped;
      });
    } else {
      openChat();
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const onFabPointerCancel = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  if (isZenMode || isChatOpen) return null;

  const isIntro = showHint && hintPhase === 'intro';
  const isNudge = showHint && hintPhase === 'nudge';
  const isHoverOnly = Boolean(hoverHintText) && !showHint;
  const hintVisible = isIntro || isNudge || isHoverOnly;
  const hintText = isIntro
    ? INTRO_GREETING
    : isNudge
      ? nudgeMessage
      : hoverHintText;
  const showCloseButton = isIntro || isNudge;

  return (
    <div
      ref={rootRef}
      style={{ right: pos.right, bottom: pos.bottom }}
      className="fixed z-[58] pointer-events-auto flex flex-col items-end gap-2 touch-none select-none"
      aria-label="MOONi AI 여행 도우미"
    >
      {hintVisible && (
        <div className="relative max-w-[220px] animate-fade-in-up pointer-events-auto">
          <div className="rounded-2xl border border-cyan-400/30 bg-black/70 backdrop-blur-xl px-4 py-3 text-sm text-gray-100 shadow-[0_8px_32px_rgba(34,211,238,0.15)]">
            <p className={`leading-snug ${showCloseButton ? 'pr-5' : ''}`}>{hintText}</p>
            {showCloseButton && (
              <button
                type="button"
                onClick={dismissHint}
                className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
                aria-label="말풍선 닫기"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div
            className="absolute -bottom-2 right-8 h-3 w-3 rotate-45 border-r border-b border-cyan-400/30 bg-black/70"
            aria-hidden="true"
          />
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerCancel}
        onMouseEnter={() => {
          if (isDragging || showHint) return;
          const { text, index } = pickRandomFromPool(HOVER_HINTS, lastHoverIndexRef.current);
          lastHoverIndexRef.current = index;
          setHoverHintText(text);
        }}
        onMouseLeave={() => setHoverHintText('')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openChat();
          }
        }}
        className={`group relative flex flex-col items-center gap-1 rounded-2xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
          isDragging ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab hover:scale-105'
        } transition-transform duration-200`}
        aria-label="MOONi와 대화하기. 드래그하면 위치를 옮길 수 있어요."
      >
        <span className={`pointer-events-none ${isDragging ? '' : 'mooni-float'}`}>
          <img
            src={mooniChar}
            alt="MOONi 캐릭터"
            className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] object-contain drop-shadow-[0_8px_24px_rgba(34,211,238,0.35)]"
            draggable={false}
          />
        </span>
        <img
          src={mooniText}
          alt="MOONi"
          className="h-5 sm:h-6 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
