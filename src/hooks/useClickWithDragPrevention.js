import { useRef, useCallback, useEffect } from 'react';

/**
 * pointer 제스처 뒤 click을 막는다.
 * reset()이 moved를 지운 뒤에도 남는다. 카드 인스턴스가 갈려도 같다.
 * pointerdown 없는 키보드 click/Enter만 handleClick으로 연다.
 */
let releaseAnywhereSuppressUntil = 0;
let pendingCompatClicks = 0;
let compatTimer = 0;
const COMPAT_CLICK_MS = 1500;

function blockFollowupClick(ms) {
  const until = Date.now() + ms;
  if (until > releaseAnywhereSuppressUntil) releaseAnywhereSuppressUntil = until;
}

function followupClickBlocked() {
  return Date.now() < releaseAnywhereSuppressUntil;
}

/** pointerup이 이미 연 제스처의 호환 click. 메인 스레드가 늦어도 한 번만 삼킨다. */
export function noteCompatClick() {
  pendingCompatClicks += 1;
  if (compatTimer) clearTimeout(compatTimer);
  compatTimer = setTimeout(() => {
    pendingCompatClicks = 0;
    compatTimer = 0;
  }, COMPAT_CLICK_MS);
}

export function takeCompatClick() {
  if (pendingCompatClicks <= 0) return false;
  pendingCompatClicks -= 1;
  if (pendingCompatClicks === 0 && compatTimer) {
    clearTimeout(compatTimer);
    compatTimer = 0;
  }
  return true;
}

export function resetCompatClicks() {
  pendingCompatClicks = 0;
  if (compatTimer) clearTimeout(compatTimer);
  compatTimer = 0;
}

/**
 * 드래그와 클릭을 구분하는 스마트 클릭 감지 Hook
 *
 * 주요 여행 사이트 (Airbnb, Booking.com, TripAdvisor) UX 패턴 분석 결과:
 * - 이동 거리 임계값: 5-10px
 * - 시간 임계값: 100-500ms
 * - 모바일/데스크톱 공통 최적화
 *
 * releaseAnywhere: pointerdown 이후 노드가 언마운트되거나 pointerleave가 나도
 * window pointerup으로 탭을 끝낸다. 탐색 결과 카드가 로딩 재렌더로 사라지는 경우.
 *
 * @param {Function} onClick - 클릭 시 실행할 콜백 함수
 * @param {Object} options - 설정 옵션
 * @param {number} options.threshold - 드래그로 간주할 최소 이동 거리 (px)
 * @param {number} options.timeThreshold - 클릭으로 간주할 최대 시간 (ms)
 * @param {number} options.minTime - 클릭으로 간주할 최소 시간 (ms, 오작동 방지)
 * @param {boolean} [options.releaseAnywhere]
 * @returns {Object} 이벤트 핸들러 객체
 */
