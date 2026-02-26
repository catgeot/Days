// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] Supabase 쿼리 빌더에는 .catch() 체이닝을 사용할 수 없으므로(TypeError 방지), 전부 제거하고 { error } 객체 확인 방식으로 변경.
// 2. [Fact Check] toggleBookmark: 입력값이 '장소 객체(PlaceCard)'인지 'ID(ChatModal)'인지 다형성(Polymorphism)으로 구분하여 처리. 신규 즐겨찾기 시 즉시 Insert.
// 3. [Fact Check] deleteTrip: 북마크 여부와 상관없이 삭제(휴지통) 버튼을 누르면 무조건 화면에서 즉시 제거(filter)하고 DB에서는 is_hidden: true로 처리.

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

export const useTravelData = () => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('saved_trips')
      .select('*')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });
    if (data) setSavedTrips(data);
  }, []);

  const saveNewTrip = useCallback(async (newTrip) => {
    // 낙관적 업데이트를 위한 임시 ID 발급
    const tempId = `temp_${Date.now()}`;
    const optimisticTrip = { ...newTrip, id: tempId };
    
    // DB 응답을 기다리지 않고 UI에 즉시 렌더링 (비회원 채팅창 즉시 오픈)
    setSavedTrips(prev => [optimisticTrip, ...prev]);

    // 실제 DB Insert 시도
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    
    if (!error && data) {
      // 회원인 경우: DB 저장 성공 시, 임시 ID를 부여받은 진짜 DB ID(int8)로 조용히 교체
      setSavedTrips(prev => prev.map(t => t.id === tempId ? data[0] : t));
      return data[0];
    }
    
    // 비회원인 경우(RLS 에러 등): DB 저장은 실패하지만 UI 흐름을 유지하기 위해 임시 객체 반환
    return optimisticTrip;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    // 프론트엔드 상태에서 목적지를 바로 찾음 (Subtraction)
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
        console.log(`📊 [Rank] First Chat Act (+3): ${trip.destination}`);
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    
    // 진짜 DB ID(숫자)일 때만 DB 업데이트 시도. 비회원(temp_ 문자열)은 무시.
    // 🚨 [Fix] .catch() 제거, 일반 await 문법으로 변경
    if (typeof id === 'number') {
        const { error } = await supabase.from('saved_trips').update({ messages }).eq('id', id);
        if (error) console.warn("🚨 [DB Error] updateMessages:", error);
    }
  }, [savedTrips]);

  // 다형성 적용: id(숫자/문자열) 또는 location(객체) 모두 처리 가능하도록 안전망 구축
  const toggleBookmark = useCallback(async (target) => {
    if (!target) return;

    let targetId = null;
    let locationObj = null;
    let destinationName = "";

    // 1. 입력값이 객체(PlaceCard에서 호출)인지, ID(ChatModal에서 호출)인지 판별
    if (typeof target === 'object' && target.name) {
        locationObj = target;
        destinationName = target.name;
        // 이미 이 장소가 savedTrips에 존재하는지 확인
        const existingTrip = savedTrips.find(t => t.destination === destinationName);
        if (existingTrip) {
            targetId = existingTrip.id;
        }
    } else {
        targetId = target;
        const existingTrip = savedTrips.find(t => t.id === targetId);
        if (existingTrip) {
            destinationName = existingTrip.destination;
        }
    }

    // 2-A. 기존에 존재하는 여행/채팅 기록인 경우 (상태 반전)
    if (targetId) {
        const trip = savedTrips.find(t => t.id === targetId);
        if (!trip) return;
        
        const newStatus = !trip.is_bookmarked;
        
        if (newStatus === true && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
            recordInteraction(trip.destination, 'save');
            console.log(`📊 [Rank] Bookmarked (+5): ${trip.destination}`);
        }

        setSavedTrips(prev => prev.map(t => t.id === targetId ? { ...t, is_bookmarked: newStatus } : t));
        
        // 🚨 [Fix] .catch() 제거
        if (typeof targetId === 'number') {
            const { error } = await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', targetId);
            if (error) console.warn("🚨 [DB Error] toggleBookmark (update):", error);
        }
    } 
    // 2-B. [새로운 로직] 기존 기록이 없고 장소카드에서 신규 즐겨찾기를 누른 경우 (Insert 필요)
    else if (locationObj) {
        const newTrip = {
            destination: locationObj.name,
            lat: locationObj.lat,
            lng: locationObj.lng,
            date: new Date().toLocaleDateString(),
            messages: [], 
            is_bookmarked: true,
            is_hidden: false, 
            category: locationObj.category || 'general'
        };

        // 낙관적 업데이트 UI 반영
        const tempId = `temp_bm_${Date.now()}`;
        const optimisticTrip = { ...newTrip, id: tempId };
        setSavedTrips(prev => [optimisticTrip, ...prev]);

        // 통계 점수 즉시 반영
        recordInteraction(locationObj.name, 'save');
        console.log(`📊 [Rank] Bookmarked (+5): ${locationObj.name}`);

        // DB Insert 시도
        const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
        
        if (!error && data) {
            setSavedTrips(prev => prev.map(t => t.id === tempId ? data[0] : t));
        } else if (error) {
            console.warn("🚨 [DB Error] toggleBookmark (insert):", error);
        }
    }
  }, [savedTrips]);

  // 삭제 버그 수정: 즐겨찾기 여부와 상관없이 채팅 리스트에서 삭제하면 화면에서 지우고 is_hidden 처리.
  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    // 화면에서 즉시 제거 (Optimistic UI)
    setSavedTrips(prev => prev.filter(t => t.id !== id));
    
    // DB에서 보이지 않게 처리 (Soft Delete)
    // 🚨 [Fix] .catch() 제거
    if (typeof id === 'number') {
        const { error } = await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id);
        if (error) console.warn("🚨 [DB Error] deleteTrip:", error);
    }
  }, [savedTrips]);

  return { 
    savedTrips, 
    setSavedTrips, 
    activeChatId, 
    setActiveChatId, 
    fetchData, 
    saveNewTrip, 
    updateMessages, 
    toggleBookmark, 
    deleteTrip 
  };
};