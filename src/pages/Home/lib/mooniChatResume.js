import { supabase } from '../../../shared/api/supabase';
import {
  findTripById,
  readMooniLastChatId,
  tripHasPersistedDialogue,
} from './tripChatUtils';

/**
 * MOONi FAB 재진입 — sessionStorage + localStorage last id, 없으면 DB(로그인)에서 trip 로드.
 * 메시지 SSOT: saved_trips.messages (로그인 DB · 게스트 localStorage).
 */
export async function resolveMooniResumeTrip({ savedTrips = [], userId = null }) {
  const lastId = readMooniLastChatId(userId);
  if (!lastId) return null;

  let trip = findTripById(savedTrips, lastId);

  if (!trip && userId && !String(lastId).startsWith('temp_')) {
    const { data, error } = await supabase
      .from('saved_trips')
      .select('*')
      .eq('id', lastId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data && !data.is_hidden) {
      trip = data;
    }
  }

  if (!trip || trip.is_hidden || !tripHasPersistedDialogue(trip)) {
    return null;
  }

  return trip;
}
