import { useState, useCallback } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { getGeminiProxyErrorMessage } from '../../../pages/Home/lib/geminiProxyError';
import { resolveChatBookingActions } from '../../../utils/chatBookingResolver';
import { resolveMooniChatModel } from '../../../utils/mooniChatModel';
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

  const sendMessage = useCallback(async (userText, currentSystemPrompt = '') => {
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

      const aiReply = await apiClient.fetchProxyGemini(
        null,
        priorHistory,
        currentSystemPrompt,
        userText,
        [],
        chatModelId,
      );

      const essentialGuide =
        (await ensureChatEssentialGuide(slug, destinationName)) ?? cachedGuide;

      const booking = resolveChatBookingActions({
        userText,
        destinationName,
        slug,
        chatHistory: priorHistory,
        chatSource,
        aiReplyText: aiReply,
        essentialGuide,
      });

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'model',
          text: aiReply,
          bookingActions: booking.show ? booking.actions : null,
          bookingMeta: booking.show
            ? { slug: booking.slug, plannerUrl: booking.plannerUrl }
            : null,
        },
      ]);
    } catch (err) {
      const message = getGeminiProxyErrorMessage(err);
      setError(message);
      setChatHistory((prev) => [
        ...prev,
        { role: 'error', text: message },
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
