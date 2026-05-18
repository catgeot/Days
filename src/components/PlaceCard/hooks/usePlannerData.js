import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../shared/api/supabase';
import {
  fetchToolkitRow,
  hasUsableToolkitForLocation,
  toolkitRowMatchesLocation,
  toolkitUpdateMatchesLocation,
  buildToolkitPlaceIdCandidates,
} from '../../../utils/toolkitPlaceIdResolve';
import { getPlaceStableKey } from '../../../utils/travelSpotResolve';

const isDev = import.meta.env.DEV;

export const usePlannerData = (location, mediaMode) => {
  const placeKey = getPlaceStableKey(location);

  const [plannerData, setToolkitData] = useState(null);
  const [isPlannerLoading, setIsToolkitLoading] = useState(Boolean(placeKey));
  const [isPlannerRefreshing, setIsPlannerRefreshing] = useState(false);
  const [prevMediaMode, setPrevMediaMode] = useState(mediaMode);

  // ✅ 렌더링 중 상태 변경 패턴 (React 16.4+)
  // PLANNER 전환 직후 useEffect DB 조회 전에 로딩을 켜 두어, 빈 상태가 한 프레임이라도 먼저 보이는 것을 줄입니다.
  if (mediaMode !== prevMediaMode) {
      setPrevMediaMode(mediaMode);
      if (mediaMode === 'PLANNER') {
          setIsToolkitLoading(true);
      } else {
          setIsToolkitLoading(false);
      }
  }

  const plannerDataRef = useRef(null);
  const locationRef = useRef(location);

  useEffect(() => {
    plannerDataRef.current = plannerData;
    locationRef.current = location;
  }, [plannerData, location]);

  /** AI/Edge 호출 없이 DB `place_toolkit` 행만 다시 읽기 — 화면이 비었을 때 복구용 */
  const refetchPlannerFromDb = useCallback(async () => {
    if (!placeKey) return;
    setIsPlannerRefreshing(true);
    try {
      const data = await fetchToolkitRow(supabase, location);
      if (
        locationRef.current === location ||
        (typeof locationRef.current === 'object' && getPlaceStableKey(locationRef.current) === placeKey)
      ) {
        setToolkitData(data || null);
      }
    } catch (err) {
      console.error('[usePlannerData] refetch 예외:', err);
    } finally {
      setIsPlannerRefreshing(false);
    }
  }, [location, placeKey]);

  useEffect(() => {
    if (!placeKey) return;

    // ✅ PLANNER 모드가 아니면 loading 상태만 false로 설정하고 데이터는 유지
    if (mediaMode !== 'PLANNER') {
        setIsToolkitLoading(false);
        return;
    }

    const cached = plannerDataRef.current;
    const cacheMatchesPlace = toolkitRowMatchesLocation(cached, location);

    // ✅ 장소가 바뀌었거나, 캐시가 현재 장소와 무관하면 리셋
    if (!cacheMatchesPlace) {
      setToolkitData(null);
      setIsToolkitLoading(false);
    }

    // ✅ place_id만 맞고 essential_guide가 비어 있으면 캐시 무시 후 재조회
    if (cacheMatchesPlace && !hasUsableToolkitForLocation(cached, location)) {
      if (isDev) {
        console.log(`[usePlannerData] 빈/불일치 툴킷 무시 - placeKey: ${placeKey}, db place_id: ${cached?.place_id}`);
      }
      setToolkitData(null);
    }

    // ✅ 동일 장소 + 실제 가이드 내용·지리 일치 시에만 재조회 생략
    if (cacheMatchesPlace && hasUsableToolkitForLocation(cached, location)) {
      if (isDev) {
        console.log(`[usePlannerData] 기존 툴킷 유지 - placeKey: ${placeKey}, db place_id: ${cached.place_id}`);
      }
      setIsToolkitLoading(false);
      return;
    }

    let isSubscribed = true;

    setIsToolkitLoading(true);

    const fetchToolkitData = async () => {
      const candidates = buildToolkitPlaceIdCandidates(location);
      if (isDev) {
        console.log(`[usePlannerData] DB 조회 시작 - placeKey: ${placeKey}, candidates:`, candidates);
      }

      try {
        const data = await fetchToolkitRow(supabase, location);

        if (isSubscribed) {
          setToolkitData(data || null);
          if (isDev) {
            if (data) {
              console.log('[usePlannerData] 데이터 로드 완료', {
                place_id: data.place_id,
                hasGuide: hasUsableToolkitForLocation(data, location),
              });
            } else {
              console.log('[usePlannerData] 매칭 행 없음');
            }
          }
        }
      } catch (err) {
        console.error('[usePlannerData] 예상치 못한 에러:', err);
        if (isSubscribed) setToolkitData(null);
      } finally {
        if (isSubscribed) setIsToolkitLoading(false);
      }
    };

    fetchToolkitData();

    return () => {
      isSubscribed = false;
    };
  }, [placeKey, mediaMode, location]);

  useEffect(() => {
    const handleToolkitUpdated = (event) => {
      const updatedPlaceId = event.detail?.placeId;
      const essentialGuide = event.detail?.essentialGuide;
      const loc = locationRef.current;

      if (!toolkitUpdateMatchesLocation(updatedPlaceId, loc)) return;

      console.log(`[usePlannerData] Toolkit 업데이트 감지 - 데이터 즉시 반영 (${updatedPlaceId})`);

      if (essentialGuide) {
        setToolkitData(prev => {
          console.log('[usePlannerData] 툴킷 데이터 즉시 반영 완료');
          return {
            ...prev,
            place_id: updatedPlaceId,
            essential_guide: essentialGuide,
            toolkit_updated_at: new Date().toISOString()
          };
        });
      }

      setTimeout(async () => {
        try {
          const data = await fetchToolkitRow(supabase, loc);
          if (data && toolkitUpdateMatchesLocation(data.place_id, loc)) {
            setToolkitData(data);
            console.log('[usePlannerData] 백그라운드 동기화 완료');
          }
        } catch (e) {
          console.error('[usePlannerData] 백그라운드 패치 에러:', e);
        }
      }, 1500);
    };

    window.addEventListener('toolkit-updated', handleToolkitUpdated);

    if (isDev) {
      console.log('[usePlannerData] Toolkit 이벤트 리스너 등록 완료');
    }

    return () => {
      window.removeEventListener('toolkit-updated', handleToolkitUpdated);
      if (isDev) {
        console.log('[usePlannerData] Toolkit 이벤트 리스너 제거');
      }
    };
  }, []);

  return { plannerData, isPlannerLoading, refetchPlannerFromDb, isPlannerRefreshing };
};
