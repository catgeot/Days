// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Guest Mode 개방] 비회원도 UI가 멈추지 않도록 낙관적 업데이트(Optimistic Update) 적용.
// 2. [Subtraction] updateMessages 내부의 불필요한 DB SELECT 쿼리 제거 및 상태(State) 직접 참조로 변경.
// 3. [비관적 우선] DB의 실제 ID(number)일 때만 update 쿼리를 날려 RLS 에러 원천 차단.

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
    // 🚨 [New] 낙관적 업데이트를 위한 임시 ID 발급
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
    // 🚨 [Fix] DB 조회 대신, 현재 화면에 띄워진 프론트엔드 상태에서 목적지를 바로 찾음 (Subtraction)
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
        console.log(`📊 [Rank] First Chat Act (+3): ${trip.destination}`);
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    
    // 🚨 [Fix] 진짜 DB ID(숫자)일 때만 DB 업데이트 시도. 비회원(temp_ 문자열)은 무시.
    if (typeof id === 'number') {
        await supabase.from('saved_trips').update({ messages }).eq('id', id).catch(() => {});
    }
  }, [savedTrips]);

  const toggleBookmark = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;
    
    const newStatus = !trip.is_bookmarked;
    
    if (newStatus === true && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'save');
        console.log(`📊 [Rank] Bookmarked (+5): ${trip.destination}`);
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, is_bookmarked: newStatus } : t));
    
    if (typeof id === 'number') {
        await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', id).catch(() => {});
    }
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    if (trip.is_bookmarked) {
      setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages: [] } : t));
      if (typeof id === 'number') {
          await supabase.from('saved_trips').update({ messages: [] }).eq('id', id).catch(() => {});
      }
    } else {
      setSavedTrips(prev => prev.filter(t => t.id !== id));
      if (typeof id === 'number') {
          await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id).catch(() => {});
      }
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