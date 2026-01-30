// src/hooks/useGlobeLogic.js
import { useState, useCallback } from 'react';

export const useGlobeLogic = (globeRef) => {
  const [scoutedPins, setScoutedPins] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const moveToLocation = useCallback((lat, lng, name, category = 'scout') => {
    if (globeRef.current) {
      globeRef.current.flyToAndPin(lat, lng, name, category);
    }
  }, [globeRef]);

  const addScoutPin = useCallback((pin) => {
    setScoutedPins(prev => {
      // 중복 제거 후 최신 5개만 유지
      const filtered = prev.filter(p => p.id !== pin.id && p.name !== pin.name);
      return [pin, ...filtered].slice(0, 5);
    });
    setSelectedLocation(pin);
  }, []);

  // 🚨 [Fix] 안전장치 추가: resetPins 함수가 실제로 존재할 때만 호출
  const clearScouts = useCallback(() => {
    setScoutedPins([]); // 1. 데이터(State) 비우기
    setSelectedLocation(null); // 2. 선택 해제
    
    // 3. 지구본 핀 제거 명령 (기능이 있을 때만 실행하여 크래시 방지)
    if (globeRef.current && typeof globeRef.current.resetPins === 'function') {
      globeRef.current.resetPins();
    } else {
      console.warn("HomeGlobe: resetPins function not found.");
    }
  }, [globeRef]);

  return {
    scoutedPins,
    setScoutedPins,
    selectedLocation,
    setSelectedLocation,
    moveToLocation,
    addScoutPin,
    clearScouts
  };
};