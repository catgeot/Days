// src/hooks/useGlobeLogic.js
// 🚨 [Fix/New] 수정 이유: 
// 1. 데이터 무결성 강화: 이모지 자동 제거(Sanitize) 및 랭킹 시스템(View Count) 완벽 연동
// 2. 🚨 [Subtraction] 물리적으로 존재하지 않는 scout_pins 테이블 통신 로직(fetchActivePins, clearTemporaryData) 완전 제거. 프론트엔드 상태로만 수명주기 관리.

import { useState, useCallback } from 'react';
import { recordInteraction } from '../../../shared/api/supabase';

export const useGlobeLogic = (globeRef, userId) => {
  const [scoutedPins, setScoutedPins] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 🚨 [Fix] fetchActivePins() 호출 로직 제거 (DB 종속성 탈피)

  const moveToLocation = useCallback((lat, lng, name, category = 'scout') => {
    if (globeRef.current) {
      globeRef.current.flyToAndPin(lat, lng, name, category);
    }
  }, [globeRef]);

  const addScoutPin = useCallback((pin) => {
    const cleanName = pin.name ? pin.name.replace(/📍\s?/g, '').trim() : "Unknown";
    const cleanPin = { ...pin, name: cleanName };

    if (cleanName !== 'Scanning...' && cleanName !== 'Searching...') {
        recordInteraction(cleanName, 'view');
    }

    setScoutedPins(prev => {
      const filtered = prev.filter(p => p.id !== cleanPin.id && p.name !== cleanName);
      return [cleanPin, ...filtered].slice(0, 5);
    });
    
    setSelectedLocation(cleanPin);
  }, []);

  const confirmPin = useCallback((tempId, realPin) => {
    const cleanName = realPin.name.replace(/📍\s?/g, '').trim();
    
    const cleanPin = { 
        ...realPin, 
        name: cleanName,
        display_name: cleanName
    };

    recordInteraction(cleanName, 'view');

    setScoutedPins(prev => prev.map(p => p.id === tempId ? cleanPin : p));
    setSelectedLocation(cleanPin);
  }, []);

  const clearScouts = useCallback(async () => {
    setScoutedPins([]); 
    setSelectedLocation(null); 
    
    if (globeRef.current && typeof globeRef.current.resetPins === 'function') {
      globeRef.current.resetPins();
    }
    // 🚨 [Fix] clearTemporaryData(userId) 호출 제거
  }, [globeRef]);

  return {
    scoutedPins,
    setScoutedPins,
    selectedLocation,
    setSelectedLocation,
    moveToLocation,
    addScoutPin,
    confirmPin, 
    clearScouts
  };
};