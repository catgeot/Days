// src/pages/Home/hooks/useTravelData.js
// 🚨 [Fix/New] 수정 이유: 
// 1. [Fact Check] fetchData 쿼리 확장 유지: is_hidden이 false이거나 is_bookmarked가 true인 유효 데이터 Fetch.
// 2. [Fix] Data Lake 분리 (로그인 vs 비로그인): 비로그인 시 DB를 호출하지 않고 로컬 스토리지(days_guest_trips)만 사용하도록 격리.
// 3. [Fix] Auth 연동: 로그인 유저일 경우 saveNewTrip 시 명시적으로 user_id를 포함하여 RLS 정책 충돌 방지.
// 4. [Fix/Subtraction] 큐레이션 데이터 저장 시 불필요한 영문 고유명사 추출 로직 제거. 일반 북마크와 동일하게 한글 지명(location)을 destination의 식별 키로 통일하여 상태 불일치 문제 원천 차단.
// 5. 🚨 [Fix/Safe Path] DB 데이터 존재 확인 시 .single()로 인한 406 Not Acceptable 에러 방지를 위해 .maybeSingle()로 교체.

import { useState, useCallback } from 'react';
import { supabase, recordInteraction } from '../../../shared/api/supabase';

const LOCAL_STORAGE_KEY = 'days_guest_trips';

export const useTravelData = (user) => {
  const [savedTrips, setSavedTrips] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const syncLocalStorage = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  const fetchData = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase.from('saved_trips')
        .select('*')
        .eq('user_id', user.id)
        .or('is_hidden.eq.false,is_bookmarked.eq.true')
        .order('created_at', { ascending: false });
        
      if (error) {
          console.error("🚨 [DB Error] fetchData:", error);
          return;
      }
      if (data) setSavedTrips(data);
    } else {
      const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
      setSavedTrips(localData);
    }
  }, [user]);

  const saveNewTrip = useCallback(async (newTrip) => {
    if (user) {
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
      const tempTrip = { ...newTrip, id: `temp_${Date.now()}` };
      setSavedTrips(prev => {
        const updated = [tempTrip, ...prev];
        syncLocalStorage(updated);
        return updated;
      });
      return tempTrip;
    }
  }, [user]);

  const saveCurationData = useCallback(async (curationData, userObj) => {
    const targetUser = user || userObj;
    if (!targetUser) return null;

    const targetDest = curationData.location;

    let existingTrip = savedTrips.find(t => t.destination === targetDest);

    if (!existingTrip) {
      // 🚨 [Fix/Safe Path] .single() -> .maybeSingle() 변경: 결과가 0건일 때 406 에러 대신 null을 안전하게 반환
      const { data } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', targetUser.id)
        .eq('destination', targetDest)
        .maybeSingle(); 
      if (data) existingTrip = data;
    }

    if (existingTrip) {
      const { data, error } = await supabase
        .from('saved_trips')
        .update({ 
          lat: curationData.lat || existingTrip.lat || 0,
          lng: curationData.lng || existingTrip.lng || 0,
          curation_data: curationData,
          is_ai_curation: true,
          is_bookmarked: true,
          is_hidden: false,
          prompt_summary: curationData.title
        })
        .eq('id', existingTrip.id)
        .select()
        .single();

      if (!error && data) {
        setSavedTrips(prev => {
          const exists = prev.some(t => t.id === data.id);
          if (exists) return prev.map(t => t.id === data.id ? data : t);
          return [data, ...prev];
        });
        return data;
      }
    } else {
      const newTrip = {
        user_id: targetUser.id,
        destination: targetDest,
        lat: curationData.lat || 0,
        lng: curationData.lng || 0,
        is_bookmarked: true,
        curation_data: curationData,
        is_ai_curation: true,
        prompt_summary: curationData.title,
        is_hidden: false
      };

      const { data, error } = await supabase
        .from('saved_trips')
        .insert([newTrip])
        .select()
        .single();

      if (!error && data) {
        setSavedTrips(prev => [data, ...prev]);
        return data;
      }
    }
    return null;
  }, [savedTrips, user]);

  const updateMessages = useCallback(async (id, messages) => {
    const trip = savedTrips.find(t => t.id === id);
    
    if (messages.length === 1 && trip && trip.destination && trip.destination !== "New Session" && trip.destination !== "Scanning...") {
        recordInteraction(trip.destination, 'chat');
    }

    setSavedTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, messages } : t);
      if (!user) syncLocalStorage(updated); 
      return updated;
    });
    
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
          if (!user) syncLocalStorage(updated); 
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

    setSavedTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, is_hidden: true } : t);
      if (!user) syncLocalStorage(updated); 
      return updated;
    });
    
    if (user) {
      const { error } = await supabase.from('saved_trips').update({ is_hidden: true }).eq('id', id);
      if (error) console.warn("🚨 [DB Error] deleteTrip:", error);
    }
  }, [savedTrips, user]);

  return { 
    savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, 
    saveNewTrip, updateMessages, toggleBookmark, deleteTrip, saveCurationData 
  };
};