// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 허수 데이터(False Positive) 방어: 방 생성 시점이 아닌 '첫 대화 발화' 시점에만 랭킹 점수 부여

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
      // 🚨 [Subtraction] 기존의 '방 생성 시점' 점수 펌프질 로직을 완전히 삭제했습니다. (허수 카운트 차단)
      setSavedTrips(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    setSavedTrips(prev => {
      const trip = prev.find(t => t.id === id);
      
      // 🚨 [Fact Check] 방어 로직: 기존 대화가 0개이고, 새 대화가 1개 이상 들어올 때(첫 발화) 단 1회만 점수 부여
      if (trip && trip.messages.length === 0 && messages.length > 0) {
          if (trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
              recordInteraction(trip.destination, 'chat');
              console.log(`📊 [Rank] First Chat Act (+3): ${trip.destination}`);
          }
      }
      
      return prev.map(t => t.id === id ? { ...t, messages } : t);
    });
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
    setSavedTrips(prev => prev.filter(t => t.id !== id));
    await supabase.from('saved_trips').delete().eq('id', id);
  }, []);

  const clearTemporaryTrips = useCallback(async () => {
    setSavedTrips(prev => prev.filter(trip => trip.is_bookmarked));
    const { error } = await supabase.from('saved_trips').delete().eq('is_bookmarked', false);
    if (error) console.error("🚨 [Trash] DB Error:", error);
  }, []);

  return { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip, clearTemporaryTrips };
};