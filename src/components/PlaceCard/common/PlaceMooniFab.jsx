import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mooniChar from '../../../assets/MOONI_transparent.png';
import {
  PLACE_MOONI_DRAG_THRESHOLD,
  PLACE_MOONI_FAB_SIZE,
  clampPlaceMooniPosition,
  getPlaceMooniDefaultPosition,
  getPlaceMooniMinBottom,
  getPlaceMooniScrollTopReserve,
  loadPlaceMooniPosition,
  savePlaceMooniPosition,
} from './placeMooniFabPosition';

const PlaceMooniFab = ({ onOpen, mediaMode, hasGalleryRelatedBar }) => {
  const dragRef = useRef(null);
  const clampOptionsRef = useRef({ minBottom: 88, scrollTopReserve: null });

  const [pos, setPos] = useState(() => {
    const minBottom = getPlaceMooniMinBottom(hasGalleryRelatedBar);
    const saved = loadPlaceMooniPosition();
    const initial = saved ?? getPlaceMooniDefaultPosition(minBottom);
    if (typeof window === 'undefined') return initial;
    return clampPlaceMooniPosition(initial, {
      minBottom,
      scrollTopReserve: getPlaceMooniScrollTopReserve(mediaMode),
    });
  });
  const [isDragging, setIsDragging] = useState(false);

  const getClampOptions = useCallback(() => ({
    minBottom: getPlaceMooniMinBottom(hasGalleryRelatedBar),
    scrollTopReserve: getPlaceMooniScrollTopReserve(mediaMode),
  }), [hasGalleryRelatedBar, mediaMode]);

  useEffect(() => {
    clampOptionsRef.current = getClampOptions();
    setPos((prev) => clampPlaceMooniPosition(prev, clampOptionsRef.current));
  }, [getClampOptions]);

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => clampPlaceMooniPosition(prev, clampOptionsRef.current));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerDown = (event) => {
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

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (!drag.moved && (Math.abs(dx) > PLACE_MOONI_DRAG_THRESHOLD || Math.abs(dy) > PLACE_MOONI_DRAG_THRESHOLD)) {
      drag.moved = true;
      setIsDragging(true);
    }

    if (!drag.moved) return;

    const next = clampPlaceMooniPosition(
      {
        right: drag.startRight - dx,
        bottom: drag.startBottom - dy,
      },
      clampOptionsRef.current
    );
    setPos(next);
  };

  const finishPointer = (event, invokeOpen) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);

    if (drag.moved) {
      setPos((current) => {
        const clamped = clampPlaceMooniPosition(current, clampOptionsRef.current);
        savePlaceMooniPosition(clamped);
        return clamped;
      });
    } else if (invokeOpen) {
      onOpen?.();
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const onPointerUp = (event) => finishPointer(event, true);
  const onPointerCancel = (event) => finishPointer(event, false);

  return createPortal(
    <div
      style={{ right: pos.right, bottom: pos.bottom, width: PLACE_MOONI_FAB_SIZE.width }}
      className="md:hidden fixed z-[165] flex flex-col items-center touch-none select-none pointer-events-auto"
    >
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen?.();
          }
        }}
        className={`flex flex-col items-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
          isDragging ? 'cursor-grabbing scale-[1.02]' : 'cursor-grab active:scale-[0.98]'
        } transition-transform`}
        aria-label="MOONi와 대화하기. 드래그하면 위치를 옮길 수 있어요."
      >
        <span className={`pointer-events-none ${isDragging ? '' : 'mooni-float'}`}>
          <img
            src={mooniChar}
            alt="MOONi"
            className="h-14 w-14 object-contain drop-shadow-[0_8px_24px_rgba(34,211,238,0.35)]"
            draggable={false}
          />
        </span>
        <span className="pointer-events-none text-[10px] font-bold text-cyan-200/90">MOONi</span>
      </div>
    </div>,
    document.body
  );
};

export default PlaceMooniFab;
