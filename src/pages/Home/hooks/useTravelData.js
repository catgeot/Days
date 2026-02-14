// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix] Memory First 전략 적용: 휴지통 비우기 로직 강화 및 랭킹 시스템 연동 최적화

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

export const useTravelData = () => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const fetchData = useCallback(async () => {
    // 🚨 [Fix] is_bookmarked 순으로 정렬하여 즐겨찾기가 상단에 오도록 개선 가능하나, 일단 생성순 유지
    const { data } = await supabase.from('saved_trips').select('*').order('created_at', { ascending: false });
    if (data) setSavedTrips(data);
  }, []);

  const saveNewTrip = useCallback(async (newTrip) => {
    // 🚨 [Info] 대화 시작 시점에 비로소 DB에 저장됨 (Ghost -> Bubble 승격)
    // 🚨 [New] index.jsx에서 newTrip 객체에 'category' 꼬리표를 담아 보내므로, 그대로 DB에 안착됩니다.
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    
    if (!error && data) {
      // 📊 [Rank] Chat Start (+3)
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
    
    // 📊 [Rank] Bookmark (+5) - 승격 시에만 점수 부여
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

  // 🚨 [Fix] 휴지통: 화면과 DB의 '임시 데이터'를 완벽하게 분리하여 제거
  const clearTemporaryTrips = useCallback(async () => {
    console.log("🧹 [Trash] Clearing temporary chats...");

    // 1. UI Optimistic Update: 북마크 된 것만 남기고 즉시 삭제
    setSavedTrips(prev => prev.filter(trip => trip.is_bookmarked));

    // 2. Server Side Cleanup: 'is_bookmarked'가 false인 항목만 DB에서 제거
    const { error, count } = await supabase
        .from('saved_trips')
        .delete({ count: 'exact' }) // 삭제된 개수 확인용
        .eq('is_bookmarked', false);

    if (error) {
        console.error("🚨 [Trash] DB Error:", error);
    } else {
        console.log(`🗑️ [Trash] Deleted ${count} temporary chats from DB.`);
    }
  }, []);

  return { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip, clearTemporaryTrips };
};