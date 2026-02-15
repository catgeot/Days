// src/pages/Home/hooks/useHomeHandlers.js
// 🚨 [Fix/New] 연타 방어 락(Lock) 기능과 유령 핀 강제 승격 로직(handleToggleBookmark) 추가

import { useCallback, useRef } from 'react'; // 🚨 useRef 추가
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
  toggleBookmark // 🚨 [Fix] 파라미터로 toggleBookmark 수신 추가
}) {

  // 🚨 [비관적 방어] 네트워크 지연 중 중복 클릭을 막기 위한 물리적 잠금장치
  const isTogglingRef = useRef(false);

  // 1. 지구본 클릭 핸들러
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

  // 2. 위치 선택 핸들러
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

  // 3. 채팅 시작 핸들러
  const handleStartChat = useCallback(async (dest, initPayload, existingId = null) => {
    if (globeRef.current) globeRef.current.pauseRotation();

    if (initPayload?.mode === 'view_history' || existingId) {
      const targetId = existingId || savedTrips.find(t => (initPayload?.id && t.id === initPayload.id) || (dest && t.destination === dest))?.id;
      if (targetId) {
        setActiveChatId(targetId);
        setInitialQuery(null); 
        setIsChatOpen(true);
        return;
      }
    }

    const persona = initPayload?.persona || (selectedLocation ? PERSONA_TYPES.INSPIRER : PERSONA_TYPES.GENERAL);
    const locationName = dest || selectedLocation?.name || "New Session";
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

  // 🚨 [New] 4. 북마크(별표) 토글 핸들러 - 유령 핀 승격 핵심 로직
  const handleToggleBookmark = useCallback(async (loc) => {
    if (!loc || !loc.name || isTogglingRef.current) return;

    isTogglingRef.current = true; // 락(Lock) 온
    try {
      // [Fact Check] DB에 존재하는 여행지인지 확인 (destination == name 기준)
      const existingTrip = savedTrips.find(t => t.destination === loc.name);

      if (existingTrip) {
        // [Case A] 이미 방이 존재함 (DB 갱신만 수행)
        await toggleBookmark(existingTrip.id);
      } else {
        // [Case B] 유령 핀 -> 강제 저장 (DB 승격 및 북마크 자동 활성화)
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
          is_bookmarked: true, // 🚨 저장과 동시에 별표 적용
          persona,
          category: category
        };
        await saveNewTrip(newTrip);
      }
    } catch (error) {
      console.error("Bookmark Error:", error);
    } finally {
      isTogglingRef.current = false; // 락(Lock) 오프
    }
  }, [savedTrips, toggleBookmark, saveNewTrip, category]);

  // 5. 스마트 검색 핸들러
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

  // 6. 대화 리스트 영구 삭제(Trash) 핸들러
  const handleClearChats = useCallback(async () => {
    if (user) {
      const isConfirm = window.confirm("모든 대화 기록을 영구 삭제하시겠습니까? (복구 불가)");
      if (isConfirm) {
        const { error } = await supabase.from('saved_trips').delete().eq('code', 'CHAT').eq('user_id', user.id);
        if (!error) {
          fetchData();
          setActiveChatId(null);
          setIsChatOpen(false);
        } else {
          alert("삭제 중 오류가 발생했습니다.");
        }
      }
    } else {
      const isConfirm = window.confirm("모든 임시 대화 기록을 삭제하시겠습니까?");
      if (isConfirm) {
        setSavedTrips([]); 
        setActiveChatId(null);
        setIsChatOpen(false); 
      }
    }
  }, [user, fetchData, setActiveChatId, setIsChatOpen, setSavedTrips]);

  return {
    handleGlobeClick,
    handleLocationSelect,
    handleStartChat,
    handleToggleBookmark, // 🚨 외부 노출
    handleSmartSearch,
    handleClearChats
  };
}