// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] fetchData 쿼리 확장 유지: is_hidden이 false이거나 is_bookmarked가 true인 유효 데이터 Fetch.
// 2. 🚨 [Fix] Data Lake 분리 (로그인 vs 비로그인): user 객체를 주입받아, 비로그인 시 DB를 호출하지 않고 로컬 스토리지(days_guest_trips)만 사용하도록 격리 (Pessimistic First 적용).
// 3. 🚨 [Fix] Auth 연동: 로그인 유저일 경우 saveNewTrip 시 명시적으로 user_id를 포함하여 RLS(Row Level Security) 정책 충돌을 방지함.

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

const LOCAL_STORAGE_KEY = 'days_guest_trips';

export const useTravelData = (user) => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // 🚨 [New] 비로그인 유저를 위한 로컬 스토리지 동기화 헬퍼 함수
  const syncLocalStorage = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  const fetchData = useCallback(async () => {
    if (user) {
      // 🚨 [Fix] 로그인 유저: Supabase DB에서 본인 데이터만 안전하게 조회 (RLS 통과)
      const { data, error } = await supabase.from('saved_trips')
        .select('*')
        .eq('user_id', user.id) // 명시적 소유권 증명
        .or('is_hidden.eq.false,is_bookmarked.eq.true')
        .order('created_at', { ascending: false });
        
      if (error) {
          console.error("🚨 [DB Error] fetchData:", error);
          return;
      }
      if (data) setSavedTrips(data);
    } else {
      // 🚨 [Fix] 비로그인 유저: DB 접근을 차단하고 로컬 스토리지에서만 조회 (Safe Path)
      const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      setSavedTrips(localData);
    }
  }, [user]);

  const saveNewTrip = useCallback(async (newTrip) => {
    if (user) {
      // 🚨 [Fact Check] 로그인 유저: DB Insert 선행 및 user_id 바인딩
      const tripWithUser = { ...newTrip, user_id: user.id };
      const { data, error } = await supabase.from('saved_trips').insert([tripWithUser]).select();
      
      if (!error && data && data.length > 0) {
        const realTrip = data[0];
        setSavedTrips(prev => [realTrip, ...prev]); 
        return realTrip;
      }
      
      console.error("🚨 [DB Error] saveNewTrip 실패:", error);
      return null;
    } else {
      // 🚨 [Fix] 비로그인 유저: 임시 ID 발급 및 로컬 스토리지 저장
      const tempTrip = { ...newTrip, id: `temp_${Date.now()}` };
      setSavedTrips(prev => {
        const updated = [tempTrip, ...prev];
        syncLocalStorage(updated);
        return updated;
      });
      return tempTrip;
    }
  }, [user]);

  const updateMessages = useCallback(async (id, messages) => {
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
    }

    // 상태는 공통으로 업데이트
    setSavedTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, messages } : t);
      if (!user) syncLocalStorage(updated); // 🚨 비로그인 시 로컬만 동기화
      return updated;
    });
    
    // 🚨 로그인 시에만 DB 찌르기
    if (user) {
      const { error } = await supabase.from('saved_trips').update({ messages }).eq('id', id);
      if (error) console.warn("🚨 [DB Error] updateMessages:", error);
    }
  }, [savedTrips, user]);

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

        setSavedTrips(prev => {
          const updated = prev.map(t => t.id === targetId ? { ...t, is_bookmarked: newStatus } : t);
          if (!user) syncLocalStorage(updated); // 🚨 비로그인 동기화
          return updated;
        });
        
        if (user) {
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

        recordInteraction(locationObj.name, 'save');

        if (user) {
          const tripWithUser = { ...newTrip, user_id: user.id };
          const { data, error } = await supabase.from('saved_trips').insert([tripWithUser]).select();
          
          if (!error && data && data.length > 0) {
              setSavedTrips(prev => [data[0], ...prev]);
          } else {
              console.error("🚨 [DB Error] toggleBookmark (insert):", error);
          }
        } else {
          const tempTrip = { ...newTrip, id: `temp_${Date.now()}` };
          setSavedTrips(prev => {
            const updated = [tempTrip, ...prev];
            syncLocalStorage(updated);
            return updated;
          });
        }
    }
  }, [savedTrips, user]);

  const deleteTrip = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;

    // 🚨 단일 책임 원칙: Soft Delete (is_hidden: true) 적용
    setSavedTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, is_hidden: true } : t);
      if (!user) syncLocalStorage(updated); // 🚨 비로그인 동기화
      return updated;
    });
    
    if (user) {
      const { error } = await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id);
      if (error) console.warn("🚨 [DB Error] deleteTrip:", error);
    }
  }, [savedTrips, user]);

  return { 
    savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip 
  };
};