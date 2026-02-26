// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] deleteTrip: 타입 방어벽(typeof id === 'number') 완전 철거. id가 'temp_'로 시작하는 임시 객체가 아니라면, 문자열("12")이든 숫자(12)든 가리지 않고 즉시 DB is_hidden 처리.
// 2. [Fact Check] toggleBookmark: 입력값이 '장소 객체'인지 'ID'인지 판별하여 유연하게 대처하고, 새 북마크 시 즉시 Insert.

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
    const tempId = `temp_${Date.now()}`;
    const optimisticTrip = { ...newTrip, id: tempId };
    
    setSavedTrips(prev => [optimisticTrip, ...prev]);

    const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
    
    if (!error && data) {
      setSavedTrips(prev => prev.map(t => t.id === tempId ? data[0] : t));
      return data[0];
    }
    
    return optimisticTrip;
  }, []);

  const updateMessages = useCallback(async (id, messages) => {
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
    }

    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    
    if (!String(id).startsWith('temp_')) {
        const { error } = await supabase.from('saved_trips').update({ messages }).eq('id', id);
        if (error) console.warn("🚨 [DB Error] updateMessages:", error);
    }
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
        
        // 🚨 [Fix] 타입 검사 완화 (문자열 ID 허용)
        if (!String(targetId).startsWith('temp_')) {
            const { error } = await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', targetId);
            if (error) console.warn("🚨 [DB Error] toggleBookmark (update):", error);
        }
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

        const tempId = `temp_bm_${Date.now()}`;
        const optimisticTrip = { ...newTrip, id: tempId };
        setSavedTrips(prev => [optimisticTrip, ...prev]);

        recordInteraction(locationObj.name, 'save');

        const { data, error } = await supabase.from('saved_trips').insert([newTrip]).select();
        
        if (!error && data) {
            setSavedTrips(prev => prev.map(t => t.id === tempId ? data[0] : t));
        }
    }
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    setSavedTrips(prev => prev.filter(t => t.id !== id));
    
    // 🚨 [Fix] 삭제 시 임시 ID가 아니면 무조건 DB 숨김 처리 (새로고침 부활 완벽 차단)
    if (!String(id).startsWith('temp_')) {
        const { error } = await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id);
        if (error) console.warn("🚨 [DB Error] deleteTrip:", error);
    }
  }, [savedTrips]);

  return { 
    savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip 
  };
};