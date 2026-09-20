import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

/** 인트로·넛지 말풍선 — X 없이 자동 닫힘 (기존 넛지 4.5s → 4s) */
const HINT_AUTO_DISMISS_MS = 4_000;
const DRAG_REACT_DISMISS_MS = 2_800;
const PRESS_PEEK_MS = 180;
const DRAG_THRESHOLD = 6;
const FAB_ESTIMATE = { width: 96, height: 120 };
/** 모바일 실측 근사 (72px 캐릭터 + 패딩) — 과대 추정 시 좌측 여백이 남음 */
const FAB_ESTIMATE_MOBILE = { width: 80, height: 104 };
/** 말풍선 max-w와 맞춤 — 좌측 여유 부족 시 우측으로 반전 */
const HINT_MAX_WIDTH = 220;
/** 좌·우·상단 여백 */
const EDGE_PADDING = 8;
/**
 * 모바일 가장자리 오버플로 — 좌·하단만 적용.
 * 우측은 캐릭터 실루엣이 바로 잘려 과하게 나가 보이므로 패딩만 유지.
 */
const EDGE_OVERFLOW_MOBILE = 28;
const POSITION_KEY = 'gateo_mooni_fab_pos';
/** 홈 FAB 기본 — 모바일 우측 하단 (카테고리 바는 좌하단) */
const DEFAULT_POS = { right: 16, bottom: 32 };
const DISMISS_REACT_CHANCE = 0.35;

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

function fabSize() {
  return isMobileViewport() ? FAB_ESTIMATE_MOBILE : FAB_ESTIMATE;
}

/** FAB 왼쪽 공간이 말풍선보다 좁으면 말풍선을 FAB 오른쪽에 둠 */
function shouldPlaceHintOnRight(right) {
  if (typeof window === 'undefined') return false;
  const fabLeft = window.innerWidth - right - fabSize().width;
  return fabLeft < HINT_MAX_WIDTH + EDGE_PADDING;
}

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
  const mobile = isMobileViewport();
  const { width, height } = fabSize();
  const edgeOverflow = mobile ? EDGE_OVERFLOW_MOBILE : 0;
  const minBottom = mobile ? -edgeOverflow : EDGE_PADDING;
  const minRight = mobile ? 0 : EDGE_PADDING;
  const maxRight = Math.max(minRight, window.innerWidth - width - EDGE_PADDING + edgeOverflow);
  const maxBottom = Math.max(minBottom, window.innerHeight - height - EDGE_PADDING);
  return {
    right: Math.min(Math.max(pos.right, minRight), maxRight),
    bottom: Math.min(Math.max(pos.bottom, minBottom), maxBottom),
  };
}

function canUseHoverPeek() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function MooniAgentFab({
  onOpenChat,
  isChatOpen,
  isZenMode,
  isTourActive = false,
  /** 모바일 숙소 패널 펼침 — FAB 숨김(가독성) */
  hideForStayPanel = false,
}) {
  const { t } = useTranslation();
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
      }, HINT_AUTO_DISMISS_MS);
    }, getMooniNudgeIntervalMs());
  }, [clearNudgeDismissTimer]);

  useEffect(() => {
    if (!showHint || hintPhase !== 'intro') return undefined;

    clearNudgeDismissTimer();
    nudgeDismissTimerRef.current = setTimeout(() => {
      markMooniIntroSeen();
      setShowHint(false);
      setHintPhase(null);
      nudgeDismissTimerRef.current = null;
      scheduleNextNudge();
    }, HINT_AUTO_DISMISS_MS);

    return clearNudgeDismissTimer;
  }, [showHint, hintPhase, clearNudgeDismissTimer, scheduleNextNudge]);

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

  if (isZenMode || isChatOpen || isTourActive || hideForStayPanel) return null;

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
  const hintOnRight = shouldPlaceHintOnRight(pos.right);

  return (
    <div
      ref={rootRef}
      style={{ right: pos.right, bottom: pos.bottom }}
      className="fixed z-[58] pointer-events-auto touch-none select-none"
      aria-label={t('mooni.fab.ariaHelper')}
    >
      <div className="relative flex flex-col items-center">
        {hintVisible && (
          <div
            className={`absolute bottom-full mb-2 animate-fade-in-up pointer-events-auto ${
              hintOnRight ? 'left-0' : 'right-0'
            }`}
            style={{ width: 'max-content', maxWidth: HINT_MAX_WIDTH }}
          >
            <div className="relative rounded-2xl border border-cyan-400/30 bg-black/70 backdrop-blur-xl px-4 py-3 text-sm text-gray-100 shadow-[0_8px_32px_rgba(34,211,238,0.15)]">
              <p className={`leading-snug ${showCloseButton ? 'pr-5' : ''}`}>{hintText}</p>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={dismissHint}
                  className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
                  aria-label={t('mooni.fab.ariaCloseHint')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div
              className={`absolute -bottom-2 h-3 w-3 rotate-45 border-r border-b border-cyan-400/30 bg-black/70 ${
                hintOnRight ? 'left-8' : 'right-8'
              }`}
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
          aria-label={t('mooni.fab.ariaChat')}
        >
          <span className={`pointer-events-none ${isDragging ? '' : 'mooni-float'}`}>
            <img
              src={mooniChar}
              alt={t('mooni.fab.ariaCharacter')}
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
    </div>
  );
}
