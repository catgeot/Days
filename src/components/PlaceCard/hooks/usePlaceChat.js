import { useState, useCallback } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';
import { resolveBookingActions } from '../../../utils/bookingIntentResolver';

/**
 * Place Card AI 채팅 — 예약 CTA 포함 메시지 지원.
 *
 * @param {{ slug?: string, destinationName?: string, chatSource?: 'home' | 'place' }} [options]
 */
export const usePlaceChat = (options = {}) => {
  const { slug = null, destinationName = '', chatSource = 'place' } = options;

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
      const aiReply = await apiClient.fetchProxyGemini(
        null,
        priorHistory,
        currentSystemPrompt,
        userText,
        [],
        'gemini-2.5-flash',
      );

      const booking = resolveBookingActions({
        userText,
        destinationName,
        slug,
        chatHistory: priorHistory,
        chatSource,
        aiReplyText: aiReply,
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
    } catch {
      setError('메시지 전송 중 오류가 발생했습니다.');
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: '⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  }, [chatHistory, isAiLoading, slug, destinationName, chatSource]);

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
