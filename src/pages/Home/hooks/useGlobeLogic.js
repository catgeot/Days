// src/hooks/useGlobeLogic.js
// 🚨 [Fix] 데이터 무결성 강화: 이모지 자동 제거(Sanitize) 및 랭킹 시스템(View Count) 완벽 연동

import { useState, useCallback, useEffect } from 'react';
import { recordInteraction, fetchActivePins, clearTemporaryData } from '../../../shared/api/supabase';

export const useGlobeLogic = (globeRef, userId) => {
  const [scoutedPins, setScoutedPins] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // 1. 초기 로드 (Safe-Start): 서버에서 살아있는 핀 가져오기
  useEffect(() => {
    const loadPins = async () => {
      const active = await fetchActivePins();
      if (active && active.length > 0) {
        setScoutedPins(active);
      }
    };
    loadPins();
  }, []);

  const moveToLocation = useCallback((lat, lng, name, category = 'scout') => {
    if (globeRef.current) {
      // 지구본 이동 시에는 시각적 효과를 위해 이모지가 있든 없든 그대로 전달해도 무방
      globeRef.current.flyToAndPin(lat, lng, name, category);
    }
  }, [globeRef]);

  // 2. 핀 추가 (임시/검색 공용)
  const addScoutPin = useCallback((pin) => {
    // 🚨 [Fix] 이름 정제: "📍 몰디브" -> "몰디브" (DB 저장용)
    const cleanName = pin.name ? pin.name.replace(/📍\s?/g, '').trim() : "Unknown";
    const cleanPin = { ...pin, name: cleanName };

    // 'Scanning...' 상태가 아니고, 실제 지명일 때만 랭킹 점수 기록
    if (cleanName !== 'Scanning...' && cleanName !== 'Searching...') {
        recordInteraction(cleanName, 'view');
    }

    setScoutedPins(prev => {
      // 중복 제거 후 최신 5개만 유지 (LIFO)
      const filtered = prev.filter(p => p.id !== cleanPin.id && p.name !== cleanName);
      return [cleanPin, ...filtered].slice(0, 5);
    });
    
    // 선택된 위치 상태 업데이트
    setSelectedLocation(cleanPin);
  }, []);

  // 3. 핀 확정 (지오코딩 완료 후 호출)
  // 🚨 [New] 이 함수가 호출될 때 비로소 '진짜 점수'가 올라갑니다.
  const confirmPin = useCallback((tempId, realPin) => {
    // 🚨 [Fix] 이름 정제 (이모지 제거)
    const cleanName = realPin.name.replace(/📍\s?/g, '').trim();
    
    // 정제된 이름으로 객체 갱신
    const cleanPin = { 
        ...realPin, 
        name: cleanName,
        display_name: cleanName // UI 표시용 이름도 통일
    };

    // A. 진짜 이름으로 랭킹 점수 기록 (+1 View)
    recordInteraction(cleanName, 'view');

    // B. 리스트 내의 임시 핀(Scanning...)을 진짜 핀(Address)으로 교체
    setScoutedPins(prev => prev.map(p => p.id === tempId ? cleanPin : p));
    
    // C. 선택된 위치 정보 갱신
    setSelectedLocation(cleanPin);
  }, []);

  // 4. 초기화 (휴지통)
  const clearScouts = useCallback(async () => {
    // 1. UI 즉시 초기화 (Optimistic UI)
    setScoutedPins([]); 
    setSelectedLocation(null); 
    
    // 2. 지구본 핀 및 효과 제거
    if (globeRef.current && typeof globeRef.current.resetPins === 'function') {
      globeRef.current.resetPins();
    }

    // 3. 서버 데이터 삭제 (백그라운드)
    if (userId) {
        await clearTemporaryData(userId);
    }
  }, [globeRef, userId]);

  return {
    scoutedPins,
    setScoutedPins,
    selectedLocation,
    setSelectedLocation,
    moveToLocation,
    addScoutPin,
    confirmPin, // 🚨 중요: Index.jsx에서 지오코딩 완료 후 호출해야 함
    clearScouts
  };
};