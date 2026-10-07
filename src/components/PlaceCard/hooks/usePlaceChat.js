import { useState, useCallback } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { GeminiProxyError, getGeminiProxyErrorMessage } from '../../../pages/Home/lib/geminiProxyError';
import { resolveChatBookingActions } from '../../../utils/chatBookingResolver';
import { GEMINI_MODELS } from '../../../utils/geminiModels';
import { resolveMooniChatModel } from '../../../utils/mooniChatModel';
import {
  extractMooniTripFacts,
  mergeMooniTripSession,
} from '../../../pages/Home/lib/mooniTripSession.js';
import {
  ensureChatEssentialGuide,
  useChatEssentialGuide,
} from '../../../hooks/useChatEssentialGuide';

/**
 * Place Card AI 채팅 — 예약 CTA 포함 메시지 지원.
 *
 * @param {{ slug?: string, destinationName?: string, chatSource?: 'home' | 'place' }} [options]
 */
export const usePlaceChat = (options = {}) => {
  const { slug = null, destinationName = '', chatSource = 'place' } = options;
  const cachedGuide = useChatEssentialGuide(slug, destinationName);

  const [chatHistory, setChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText, taskParams = {}) => {
    if (!userText.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setError(null);

    const priorHistory = chatHistory;
    const newHistory = [...priorHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);

    try {
      const chatModelId = resolveMooniChatModel({
        userText,
        chatHistory: priorHistory,
      });
      const params = taskParams && typeof taskParams === 'object' ? taskParams : {};
      const history = priorHistory
        .filter((turn) => turn.role === 'user' || turn.role === 'model')
        .map((turn) => ({ role: turn.role, text: String(turn.text ?? '') }));

      const aiReply = await apiClient.invokeGeminiTask('mooni_chat', {
        locale: params.locale || 'ko',
        persona: params.persona || 'GENERAL',
        tier: chatModelId === GEMINI_MODELS.QUALITY ? 'quality' : 'fast',
        locationName: params.locationName || destinationName || '',
        boundPlaceName: params.boundPlaceName || destinationName || '',
        isMooni: params.isMooni !== false,
        chipId: params.chipId ?? null,
        facts: params.facts ?? null,
        tripSession: params.tripSession ?? null,
        cta: params.cta ?? 'none_quiet',
        ctaPlace: params.ctaPlace || destinationName || '',
        history,
        userText,
      });

      const essentialGuide =
        (await ensureChatEssentialGuide(slug, destinationName)) ?? cachedGuide;

      const tripSession = mergeMooniTripSession(params.tripSession, extractMooniTripFacts(userText, {
        destinationName,
        slug,
      }));

      const booking = resolveChatBookingActions({
        userText,
        destinationName,
        slug,
        chatHistory: priorHistory,
        chatSource,
        aiReplyText: aiReply,
        essentialGuide,
        tripSession,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: aiReply,
          bookingActions: booking.show ? booking.actions : null,
          bookingMeta: booking.show
            ? {
                slug: booking.slug,
                plannerUrl: booking.plannerUrl,
                itineraryBookingCompact: Boolean(booking.itineraryBookingCompact),
              }
            : null,
        },
      ]);
    } catch (err) {
      const message = getGeminiProxyErrorMessage(err);
      const role = err instanceof GeminiProxyError && err.kind === 'budget' ? 'model' : 'error';
      setError(message);
      setChatHistory((prev) => [
        ...prev,
        { role, text: message },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  }, [chatHistory, isAiLoading, slug, destinationName, chatSource, cachedGuide]);

  const clearChat = useCallback(() => {
    setChatHistory([]);
    setError(null);
    setIsAiLoading(false);
  }, []);

  return {
    chatHistory,
    isAiLoading,
    error,
    sendMessage,
    clearChat,
  };
};
