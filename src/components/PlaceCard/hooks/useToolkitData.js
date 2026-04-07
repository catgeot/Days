import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/api/supabase';

const isDev = import.meta.env.DEV;

export const useToolkitData = (placeId, mediaMode) => {
  const [toolkitData, setToolkitData] = useState(null);
  // ✅ placeId가 있으면 초기에 무조건 loading=true로 시작 (race condition 방지)
  // TOOLKIT 모드가 아니면 useEffect에서 즉시 false로 변경됨
  const [isToolkitLoading, setIsToolkitLoading] = useState(Boolean(placeId));

  const toolkitDataRef = useRef(null);
  const placeIdRef = useRef(placeId);

  useEffect(() => {
    toolkitDataRef.current = toolkitData;
    placeIdRef.current = placeId;
  }, [toolkitData, placeId]);

  useEffect(() => {
    if (!placeId) return;

    // ✅ TOOLKIT 모드가 아니면 loading 상태만 false로 설정하고 데이터는 유지
    if (mediaMode !== 'TOOLKIT') {
        setIsToolkitLoading(false);
        return;
    }

    // ✅ placeId가 변경되었을 때만 리셋 (동일 placeId면 기존 데이터 유지)
    if (toolkitDataRef.current?.place_id !== placeId) {
      setToolkitData(null);
      setIsToolkitLoading(false);
    }

    // ✅ 이미 동일한 placeId 데이터가 있으면 재로딩 안 함 (early return을 useEffect 레벨로 이동)
    if (toolkitDataRef.current?.place_id === placeId) {
      if (isDev) {
        console.log(`[useToolkitData] 기존 데이터 유지 - placeId: ${placeId}`);
      }
      return;
    }

    let isSubscribed = true;

    // ✅ fetchToolkitData 호출 전에 loading 상태를 true로 설정하여 race condition 방지
    // 이렇게 하면 ToolkitTab이 체크할 때 이미 isToolkitLoading이 true가 되어 auto-request를 방지함
    setIsToolkitLoading(true);

    const fetchToolkitData = async () => {
      if (isDev) {
        console.log(`[useToolkitData] DB 조회 시작 - placeId: ${placeId}`);
      }

      try {
        const { data, error } = await supabase
          .from('place_toolkit')
          .select('*')
          .eq('place_id', String(placeId))
          .maybeSingle();

        if (error) {
            console.error('[useToolkitData] DB 조회 에러:', error);
        }

        if (isSubscribed) {
          setToolkitData(data || null);
          if (isDev && data) {
            console.log('[useToolkitData] 데이터 로드 완료');
          }
        }
      } catch (err) {
        console.error('[useToolkitData] 예상치 못한 에러:', err);
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
        console.log(`[useToolkitData] Toolkit 업데이트 감지 - 데이터 즉시 반영 (${updatedPlaceId})`);

        if (essentialGuide) {
          setToolkitData(prev => {
            console.log('[useToolkitData] 툴킷 데이터 즉시 반영 완료');
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
              console.log('[useToolkitData] 백그라운드 동기화 완료');
            }
          } catch (e) {
            console.error('[useToolkitData] 백그라운드 패치 에러:', e);
          }
        }, 1500);
      }
    };

    window.addEventListener('toolkit-updated', handleToolkitUpdated);

    if (isDev) {
      console.log('[useToolkitData] Toolkit 이벤트 리스너 등록 완료');
    }

    return () => {
      window.removeEventListener('toolkit-updated', handleToolkitUpdated);
      if (isDev) {
        console.log('[useToolkitData] Toolkit 이벤트 리스너 제거');
      }
    };
  }, []);

  return { toolkitData, isToolkitLoading };
};
