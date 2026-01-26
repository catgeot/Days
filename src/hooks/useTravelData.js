import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, messages } : t));
    await supabase.from('saved_trips').update({ messages }).eq('id', id);
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    const trip = savedTrips.find(t => t.id === id);
    if (!trip) return;
    const newStatus = !trip.is_bookmarked;
    setSavedTrips(prev => prev.map(t => t.id === id ? { ...t, is_bookmarked: newStatus } : t));
    await supabase.from('saved_trips').update({ is_bookmarked: newStatus }).eq('id', id);
  }, [savedTrips]);

  const deleteTrip = useCallback(async (id) => {
    setSavedTrips(prev => prev.filter(t => t.id !== id));
    await supabase.from('saved_trips').delete().eq('id', id);
  }, []);

  return { savedTrips, setSavedTrips, activeChatId, setActiveChatId, fetchData, saveNewTrip, updateMessages, toggleBookmark, deleteTrip };
};