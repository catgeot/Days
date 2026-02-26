// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] fetchData 쿼리 확장: 단순히 is_hidden이 false인 것뿐만 아니라, is_bookmarked가 true인(즐겨찾기 유지) 데이터도 함께 로드하도록 or 쿼리 적용.
// 2. 이로써 채팅방에서 삭제(is_hidden: true)하더라도 즐겨찾기가 되어있다면 로컬 전역 상태(savedTrips)에 데이터가 온전히 남아 버킷리스트와 장소 카드 별표가 정상 유지됨.

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

export const useTravelData = () => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const fetchData = useCallback(async () => {
    // 🚨 [Fix] 쿼리 조건 확장: 채팅 목록에 보이거나(is_hidden: false) OR 즐겨찾기 된(is_bookmarked: true) 모든 유효 데이터 Fetch
    const { data, error } = await supabase.from('saved_trips')
      .select('*')
      .or('is_hidden.eq.false,is_bookmarked.eq.true')
      .order('created_at', { ascending: false });
      
    if (error) {
        console.error("🚨 [DB Error] fetchData:", error);
        return;
    }
    if (data) setSavedTrips(data);
  }, []);

  const saveNewTrip = useCallback(async (newTrip) => {
    // 🚨 [Fact Check] DB Insert 선행 (임시 ID 발급 제거 유지)
    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    
    if (!error && data && data.length > 0) {
      const realTrip = data[0];
      setSavedTrips(prev => [realTrip, ...prev]); 
      return realTrip;
    }
    
    console.error("🚨 [DB Error] saveNewTrip 실패:", error);
    return null;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    
    const { error } = await supabase.from('saved_trips').update({ messages }).eq('id', id);
    if (error) console.warn("🚨 [DB Error] updateMessages:", error);
  }, [savedTrips]);

  const toggleBookmark = useCallback(async (target) => {
    if (!target) return;

    let targetId = null;
    let locationObj = null;
    let destinationName = "";

    if (typeof target === 'object' && target.name) {
        locationObj = target;
        destinationName = target.name;
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

    if (targetId) {
        const trip = savedTrips.find(t => t.id === targetId);
        if (!trip) return;
        
        const newStatus = !trip.is_bookmarked;
        
        if (newStatus === true && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
            recordInteraction(trip.destination, 'save');
        }

        setSavedTrips(prev => prev.map(t => t.id === targetId ? { ...t, is_bookmarked: newStatus } : t));
        
        const { error } = await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', targetId);
        if (error) console.warn("🚨 [DB Error] toggleBookmark (update):", error);
    } 
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

        recordInteraction(locationObj.name, 'save');

        const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
        
        if (!error && data && data.length > 0) {
            setSavedTrips(prev => [data[0], ...prev]);
        } else {
            console.error("🚨 [DB Error] toggleBookmark (insert):", error);
        }
    }
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    // 🚨 단일 책임 원칙: 오직 is_hidden 상태만 true로 변경 (즐겨찾기 상태 건드리지 않음)
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, is_hidden: true } : t));
    
    const { error } = await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id);
    if (error) console.warn("🚨 [DB Error] deleteTrip:", error);
  }, [savedTrips]);

  return { 
    savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip 
  };
};