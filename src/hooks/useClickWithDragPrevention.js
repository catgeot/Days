import { useRef, useCallback } from 'react';

/**
 * 드래그와 클릭을 구분하는 스마트 클릭 감지 Hook
 *
 * 주요 여행 사이트 (Airbnb, Booking.com, TripAdvisor) UX 패턴 분석 결과:
 * - 이동 거리 임계값: 5-10px
 * - 시간 임계값: 100-500ms
 * - 모바일/데스크톱 공통 최적화
 *
 * @param {Function} onClick - 클릭 시 실행할 콜백 함수
 * @param {Object} options - 설정 옵션
 * @param {number} options.threshold - 드래그로 간주할 최소 이동 거리 (px)
 * @param {number} options.timeThreshold - 클릭으로 간주할 최대 시간 (ms)
 * @param {number} options.minTime - 클릭으로 간주할 최소 시간 (ms, 오작동 방지)
 * @returns {Object} 이벤트 핸들러 객체
 */
const useClickWithDragPrevention = (onClick, options = {}) => {
  const {
    threshold = 5,        // 5px 이상 이동 시 드래그로 간주 (Booking.com 기준)
    timeThreshold = 500,  // 500ms 이상 누르면 무시 (롱프레스 방지)
    minTime = 50          // 50ms 미만은 오작동으로 간주
  } = options;

  const startPos = useRef(null);
  const startTime = useRef(null);
  const moved = useRef(false);

  const handleStart = useCallback((e) => {
    // clientX/Y는 mouse와 touch 이벤트 모두에서 사용 가능
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX !== undefined && clientY !== undefined) {
      startPos.current = { x: clientX, y: clientY };
      startTime.current = Date.now();
      moved.current = false;
    }
  }, []);

  const handleMove = useCallback((e) => {
    if (!startPos.current) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    if (clientX !== undefined && clientY !== undefined) {
      const distance = Math.sqrt(
        Math.pow(clientX - startPos.current.x, 2) +
        Math.pow(clientY - startPos.current.y, 2)
      );

      // 임계값 초과 시 드래그로 간주
      if (distance > threshold) {
        moved.current = true;
      }
    }
  }, [threshold]);

  const handleEnd = useCallback((e, data) => {
    if (!startPos.current || !startTime.current) {
      reset();
      return;
    }

    const duration = Date.now() - startTime.current;

    // 클릭 조건 체크:
    // 1. 이동하지 않았고 (드래그 아님)
    // 2. 최소 시간 이상이고 (오작동 아님)
    // 3. 최대 시간 이하 (롱프레스 아님)
    if (!moved.current && duration >= minTime && duration < timeThreshold) {
      if (onClick && typeof onClick === 'function') {
        onClick(data);
      }
    }

    reset();
  }, [onClick, minTime, timeThreshold]);

  const reset = useCallback(() => {
    startPos.current = null;
    startTime.current = null;
    moved.current = false;
  }, []);

  const handleCancel = useCallback(() => {
    reset();
  }, [reset]);

  return {
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    reset
  };
};

export default useClickWithDragPrevention;
