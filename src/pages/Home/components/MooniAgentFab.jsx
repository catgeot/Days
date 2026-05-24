import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import mooniChar from '../../../assets/MOONI_transparent.png';
import mooniText from '../../../assets/MONNI_text.png';
import { PERSONA_TYPES } from '../lib/prompts';
import {
  getMooniNudgeIntervalMs,
  hasMooniIntroSeen,
  markMooniIntroSeen,
  pickDismissReactLine,
  pickDragReactLine,
  pickIdleLine,
  pickIntroLine,
  pickPeekLine,
} from '../lib/mooniLines';

const NUDGE_AUTO_DISMISS_MS = 4_500;
const DRAG_REACT_DISMISS_MS = 2_800;
const PRESS_PEEK_MS = 180;
const DRAG_THRESHOLD = 6;
const FAB_ESTIMATE = { width: 96, height: 120 };
const EDGE_PADDING = 8;
const POSITION_KEY = 'gateo_mooni_fab_pos';
const DEFAULT_POS = { right: 12, bottom: 16 };
const DISMISS_REACT_CHANCE = 0.35;

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

function canUseHoverPeek() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function MooniAgentFab({ onOpenChat, isChatOpen, isZenMode }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const hintTimerRef = useRef(null);
  const nudgeDismissTimerRef = useRef(null);
  const pressPeekTimerRef = useRef(null);
  const dragReactTimerRef = useRef(null);
  const lastIdleCategoryRef = useRef(null);
  const lastPeekCategoryRef = useRef(null);
  const lastIntroIndexRef = useRef(-1);
  const lastDragReactIndexRef = useRef(-1);
  const lastDismissReactIndexRef = useRef(-1);
  const introSeenOnMount = useRef(hasMooniIntroSeen());
  const showHintRef = useRef(false);
  const reactTextRef = useRef('');

  const [pos, setPos] = useState(() => clampPosition(loadPosition() ?? DEFAULT_POS));
  const [hintPhase, setHintPhase] = useState(() => (introSeenOnMount.current ? null : 'intro'));
  const [showHint, setShowHint] = useState(() => !introSeenOnMount.current);
  const [introText, setIntroText] = useState('');
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [peekText, setPeekText] = useState('');
  const [reactText, setReactText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPressPeek, setIsPressPeek] = useState(false);

  useEffect(() => {
    showHintRef.current = showHint;
  }, [showHint]);

  useEffect(() => {
    reactTextRef.current = reactText;
  }, [reactText]);

  useEffect(() => {
    if (introSeenOnMount.current) return;
    const { text, index } = pickIntroLine(lastIntroIndexRef.current);
    lastIntroIndexRef.current = index;
    setIntroText(text);
  }, []);

  const clearNudgeDismissTimer = useCallback(() => {
    if (nudgeDismissTimerRef.current) {
      clearTimeout(nudgeDismissTimerRef.current);
      nudgeDismissTimerRef.current = null;
    }
  }, []);

  const clearPressPeekTimer = useCallback(() => {
    if (pressPeekTimerRef.current) {
      clearTimeout(pressPeekTimerRef.current);
      pressPeekTimerRef.current = null;
    }
  }, []);

  const clearDragReactTimer = useCallback(() => {
    if (dragReactTimerRef.current) {
      clearTimeout(dragReactTimerRef.current);
      dragReactTimerRef.current = null;
    }
  }, []);

  const clearPeek = useCallback(() => {
    setPeekText('');
    setIsPressPeek(false);
  }, []);

  const showDragReact = useCallback((text) => {
    clearDragReactTimer();
    setReactText(text);
    dragReactTimerRef.current = setTimeout(() => {
      setReactText('');
      dragReactTimerRef.current = null;
    }, DRAG_REACT_DISMISS_MS);
  }, [clearDragReactTimer]);

  const wasChatOpenRef = useRef(isChatOpen);

  const scheduleNextNudge = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      const { text, category } = pickIdleLine(lastIdleCategoryRef.current);
      lastIdleCategoryRef.current = category;
      setNudgeMessage(text);
      setHintPhase('nudge');
      setShowHint(true);

      clearNudgeDismissTimer();
      nudgeDismissTimerRef.current = setTimeout(() => {
        setShowHint(false);
        setHintPhase(null);
        scheduleNextNudge();
      }, NUDGE_AUTO_DISMISS_MS);
    }, getMooniNudgeIntervalMs());
  }, [clearNudgeDismissTimer]);

  useEffect(() => {
    if (isChatOpen) {
      setShowHint(false);
      setHintPhase(null);
      clearPeek();
      setReactText('');
      clearNudgeDismissTimer();
      clearPressPeekTimer();
      clearDragReactTimer();
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    }
  }, [isChatOpen, clearNudgeDismissTimer, clearPeek, clearPressPeekTimer, clearDragReactTimer]);

  useEffect(() => {
    if (isChatOpen || !introSeenOnMount.current) return;
    scheduleNextNudge();
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount: intro 스킵 세션만 idle 시작
  }, []);

  useEffect(() => {
    if (wasChatOpenRef.current && !isChatOpen && !(showHint && hintPhase === 'intro')) {
      scheduleNextNudge();
    }
    wasChatOpenRef.current = isChatOpen;
  }, [isChatOpen, showHint, hintPhase, scheduleNextNudge]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPosition(prev));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    clearNudgeDismissTimer();
    clearPressPeekTimer();
    clearDragReactTimer();
  }, [clearNudgeDismissTimer, clearPressPeekTimer, clearDragReactTimer]);

  const dismissHint = useCallback(() => {
    if (hintPhase === 'intro') {
      markMooniIntroSeen();
    }
    setShowHint(false);
    setHintPhase(null);

    if (Math.random() < DISMISS_REACT_CHANCE) {
      const { text, index } = pickDismissReactLine(lastDismissReactIndexRef.current);
      lastDismissReactIndexRef.current = index;
      showDragReact(text);
    }

    clearNudgeDismissTimer();
    scheduleNextNudge();
  }, [hintPhase, clearNudgeDismissTimer, scheduleNextNudge, showDragReact]);

  const openChat = useCallback(() => {
    markMooniIntroSeen();
    setShowHint(false);
    setHintPhase(null);
    clearPeek();
    setReactText('');
    clearNudgeDismissTimer();
    clearPressPeekTimer();
    clearDragReactTimer();
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    onOpenChat?.({ persona: PERSONA_TYPES.GENERAL });
  }, [clearNudgeDismissTimer, clearPeek, clearPressPeekTimer, clearDragReactTimer, onOpenChat]);

  const showPeek = useCallback(() => {
    if (showHint || isDragging || reactText) return;
    const { text, category } = pickPeekLine(lastPeekCategoryRef.current);
    lastPeekCategoryRef.current = category;
    setPeekText(text);
  }, [showHint, isDragging, reactText]);

  const onFabPointerDown = (event) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRight: pos.right,
      startBottom: pos.bottom,
      moved: false,
      pressPeekActivated: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);

    clearPressPeekTimer();
    pressPeekTimerRef.current = setTimeout(() => {
      const drag = dragRef.current;
      if (!drag || drag.moved || showHintRef.current || reactTextRef.current) return;
      drag.pressPeekActivated = true;
      setIsPressPeek(true);
      const { text, category } = pickPeekLine(lastPeekCategoryRef.current);
      lastPeekCategoryRef.current = category;
      setPeekText(text);
    }, PRESS_PEEK_MS);
  };

  const onFabPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      drag.moved = true;
      clearPressPeekTimer();
      clearPeek();
      setIsDragging(true);

      const { text, index } = pickDragReactLine(lastDragReactIndexRef.current);
      lastDragReactIndexRef.current = index;
      showDragReact(text);
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
    clearPressPeekTimer();

    if (drag.moved) {
      setPos((current) => {
        const clamped = clampPosition(current);
        savePosition(clamped);
        return clamped;
      });
    } else if (drag.pressPeekActivated || isPressPeek) {
      clearPeek();
    } else {
      openChat();
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const onFabPointerCancel = () => {
    dragRef.current = null;
    clearPressPeekTimer();
    clearPeek();
    setIsDragging(false);
  };

  if (isZenMode || isChatOpen) return null;

  const isIntro = showHint && hintPhase === 'intro';
  const isNudge = showHint && hintPhase === 'nudge';
  const isPeekOnly = Boolean(peekText) && !showHint && !reactText;
  const isReactOnly = Boolean(reactText) && !showHint;
  const hintVisible = isIntro || isNudge || isPeekOnly || isReactOnly;
  const hintText = isIntro
    ? introText
    : isNudge
      ? nudgeMessage
      : isReactOnly
        ? reactText
        : peekText;
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
          if (!canUseHoverPeek() || isDragging || showHint || reactText) return;
          showPeek();
        }}
        onMouseLeave={() => {
          if (isPressPeek) return;
          clearPeek();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openChat();
          }
        }}
        className={`group relative flex flex-col items-center gap-1 rounded-2xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
          isDragging ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab hover:scale-105'
        } transition-transform duration-200`}
        aria-label="MOONi와 대화하기. 드래그하면 위치를 옮길 수 있어요. 모바일에서는 누르고 있으면 말풍선이 나와요."
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
