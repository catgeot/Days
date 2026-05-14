// src/pages/Home/hooks/useHomeHandlers.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Fix/New] handleStartChat 로컬 부활 로직 유지: is_hidden이 true라면, false로 변경(부활) 후 채팅창 노출.
// 2. [Subtraction] handleClearChats의 분기 로직 제거 유지: 일괄적으로 'is_hidden: true' 처리.
// 3. [Subtraction] handleStartChat 내 불필요한 상태값(code: "CHAT") 전면 제거. 데이터의 실체(messages 배열)만을 Single Source of Truth로 삼음.
// 4. [Fix/Sync] handleGlobeClick 내 누락된 상태 동기화 추가: 지구본 클릭 시 생성된 마커(realPin)를 setSelectedLocation으로 현재 상태에 명시적으로 주입.
// 5. 🚨 [Fix/New] 바다 클릭 방어막 (Pessimistic First): 영문명을 얻지 못했거나 바다를 클릭한 경우 `loc-${lat}-${lng}` 포맷을 ID로 강제 할당하여 튕김 방지.

import { useCallback, useRef } from 'react';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '../lib/geocoding';
import { formatUrlName } from '../lib/formatUrlName';
import { supabase, recordInteraction } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { citiesData } from '../data/citiesData';
import { PERSONA_TYPES } from '../lib/prompts';
import { apiClient } from '../lib/apiClient';
import { enrichLocationWithRentalAirport } from '../../../utils/rentalAirportMatch.js';

// Haversine 공식을 이용한 두 좌표 간의 거리 계산 (단위: km)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const SMART_SEARCH_COORD_TOLERANCE_KM = 120;
const MOOD_VARIANT_RECENT_COOLDOWN_HOURS = 24;
const MOOD_HINT_KEYWORDS = [
  '감정', '기분', '마음', '분위기', '무드',
  '우울', '우울해', '울적', '침울', '슬픔', '슬퍼', '눈물',
  '외로', '쓸쓸', '적적', '공허', '허무', '허전',
  '번아웃', '지침', '지쳤', '피곤', '피폐', '무기력', '탈진', '현타', '현실자각',
  '스트레스', '압박', '불안', '초조', '답답', '갑갑', '멘붕', '멘탈',
  '화남', '화나', '짜증', '분노', '빡침',
  '설렘', '설레', '두근', '흥분', '떨림', '신남', '행복',
  '그리움', '향수', '추억', '보고싶', '회상',
  '힐링', '위로', '치유', '회복', '휴식', '쉼', '충전', '리프레시',
  '도망가고 싶다', '떠나고 싶다', '어디론가 가고 싶다', '바람 쐬고 싶다', '잠깐 쉬고 싶다',
  '놀고 싶다', '재밌는 데', '감성', '센치', '낭만', '로맨틱',
  'burnout', 'lonely', 'sad', 'angry', 'anxious', 'stressed', 'overwhelmed', 'tired',
  'excited', 'nostalgic', 'healing', 'rest', 'calm', 'refresh', 'escape'
];

