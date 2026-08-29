import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { resolveSessionBoundSpot } from '../../../utils/resolveDestinationFromChat';
import ChatModal from './ChatModal';
import { useTravelData } from '../hooks/useTravelData';
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';
import {
  persistMooniLastChatId,
  tripHasPersistedDialogue,
} from '../lib/tripChatUtils';
import { buildMooniBoundSpotFromLocation } from '../lib/placeChatIntro';

const THEME_CHAT_CATEGORY = 'korea-theme';

/**
 * Home(`/`) 밖(테마·명승 등)에서 라우트를 바꾸지 않고 MOONi ChatModal을 연다.
 * 닫으면 호출측 화면(상세 모달 등)이 그대로 남는다.
 */
export default function MooniBoundChatHost({ isOpen, boundSpot, initialQuery = null, onClose }) {
  const [user, setUser] = useState(null);
  const {
    savedTrips,
    activeChatId,
    setActiveChatId,
    fetchData,
    saveNewTrip,
    updateMessages,
    updateTripDestination,
    deleteTrip,
  } = useTravelData(user);
  const [chatDraft, setChatDraft] = useState(null);
  const [mooniPlaceContext, setMooniPlaceContext] = useState(null);
  const openedKeyRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user || null),
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetSession = useCallback(() => {
    setChatDraft(null);
    setActiveChatId(null);
    setMooniPlaceContext(null);
    openedKeyRef.current = null;
  }, [setActiveChatId]);

  const openBound = useCallback(
    (spot) => {
      const label =
        String(spot?.displayLabel || spot?.name || '').trim() || null;
      if (!label) return;
      setMooniPlaceContext(spot);

      const placeTrip = savedTrips.find(
        (t) =>
          !t.is_hidden &&
          (t.destination === label || t.destination === spot?.name) &&
          tripHasPersistedDialogue(t),
      );
      if (placeTrip) {
        setChatDraft(null);
        setActiveChatId(placeTrip.id);
        return;
      }

      const lat = Number(spot?.lat);
      const lng = Number(spot?.lng);
      setChatDraft({
        destination: label,
        lat: Number.isFinite(lat) ? lat : 0,
        lng: Number.isFinite(lng) ? lng : 0,
        persona: PERSONA_TYPES.GENERAL,
        category: THEME_CHAT_CATEGORY,
      });
      setActiveChatId(null);
    },
    [savedTrips, setActiveChatId],
  );

  useEffect(() => {
    if (!isOpen || !boundSpot?.name) {
      if (!isOpen) openedKeyRef.current = null;
      return;
    }
    const queryKey =
      typeof initialQuery === 'string'
        ? initialQuery
        : initialQuery?.text || initialQuery?.query || '';
    const key = `${boundSpot.slug || ''}|${boundSpot.name}|${boundSpot.lat ?? ''}|${boundSpot.lng ?? ''}|${queryKey}`;
    if (openedKeyRef.current === key) return;
    openedKeyRef.current = key;
    openBound(boundSpot);
  }, [isOpen, boundSpot, initialQuery, openBound]);

  const createTripOnFirstUserMessage = useCallback(
    async ({ destination, lat, lng, persona, firstUserText }) => {
      const systemPrompt = getSystemPrompt(persona, destination);
      const newTrip = {
        destination,
        lat: lat ?? 0,
        lng: lng ?? 0,
        date: new Date().toLocaleDateString(),
        prompt_summary: systemPrompt,
        messages: [{ role: 'user', text: firstUserText }],
        is_bookmarked: false,
        is_hidden: false,
        persona,
        category: THEME_CHAT_CATEGORY,
      };
      const created = await saveNewTrip(newTrip);
      if (created) {
        setChatDraft(null);
        setActiveChatId(created.id);
        persistMooniLastChatId(created.id, user?.id ?? null);
      }
      return created;
    },
    [saveNewTrip, setActiveChatId, user?.id],
  );

  const updateChatDraftDestination = useCallback((patch) => {
    setChatDraft((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const handleClose = useCallback(() => {
    if (activeChatId) {
      persistMooniLastChatId(activeChatId, user?.id ?? null);
    }
    resetSession();
    onClose?.();
  }, [activeChatId, onClose, resetSession, user?.id]);

  useEffect(() => {
    if (isOpen) return;
    if (activeChatId) {
      persistMooniLastChatId(activeChatId, user?.id ?? null);
    }
    if (
      openedKeyRef.current != null ||
      chatDraft ||
      activeChatId ||
      mooniPlaceContext
    ) {
      resetSession();
    }
  }, [isOpen, activeChatId, chatDraft, mooniPlaceContext, resetSession, user?.id]);

  if (!isOpen) return null;

  return (
    <ChatModal
      isOpen={isOpen}
      mooniEntry
      mooniPlaceContext={mooniPlaceContext}
      onClose={handleClose}
      initialQuery={initialQuery}
      chatHistory={savedTrips}
      chatDraft={chatDraft}
      onCreateTripOnFirstUserMessage={createTripOnFirstUserMessage}
      onUpdateChat={updateMessages}
      onUpdateTripDestination={updateTripDestination}
      onUpdateChatDraft={updateChatDraftDestination}
      activeChatId={activeChatId}
      onSwitchChat={(id) => {
        setChatDraft(null);
        setActiveChatId(id);
        const trip = savedTrips.find((t) => String(t.id) === String(id));
        const spot = trip
          ? resolveSessionBoundSpot(trip.destination, trip.messages || [])
          : null;
        if (spot) {
          setMooniPlaceContext(buildMooniBoundSpotFromLocation(spot));
        } else if (
          trip?.destination &&
          String(trip.destination).trim() !== 'MOONi'
        ) {
          setMooniPlaceContext({
            slug: null,
            name: String(trip.destination).trim(),
            displayLabel: String(trip.destination).trim(),
            country: trip.curation_data?.country ?? null,
            lat: trip.lat ?? null,
            lng: trip.lng ?? null,
          });
        } else {
          setMooniPlaceContext(null);
        }
      }}
      onDeleteChat={deleteTrip}
    />
  );
}
