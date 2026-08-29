// src/components/PlaceCard/hooks/usePlaceGallery.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Maintain] saveToSmartCache 내 QuotaExceededError 예외 처리 및 자동 청소(Auto-Purge) 로직 '유지' (앱 크래시 완벽 방어)
// 2. [Maintain] Unsplash API 최종 실패 시 기본 대체 이미지를 제공하는 3차 방어막(Fallback) '유지'
// 3. 🚨 [Subtraction] 영문 매핑 사전(FALLBACK_DICTIONARY) '제거' -> 기형적인 로직을 버리고 citiesData.js의 원본 데이터(name_en)를 직접 참조하도록 아키텍처 원복
// 4. 🚨 [New] Unsplash 프로덕션 승인 요건: 다운로드 트래킹(download_location) 호출 및 실제 파일 다운로드 로직(handleDownload) 추가
// 5. 🚨 [New] 갤러리 이미지 영구 삭제 기능(Ctrl + 더블클릭) 지원을 위한 handleRemoveImage 추가 및 쿼리/이름 Ref 추가

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { TRAVEL_SPOTS } from '../../../pages/Home/data/travelSpots';
import { citiesData } from '../../../pages/Home/data/citiesData';
import { supabase } from '../../../shared/api/supabase';
import { buildPlaceDbIdCandidates, getPlaceStableKey, getPlaceStatsId } from '../../../utils/travelSpotResolve';
import { isDomesticKoreaLocation, resolveTourApiPlace } from '../../../utils/tourApiMatch';
import { fetchTourApiGallery } from '../../../utils/fetchTourApiGallery';
import {
  clearGalleryAttributionReturnState,
  consumeGalleryAttributionReturnState,
  findImageForReturnState,
  readGalleryAttributionReturnState,
} from '../common/galleryAttributionNavigation';

/** v1.17 — slug 오버라이드 DB 생략 분리 · thin stock 재수집 */
const CACHE_VERSION = 'v1.17';
const CACHE_TTL = 1000 * 60 * 60 * 24;

// 🚨 [Fix] 오지/자연경관 등 citiesData에 영문명이 없는 경우를 위한 Fallback Dictionary 복구
const FALLBACK_DICTIONARY = {
  "에베레스트": "Mount Everest",
  "에베레스트 베이스캠프": "Everest Base Camp",
  "트리스탄 다 쿠냐": "Tristan da Cunha",
  "칼라 타파르": "Kala Patthar",
  "남극점": "South Pole",
  "맥머도 기지": "McMurdo Station",
  "세종과학기지": "King Sejong Station",
  "장보고과학기지": "Jang Bogo Station",
  "아문센-스콧 남극점 기지": "Amundsen-Scott South Pole Station",
  "파타고니아": "Patagonia",
  "우수아이아": "Ushuaia",
  "사하라 사막": "Sahara Desert",
  "아마존 분지": "Amazon Basin",
  "갈라파고스": "Galapagos Islands",
  "이스터 섬": "Easter Island",
  "세렝게티": "Serengeti",
  "통가": "Tonga",
  "투발루": "Tuvalu",
  "키리바시": "Kiribati",
  "팔라우": "Palau",
  "바누아투": "Vanuatu",
  "피지": "Fiji",
  "나이아가라 폭포": "Niagara Falls",
  "나이아가라": "Niagara Falls",
  "나이야 가라": "Niagara Falls"
};

/** 지명 단독 검색 시 결과가 빈약한 장소 — 국가/광역 키워드로 대체 */
const GALLERY_QUERY_OVERRIDES = {
  yap: {
    primary: 'Federated States of Micronesia',
    backup: 'Micronesia island tropical ocean landscape',
  },
  /** TourAPI searchPhoto가 404·오매칭(춘천 벚꽃)만 줌 → Unsplash 쿼리 보강 */
  gongjicheon: {
    primary: 'Gongjicheon Chuncheon',
    backup: 'Chuncheon cherry blossom riverside park Korea',
  },
};

/** 쿼리 오버라이드가 있어도 place_stats를 쓰는 slug — 오버라이드만으로 DB 생략 금지 */
const GALLERY_DB_SKIP_SLUGS = new Set(['yap', 'gongjicheon']);

/** Pexels 백필·더보기용 보조 검색어 (Unsplash primary는 건드리지 않음) */
const GALLERY_PEXELS_EXTRA_QUERIES = {
  'whakarewarewa-village': [
    'Whakarewarewa Village',
    'Whakarewarewa geothermal village',
    'Rotorua Maori village New Zealand',
  ],
};

/** Unsplash primary·backup 0건일 때만 시도 — primary 오버라이드 금지(slug DB 회귀 방지) */
const GALLERY_UNSPLASH_EXTRA_QUERIES = {
  'whakarewarewa-village': [
    'Rotorua Maori village New Zealand',
    'Whakarewarewa geothermal village',
    'Rotorua New Zealand',
  ],
};

const GALLERY_THIN_STOCK_REFETCH_MAX = 7;

