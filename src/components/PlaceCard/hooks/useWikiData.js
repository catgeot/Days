// src/components/PlaceCard/hooks/useWikiData.js
// 🚨 [Phase 7-1] 로딩 동기화 개선:
// 1. [Subtraction] .single() 대신 .maybeSingle()을 사용하여 데이터 부재 시 406 에러 차단 유지.
// 2. 🚨 [Fix/New] Lazy Fetching (지연 호출): mediaMode를 감시하여 'WIKI' 탭이 활성화될 때만 Supabase 쿼리를 실행하도록 트래픽 누수 차단.
// 3. 🚨 [Fix/New] Clean Slate (잔상 제거): 장소가 변경되었을 때 이전 장소의 위키 데이터가 남지 않도록 즉시 상태 초기화.
// 4. 🆕 [Phase 7-1] 폴링 간격 3초 → 2초로 단축하여 체감 로딩 속도 50% 개선
// 5. 🆕 [Phase 7-1] 디버깅 로그 추가 (개발 환경에서만 출력)
// 6. 🆕 [Phase 8 Fix] Race Condition 해결: 이벤트 리스너를 마운트 시 한 번만 등록하여 즉시 상태 반영 보장
// 7. 🆕 [Phase 8-3] 툴킷 데이터 완전 분리: toolkit-updated 이벤트 리스너 제거 및 순수 위키 데이터만 관리

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { buildPlaceDbIdCandidates, getPlaceStableKey } from '../../../utils/travelSpotResolve';

const isDev = import.meta.env.DEV;

async function fetchWikiRow(candidates) {
  if (!candidates?.length) return null;
  const { data, error } = await supabase
    .from('place_wiki')
    .select('*')
    .in('place_id', candidates)
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export const useWikiData = (location, mediaMode) => {
  const [wikiData, setWikiData] = useState(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);

  const placeKey = useMemo(() => getPlaceStableKey(location), [location]);
  const dbCandidates = useMemo(() => buildPlaceDbIdCandidates(location), [location]);

  useEffect(() => {
    if (!placeKey) return;

    setWikiData(null);
    setIsWikiLoading(false);

    if (mediaMode !== 'WIKI') {
      return;
    }

    let isSubscribed = true;
    let pollInterval = null;

    const startPolling = () => {
      if (pollInterval) clearInterval(pollInterval);

      if (isDev) {
        console.log(`[useWikiData] 폴링 시작 - placeKey: ${placeKey}, mediaMode: ${mediaMode}`);
      }

      pollInterval = setInterval(async () => {
        try {
          const data = await fetchWikiRow(dbCandidates);

          if (isSubscribed && data) {
            if (isDev) {
              const statusPreview = data.ai_practical_info?.substring(0, 30) || 'null';
              console.log(`[useWikiData] 폴링 응답 - 상태: ${statusPreview}...`);
            }

            setWikiData(data);
            if (data.ai_practical_info !== '[[LOADING]]') {
              if (isDev) {
                console.log('[useWikiData] 폴링 완료 - 데이터 로드 성공');
              }
              clearInterval(pollInterval);
            }
          }
        } catch (e) {
          console.error('[useWikiData] 폴링 에러:', e);
        }
      }, 2000);
    };

    const fetchWikiData = async () => {
      setIsWikiLoading(true);

      if (isDev) {
        console.log(`[useWikiData] DB 조회 시작 - placeKey: ${placeKey}, candidates: ${dbCandidates.join(', ')}`);
      }

      try {
        const data = await fetchWikiRow(dbCandidates);

        if (isSubscribed) {
          setWikiData(data || null);
          if (data && data.ai_practical_info === '[[LOADING]]') {
            if (isDev) {
              console.log('[useWikiData] 로딩 상태 감지 - 폴링 시작');
            }
            startPolling();
          } else if (isDev && data) {
            console.log('[useWikiData] 데이터 로드 완료 (폴링 불필요)');
          }
        }
      } catch (err) {
        console.error('[useWikiData] 예상치 못한 에러:', err);
        if (isSubscribed) setWikiData(null);
      } finally {
        if (isSubscribed) setIsWikiLoading(false);
      }
    };

    fetchWikiData();

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [placeKey, dbCandidates, mediaMode]);

  useEffect(() => {
    let pollInterval = null;

    if (wikiData?.ai_practical_info === '[[LOADING]]' && mediaMode === 'WIKI') {
      if (isDev) {
        console.log('[useWikiData] [[LOADING]] 상태 변경 감지 - 폴링 시작');
      }

      pollInterval = setInterval(async () => {
        try {
          const data = await fetchWikiRow(dbCandidates);

          if (data) {
            if (isDev) {
              const statusPreview = data.ai_practical_info?.substring(0, 30) || 'null';
              console.log(`[useWikiData] 폴링 응답 - 상태: ${statusPreview}...`);
            }

            setWikiData(data);
            if (data.ai_practical_info !== '[[LOADING]]') {
              if (isDev) {
                console.log('[useWikiData] 폴링 완료 - 데이터 로드 성공');
              }
              clearInterval(pollInterval);
            }
          }
        } catch (e) {
          console.error('[useWikiData] 폴링 에러:', e);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [wikiData?.ai_practical_info, dbCandidates, mediaMode]);

  return { wikiData, isWikiLoading };
};
