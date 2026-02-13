// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix] 랭킹 시스템 연동: 채팅(Chat) 및 저장(Save) 액션 발생 시 점수 집계

import { useState, useCallback } from 'react';
// 🚨 [Fix] recordInteraction 추가 임포트
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
      // 🚨 [New] 랭킹 집계: 채팅방 생성 성공 시 (+3점)
      // Fire-and-Forget: 랭킹 집계 실패가 채팅 생성을 막으면 안 됨
      if (newTrip.destination) {
          recordInteraction(newTrip.destination, 'chat');
          console.log(`📊 [Rank] Chat Start (+3): ${newTrip.destination}`);
      }

      setSavedTrips(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    await supabase.from('saved_trips').update({ messages }).eq('id', id);
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;
    
    const newStatus = !trip.is_bookmarked;
    
    // 🚨 [New] 랭킹 집계: 북마크 활성화 시 (+5점)
    if (newStatus === true && trip.destination) {
        recordInteraction(trip.destination, 'save');
        console.log(`📊 [Rank] Bookmarked (+5): ${trip.destination}`);
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, is_bookmarked: newStatus } : t));
    await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', id);
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    setSavedTrips(prev => prev.filter(t => t.id !== id));
    await supabase.from('saved_trips').delete().eq('id', id);
  }, []);
	// 🚨 [New] 휴지통: 북마크 되지 않은(임시) 대화 기록 정리
  const clearTemporaryTrips = useCallback(async () => {
    // 1. UI 즉시 반영: 북마크(is_bookmarked) 된 것만 남기고 다 지움
    setSavedTrips(prev => prev.filter(trip => trip.is_bookmarked));

    // 2. 서버 데이터 정리: 북마크가 false인 항목 삭제
    const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('is_bookmarked', false); // 북마크 안 된 것만 골라서 삭제

    if (error) console.error("🚨 [Trash] Failed to clear chats:", error);
  }, []);

  return { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip };
};