const GALLERY_REFRESH_COOLDOWN_MS = 30_000;
/** place_stats / Unsplash 등 TourAPI 이후 단계 hang 시 스켈레톤 고착 방지 */
const GALLERY_LOAD_SAFETY_MS = 28_000;
const PLACE_STATS_QUERY_MS = 8_000;

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function isTourApiGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'tourapi') return true;
  return String(img.id ?? '').startsWith('tourapi');
}

/** place_stats가 TourAPI 위주면 soft는 스톡 API로 갱신(절약은 세션·스톡 DB 히트) */
function isTourApiDominantGallery(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0) return false;
  const tourCount = list.filter(isTourApiGalleryImage).length;
  return tourCount / list.length >= 0.5;
}

function resolveGalleryStablePlaceKey(locationSource) {
  if (!locationSource) return '';
  if (typeof locationSource === 'object') {
    return (
      getPlaceStableKey(locationSource) ||
      String(locationSource.slug || locationSource.id || locationSource.name || '').trim()
    );
  }
  return String(locationSource).trim();
}

function isPexelsGalleryImage(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'pexels') return true;
  return String(img.id ?? '').startsWith('pexels');
}

function galleryHasPexels(images) {
  return Array.isArray(images) && images.some(isPexelsGalleryImage);
}

function needsPexelsBackfill(images, thumbnailOnly) {
  if (thumbnailOnly) return false;
  if (!Array.isArray(images) || images.length === 0) return false;
  return !galleryHasPexels(images);
}

function shouldMergePexelsStock({ thumbnailOnly, forceRefresh, results, existingImages }) {
  if (thumbnailOnly) return false;
  const existing = Array.isArray(existingImages) ? existingImages : [];
  const batch = Array.isArray(results) ? results : [];
  if (forceRefresh) return true;
  if (!galleryHasPexels(existing) && !galleryHasPexels(batch)) return true;
  return batch.length <= 15;
}

function isThinStockGallery(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (list.length === 0 || list.length > GALLERY_THIN_STOCK_REFETCH_MAX) return false;
  return !galleryHasPexels(list) && !isTourApiDominantGallery(list);
}

function resolvePexelsQueries(primaryQuery, backupQuery, koreanName, spotSlug) {
  const extras = spotSlug ? (GALLERY_PEXELS_EXTRA_QUERIES[spotSlug] || []) : [];
  return [...new Set([primaryQuery, backupQuery, ...extras, koreanName].filter(Boolean))];
}

function mergeGalleryAppend(existing, incoming) {
  const existingIds = new Set((existing || []).map((img) => img.id));
  const fresh = (incoming || []).filter((img) => img?.id && !existingIds.has(img.id));
  if (!fresh.length) return { merged: existing || [], added: 0 };
  return { merged: [...(existing || []), ...fresh], added: fresh.length };
}

async function fetchPexelsBatch(apiKey, queries, page) {
  const seenPexelsIds = new Set();
  const merged = [];
  for (const query of queries) {
    const images = await apiClient.fetchPexelsImages(apiKey, query, page);
    if (!images?.length) continue;
    for (const img of images) {
      if (!seenPexelsIds.has(img.id)) {
        seenPexelsIds.add(img.id);
        merged.push(img);
      }
    }
  }
  return merged;
}

