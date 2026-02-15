// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] React Strict Mode에 의한 더블 렌더링(점수 2배 누적) 버그를 막기 위해, 부작용(API 호출)을 상태 Setter(setSavedTrips) 외부로 분리함.
// 2. [조건부 삭제] deleteTrip 및 clearTemporaryTrips 로직 유지 (이전 턴과 동일)

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

export const useTravelData = () => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const fetchData = useCallback(async () => {
    const { data } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false });
    if (data) setSavedTrips(data);
  }, []);

  const saveNewTrip = useCallback(async (newTrip) => {
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    
    if (!error && data) {
      setSavedTrips(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    // 🚨 [Fix] 점수 부여 로직을 setter 밖으로 빼내어 중복 실행(Double Invoke) 원천 차단
    if (messages.length === 1) {
       // 첫 대화일 때만 DB에서 정확한 목적지를 조회하여 단 1회 점수 부여
       const { data } = await supabase.from('saved_trips').select('destination').eq('id', id).single();
       if (data && data.destination && data.destination !== "New Session" && data.destination !== "Scanning...") {
           recordInteraction(data.destination, 'chat');
           console.log(`📊 [Rank] First Chat Act (+3): ${data.destination}`);
       }
    }

    // UI 상태와 DB는 순수하게 데이터만 업데이트
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    await supabase.from('saved_trips').update({ messages }).eq('id', id);
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;
    
    const newStatus = !trip.is_bookmarked;
    
    if (newStatus === true && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'save');
        console.log(`📊 [Rank] Bookmarked (+5): ${trip.destination}`);
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, is_bookmarked: newStatus } : t));
    await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', id);
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    if (trip.is_bookmarked) {
      setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages: [] } : t));
      await supabase.from('saved_trips').update({ messages: [] }).eq('id', id);
    } else {
      setSavedTrips(prev => prev.filter(t => t.id !== id));
      await supabase.from('saved_trips').delete().eq('id', id);
    }
  }, [savedTrips]);

  const clearTemporaryTrips = useCallback(async () => {
    setSavedTrips(prev => prev.filter(trip => trip.is_bookmarked));
    const { error } = await supabase.from('saved_trips').delete().eq('is_bookmarked', false);
    if (error) console.error("🚨 [Trash] DB Error:", error);
  }, []);

  return { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip, clearTemporaryTrips };
};