export function useHomeHandlers({
  globeRef,
  user: _user,
  category,
  isPinVisible,
  selectedLocation,
  savedTrips,
  setSelectedLocation,
  addScoutPin,
  moveToLocation,
  processSearchKeywords,
  setIsPlaceCardOpen,
  setIsCardExpanded,
  setIsPinVisible,
  setDraftInput,
  setIsChatOpen,
  setInitialQuery,
  setActiveChatId,
  setChatDraft,
  setSavedTrips,
  fetchData: _fetchData,
  toggleBookmark
}) {

  const isTogglingRef = useRef(false);
  const isProcessingRef = useRef(false);

  const handleGlobeClick = useCallback(async ({ lat, lng, source, label, labelEn }) => {
    if (isProcessingRef.current) return;
    if (!lat || !lng) return;

    if (globeRef.current) globeRef.current.pauseRotation();

    isProcessingRef.current = true;

    try {
      // 🚨 시각적 피드백: 물방울 이펙트만 먼저 발생시킴 (카메라 비행은 최종 목적지에서만 1회 실행)
      if (globeRef.current && typeof globeRef.current.triggerRipple === 'function') {
          globeRef.current.triggerRipple(lat, lng);
      }

      const fallbackId = `loc-${lat}-${lng}`;
      const scanPin = {
          id: fallbackId,
          lat,
          lng,
          name: "위치 탐색 중...",
          country: "SEARCHING",
          isScanning: true,
          type: 'temp-base',
          category: category
      };

      addScoutPin(scanPin);
      setSelectedLocation(scanPin);
      setIsPlaceCardOpen(true);
      setIsCardExpanded(false);
      if (!isPinVisible) setIsPinVisible(true);
      // 🚨 여기서 미리 moveToLocation을 호출하지 않음으로써 모바일 GPU 과부하(리플 겹침/WebGL 마비) 방지

      const clickedLabel = typeof label === 'string' ? label.trim() : '';
      const clickedLabelEn = typeof labelEn === 'string' ? labelEn.trim() : '';
      if (source === 'label' && clickedLabel) {
        let slugBase = clickedLabelEn;
        if (!slugBase) {
          const addressFromLabelPoint = await getAddressFromCoordinates(lat, lng);
          slugBase = addressFromLabelPoint?.name_en || '';
        }

        const labelPin = enrichLocationWithRentalAirport({
          id: `label-${lat}-${lng}`,
          slug: formatUrlName(slugBase || clickedLabel),
          lat,
          lng,
          name: clickedLabel,
          name_en: slugBase || clickedLabel,
          name_ko: clickedLabel,
          type: 'temp-base',
          category: category,
          country: 'Explore',
          country_en: 'Explore',
          display_name: clickedLabel
        });

        addScoutPin(labelPin);
        setSelectedLocation(labelPin);
        moveToLocation(lat, lng, clickedLabel, category, { focus: false });
        processSearchKeywords(clickedLabel);
        recordInteraction(clickedLabel, 'view');
        return;
      }

      const addressData = await getAddressFromCoordinates(lat, lng);

      const isOcean = !addressData || (!addressData.city && !addressData.country);

      if (isOcean) {
        const allKnownPoints = [...TRAVEL_SPOTS, ...citiesData];
        let nearestPoint = null;
        let minDistance = Infinity;

        for (let pt of allKnownPoints) {
          if (pt.lat === undefined || pt.lng === undefined) continue;
          const dist = getDistanceKm(lat, lng, pt.lat, pt.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearestPoint = pt;
          }
        }

        if (nearestPoint) {
            const finalLoc = enrichLocationWithRentalAirport({
                ...nearestPoint,
                id: nearestPoint.id || `snap-${nearestPoint.lat}-${nearestPoint.lng}`,
                type: nearestPoint.type || 'temp-base',
                category: nearestPoint.category || category
            });

            addScoutPin(finalLoc);
            setSelectedLocation(finalLoc);
            moveToLocation(finalLoc.lat, finalLoc.lng, finalLoc.name, finalLoc.category, { focus: false });
            processSearchKeywords(finalLoc.name);
            recordInteraction(finalLoc.name, 'view');
            return;
        }
      }

      const name_en = addressData?.name_en || "";
      const display_name = addressData.city || addressData.country;

      const realPin = enrichLocationWithRentalAirport({
        id: !name_en ? fallbackId : Date.now(),
        slug: name_en ? formatUrlName(name_en) : fallbackId,
        lat,
        lng,
        name: display_name,
        name_en: name_en,
        name_ko: addressData?.name_ko || "",
        type: 'temp-base',
        category: category,
        country: addressData?.country || "Explore",
        country_en: addressData?.country_en || "Explore",
        display_name: display_name
      });

      addScoutPin(realPin);
      setSelectedLocation(realPin);
      moveToLocation(lat, lng, display_name, category, { focus: false });
      processSearchKeywords(display_name);
      recordInteraction(display_name, 'view');
    } catch (error) {
      console.error("Geocoding Error:", error);
      setSelectedLocation(null);
      setIsPlaceCardOpen(false);
    } finally {
      isProcessingRef.current = false;
    }
  }, [globeRef, category, isPinVisible, addScoutPin, setSelectedLocation, setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, moveToLocation, processSearchKeywords]);

  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;

    if (selectedLocation && selectedLocation.lat === loc.lat && selectedLocation.lng === loc.lng) {
      setIsPlaceCardOpen(true);
      return;
    }

    const name = loc.name || "Selected";
    const finalLoc = enrichLocationWithRentalAirport({
      ...loc,
      type: loc.type || 'temp-base',
      id: loc.id || `loc-${loc.lat}-${loc.lng}`,
      name: name,
      category: loc.category || category
    });

    moveToLocation(loc.lat, loc.lng, name, loc.category || category);
    addScoutPin(finalLoc);
    processSearchKeywords(name);

    setSelectedLocation(finalLoc);
    setIsPlaceCardOpen(true);
    setIsCardExpanded(false);
  }, [selectedLocation, category, moveToLocation, addScoutPin, processSearchKeywords, setSelectedLocation, setIsPlaceCardOpen, setIsCardExpanded]);

  const handleStartChat = useCallback(async (dest, initPayload, existingId = null) => {
    if (globeRef.current) globeRef.current.pauseRotation();

    const locationName = dest || selectedLocation?.name || "New Session";
    const persona = initPayload?.persona || (selectedLocation ? PERSONA_TYPES.INSPIRER : PERSONA_TYPES.GENERAL);

    // 🚨 1. 프론트엔드 상태(savedTrips)에서 탐색
    let targetTrip = savedTrips.find(t =>
      (existingId && t.id === existingId) ||
      (t.destination === locationName)
    );

    // 🚨 1-2. 로컬 부활 로직
    if (targetTrip && targetTrip.is_hidden) {
        targetTrip = { ...targetTrip, is_hidden: false };
        setSavedTrips(prev => prev.map(t => t.id === targetTrip.id ? targetTrip : t));

        if (!String(targetTrip.id).startsWith('temp_')) {
            supabase.from('saved_trips').update({ is_hidden: false }).eq('id', targetTrip.id).then(({error}) => {
                if(error) console.warn("🚨 [DB Error] Local Resurrection:", error);
            });
        }
    }

    // 🚨 2. DB에 숨겨져(is_hidden: true) 있는지 비관적 탐색 (부활 로직)
    if (!targetTrip) {
        const { data } = await supabase
            .from('saved_trips')
            .select('*')
            .eq('destination', locationName)
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            targetTrip = data[0];
            if (targetTrip.is_hidden) {
                await supabase.from('saved_trips').update({ is_hidden: false }).eq('id', targetTrip.id);
                targetTrip.is_hidden = false;
            }

            setSavedTrips(prev => {
                if (!prev.find(p => p.id === targetTrip.id)) return [targetTrip, ...prev];
                return prev.map(p => p.id === targetTrip.id ? targetTrip : p);
            });
        }
    }

    // 🚨 3. 찾았거나 부활시켰다면 해당 방으로 입장
    if (targetTrip) {
      setChatDraft(null);
      setActiveChatId(targetTrip.id);
      setInitialQuery(initPayload?.text ? { text: initPayload.text, persona } : null);
      setIsChatOpen(true);
      return;
    }

    // 4. DB에 행이 없으면: 빈 saved_trips 를 만들지 않고, 첫 메시지 전송 시 insert (setChatDraft + 모달만 오픈)
    const isSameLocation = selectedLocation && (selectedLocation.name === locationName || selectedLocation.display_name === locationName);
    const targetLat = isSameLocation ? (selectedLocation.lat || 0) : 0;
    const targetLng = isSameLocation ? (selectedLocation.lng || 0) : 0;

    setChatDraft({
      destination: locationName,
      lat: targetLat,
      lng: targetLng,
      persona,
      category: category
    });
    setActiveChatId(null);
    setInitialQuery(initPayload?.text ? { text: initPayload.text, persona } : null);
    setIsChatOpen(true);
  }, [globeRef, savedTrips, selectedLocation, category, setActiveChatId, setInitialQuery, setIsChatOpen, setSavedTrips, setChatDraft]);

  const handleToggleBookmark = useCallback(async (loc) => {
    if (!loc || !loc.name || isTogglingRef.current) return;

    isTogglingRef.current = true;
    try {
      await toggleBookmark(loc);
    } catch (error) {
      console.error("Bookmark Error:", error);
    } finally {
      isTogglingRef.current = false;
    }
  }, [toggleBookmark]);

  const handleSmartSearch = useCallback(async (input) => {
    if (!input) return;

    if (typeof input === 'object' && input.lat !== undefined && input.lng !== undefined) {
      handleLocationSelect(input);
      return input;
    }

    const query = input.trim();
    setDraftInput(query);
    processSearchKeywords(query);

    const localSpot = TRAVEL_SPOTS.find(s =>
      s.name.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase())
    ) || TRAVEL_SPOTS.find(s =>
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.country_en && s.country_en.toLowerCase() === query.toLowerCase())
    );
    if (localSpot) {
      handleLocationSelect(localSpot);
      return localSpot;
    }

    const citySpot = citiesData.find(c =>
      c.name.toLowerCase() === query.toLowerCase() ||
      (c.name_en && c.name_en.toLowerCase() === query.toLowerCase())
    ) || citiesData.find(c =>
      (c.country && c.country.toLowerCase() === query.toLowerCase()) ||
      (c.country_en && c.country_en.toLowerCase() === query.toLowerCase())
    );

    if (citySpot) {
      const normalizedCity = {
        id: `city-${citySpot.lat}-${citySpot.lng}`,
        slug: citySpot.slug,
        name: citySpot.name,
        name_en: citySpot.name_en || citySpot.name,
        country: citySpot.country || "Explore",
        country_en: citySpot.country_en || "Explore",
        lat: citySpot.lat,
        lng: citySpot.lng,
        category: category,
        desc: citySpot.desc,
        type: 'temp-base'
      };
      handleLocationSelect(normalizedCity);
      return normalizedCity;
    }

    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) return null;

    const isLikelyMoodQuery = (text) => {
      const normalized = (text || '').toLowerCase().trim();
      if (!normalized) return false;
      if (normalized.length >= 8) return true;
      if (/[?!.]/.test(normalized)) return true;
      return MOOD_HINT_KEYWORDS.some((keyword) => normalized.includes(keyword));
    };

    const pickMoodVariant = (variants = []) => {
      if (!Array.isArray(variants) || variants.length === 0) return null;
      const now = Date.now();
      const weighted = variants.map((variant, index) => {
        const servedCount = Number(variant?.served_count || 0);
        const lastServedAt = variant?.last_served_at ? new Date(variant.last_served_at).getTime() : null;
        const cooledDown = !lastServedAt || (now - lastServedAt) > (MOOD_VARIANT_RECENT_COOLDOWN_HOURS * 60 * 60 * 1000);
        const recencyWeight = cooledDown ? 1 : 0.25;
        const countWeight = 1 / (1 + servedCount);
        const randomWeight = 0.8 + Math.random() * 0.4;
        const score = recencyWeight * countWeight * randomWeight;
        return { index, variant, score };
      });

      weighted.sort((a, b) => b.score - a.score);
      return weighted[0];
    };

    const verifyAndNormalizeCandidate = async (candidate, originalQuery, sourceLabel = "AI") => {
      const rawLat = Number(candidate?.lat);
      const rawLng = Number(candidate?.lng);
      const hasRawCoords =
        Number.isFinite(rawLat) &&
        Number.isFinite(rawLng) &&
        Math.abs(rawLat) <= 90 &&
        Math.abs(rawLng) <= 180;

      if (!hasRawCoords) return null;

      const nameForLookup = candidate?.name_en || candidate?.name || "";
      if (!nameForLookup) return null;

      const countryForLookup = candidate?.country_en || candidate?.country || "";
      const verifiedByNameCountry = await getCoordinatesFromAddress(
        countryForLookup ? `${nameForLookup}, ${countryForLookup}` : nameForLookup
      );
      const verifiedByNameOnly = verifiedByNameCountry || await getCoordinatesFromAddress(nameForLookup);
      if (!verifiedByNameOnly) return null;

      const distanceKm = getDistanceKm(rawLat, rawLng, verifiedByNameOnly.lat, verifiedByNameOnly.lng);
      if (distanceKm > SMART_SEARCH_COORD_TOLERANCE_KM) {
        console.warn(`[Smart Search ${sourceLabel}] 지명-좌표 불일치 차단: "${nameForLookup}" (${distanceKm.toFixed(1)}km)`);
        return null;
      }

      const reasonText = typeof candidate?.reason === 'string' ? candidate.reason.trim() : '';
      const baseDesc = `"${originalQuery}"의 분위기를 "${candidate?.name || nameForLookup}" 여정으로 연결해 탐색합니다.`;
      const enrichedDesc = reasonText ? `${baseDesc} ${reasonText}` : baseDesc;

      return {
        id: `search-${verifiedByNameOnly.lat}-${verifiedByNameOnly.lng}`,
        slug: formatUrlName(verifiedByNameOnly.name_en || verifiedByNameOnly.name || nameForLookup),
        name: candidate?.name || verifiedByNameOnly.name || nameForLookup,
        name_en: verifiedByNameOnly.name_en || candidate?.name_en || candidate?.name || nameForLookup,
        country: verifiedByNameOnly.country || candidate?.country || "Explore",
        country_en: verifiedByNameOnly.country_en || candidate?.country_en || "Explore",
        lat: verifiedByNameOnly.lat,
        lng: verifiedByNameOnly.lng,
        category: category,
        desc: enrichedDesc,
        type: 'temp-base',
        isCorrected: true,
        originalQuery: originalQuery
      };
    };

    const coords = await getCoordinatesFromAddress(query);

    if (coords) {
      const normalizedLoc = {
        id: `search-${coords.lat}-${coords.lng}`,
        slug: formatUrlName(coords.name_en || coords.name),
        name: query,
        name_en: coords.name_en || coords.name,
        country: coords.country || "Explore",
        country_en: coords.country_en || "Explore",
        lat: coords.lat,
        lng: coords.lng,
        category: category,
        desc: `${query} (${coords.country || "Explore"}) 지역을 탐색합니다.`,
        type: 'temp-base'
      };
      handleLocationSelect(normalizedLoc);
      return normalizedLoc;
    } else {
      // 🚨 [New] Smart Search Fallback (AI 자동 교정 엔진)
      let isCorrected = false;
      try {
        const lowerQuery = query.toLowerCase();
        const treatAsMoodQuery = isLikelyMoodQuery(query);
        // 1. 먼저 DB에서 캐시된 교정 결과가 있는지 확인 (Phase 1.5)
        const { data: cachedDict } = await supabase
          .from('search_dictionary')
          .select('*')
          .eq('original_query', lowerQuery)
          .single();

        if (cachedDict && cachedDict.location_data) {
          console.log(`[Smart Search DB Cache] "${query}" -> "${cachedDict.corrected_query}" (캐시 적중)`);
          const parsedData = cachedDict.location_data;
          const isMoodCache = parsedData?.intent_type === 'mood' && Array.isArray(parsedData?.variants);

          if (isMoodCache) {
            const picked = pickMoodVariant(parsedData.variants);
            if (picked?.variant) {
              const verifiedMoodLoc = await verifyAndNormalizeCandidate(picked.variant, query, "CacheMood");
              if (verifiedMoodLoc) {
                handleLocationSelect(verifiedMoodLoc);
                setDraftInput(verifiedMoodLoc.name);
                processSearchKeywords(verifiedMoodLoc.name);
                isCorrected = true;
                return verifiedMoodLoc;

                const nextVariants = [...parsedData.variants];
                nextVariants[picked.index] = {
                  ...nextVariants[picked.index],
                  served_count: Number(nextVariants[picked.index]?.served_count || 0) + 1,
                  last_served_at: new Date().toISOString()
                };

                supabase
                  .from('search_dictionary')
                  .update({
                    corrected_query: verifiedMoodLoc.name,
                    location_data: { ...parsedData, variants: nextVariants, last_pick_at: new Date().toISOString() }
                  })
                  .eq('id', cachedDict.id)
                  .then(({ error }) => {
                    if (error) console.warn("[Smart Search Mood Cache Update Error]", error);
                  });
              }
            }
          } else {
            const verifiedCachedLoc = await verifyAndNormalizeCandidate(parsedData, query, "Cache");
            if (verifiedCachedLoc) {
              verifiedCachedLoc.desc = `"${query}" 검색에 실패하여 "${verifiedCachedLoc.name}"(으)로 교정하여 탐색합니다. (캐시 기반)`;
              handleLocationSelect(verifiedCachedLoc);
              setDraftInput(verifiedCachedLoc.name);
              processSearchKeywords(verifiedCachedLoc.name);
              isCorrected = true;
              return verifiedCachedLoc;
            }
          }
        }

        if (!isCorrected) {
          // 2. 캐시가 없으면 Proxy를 통해 AI 호출
          try {
            const aiPrompt = treatAsMoodQuery
              ? `사용자가 여행 검색창에 "${query}"라고 입력했습니다.
입력값은 오타일 수도 있고, 감정(예: 번아웃, 설렘, 흥분, 화남, 그리움), 분위기, 사물, 문장일 수도 있습니다.

당신은 사용자의 마음을 여행 계획으로 연결하는 감성 여행 큐레이터입니다.
다음 규칙을 반드시 지키세요.
1) 실제로 존재하는 여행지 3곳을 제안합니다.
2) 지명/국가/좌표가 실제로 일치해야 합니다. 추측 지명, 가상 지명, 별칭, 신조어는 금지합니다.
3) 오타로 보이면 가장 가능성 높은 실제 지명으로 교정합니다.
4) 감정/사물/상황 입력이면 그 감정을 환기하거나 확장하기 좋은 실제 여행지를 매칭합니다.
5) 좌표는 해당 지명의 중심 좌표를 사용하세요.

응답은 반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요.
{
  "intent_type": "mood",
  "candidates": [
    {
      "name": "정확한 지명(한국어)",
      "name_en": "정확한 지명(영어)",
      "country": "소속 국가(한국어)",
      "country_en": "소속 국가(영어)",
      "lat": 위도(숫자),
      "lng": 경도(숫자),
      "reason": "이 목적지가 현재 입력 감정을 어떻게 다음 계획으로 연결하는지 1문장 (한국어, 40자 내외)"
    }
  ]
}`
              : `사용자가 여행 검색창에 "${query}"라고 입력했습니다.
입력값은 오타일 가능성이 높습니다. 가장 가능성 높은 실제 지명 1곳으로 교정하세요.
응답은 반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요.
{
  "intent_type": "typo",
  "name": "정확한 지명(한국어)",
  "name_en": "정확한 지명(영어)",
  "country": "소속 국가(한국어)",
  "country_en": "소속 국가(영어)",
  "lat": 위도(숫자),
  "lng": 경도(숫자),
  "reason": "교정 이유 1문장 (한국어, 30자 내외)"
}`;

            const aiResponse = await apiClient.fetchProxyGemini(
              null, // 🚨 더 이상 클라이언트에서 API 키를 넘기지 않습니다. 서버에서 처리합니다.
              [],
              "당신은 감정 기반 여행지 매칭 전문가입니다. 실재 지명만 사용하고 오직 유효한 JSON만 출력해야 합니다.",
              aiPrompt,
              [],
              "gemini-3.1-flash-lite-preview"
            );

            const cleanJsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanJsonString);
            if (treatAsMoodQuery) {
              const rawCandidates = Array.isArray(parsedData?.candidates) ? parsedData.candidates : [];
              const verifiedCandidates = [];
              for (const candidate of rawCandidates) {
                const verified = await verifyAndNormalizeCandidate(candidate, query, "AIMood");
                if (verified && !verifiedCandidates.find((v) => v.name_en === verified.name_en)) {
                  verifiedCandidates.push({
                    name: verified.name,
                    name_en: verified.name_en,
                    country: verified.country,
                    country_en: verified.country_en,
                    lat: verified.lat,
                    lng: verified.lng,
                    reason: candidate?.reason || '',
                    served_count: 0,
                    last_served_at: null
                  });
                }
              }

              const picked = pickMoodVariant(verifiedCandidates);
              if (picked?.variant) {
                const chosen = picked.variant;
                const chosenLoc = await verifyAndNormalizeCandidate(chosen, query, "AIMoodPicked");
                if (chosenLoc) {
                  handleLocationSelect(chosenLoc);
                  setDraftInput(chosenLoc.name);
                  processSearchKeywords(chosenLoc.name);
                  isCorrected = true;
                  return chosenLoc;

                  const variantsForCache = verifiedCandidates.map((variant, idx) => ({
                    ...variant,
                    served_count: idx === picked.index ? 1 : 0,
                    last_served_at: idx === picked.index ? new Date().toISOString() : null
                  }));

                  const cachePayload = {
                    corrected_query: chosenLoc.name,
                    location_data: {
                      intent_type: 'mood',
                      source: 'ai',
                      variants: variantsForCache,
                      last_pick_at: new Date().toISOString()
                    }
                  };

                  if (cachedDict?.id) {
                    supabase.from('search_dictionary').update(cachePayload).eq('id', cachedDict.id).then(({ error }) => {
                      if (error) console.warn("[Smart Search Mood Cache Upsert Error]", error);
                    });
                  } else {
                    supabase.from('search_dictionary').insert({
                      original_query: lowerQuery,
                      ...cachePayload
                    }).then(({ error }) => {
                      if (error) console.warn("[Smart Search Mood Cache Insert Error]", error);
                    });
                  }
                }
              }
            } else {
              const cleanName = parsedData.name;
              if (cleanName && cleanName !== query && cleanName.length > 0 && cleanName.length < 30) {
                console.log(`[Smart Search AI] AI가 "${query}"를 "${cleanName}"(으)로 교정 및 좌표를 파싱했습니다.`, parsedData);
                const verifiedAiLoc = await verifyAndNormalizeCandidate(parsedData, query, "AI");

                if (verifiedAiLoc) {
                  // 3. AI 교정 성공 + 실재 검증 성공 시에만 캐시 저장
                  supabase.from('search_dictionary').insert({
                    original_query: lowerQuery,
                    corrected_query: verifiedAiLoc.name,
                    location_data: {
                      intent_type: 'typo',
                      name: verifiedAiLoc.name,
                      name_en: verifiedAiLoc.name_en,
                      country: verifiedAiLoc.country,
                      country_en: verifiedAiLoc.country_en,
                      lat: verifiedAiLoc.lat,
                      lng: verifiedAiLoc.lng,
                      reason: parsedData.reason || ""
                    }
                  }).then(({ error }) => {
                    if (error) console.warn("[Smart Search Cache Insert Error]", error);
                  });

                  handleLocationSelect(verifiedAiLoc);
                  setDraftInput(verifiedAiLoc.name);
                  processSearchKeywords(verifiedAiLoc.name);
                  isCorrected = true;
                  return verifiedAiLoc;
                }
              }
            }
          } catch (aiErr) {
            console.warn("Smart Search AI Proxy Error:", aiErr);
          }
        }
      } catch (err) {
        console.warn("Smart Search Fallback Error:", err);
      }

      if (!isCorrected) {
        const wantsAiChat = window.confirm(`정확한 지도 위치를 찾을 수 없습니다.\n대신 AI 가이드에게 '${query}'에 대해 물어보시겠습니까?`);
        if (wantsAiChat) {
          setSelectedLocation(null);
          handleStartChat(query, { text: query, persona: PERSONA_TYPES.GENERAL });
          setDraftInput('');
        }
        return null;
      }
    }
    return null;
  }, [category, processSearchKeywords, setDraftInput, handleLocationSelect, setSelectedLocation, handleStartChat]);

  const handleClearChats = useCallback(async () => {
    const isConfirm = window.confirm("채팅 목록을 모두 비우시겠습니까? (기록은 보존되며 동일 장소 채팅 시 복구됩니다.)");
    if (isConfirm) {
      await supabase.from('saved_trips').update({ is_hidden: true }).eq('category', category);

      setSavedTrips(prev => prev.map(t => {
        if (t.category === category) return { ...t, is_hidden: true };
        return t;
      }));

      setActiveChatId(null);
      setIsChatOpen(false);
    }
  }, [category, setActiveChatId, setIsChatOpen, setSavedTrips]);

  return {
    handleGlobeClick,
    handleLocationSelect,
    handleStartChat,
    handleToggleBookmark,
    handleSmartSearch,
    handleClearChats
  };
}
