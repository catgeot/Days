// src/pages/Home/hooks/useHomeHandlers.js
// 🚨 [Fix/New] 수정 이유: 
// 1. handleClearChats: '전체 지우기' 클릭 시에도 개별 휴지통과 동일하게 조건부 삭제(A/B) 룰을 적용하여 DB 무결성 유지.

import { useCallback, useRef } from 'react';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '../lib/geocoding';
import { supabase, recordInteraction } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
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
    
    const tempId = Date.now();
    const tempPin = { id: tempId, lat, lng, name: "Scanning...", type: 'temp-base', category: category };

    addScoutPin(tempPin);
    setIsPlaceCardOpen(true);
    setIsCardExpanded(false); 
    
    if (!isPinVisible) setIsPinVisible(true);

    moveToLocation(lat, lng, "Scanning...", category);

    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      const name = addressData?.city || addressData?.country || `Point (${lat.toFixed(1)}, ${lng.toFixed(1)})`;

      processSearchKeywords(name);
      
      const realPin = { 
        ...tempPin, 
        name, 
        name_en: name, 
        country: addressData?.country || "Unknown",
        display_name: name 
      };
      
      addScoutPin(realPin);
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

    const localSpot = TRAVEL_SPOTS.find(s => 
      s.name.toLowerCase() === query.toLowerCase() || 
      s.country.toLowerCase() === query.toLowerCase() ||
      (s.name_en && s.name_en.toLowerCase() === query.toLowerCase()) 
    );
    if (localSpot) {
      handleLocationSelect(localSpot);
      return;
    }

    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) return;

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
        description: `${query} (${coords.country}) 지역을 탐색합니다.`,
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

  // 🚨 [Fix] 전체 지우기 시에도 조건부 삭제(A/B) 룰을 완벽하게 적용
  const handleClearChats = useCallback(async () => {
    const isConfirm = window.confirm("모든 대화 기록을 지우시겠습니까? (즐겨찾기된 장소는 유지됩니다)");
    if (isConfirm) {
      // 1. 즐겨찾기 된 방: DB에서 messages 배열만 비움 (일괄 처리)
      await supabase.from('saved_trips').update({ messages: [] }).eq('is_bookmarked', true).eq('category', category);

      // 2. 즐겨찾기 안 된 방: DB에서 행 전체를 물리적 삭제 (일괄 처리)
      await supabase.from('saved_trips').delete().eq('is_bookmarked', false).eq('category', category);

      // 3. UI(Local State) 동기화
      setSavedTrips(prev => prev.map(t => {
        if (t.category === category) {
          if (t.is_bookmarked) return { ...t, messages: [] };
          return null; // 조건 B에 해당하여 삭제될 항목
        }
        return t; // 다른 카테고리는 건드리지 않음
      }).filter(Boolean)); // null로 마킹된 항목 제거

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