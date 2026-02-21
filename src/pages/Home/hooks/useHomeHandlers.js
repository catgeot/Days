// src/pages/Home/hooks/useHomeHandlers.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Maintain] handleGlobeClick: 바다나 유효하지 않은 지형 클릭 시 쓰레기 데이터 생성을 막는 로직 '유지' (Pessimistic)
// 2. [Maintain] handleClearChats: '전체 지우기' 룰 '유지'
// 3. [Subtraction] SEARCH_MAP 인터셉터 '제거' -> 검색어는 TRAVEL_SPOTS를 먼저 타게 되므로, citiesData.js만 완벽하면 Geocoding API의 오작동을 원천 회피함.
// 4. [Fix/New] handleSmartSearch 내 citiesData 검색 파이프라인 추가
// 5. 🚨 [Fix/New] Schema First 위반 수정: description 키값을 기존 데이터 스키마에 맞게 desc로 원복하여 상세 카드에 정상 렌더링되도록 함.

import { useCallback, useRef } from 'react';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '../lib/geocoding';
import { supabase, recordInteraction } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { citiesData } from '../data/citiesData'; 
import { PERSONA_TYPES, getSystemPrompt } from '../lib/prompts';

export function useHomeHandlers({
  globeRef,
  user,
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
  saveNewTrip,
  setSavedTrips,
  fetchData,
  toggleBookmark 
}) {

  const isTogglingRef = useRef(false);

  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (!lat || !lng) return;
    if (globeRef.current) globeRef.current.pauseRotation();
    
    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country;
      
      // 🚨 [Maintain] 데이터가 없으면 UI를 그리지 않고 조용히 패스
      if (!name) {
         if (globeRef.current && typeof globeRef.current.resumeRotation === 'function') {
             globeRef.current.resumeRotation();
         }
         return;
      }

      const tempId = Date.now();
      const realPin = { 
        id: tempId, 
        lat, 
        lng, 
        name: name, 
        name_en: name, 
        type: 'temp-base', 
        category: category,
        country: addressData?.country || "Unknown",
        display_name: name 
      };
      
      addScoutPin(realPin);
      setIsPlaceCardOpen(true);
      setIsCardExpanded(false); 
      
      if (!isPinVisible) setIsPinVisible(true);

      moveToLocation(lat, lng, name, category);
      processSearchKeywords(name);
      
      recordInteraction(name, 'view'); 
    } catch (error) {
      console.error("Geocoding Error:", error);
    }
  }, [globeRef, category, isPinVisible, addScoutPin, setIsPlaceCardOpen, setIsCardExpanded, setIsPinVisible, moveToLocation, processSearchKeywords]);

  const handleLocationSelect = useCallback((loc) => {
    if (!loc) return;

    if (selectedLocation && selectedLocation.lat === loc.lat && selectedLocation.lng === loc.lng) {
      setIsPlaceCardOpen(true); 
      return;
    }

    const name = loc.name || "Selected";
    const finalLoc = { 
      ...loc, 
      type: loc.type || 'temp-base', 
      id: loc.id || `loc-${loc.lat}-${loc.lng}`,
      name: name,
      category: loc.category || category 
    };

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

    const existingTrip = savedTrips.find(t => 
      (existingId && t.id === existingId) || 
      (t.destination === locationName && t.category === category)
    );

    if (existingTrip) {
      setActiveChatId(existingTrip.id);
      setInitialQuery(initPayload?.text ? { text: initPayload.text, persona } : null); 
      setIsChatOpen(true);
      return; 
    }

    const systemPrompt = getSystemPrompt(persona, locationName);
    const isSameLocation = selectedLocation && (selectedLocation.name === locationName || selectedLocation.display_name === locationName);
    const targetLat = isSameLocation ? (selectedLocation.lat || 0) : 0;
    const targetLng = isSameLocation ? (selectedLocation.lng || 0) : 0;

    const newTrip = { 
      destination: locationName, 
      lat: targetLat, 
      lng: targetLng, 
      date: new Date().toLocaleDateString(), 
      code: "CHAT",
      prompt_summary: systemPrompt,
      messages: [], 
      is_bookmarked: false, 
      persona,
      category: category
    };
    
    const created = await saveNewTrip(newTrip);
    if (created) { 
      setActiveChatId(created.id); 
      setInitialQuery({ text: initPayload?.text || "", persona }); 
      setIsChatOpen(true); 
    }
  }, [globeRef, savedTrips, selectedLocation, category, saveNewTrip, setActiveChatId, setInitialQuery, setIsChatOpen]);

  const handleToggleBookmark = useCallback(async (loc) => {
    if (!loc || !loc.name || isTogglingRef.current) return;

    isTogglingRef.current = true;
    try {
      const existingTrip = savedTrips.find(t => t.destination === loc.name);

      if (existingTrip) {
        await toggleBookmark(existingTrip.id);
      } else {
        const persona = PERSONA_TYPES.GENERAL;
        const systemPrompt = getSystemPrompt(persona, loc.name);

        const newTrip = {
          destination: loc.name,
          lat: loc.lat || 0,
          lng: loc.lng || 0,
          date: new Date().toLocaleDateString(),
          code: "CHAT",
          prompt_summary: systemPrompt,
          messages: [],
          is_bookmarked: true, 
          persona,
          category: category
        };
        await saveNewTrip(newTrip);
      }
    } catch (error) {
      console.error("Bookmark Error:", error);
    } finally {
      isTogglingRef.current = false; 
    }
  }, [savedTrips, toggleBookmark, saveNewTrip, category]);

  const handleSmartSearch = useCallback(async (input) => {
    if (!input) return;
    
    if (typeof input === 'object' && input.lat && input.lng) {
      handleLocationSelect(input);
      return;
    }

    const query = input.trim(); 
    setDraftInput(query);
    processSearchKeywords(query);

    // 1순위: TRAVEL_SPOTS 검색
    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase()) 
    );
    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    // 2순위: citiesData 검색
    const citySpot = citiesData.find(c =>
      c.name.toLowerCase() === query.toLowerCase() ||
      (c.name_en && c.name_en.toLowerCase() === query.toLowerCase())
    );
    
    if (citySpot) {
      const normalizedCity = {
        id: `city-${citySpot.lat}-${citySpot.lng}`,
        name: citySpot.name,
        name_en: citySpot.name_en || citySpot.name,
        country: "Explore", 
        lat: citySpot.lat,
        lng: citySpot.lng,
        category: category,
        desc: citySpot.desc, // 🚨 [Fix/New] description -> desc 로 원복 (스키마 일치)
        type: 'temp-base'
      };
      handleLocationSelect(normalizedCity);
      return;
    }

    // 3순위: 카테고리/컨셉 검색
    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) return;

    // 4순위: 지오코딩 API Fallback
    const coords = await getCoordinatesFromAddress(query);
    
    if (coords) {
      const normalizedLoc = {
        id: `search-${coords.lat}-${coords.lng}`,
        name: query, 
        name_en: coords.name, 
        country: coords.country || "Explore",
        lat: coords.lat,
        lng: coords.lng,
        category: category,
        desc: `${query} (${coords.country}) 지역을 탐색합니다.`, // 🚨 [Fix/New] 여기도 desc 로 통일
        type: 'temp-base'
      };
      handleLocationSelect(normalizedLoc);
    } else {
      const wantsAiChat = window.confirm(`정확한 지도 위치를 찾을 수 없습니다.\n대신 AI 가이드에게 '${query}'에 대해 물어보시겠습니까?`);
      if (wantsAiChat) {
        setSelectedLocation(null); 
        handleStartChat(query, { text: query, persona: PERSONA_TYPES.GENERAL });
        setDraftInput(''); 
      }
    }
  }, [category, processSearchKeywords, setDraftInput, handleLocationSelect, setSelectedLocation, handleStartChat]);

  const handleClearChats = useCallback(async () => {
    const isConfirm = window.confirm("모든 대화 기록을 지우시겠습니까? (즐겨찾기된 장소는 유지됩니다)");
    if (isConfirm) {
      await supabase.from('saved_trips').update({ messages: [] }).eq('is_bookmarked', true).eq('category', category);
      await supabase.from('saved_trips').delete().eq('is_bookmarked', false).eq('category', category);

      setSavedTrips(prev => prev.map(t => {
        if (t.category === category) {
          if (t.is_bookmarked) return { ...t, messages: [] };
          return null; 
        }
        return t; 
      }).filter(Boolean)); 

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