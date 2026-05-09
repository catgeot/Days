import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../shared/api/supabase';

const isDev = import.meta.env.DEV;

export const usePlannerData = (placeId, mediaMode) => {
  const [plannerData, setToolkitData] = useState(null);
  const [isPlannerLoading, setIsToolkitLoading] = useState(Boolean(placeId));
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
  const placeIdRef = useRef(placeId);

  useEffect(() => {
    plannerDataRef.current = plannerData;
    placeIdRef.current = placeId;
  }, [plannerData, placeId]);

  /** AI/Edge 호출 없이 DB `place_toolkit` 행만 다시 읽기 — 화면이 비었을 때 복구용 */
  const refetchPlannerFromDb = useCallback(async () => {
    if (!placeId) return;
    setIsPlannerRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('place_toolkit')
        .select('*')
        .eq('place_id', String(placeId))
        .maybeSingle();

      if (error) {
        console.error('[usePlannerData] refetch DB 조회 에러:', error);
      }
      if (placeIdRef.current === placeId) {
        setToolkitData(data || null);
      }
    } catch (err) {
      console.error('[usePlannerData] refetch 예외:', err);
    } finally {
      setIsPlannerRefreshing(false);
    }
  }, [placeId]);

  useEffect(() => {
    if (!placeId) return;

    // ✅ PLANNER 모드가 아니면 loading 상태만 false로 설정하고 데이터는 유지
    if (mediaMode !== 'PLANNER') {
        setIsToolkitLoading(false);
        return;
    }

    // ✅ placeId가 변경되었을 때만 리셋 (동일 placeId면 기존 데이터 유지)
    if (plannerDataRef.current?.place_id !== placeId) {
      setToolkitData(null);
      setIsToolkitLoading(false);
    }

    // ✅ 이미 동일한 placeId 데이터가 있으면 재로딩 안 함 (early return을 useEffect 레벨로 이동)
    if (plannerDataRef.current?.place_id === placeId) {
      if (isDev) {
        console.log(`[usePlannerData] 기존 데이터 유지 - placeId: ${placeId}`);
      }
      setIsToolkitLoading(false); // ✅ 여기서 로딩 상태를 해제해야 무한 로딩에 빠지지 않음
      return;
    }

    let isSubscribed = true;

    // ✅ fetchToolkitData 호출 전에 loading 상태를 true로 설정하여 race condition 방지
    // 이렇게 하면 ToolkitTab이 체크할 때 이미 isPlannerLoading이 true가 되어 auto-request를 방지함
    setIsToolkitLoading(true);

    const fetchToolkitData = async () => {
      if (isDev) {
        console.log(`[usePlannerData] DB 조회 시작 - placeId: ${placeId}`);
      }

      try {
        const { data, error } = await supabase
          .from('place_toolkit')
          .select('*')
          .eq('place_id', String(placeId))
          .maybeSingle();

        if (error) {
            console.error('[usePlannerData] DB 조회 에러:', error);
        }

        if (isSubscribed) {
          setToolkitData(data || null);
          if (isDev && data) {
            console.log('[usePlannerData] 데이터 로드 완료');
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
  }, [placeId, mediaMode]);

  useEffect(() => {
    const handleToolkitUpdated = (event) => {
      const updatedPlaceId = event.detail?.placeId;
      const essentialGuide = event.detail?.essentialGuide;

      if (updatedPlaceId === placeIdRef.current) {
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
            const { data } = await supabase
              .from('place_toolkit')
              .select('*')
              .eq('place_id', String(updatedPlaceId))
              .maybeSingle();

            if (data && placeIdRef.current === updatedPlaceId) {
              setToolkitData(data);
              console.log('[usePlannerData] 백그라운드 동기화 완료');
            }
          } catch (e) {
            console.error('[usePlannerData] 백그라운드 패치 에러:', e);
          }
        }, 1500);
      }
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
