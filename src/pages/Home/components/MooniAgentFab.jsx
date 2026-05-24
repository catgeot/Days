import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import mooniChar from '../../../assets/MOONI_transparent.png';
import mooniText from '../../../assets/MONNI_text.png';
import { PERSONA_TYPES } from '../lib/prompts';

const GREETING = '안녕! MOONi예요. 여행이 궁금하면 편하게 물어봐요.';
const POSITION_KEY = 'gateo_mooni_fab_pos';
const HINT_IDLE_MS = 45_000;
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

export default function MooniAgentFab({ onOpenChat, isChatOpen, isZenMode }) {
  const rootRef = useRef(null);
  const dragRef = useRef(null);
  const hintTimerRef = useRef(null);

  const [pos, setPos] = useState(() => clampPosition(loadPosition() ?? DEFAULT_POS));
  const [showHint, setShowHint] = useState(true);
  const [hoverHint, setHoverHint] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const scheduleHintReturn = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowHint(true);
    }, HINT_IDLE_MS);
  }, []);

  useEffect(() => {
    if (isChatOpen) setShowHint(false);
  }, [isChatOpen]);

  useEffect(() => {
    const onResize = () => setPos((prev) => clampPosition(prev));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    setHoverHint(false);
    scheduleHintReturn();
  }, [scheduleHintReturn]);

  const openChat = useCallback(() => {
    setShowHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    onOpenChat?.({ persona: PERSONA_TYPES.GENERAL });
  }, [onOpenChat]);

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
      setHoverHint(false);
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

  const hintVisible = showHint || hoverHint;

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
            <p className="leading-snug pr-5">{GREETING}</p>
            <button
              type="button"
              onClick={dismissHint}
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
              aria-label="말풍선만 닫기"
            >
              <X size={14} />
            </button>
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
          if (!isDragging) setHoverHint(true);
        }}
        onMouseLeave={() => setHoverHint(false)}
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
