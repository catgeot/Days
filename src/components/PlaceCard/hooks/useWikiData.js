// src/components/PlaceCard/hooks/useWikiData.js
// Lazy fetch: mediaMode === 'WIKI'일 때만 place_wiki 조회.
// 같은 placeKey 재조회 시 wikiData를 null로 비우지 않음 (탭 복귀 깜박임 방지).

import { useState, useEffect, useMemo, useRef } from 'react';
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
  const wikiDataRef = useRef(null);
  const prevPlaceKeyRef = useRef('');

  const placeKey = useMemo(() => getPlaceStableKey(location), [location]);
  // location 객체 참조 변경만으로 후보 배열이 바뀌지 않게 placeKey에 고정
  const dbCandidates = useMemo(
    () => buildPlaceDbIdCandidates(location),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placeKey가 같으면 동일 장소
    [placeKey],
  );
  const candidatesKey = useMemo(() => dbCandidates.join('\0'), [dbCandidates]);

  useEffect(() => {
    wikiDataRef.current = wikiData;
  }, [wikiData]);

  useEffect(() => {
    if (!placeKey) return undefined;

    const placeChanged = prevPlaceKeyRef.current !== placeKey;
    if (placeChanged) {
      prevPlaceKeyRef.current = placeKey;
      setWikiData(null);
      wikiDataRef.current = null;
      setIsWikiLoading(false);
    }

    if (mediaMode !== 'WIKI') {
      return undefined;
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
      // 이미 같은 장소 데이터가 있으면 스켈레톤으로 비우지 않음 (복귀 깜박임 방지)
      const keepVisible = Boolean(wikiDataRef.current) && !placeChanged;
      if (!keepVisible) {
        setIsWikiLoading(true);
      }

      if (isDev) {
        console.log(
          `[useWikiData] DB 조회 시작 - placeKey: ${placeKey}, candidates: ${dbCandidates.join(', ')}${keepVisible ? ' (배경)' : ''}`,
        );
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
        if (isSubscribed && !keepVisible) setWikiData(null);
      } finally {
        if (isSubscribed) setIsWikiLoading(false);
      }
    };

    fetchWikiData();

    return () => {
      isSubscribed = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [placeKey, candidatesKey, mediaMode, dbCandidates]);

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
  }, [wikiData?.ai_practical_info, candidatesKey, mediaMode, dbCandidates]);

  return { wikiData, isWikiLoading };
};