export const usePlaceGallery = (locationSource, options = {}) => {
  const { enabled = true, thumbnailOnly = false } = options;
  const [images, setImages] = useState([]);
  /** 장소가 있으면 fetch 전까지도 true — TourAPI 대기 중 빈 블랙 화면 방지 */
  const [isImgLoading, setIsImgLoading] = useState(
    () => Boolean(enabled && locationSource),
  );
  /** 더보기(append) 전용 — 기존 그리드를 스켈레톤으로 바꾸지 않음 */
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  /** 같은 영문 쿼리를 쓰는 서로 다른 장소 구분 + in-flight 요청 무효화 */
  const lastFetchKeyRef = useRef(null);
  const galleryLoadSeqRef = useRef(0);
  // 🚨 [New] 큐레이션(좋아요/숨김) 원본 데이터를 보존하기 위한 Ref
  const allImagesRef = useRef([]);
  const unsplashPageRef = useRef(1);
  const pexelsPageRef = useRef(0);
  const currentKoreanNameRef = useRef('');
  const currentQueryRef = useRef('');
  const currentPlaceKeyRef = useRef('');
  /** 여행지(slug/id)별 갤러리 새로고침 쿨타임 — 장소 전환 시 다른 여행지에 영향 없음 */
  const lastRefreshAtByPlaceRef = useRef(new Map());

  const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

  const sourceName = locationSource && typeof locationSource === 'object' ? locationSource.name : locationSource;
  const sourceId = locationSource && typeof locationSource === 'object' ? locationSource.id : null;
  const stablePlaceKey = useMemo(
    () => resolveGalleryStablePlaceKey(locationSource),
    [
      typeof locationSource === 'object' && locationSource
        ? getPlaceStableKey(locationSource) || locationSource.slug || locationSource.id || locationSource.name
        : locationSource,
    ],
  );

  const loadFromSmartCache = (key) => {
    const cachedItem = sessionStorage.getItem(key);
    if (!cachedItem) return null;
    try {
      const parsed = JSON.parse(cachedItem);
      if (parsed.version !== CACHE_VERSION) {
        sessionStorage.removeItem(key);
        return null;
      }
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    } catch {
      sessionStorage.removeItem(key);
      return null;
    }
  };

  const saveToSmartCache = (key, data) => {
    const payload = { version: CACHE_VERSION, timestamp: Date.now(), data: data };
    try {
      sessionStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        console.warn('⚠️ SessionStorage full. Auto-Purging gallery caches...');

        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('days_gallery_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));

        try {
          sessionStorage.setItem(key, JSON.stringify(payload));
        } catch (retryError) {
          console.error('🚨 Cache save failed post-purge. Skipping cache.', retryError);
        }
      } else {
        console.error('🚨 Unexpected Cache Error:', e);
      }
    }
  };

  // 이미지 상태 업데이트 (Unsplash/Pexels 경로 그대로 · TourAPI 교차는 fetch 쪽에서만)
  const processAndSetImages = useCallback((rawImages) => {
    if (!rawImages || rawImages.length === 0) {
      setImages([]);
      return;
    }
    allImagesRef.current = rawImages;
    setImages(rawImages);
  }, []);

  const fetchImages = useCallback(async (forceRefresh = false) => {
    if (!locationSource) {
      setIsImgLoading(false);
      setIsRefreshing(false);
      return;
    }

    let targetSpot = locationSource;

    if (typeof locationSource === 'string') {
        let found = TRAVEL_SPOTS.find(s => s.name === locationSource);
        if (!found) found = citiesData.find(s => s.name === locationSource);
        if (found) targetSpot = found;
    } else if (typeof locationSource === 'object') {
      if (!locationSource.name_en) {
        let foundInMaster = TRAVEL_SPOTS.find(s =>
          s.name === sourceName || (sourceId && s.id === sourceId)
        );
        if (!foundInMaster) {
           foundInMaster = citiesData.find(s => s.name === sourceName);
        }
        if (foundInMaster) targetSpot = foundInMaster;
      }
    }

    let primaryQuery = '';
    let backupQuery = '';
    let koreanName = '';

    if (typeof targetSpot === 'object') {
        // 🚨 [Fix] 검색 정확도 향상을 위해 영어 지명에 쉼표가 있을 경우 첫 번째 구역(단어)만 추출
        const rawNameEn = targetSpot.name_en || '';
        const simpleNameEn = rawNameEn.split(',')[0].trim();

        primaryQuery = simpleNameEn || targetSpot.name || '';
        koreanName = targetSpot.name || '';

        const regionSpot =
          (typeof locationSource === 'object' && locationSource?.galleryRegionSpot) ||
          (typeof targetSpot === 'object' && targetSpot?.galleryRegionSpot) ||
          null;
        const country = targetSpot.country_en || targetSpot.country;

        if (regionSpot?.name_en && primaryQuery && regionSpot.name_en.toLowerCase() !== primaryQuery.toLowerCase()) {
          backupQuery = `${primaryQuery} ${regionSpot.name_en}`;
        } else if (country && primaryQuery && country !== primaryQuery) {
          backupQuery = `${primaryQuery} ${country}`;
        }
    } else {
        primaryQuery = String(targetSpot);
        koreanName = String(targetSpot);
    }

    primaryQuery = primaryQuery.trim();
    if (!primaryQuery) {
      setIsImgLoading(false);
      setIsRefreshing(false);
      return;
    }

    const slugOverride =
      typeof targetSpot === 'object' && targetSpot?.slug
        ? GALLERY_QUERY_OVERRIDES[targetSpot.slug]
        : null;
    const spotSlugForDb =
      typeof targetSpot === 'object' && targetSpot?.slug
        ? String(targetSpot.slug).trim().toLowerCase()
        : '';
    if (slugOverride) {
      primaryQuery = slugOverride.primary;
      backupQuery = slugOverride.backup || backupQuery;
    }

    // 🚨 [Fix] 한글 검색어로 API 호출 시 결과가 희박하므로 Dictionary로 영문 강제 치환
    if (FALLBACK_DICTIONARY[koreanName]) {
      primaryQuery = FALLBACK_DICTIONARY[koreanName];
    } else if (FALLBACK_DICTIONARY[primaryQuery]) {
      primaryQuery = FALLBACK_DICTIONARY[primaryQuery];
    }

    const placeKey =
      typeof locationSource === 'object' && locationSource
        ? getPlaceStableKey(locationSource)
        : typeof targetSpot === 'object' && targetSpot
          ? String(targetSpot.slug || targetSpot.id || targetSpot.name || '').trim()
          : String(koreanName || primaryQuery).trim();
    const stablePlaceKey = placeKey || koreanName || primaryQuery;
    const dbStatsId =
      typeof locationSource === 'object' && locationSource
        ? getPlaceStatsId(locationSource)
        : koreanName;
    const dbCandidates =
      typeof locationSource === 'object' && locationSource
        ? buildPlaceDbIdCandidates(locationSource)
        : koreanName
          ? [koreanName]
          : [];
    const fetchKey = `${stablePlaceKey}|${primaryQuery}`;

    // 상태 저장을 통한 삭제 시 활용
    currentPlaceKeyRef.current = stablePlaceKey;
    currentKoreanNameRef.current = dbStatsId || koreanName;
    currentQueryRef.current = primaryQuery;

    // 이미 성공한 동일 키 + 이미지가 있을 때만 스킵 (시작 전 마킹하면 hang 후 재시도 불가)
    if (
      !forceRefresh &&
      lastFetchKeyRef.current === fetchKey &&
      allImagesRef.current.length > 0
    ) {
      processAndSetImages(allImagesRef.current);
      setIsImgLoading(false);
      setIsRefreshing(false);
      return;
    }

    const runId = ++galleryLoadSeqRef.current;
    const hadImagesAtStart = allImagesRef.current.length > 0;
    let safetyTimer = null;

    if (forceRefresh) {
      // 더보기: 기존 TourAPI/캐시 사진을 유지한 채 Unsplash만 append
      setIsRefreshing(true);
      if (!hadImagesAtStart) setIsImgLoading(true);
    } else {
      setIsImgLoading(true);
      setIsRefreshing(false);
      setImages([]);
    }

    const CACHE_KEY = thumbnailOnly
      ? `days_gallery_thumb_${encodeURIComponent(stablePlaceKey)}`
      : `days_gallery_${encodeURIComponent(stablePlaceKey)}_${primaryQuery}`;

    const tourPlaceCandidate =
      typeof targetSpot === 'object' && targetSpot
        ? targetSpot
        : typeof locationSource === 'object' && locationSource
          ? locationSource
          : { name: koreanName, slug: stablePlaceKey };
    const resolvedTourMapping =
      resolveTourApiPlace(tourPlaceCandidate) ||
      (typeof locationSource === 'object' ? resolveTourApiPlace(locationSource) : null) ||
      (koreanName ? resolveTourApiPlace(koreanName) : null);
    /** 해외는 TourAPI 제외 · SSOT curated(국내 시드) 또는 country=한국만 허용 */
    const isDomesticKorea =
      isDomesticKoreaLocation(
        typeof targetSpot === 'object' && targetSpot ? targetSpot : null,
      ) ||
      isDomesticKoreaLocation(
        typeof locationSource === 'object' && locationSource ? locationSource : null,
      ) ||
      Boolean(resolvedTourMapping?.curated);
    const tourMapping = isDomesticKorea ? resolvedTourMapping : null;
    const hasOfficialTourContentId = Boolean(tourMapping?.contentId);

    const clearSafety = () => {
      if (safetyTimer != null) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
    };

    const isStale = () => {
      if (runId === galleryLoadSeqRef.current) return false;
      clearSafety();
      return true;
    };

    const markFetchDone = () => {
      if (runId === galleryLoadSeqRef.current) {
        lastFetchKeyRef.current = fetchKey;
      }
    };

    const finishLoading = () => {
      if (isStale()) return;
      clearSafety();
      setIsImgLoading(false);
      setIsRefreshing(false);
    };

    safetyTimer = setTimeout(() => {
      if (runId !== galleryLoadSeqRef.current) return;
      console.warn('⚠️ Gallery load safety timeout — releasing skeleton');
      if (allImagesRef.current.length > 0) {
        processAndSetImages(allImagesRef.current);
      }
      markFetchDone();
      finishLoading();
    }, GALLERY_LOAD_SAFETY_MS);

    const restorePreservedImages = () => {
      if (isStale()) return;
      if (allImagesRef.current.length > 0) {
        processAndSetImages(allImagesRef.current);
      }
    };

    const pexelsQueries = resolvePexelsQueries(primaryQuery, backupQuery, koreanName, spotSlugForDb);

    if (!forceRefresh) {
      unsplashPageRef.current = 1;
      pexelsPageRef.current = 0;
      const validCache = loadFromSmartCache(CACHE_KEY);
      if (validCache && validCache.length > 0 && !isThinStockGallery(validCache)) {
        if (isStale()) return;
        processAndSetImages(validCache);
        markFetchDone();
        finishLoading();
        if (needsPexelsBackfill(validCache, thumbnailOnly)) {
          const backfillRunId = runId;
          pexelsPageRef.current += 1;
          void fetchPexelsBatch(PEXELS_KEY, pexelsQueries, pexelsPageRef.current)
            .then((pexelsImages) => {
              if (backfillRunId !== galleryLoadSeqRef.current || !pexelsImages.length) return;
              const { merged, added } = mergeGalleryAppend(allImagesRef.current, pexelsImages);
              if (added === 0) return;
              processAndSetImages(merged);
              saveToSmartCache(CACHE_KEY, merged);
              console.log(`✅ Pexels backfill ${added}장 병합 (세션 캐시 히트 후)`);
            })
            .catch((err) => console.error('⚠️ Pexels backfill error:', err));
        }
        return;
      }
      if (validCache?.length > 0 && isThinStockGallery(validCache)) {
        console.warn('⚠️ session cache thin stock — live Unsplash/Pexels refetch');
      }

      // 2) DB 선조회 — 국내·해외 공통. 히트면 Tour/스톡 LIVE 생략.
      // soft 국내만: TourAPI 우세 DB는 건너뛰고 스톡 재수집(공지천 404 고착 방지).
      // 공식 contentId DB(Tour 포함)는 재사용 — LIVE TourAPI보다 우선.
      if (!GALLERY_DB_SKIP_SLUGS.has(spotSlugForDb) && dbCandidates.length) {
        try {
          const dbSelect = thumbnailOnly ? 'image_url, gallery_urls' : 'gallery_urls';
          const { data: dbRows, error: dbError } = await withTimeout(
            supabase
              .from('place_stats')
              .select(dbSelect)
              .in('place_id', dbCandidates)
              .limit(1),
            PLACE_STATS_QUERY_MS,
            'place_stats gallery',
          );

          const dbData = dbRows?.[0];

          if (isStale()) return;

          if (!dbError && dbData) {
            if (thumbnailOnly && dbData.image_url) {
              const thumb = {
                id: 'db-thumb',
                urls: { small: dbData.image_url, regular: dbData.image_url },
              };
              processAndSetImages([thumb]);
              saveToSmartCache(CACHE_KEY, [thumb]);
              markFetchDone();
              finishLoading();
              return;
            }
            if (dbData.gallery_urls && dbData.gallery_urls.length > 0) {
              const gallerySlice = thumbnailOnly
                ? dbData.gallery_urls.slice(0, 1)
                : dbData.gallery_urls;
              const tourDominant = isTourApiDominantGallery(gallerySlice);
              if (
                isDomesticKorea &&
                !hasOfficialTourContentId &&
                tourDominant
              ) {
                console.warn(
                  '⚠️ place_stats TourAPI-heavy — soft stock refresh (skip DB short-circuit)',
                );
              } else if (
                isDomesticKorea &&
                tourMapping?.curated &&
                !hasOfficialTourContentId &&
                !tourDominant
              ) {
                // curated hub(양구 등): Unsplash 오매칭이 DB에 고착되면 TourAPI를 못 탐
                console.warn(
                  '⚠️ place_stats stock-heavy curated — prefer TourAPI (skip DB short-circuit)',
                );
              } else if (isThinStockGallery(gallerySlice)) {
                console.warn(
                  '⚠️ place_stats thin stock-only gallery — live Unsplash/Pexels refetch',
                );
              } else {
                processAndSetImages(gallerySlice);
                saveToSmartCache(CACHE_KEY, gallerySlice);
                unsplashPageRef.current = 1;
                pexelsPageRef.current = 0;
                markFetchDone();
                finishLoading();
                if (needsPexelsBackfill(gallerySlice, thumbnailOnly)) {
                  const backfillRunId = runId;
                  pexelsPageRef.current += 1;
                  void fetchPexelsBatch(PEXELS_KEY, pexelsQueries, pexelsPageRef.current)
                    .then((pexelsImages) => {
                      if (backfillRunId !== galleryLoadSeqRef.current || !pexelsImages.length) return;
                      const { merged, added } = mergeGalleryAppend(allImagesRef.current, pexelsImages);
                      if (added === 0) return;
                      processAndSetImages(merged);
                      saveToSmartCache(CACHE_KEY, merged);
                      console.log(`✅ Pexels backfill ${added}장 병합 (place_stats 히트 후)`);
                    })
                    .catch((err) => console.error('⚠️ Pexels backfill error:', err));
                }
                return;
              }
            }
          }
        } catch {
          console.warn(`⚠️ Supabase Cache Miss or Error for ${dbStatsId || koreanName}. Proceeding to API.`);
        }
      }

      // 3) TourAPI LIVE — 국내 공식 contentId 또는 curated hub photoKeyword (DB miss)
      // Unsplash 「Yanggu」오매칭이 soft(스톡0)보다 먼저 막히지 않게 curated는 여기 우선.
      if (
        isDomesticKorea &&
        tourMapping?.photoKeyword &&
        (hasOfficialTourContentId || tourMapping.curated)
      ) {
        try {
          const tourImages = await fetchTourApiGallery({
            photoKeyword: tourMapping.photoKeyword,
            photoKeywords: tourMapping.photoKeywords,
            title: tourMapping.title,
            contentId: tourMapping.contentId,
            page: 1,
            thumbnailOnly,
          });
          if (isStale()) return;
          if (tourImages.length > 0) {
            processAndSetImages(tourImages);
            saveToSmartCache(CACHE_KEY, tourImages);
            markFetchDone();
            if (dbStatsId || koreanName) {
              const thumbnailToSave =
                tourImages[0]?.urls?.small || tourImages[0]?.urls?.regular || '';
              const statsPlaceId = dbStatsId || koreanName;
              if (thumbnailOnly) {
                if (thumbnailToSave) {
                  supabase
                    .from('place_stats')
                    .upsert(
                      { place_id: statsPlaceId, image_url: thumbnailToSave },
                      { onConflict: 'place_id' },
                    )
                    .then(({ error }) => {
                      if (error) console.error('⚠️ Supabase Thumbnail Update Error:', error);
                    });
                }
              } else {
                supabase
                  .from('place_stats')
                  .upsert(
                    {
                      place_id: statsPlaceId,
                      gallery_urls: tourImages,
                      image_url: thumbnailToSave,
                    },
                    { onConflict: 'place_id' },
                  )
                  .then(({ error }) => {
                    if (error) console.error('⚠️ Supabase Update Error:', error);
                  });
              }
            }
            finishLoading();
            return;
          }
        } catch (tourErr) {
          console.warn('⚠️ TourAPI gallery miss — fallback Unsplash/Pexels', tourErr);
        }
      }
    } else {
      // 더보기: TourAPI page2는 중복·공허한 경우가 많아 건너뛰고 Unsplash/Pexels만 append
      unsplashPageRef.current += 1;
      console.log(
        `🔄 더 많은 사진: 기존 ${allImagesRef.current.length}장 유지 · Unsplash/Pexels append (${primaryQuery}, unsplash p${unsplashPageRef.current})`,
      );
    }

    try {
      let results = [];

      if (ACCESS_KEY) {
        results = await apiClient.fetchUnsplashImages(ACCESS_KEY, primaryQuery, unsplashPageRef.current);
        if (isStale()) return;

        if (results.length === 0 && backupQuery) {
          results = await apiClient.fetchUnsplashImages(ACCESS_KEY, backupQuery, unsplashPageRef.current);
        }
        if (results.length === 0 && spotSlugForDb) {
          const unsplashExtras = GALLERY_UNSPLASH_EXTRA_QUERIES[spotSlugForDb] || [];
          for (const extraQuery of unsplashExtras) {
            if (results.length > 0) break;
            results = await apiClient.fetchUnsplashImages(ACCESS_KEY, extraQuery, unsplashPageRef.current);
          }
        }
        if (isStale()) return;
      } else {
        console.warn('⚠️ VITE_UNSPLASH_ACCESS_KEY missing — Unsplash skipped (Pexels may still run)');
      }

      // 썸네일 모드: Pexels 생략. 갤러리에 Pexels가 없으면 Unsplash 15장 초과여도 Pexels 시도
      if (
        shouldMergePexelsStock({
          thumbnailOnly,
          forceRefresh,
          results,
          existingImages: allImagesRef.current,
        })
      ) {
        try {
          pexelsPageRef.current += 1;
          const mergedPexels = await fetchPexelsBatch(PEXELS_KEY, pexelsQueries, pexelsPageRef.current);
          if (mergedPexels.length > 0) {
            results = [...results, ...mergedPexels];
            console.log(`✅ Pexels 이미지 ${mergedPexels.length}개 병합 완료. 총 ${results.length}개`);
          }
        } catch (pexelsError) {
          console.error('⚠️ Pexels API Error:', pexelsError);
        }
      }

      if (isStale()) return;

      // 5) soft 국내: 스톡 0일 때만 TourAPI (해외·공식 contentId 경로 제외)
      if (
        !forceRefresh &&
        results.length === 0 &&
        isDomesticKorea &&
        !hasOfficialTourContentId &&
        tourMapping?.photoKeyword
      ) {
        try {
          const tourImages = await fetchTourApiGallery({
            photoKeyword: tourMapping.photoKeyword,
            photoKeywords: tourMapping.photoKeywords,
            title: tourMapping.title,
            contentId: tourMapping.contentId,
            page: 1,
            thumbnailOnly,
          });
          if (isStale()) return;
          if (tourImages.length > 0) {
            results = tourImages;
            console.log(`✅ TourAPI soft fallback ${tourImages.length}장 (${tourMapping.photoKeyword})`);
          }
        } catch (tourErr) {
          console.warn('⚠️ TourAPI soft fallback miss', tourErr);
        }
      }

      // 🚨 [New] 강제 새로고침에서 결과를 얻지 못했다면 기존 캐시/상태 보존
      if (forceRefresh && results.length === 0) {
        console.warn(`⚠️ 더 이상 가져올 이미지가 없습니다 (Unsplash p${unsplashPageRef.current}). 이전 상태 유지.`);
        unsplashPageRef.current = Math.max(1, unsplashPageRef.current - 1);
        pexelsPageRef.current = Math.max(0, pexelsPageRef.current - 1);
        restorePreservedImages();
        return;
      }

      if (!ACCESS_KEY && results.length === 0) {
        if (forceRefresh) {
          unsplashPageRef.current = Math.max(1, unsplashPageRef.current - 1);
          pexelsPageRef.current = Math.max(0, pexelsPageRef.current - 1);
          restorePreservedImages();
        } else if (!isStale()) {
          processAndSetImages([]);
        }
        return;
      }

      if (results.length > 0) {
        if (thumbnailOnly) {
          results = [results[0]];
        }
        // 새로고침(Refresh) 시 페이지네이션처럼 기존 데이터를 유지하며 병합 (Append)
        let finalResults = results;
        if (!thumbnailOnly && forceRefresh && allImagesRef.current && allImagesRef.current.length > 0) {
          const { merged, added } = mergeGalleryAppend(allImagesRef.current, results);
          if (added === 0) {
            console.warn(
              `⚠️ 더보기: 신규 사진 없음 (Unsplash p${unsplashPageRef.current}, Pexels p${pexelsPageRef.current})`,
            );
            unsplashPageRef.current = Math.max(1, unsplashPageRef.current - 1);
            pexelsPageRef.current = Math.max(0, pexelsPageRef.current - 1);
            restorePreservedImages();
            return;
          }
          finalResults = merged;
        }

        if (isStale()) return;

        processAndSetImages(finalResults);
        saveToSmartCache(CACHE_KEY, finalResults);

        // 더보기(append)는 세션만 — place_stats 큐레이션을 Unsplash 병합본으로 덮지 않음
        if (!forceRefresh && (dbStatsId || koreanName)) {
          const thumbnailToSave = finalResults[0]?.urls?.small || finalResults[0]?.urls?.regular || '';
          const statsPlaceId = dbStatsId || koreanName;

          if (thumbnailOnly) {
            if (thumbnailToSave) {
              supabase
                .from('place_stats')
                .upsert({ place_id: statsPlaceId, image_url: thumbnailToSave }, { onConflict: 'place_id' })
                .then(({ error }) => {
                  if (error) console.error('⚠️ Supabase Thumbnail Update Error:', error);
                });
            }
          } else {
            supabase
              .from('place_stats')
              .upsert({
                place_id: statsPlaceId,
                gallery_urls: finalResults,
                image_url: thumbnailToSave
              }, { onConflict: 'place_id' })
              .then(({ error }) => {
                if (error) console.error('⚠️ Supabase Update Error:', error);
              });
          }
        }
      } else {
        console.warn(`⚠️ 검색 최종 실패. 기본 Fallback 이미지를 렌더링합니다.`);
        const fallbackImgs = [
          { id: 'fallback-1', urls: { regular: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80' }, user: { name: 'GATEO Default' } },
          { id: 'fallback-2', urls: { regular: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' }, user: { name: 'GATEO Default' } }
        ];
        if (!isStale()) processAndSetImages(fallbackImgs);
      }
    } catch (error) {
      console.error("Gallery API Error:", error);
      if (forceRefresh) {
        unsplashPageRef.current = Math.max(1, unsplashPageRef.current - 1);
        pexelsPageRef.current = Math.max(0, pexelsPageRef.current - 1);
        restorePreservedImages();
      } else if (!isStale()) {
        processAndSetImages([]);
      }
    } finally {
      markFetchDone();
      finishLoading();
    }

  }, [ACCESS_KEY, PEXELS_KEY, sourceName, sourceId, locationSource, processAndSetImages, thumbnailOnly]);

  useEffect(() => {
    if (!enabled) {
      setIsImgLoading(false);
      setIsRefreshing(false);
      return undefined;
    }
    // fetchImages 진입 전 페인트에서도 스켈레톤 유지 (TourAPI 지연 블랙스크린 방지)
    if (stablePlaceKey) {
      setIsImgLoading(true);
      setIsRefreshing(false);
    }
    fetchImages();
    // stablePlaceKey — 장소 전환 시에만 재조회 (location 객체 참조만 바뀌는 hydration은 무시)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, stablePlaceKey]);

  /** 여행지 전환 시에만 확대 뷰 닫기 — fetchImages identity·객체 참조 변경 시 닫지 않음 */
  const prevStablePlaceKeyRef = useRef(stablePlaceKey);
  useEffect(() => {
    const prev = prevStablePlaceKeyRef.current;
    prevStablePlaceKeyRef.current = stablePlaceKey;
    if (prev && stablePlaceKey && prev !== stablePlaceKey) {
      setSelectedImg(null);
    }
  }, [stablePlaceKey]);

  /** 모바일 출처 같은 탭 복귀 — 새로고침 시 확대 뷰 복원 */
  useEffect(() => {
    if (!enabled || !stablePlaceKey || images.length === 0) return undefined;

    const pending = consumeGalleryAttributionReturnState(stablePlaceKey, 'gallery');
    if (!pending) return undefined;

    const img = findImageForReturnState(images, pending);
    if (img) {
      setSelectedImg(img);
    }
    return undefined;
  }, [enabled, stablePlaceKey, images]);

  /** bfcache 복귀 시 React 상태 유지 — pending sessionStorage만 정리 */
  useEffect(() => {
    if (!enabled || !stablePlaceKey) return undefined;

    const onPageShow = (event) => {
      if (!event.persisted) return;
      const pending = readGalleryAttributionReturnState();
      if (!pending || pending.placeKey !== stablePlaceKey) return;
      if ((pending.context || 'gallery') !== 'gallery') return;
      clearGalleryAttributionReturnState();
    };

    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [enabled, stablePlaceKey]);

  // 🚨 [New] 트래킹 API 호출 및 안전한 다운로드(Blob 방식) 핸들러 구현 (Fire & Forget 구조)
  const handleDownload = useCallback(async (imageObj) => {
    if (!imageObj || !ACCESS_KEY) return;

    // 1. Unsplash 가이드라인: download_location 엔드포인트 호출 (조회수/다운로드수 반영)
    if (imageObj.links?.download_location) {
      try {
        fetch(imageObj.links.download_location, {
          headers: { Authorization: `Client-ID ${ACCESS_KEY}` }
        }).catch(e => console.error("⚠️ Tracking API silently failed:", e));
      } catch {
        // 비관적 설계: 트래킹 실패가 사용자 다운로드를 막지 않도록 방치
      }
    }

    // 2. 실제 파일 다운로드 (CORS 문제 방지를 위한 Blob 변환 후 강제 다운로드)
    try {
      const imageUrl = imageObj.urls?.full || imageObj.urls?.regular;
      if (!imageUrl) return;

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;

      const authorName = imageObj.user?.name ? imageObj.user.name.replace(/\s+/g, '_') : 'GATEO';
      const idStr = imageObj.id?.toString() || '';
      const sourceSuffix = idStr.startsWith('pexels')
        ? 'pexels'
        : idStr.startsWith('tourapi') || imageObj.source === 'tourapi'
          ? 'tourapi'
          : 'unsplash';
      a.download = `${authorName}_${sourceSuffix}.jpg`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("🚨 Image download failed. Falling back to new tab.", error);
      // Fallback: Blob 다운로드 실패 시 새 창으로 열기
      if (imageObj.urls?.full) window.open(imageObj.urls.full, '_blank');
    }
  }, [ACCESS_KEY]);

  /** 깨진 이미지 — 세션 캐시만 갱신 (DB 영구삭제 아님) */
  const handleDropBrokenImage = useCallback((imageToDrop) => {
    if (!imageToDrop?.id) return;
    const newImages = allImagesRef.current.filter((img) => img.id !== imageToDrop.id);
    if (newImages.length === allImagesRef.current.length) return;
    allImagesRef.current = newImages;
    setImages(newImages);
    if (selectedImg?.id === imageToDrop.id) {
      setSelectedImg(newImages[0] || null);
    }
    const koreanName = currentKoreanNameRef.current;
    const primaryQuery = currentQueryRef.current;
    const placeKeyPart = currentPlaceKeyRef.current || koreanName || primaryQuery;
    const CACHE_KEY = `days_gallery_${encodeURIComponent(placeKeyPart)}_${primaryQuery}`;
    saveToSmartCache(CACHE_KEY, newImages);
  }, [selectedImg]);

  // 🚨 [New] 특정 이미지 영구 삭제 처리 (DB, 캐시, 상태 업데이트)
  const handleRemoveImage = useCallback(async (imageToRemove) => {
    if (!imageToRemove) return;

    // 1. 상태 업데이트
    const newImages = allImagesRef.current.filter(img => img.id !== imageToRemove.id);
    allImagesRef.current = newImages;
    setImages(newImages);

    const koreanName = currentKoreanNameRef.current;
    const primaryQuery = currentQueryRef.current;
    const placeKeyPart = currentPlaceKeyRef.current || koreanName || primaryQuery;
    const CACHE_KEY = `days_gallery_${encodeURIComponent(placeKeyPart)}_${primaryQuery}`;

    // 2. 캐시 업데이트
    saveToSmartCache(CACHE_KEY, newImages);

    // 3. DB 업데이트
    if (koreanName) {
      const thumbnailToSave = newImages[0]?.urls?.small || newImages[0]?.urls?.regular || '';
      try {
        const { error } = await supabase
          .from('place_stats')
          .update({
            gallery_urls: newImages,
            image_url: thumbnailToSave
          })
          .eq('place_id', koreanName);

        if (error) {
          console.error("🚨 이미지 삭제 후 DB 업데이트 실패:", error);
        } else {
          console.log(`✅ 이미지 삭제 완료 (DB 영구반영): ${imageToRemove.id}`);
        }
      } catch (err) {
        console.error("🚨 이미지 삭제 중 예외 발생:", err);
      }
    }
  }, []);

  const handleRefresh = useCallback(() => {
    const placeKey =
      resolveGalleryStablePlaceKey(locationSource) || currentPlaceKeyRef.current;
    if (!placeKey) return false;

    const now = Date.now();
    const lastAt = lastRefreshAtByPlaceRef.current.get(placeKey) || 0;
    if (now - lastAt < GALLERY_REFRESH_COOLDOWN_MS) {
      return false;
    }
    lastRefreshAtByPlaceRef.current.set(placeKey, now);
    fetchImages(true);
    return true;
  }, [fetchImages, locationSource]);

  const getRefreshCooldownRemaining = useCallback(() => {
    const placeKey =
      resolveGalleryStablePlaceKey(locationSource) || currentPlaceKeyRef.current;
    if (!placeKey) return 0;

    const lastAt = lastRefreshAtByPlaceRef.current.get(placeKey) || 0;
    const elapsed = Date.now() - lastAt;
    const remaining = GALLERY_REFRESH_COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, [locationSource]);

  // 반환 객체
  return {
    images,
    isImgLoading,
    isRefreshing,
    selectedImg,
    setSelectedImg,
    handleDownload,
    handleRemoveImage,
    handleDropBrokenImage,
    handleRefresh,
    getRefreshCooldownRemaining,
    refreshCooldownSec: GALLERY_REFRESH_COOLDOWN_MS / 1000,
  };
};
