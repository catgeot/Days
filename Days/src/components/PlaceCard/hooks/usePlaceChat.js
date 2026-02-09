import { useState, useCallback } from 'react';
import { apiClient } from '../../../pages/Home/lib/apiClient';

// 🚨 [New] 채팅 로직을 분리하여 PlaceCard, TicketModal 등에서 재사용 가능하게 함
export const usePlaceChat = (initialSystemPrompt = "") => {
  const [chatHistory, setChatHistory] = useState([]); // { role: 'user' | 'model', text: string }
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // 메시지 전송 함수
  const sendMessage = useCallback(async (userText, currentSystemPrompt = initialSystemPrompt) => {
    if (!userText.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setError(null);

    // 1. 유저 메시지 즉시 UI 반영 (낙관적 업데이트)
    const newHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);

    try {
      // 2. API 호출
      const aiReply = await apiClient.fetchGeminiResponse(
        API_KEY,
        chatHistory, // 이전 대화 맥락 전달
        currentSystemPrompt,
        userText
      );

      // 3. AI 응답 반영
      setChatHistory(prev => [...prev, { role: 'model', text: aiReply }]);

    } catch (err) {
      setError("메시지 전송 중 오류가 발생했습니다.");
      setChatHistory(prev => [...prev, { role: 'model', text: "⚠️ 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsAiLoading(false);
    }
  }, [chatHistory, isAiLoading, initialSystemPrompt, API_KEY]);

  // 대화 초기화
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
    clearChat
  };
};