const useClickWithDragPrevention = (onClick, options = {}) => {
  const {
    threshold = 5,        // 5px 이상 이동 시 드래그로 간주 (Booking.com 기준)
    timeThreshold = 500,  // 500ms 이상 누르면 무시 (롱프레스 방지)
    minTime = 50,         // 50ms 미만은 오작동으로 간주
    releaseAnywhere = false,
  } = options;

  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const optsRef = useRef({ threshold, timeThreshold, minTime, releaseAnywhere });
  optsRef.current = { threshold, timeThreshold, minTime, releaseAnywhere };

  const startPos = useRef(null);
  const startTime = useRef(null);
  const moved = useRef(false);
  const sessionRef = useRef(null);

  const detachWindow = useCallback((session) => {
    session?.detach?.();
  }, []);

  const reset = useCallback(() => {
    detachWindow(sessionRef.current);
    sessionRef.current = null;
    startPos.current = null;
    startTime.current = null;
    moved.current = false;
    // releaseAnywhereSuppressUntil 은 드래그·pointercancel 판정이다. 여기서 지우면 뒤 click이 열린다.
  }, [detachWindow]);

  useEffect(() => () => {
    if (sessionRef.current?.releaseAnywhere) return;
    detachWindow(sessionRef.current);
    sessionRef.current = null;
  }, [detachWindow]);

  const handleStart = useCallback((e, data) => {
    if (e?.button != null && e.button !== 0) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    detachWindow(sessionRef.current);

    startPos.current = { x: clientX, y: clientY };
    startTime.current = Date.now();
    moved.current = false;

    const { releaseAnywhere: trackOnWindow, threshold: moveThreshold } = optsRef.current;
    const session = {
      x: clientX,
      y: clientY,
      t: startTime.current,
      moved: false,
      pointerId: e.pointerId,
      data,
      releaseAnywhere: trackOnWindow,
      detach: null,
      timer: 0,
    };

    const onMove = (ev) => {
      if (sessionRef.current !== session) return;
      if (session.pointerId != null && ev.pointerId != null && ev.pointerId !== session.pointerId) return;
      const x = ev.clientX ?? ev.touches?.[0]?.clientX;
      const y = ev.clientY ?? ev.touches?.[0]?.clientY;
      if (x == null || y == null) return;
      const distance = Math.hypot(x - session.x, y - session.y);
      if (distance > moveThreshold) {
        session.moved = true;
        moved.current = true;
        if (trackOnWindow) blockFollowupClick(1000);
      }
    };

    const onUp = (ev) => {
      if (sessionRef.current !== session) return;
      if (session.pointerId != null && ev?.pointerId != null && ev.pointerId !== session.pointerId) return;
      onMove(ev);
      const duration = Date.now() - session.t;
      const { minTime: minMs, timeThreshold: maxMs } = optsRef.current;
      const payload = session.data;
      const didMove = session.moved;
      if (session.timer) window.clearTimeout(session.timer);
      detachWindow(session);
      sessionRef.current = null;
      startPos.current = null;
      startTime.current = null;
      if (trackOnWindow && didMove) blockFollowupClick(1000);
      if (!didMove && duration >= minMs && duration < maxMs) {
        if (trackOnWindow) blockFollowupClick(400);
        noteCompatClick();
        onClickRef.current?.(payload);
      }
    };

    const onCancel = (ev) => {
      if (sessionRef.current !== session) return;
      if (ev && session.pointerId != null && ev.pointerId != null && ev.pointerId !== session.pointerId) return;
      if (session.timer) window.clearTimeout(session.timer);
      detachWindow(session);
      sessionRef.current = null;
      startPos.current = null;
      startTime.current = null;
      if (trackOnWindow) blockFollowupClick(1000);
    };

    session.onMove = onMove;
    session.onUp = onUp;
    session.onCancel = onCancel;

    if (trackOnWindow && typeof window !== 'undefined') {
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
      window.addEventListener('pointercancel', onCancel, true);
      session.detach = () => {
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);
        window.removeEventListener('pointercancel', onCancel, true);
      };
      session.timer = window.setTimeout(() => onCancel(), 30000);
    }

    sessionRef.current = session;
  }, [detachWindow]);

  const handleMove = useCallback((e) => {
    const session = sessionRef.current;
    if (session?.onMove) {
      session.onMove(e);
      return;
    }
    if (!startPos.current) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX !== undefined && clientY !== undefined) {
      const distance = Math.hypot(clientX - startPos.current.x, clientY - startPos.current.y);
      if (distance > optsRef.current.threshold) {
        moved.current = true;
      }
    }
  }, []);

  const handleEnd = useCallback((e, data) => {
    const session = sessionRef.current;
    if (session?.releaseAnywhere) return;
    if (session?.onUp) {
      if (data !== undefined) session.data = data;
      session.onUp(e);
      return;
    }

    if (!startPos.current || !startTime.current) {
      reset();
      return;
    }

    const duration = Date.now() - startTime.current;
    const { minTime: minMs, timeThreshold: maxMs } = optsRef.current;
    if (!moved.current && duration >= minMs && duration < maxMs) {
      noteCompatClick();
      onClickRef.current?.(data);
    }
    reset();
  }, [reset]);

  const handleCancel = useCallback((e) => {
    const session = sessionRef.current;
    if (session?.releaseAnywhere) return;
    if (session?.onCancel) {
      session.onCancel(e);
      return;
    }
    reset();
  }, [reset]);

  const handleClick = useCallback((e, data) => {
    if (takeCompatClick()) return;
    if (followupClickBlocked()) return;
    const pointerType = e?.pointerType;
    if (pointerType === 'mouse' || pointerType === 'touch' || pointerType === 'pen') return;
    if (moved.current) return;
    const payload = data !== undefined ? data : sessionRef.current?.data;
    blockFollowupClick(400);
    onClickRef.current?.(payload);
  }, []);

  return {
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    handleClick,
    reset
  };
};

export default useClickWithDragPrevention;
