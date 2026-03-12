// src/pages/Home/hooks/useHomeHandlers.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fix/New] handleStartChat 로컬 부활 로직 유지: is_hidden이 true라면, false로 변경(부활) 후 채팅창 노출.
// 2. [Subtraction] handleClearChats의 분기 로직 제거 유지: 일괄적으로 'is_hidden: true' 처리.
// 3. [Subtraction] handleStartChat 내 불필요한 상태값(code: "CHAT") 전면 제거. 데이터의 실체(messages 배열)만을 Single Source of Truth로 삼음.
// 4. [Fix/Sync] handleGlobeClick 내 누락된 상태 동기화 추가: 지구본 클릭 시 생성된 마커(realPin)를 setSelectedLocation으로 현재 상태에 명시적으로 주입.
// 5. 🚨 [Fix/New] 바다 클릭 방어막 (Pessimistic First): 영문명을 얻지 못했거나 바다를 클릭한 경우 `loc-${lat}-${lng}` 포맷을 ID로 강제 할당하여 튕김 방지.

import { useCallback, useRef } from 'react';
import { getAddressFromCoordinates, getCoordinatesFromAddress } from '../lib/geocoding';
import { supabase, recordInteraction } from '../../../shared/api/supabase';
import { TRAVEL_SPOTS } from '../data/travelSpots';
import { citiesData } from '../data/citiesData'; 
import { PERSONA_TYPES, getSystemPrompt } from '../lib/prompts';

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
  const isProcessingRef = useRef(false);

  const handleGlobeClick = useCallback(async ({ lat, lng }) => {
    if (isProcessingRef.current) return;
    if (!lat || !lng) return;

    if (globeRef.current) globeRef.current.pauseRotation();
    
    // 🚨 즉각적인 시각적/상태적 피드백 제공 (로딩 UI)
    isProcessingRef.current = true;
    
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
    moveToLocation(lat, lng, "위치 탐색 중...", category);
    
    try {
      const addressData = await getAddressFromCoordinates(lat, lng);
      
      // 🚨 [Fix/New] Pessimistic First: 바다 한가운데 등 데이터를 전혀 받지 못한 경우의 안전망
      const isOcean = !addressData || (!addressData.city && !addressData.country);
      
      const name_en = addressData?.name_en || "";
      const display_name = isOcean ? "미지의 탐험지" : (addressData.city || addressData.country);

      const realPin = { 
        // 영문명이 없거나 바다인 경우, 라우터가 역추적할 수 있도록 좌표 기반 ID 부여
        id: isOcean || !name_en ? fallbackId : Date.now(), 
        lat, 
        lng, 
        name: display_name, 
        name_en: name_en, 
        type: 'temp-base', 
        category: category,
        country: addressData?.country || "Ocean",
        country_en: addressData?.country_en || "Ocean",
        display_name: display_name 
      };
      
      addScoutPin(realPin);
      
      // 상태 동기화 (진실의 공급원 업데이트)
      setSelectedLocation(realPin);

      processSearchKeywords(display_name);
      
      if (!isOcean) recordInteraction(display_name, 'view'); 
    } catch (error) {
      console.error("Geocoding Error:", error);
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
      setActiveChatId(targetTrip.id);
      setInitialQuery(initPayload?.text ? { text: initPayload.text, persona } : null); 
      setIsChatOpen(true);
      return; 
    }

    // 🚨 4. DB에도 진짜 없다면 새롭게 생성 (Insert)
    const systemPrompt = getSystemPrompt(persona, locationName);
    const isSameLocation = selectedLocation && (selectedLocation.name === locationName || selectedLocation.display_name === locationName);
    const targetLat = isSameLocation ? (selectedLocation.lat || 0) : 0;
    const targetLng = isSameLocation ? (selectedLocation.lng || 0) : 0;

    const newTrip = { 
      destination: locationName, 
      lat: targetLat, 
      lng: targetLng, 
      date: new Date().toLocaleDateString(), 
      prompt_summary: systemPrompt,
      messages: [], 
      is_bookmarked: false, 
      is_hidden: false,
      persona,
      category: category
    };
    
    const created = await saveNewTrip(newTrip);
    if (created) { 
      setActiveChatId(created.id); 
      setInitialQuery({ text: initPayload?.text || "", persona }); 
      setIsChatOpen(true); 
    }
  }, [globeRef, savedTrips, selectedLocation, category, saveNewTrip, setActiveChatId, setInitialQuery, setIsChatOpen, setSavedTrips]);

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

    const citySpot = citiesData.find(c =>
      c.name.toLowerCase() === query.toLowerCase() ||
      (c.name_en && c.name_en.toLowerCase() === query.toLowerCase())
    );
    
    if (citySpot) {
      const normalizedCity = {
        id: `city-${citySpot.lat}-${citySpot.lng}`,
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
      return;
    }

    const isConcept = TRAVEL_SPOTS.some(spot => spot.category === query || spot.keywords?.some(k => k.includes(query)));
    if (isConcept) return;

    const coords = await getCoordinatesFromAddress(query);
    
    if (coords) {
      const normalizedLoc = {
        id: `search-${coords.lat}-${coords.lng}`,
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