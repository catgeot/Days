// src/components/PlaceCard/hooks/useWikiData.js
// Lazy fetch: mediaMode === 'WIKI'일 때만 place_wiki 조회.
// 같은 placeKey 재조회 시 wikiData를 null로 비우지 않음 (탭 복귀 깜박임 방지).

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { getPlaceStableKey } from '../../../utils/travelSpotResolve';
import { normalizeAppLocale } from '../../../i18n/constants';
import { buildPlaceWikiLocaleCandidates, mergePlaceWikiRows } from '../common/magazineLocale';

const isDev = import.meta.env.DEV;

/** 로컬 왓슨 또는 매거진 생성 중 */
function isWikiRowGenerating(row) {
  return row?.ai_practical_info === '[[LOADING]]' || row?.summary === '[[LOADING]]';
}

/** place_wiki 후보 중 매거진·왓슨 병합 최선 행 */
export async function fetchPlaceWikiBestRow(candidates) {
  if (!candidates?.length) return null;
  const { data, error } = await supabase
    .from('place_wiki')
    .select('*')
    .in('place_id', candidates);
  if (error) throw error;
  return mergePlaceWikiRows(data, candidates);
}

async function fetchWikiRow(candidates) {
  return fetchPlaceWikiBestRow(candidates);
}

export const useWikiData = (location, mediaMode, locale = 'ko') => {
  const [wikiData, setWikiData] = useState(null);
  const [isWikiLoading, setIsWikiLoading] = useState(false);
  const wikiDataRef = useRef(null);
  const prevPlaceKeyRef = useRef('');

  const placeKey = useMemo(() => getPlaceStableKey(location), [location]);
  const dbCandidates = useMemo(
    () => buildPlaceWikiLocaleCandidates(location, locale),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placeKey·locale가 같으면 동일 장소
    [placeKey, normalizeAppLocale(locale)],
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
              const statusPreview =
                data.summary === '[[LOADING]]'
                  ? 'magazine:[[LOADING]]'
                  : data.ai_practical_info?.substring(0, 30) || 'null';
              console.log(`[useWikiData] 폴링 응답 - 상태: ${statusPreview}...`);
            }

            setWikiData(data);
            if (!isWikiRowGenerating(data)) {
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
          if (data && isWikiRowGenerating(data)) {
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

    if (isWikiRowGenerating(wikiData) && mediaMode === 'WIKI') {
      if (isDev) {
        console.log('[useWikiData] [[LOADING]] 상태 변경 감지 - 폴링 시작');
      }

      pollInterval = setInterval(async () => {
        try {
          const data = await fetchWikiRow(dbCandidates);

          if (data) {
            if (isDev) {
              const statusPreview =
                data.summary === '[[LOADING]]'
                  ? 'magazine:[[LOADING]]'
                  : data.ai_practical_info?.substring(0, 30) || 'null';
              console.log(`[useWikiData] 폴링 응답 - 상태: ${statusPreview}...`);
            }

            setWikiData(data);
            if (!isWikiRowGenerating(data)) {
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
  }, [wikiData?.ai_practical_info, wikiData?.summary, candidatesKey, mediaMode, dbCandidates]);

  useEffect(() => {
    if (mediaMode !== 'WIKI' || !placeKey) return undefined;

    const onMagazineUpdated = async (e) => {
      const updatedId = String(e.detail?.placeId ?? '').trim();
      if (updatedId && !dbCandidates.includes(updatedId) && updatedId !== placeKey) {
        return;
      }
      try {
        const data = await fetchWikiRow(dbCandidates);
        if (data) setWikiData(data);
      } catch (err) {
        console.error('[useWikiData] magazine-updated 재조회 실패:', err);
      }
    };

    window.addEventListener('magazine-updated', onMagazineUpdated);
    return () => window.removeEventListener('magazine-updated', onMagazineUpdated);
  }, [mediaMode, placeKey, candidatesKey, dbCandidates]);

  useEffect(() => {
    if (mediaMode !== 'WIKI' || !placeKey) return undefined;

    const onWatsonUpdated = async (e) => {
      const updatedId = String(e.detail?.placeId ?? '').trim();
      if (updatedId && !dbCandidates.includes(updatedId) && updatedId !== placeKey) {
        return;
      }
      try {
        const data = await fetchWikiRow(dbCandidates);
        if (data) setWikiData(data);
      } catch (err) {
        console.error('[useWikiData] watson-updated 재조회 실패:', err);
      }
    };

    window.addEventListener('watson-updated', onWatsonUpdated);
    return () => window.removeEventListener('watson-updated', onWatsonUpdated);
  }, [mediaMode, placeKey, candidatesKey, dbCandidates]);

  return { wikiData, isWikiLoading };
};
