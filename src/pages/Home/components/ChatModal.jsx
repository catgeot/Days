import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Loader2, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';
import { apiClient } from '../lib/apiClient';
import { tripHasPersistedDialogue } from '../lib/tripChatUtils';
import {
  fetchPlaceChatIntroSummary,
  generatePlaceChatIntroWithAi,
  persistPlaceChatIntroSummary
} from '../lib/placeChatIntro';
import {
  shouldUsePlannerPersona,
  resolveSlugFromDestination,
} from '../../../utils/bookingIntentResolver';
import { resolveChatBookingActions } from '../../../utils/chatBookingResolver';
import {
  resolveDestinationFromChat,
} from '../../../utils/resolveDestinationFromChat';
import BookingActionCards from '../../../components/chat/BookingActionCards';
import DestinationResolutionChips from '../../../components/chat/DestinationResolutionChips';

const ChatModal = ({
  isOpen,
  onClose,
  mooniEntry = false,
  initialQuery,
  chatHistory = [],
  chatDraft = null,
  onCreateTripOnFirstUserMessage,
  onUpdateChat,
  onUpdateTripDestination,
  onUpdateChatDraft,
  activeChatId,
  onSwitchChat,
  onDeleteChat
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(PERSONA_TYPES.GENERAL);
  const [loadingStatus, setLoadingStatus] = useState("AI가 답변을 준비 중입니다...");
  const [placeIntro, setPlaceIntro] = useState(null);
  const [placeIntroLoading, setPlaceIntroLoading] = useState(false);
  const [placeIntroError, setPlaceIntroError] = useState(null);

  const lastQuestionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasSentInitialRef = useRef(false);

  const introDestinationRaw = useMemo(() => {
    if (!isOpen) return '';
    const fromDraft = (chatDraft?.destination || '').trim();
    if (fromDraft) return fromDraft;
    if (activeChatId && Array.isArray(chatHistory)) {
      const trip = chatHistory.find((t) => t.id === activeChatId);
      return (trip?.destination || '').trim();
    }
    return '';
  }, [isOpen, chatDraft?.destination, activeChatId, chatHistory]);

  const isMooniSession = introDestinationRaw === 'MOONi';
  const isMooniUi = mooniEntry || isMooniSession;
  const boundDestinationSlug = useMemo(() => {
    if (!introDestinationRaw || isMooniSession) return null;
    return resolveSlugFromDestination(introDestinationRaw);
  }, [introDestinationRaw, isMooniSession]);

  useEffect(() => {
    if (!isOpen || !introDestinationRaw || isMooniUi) {
      setPlaceIntro(null);
      setPlaceIntroError(null);
      setPlaceIntroLoading(false);
      return;
    }

    let cancelled = false;
    setPlaceIntro(null);
    setPlaceIntroError(null);
    setPlaceIntroLoading(true);

    (async () => {
      try {
        let text = await fetchPlaceChatIntroSummary(introDestinationRaw);
        if (cancelled) return;
        if (text) {
          setPlaceIntro(text);
          return;
        }
        text = await generatePlaceChatIntroWithAi(introDestinationRaw);
        if (cancelled) return;
        setPlaceIntro(text);
        await persistPlaceChatIntroSummary(introDestinationRaw, text);
      } catch (e) {
        if (!cancelled) {
          setPlaceIntroError(e?.message || '여행지 요약을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setPlaceIntroLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, introDestinationRaw, isMooniUi]);

  // 🚨 보안 수정: 클라이언트에서 API 키를 가져오지 않습니다. 서버 프록시 사용.
  // const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    let interval;
    if (isLoading) {
      const statuses = [
        "새로운 여행지 정보를 스캔하고 있습니다...",
        "숨겨진 로컬 맛집과 명소를 찾는 중...",
        "🗺️ 여행 계획을 정리하고 있습니다...",
        "✈️ 답변을 생성 중입니다..."
      ];
      let i = 0;
      setLoadingStatus(statuses[0]);
      interval = setInterval(() => {
        i = (i + 1) % statuses.length;
        setLoadingStatus(statuses[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        if (lastQuestionRef.current) {
          lastQuestionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      return;
    }
    if (activeChatId) {
      const targetTrip = chatHistory.find(
        (t) => String(t.id) === String(activeChatId)
      );
      if (targetTrip) {
        setMessages(targetTrip.messages || []);
        if (targetTrip.persona) setCurrentPersona(targetTrip.persona);
      }
      return;
    }
    if (chatDraft) {
      setMessages([]);
      if (chatDraft.persona) setCurrentPersona(chatDraft.persona);
    }
  }, [activeChatId, isOpen, chatHistory, chatDraft]);

  const applyDestinationBinding = useCallback(async (chatId, draft, candidate) => {
    if (!candidate?.name) return;
    const patch = {
      destination: candidate.name,
      lat: candidate.lat ?? draft?.lat ?? 0,
      lng: candidate.lng ?? draft?.lng ?? 0,
    };
    if (chatId && onUpdateTripDestination) {
      await onUpdateTripDestination(chatId, patch);
    } else if (draft && onUpdateChatDraft) {
      onUpdateChatDraft(patch);
    }
  }, [onUpdateTripDestination, onUpdateChatDraft]);

  const handleSelectDestinationCandidate = useCallback(async (candidate, messageIndex) => {
    if (!candidate?.slug || !candidate?.name) return;

    await applyDestinationBinding(activeChatId, chatDraft, candidate);

    setMessages((prev) => {
      const next = prev.map((m, i) =>
        i === messageIndex
          ? {
              ...m,
              destinationCandidates: null,
              confirmedDestination: { slug: candidate.slug, name: candidate.name },
            }
          : m
      );
      if (activeChatId) onUpdateChat(activeChatId, next);
      return next;
    });
  }, [activeChatId, chatDraft, applyDestinationBinding, onUpdateChat]);

  const handleSend = useCallback(async (text, personaOverride = null) => {
    if (!text?.trim() || isLoading) return;

    const cleanText = typeof text === 'object' ? (text.text || "질문 내용 확인 불가") : text;
    const personaToUse =
      personaOverride ||
      (shouldUsePlannerPersona(cleanText, messages) ? PERSONA_TYPES.PLANNER : currentPersona);

    if (personaToUse !== currentPersona) {
      setCurrentPersona(personaToUse);
    }

    if (!activeChatId && !chatDraft) {
      return;
    }

    const currentDest =
      (activeChatId && chatHistory.find((t) => t.id === activeChatId)?.destination) ||
      chatDraft?.destination ||
      '';

    let resolution = resolveDestinationFromChat(cleanText, messages, currentDest);

    let sessionDest = currentDest;
    if (resolution?.confidence === 'high' && resolution.name) {
      sessionDest = resolution.name;
    }

    const userMsg = {
      role: 'user',
      text: cleanText,
      ...(resolution?.confidence === 'high' && resolution.slug
        ? { confirmedDestination: { slug: resolution.slug, name: resolution.name } }
        : {}),
      ...(resolution?.confidence === 'low' && resolution.candidates?.length
        ? { destinationCandidates: resolution.candidates, destinationPrompt: true }
        : {}),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let effectiveChatId = activeChatId;
    if (!effectiveChatId) {
      const created = await onCreateTripOnFirstUserMessage({
        destination: sessionDest,
        lat:
          resolution?.confidence === 'high'
            ? (resolution.lat ?? chatDraft.lat)
            : chatDraft.lat,
        lng:
          resolution?.confidence === 'high'
            ? (resolution.lng ?? chatDraft.lng)
            : chatDraft.lng,
        persona: personaToUse,
        firstUserText: cleanText
      });
      if (!created?.id) {
        setIsLoading(false);
        setMessages((prev) => (prev.length > 0 ? prev.slice(0, -1) : []));
        return;
      }
      effectiveChatId = created.id;
    } else if (resolution?.confidence === 'high' && resolution.name) {
      await applyDestinationBinding(effectiveChatId, chatDraft, resolution);
    }

    onUpdateChat(effectiveChatId, newMessages);

    try {
      const destForPrompt = sessionDest === 'MOONi' ? (resolution?.name || sessionDest) : sessionDest;
      const systemInstruction = getSystemPrompt(personaToUse, destForPrompt, {
        isMooni: destForPrompt === 'MOONi',
      });
      const priorTurns = messages.map((m) => ({ role: m.role, text: m.text }));

      const aiReply = await apiClient.fetchProxyGemini(
        null,
        priorTurns,
        systemInstruction,
        cleanText,
        [],
        "gemini-2.5-flash"
      );

      const slug =
        resolution?.slug ??
        resolveSlugFromDestination(destForPrompt === 'MOONi' ? null : destForPrompt);
      const booking = resolveChatBookingActions({
        userText: cleanText,
        destinationName: destForPrompt === 'MOONi' ? (resolution?.name ?? '') : destForPrompt,
        slug,
        chatHistory: priorTurns,
        chatSource: 'home',
        aiReplyText: aiReply,
      });

      const finalMessages = [
        ...newMessages,
        {
          role: 'model',
          text: aiReply,
          bookingActions: booking.show ? booking.actions : null,
          bookingMeta: booking.show
            ? { slug: booking.slug, plannerUrl: booking.plannerUrl }
            : null,
        },
      ];
      setMessages(finalMessages);

      onUpdateChat(effectiveChatId, finalMessages);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', text: "Error: " + error.message }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentPersona, messages, activeChatId, chatDraft, onUpdateChat, onCreateTripOnFirstUserMessage, chatHistory, applyDestinationBinding]);

  useEffect(() => {
    if (isOpen && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;

      let queryText = "";
      if (typeof initialQuery === 'string') {
        queryText = initialQuery;
      } else if (typeof initialQuery === 'object') {
        queryText = initialQuery?.text || initialQuery?.display || initialQuery?.query || "";
      }

      const queryPersona = initialQuery?.persona || PERSONA_TYPES.GENERAL;
      setCurrentPersona(queryPersona);

      if (queryText.trim().length > 0) {
        handleSend(queryText, queryPersona);
      }

    } else if (!isOpen) {
      hasSentInitialRef.current = false;
    }
  }, [isOpen, initialQuery, handleSend]);

  const handleSidebarClick = (id) => { if (onSwitchChat) onSwitchChat(id); };

  const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] rounded-3xl border border-gray-700 shadow-2xl flex overflow-hidden relative transition-all">

        <div className="hidden md:flex w-72 bg-gray-900 border-r border-gray-700 flex-col">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              <span className="font-bold text-gray-200 text-sm">채팅 기록</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chatHistory
              .filter((item) => !item.is_hidden && tripHasPersistedDialogue(item))
              .map((item) => (
              <div key={item.id} onClick={() => handleSidebarClick(item.id)} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeChatId === item.id ? 'bg-gray-800 border-blue-500/50' : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-300 text-sm truncate max-w-[140px]">{item.destination}</span>
                  <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(item.id);
                        }}
                        className="text-gray-600 hover:text-red-400"
                        title="채팅방 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-gray-500">{item.date}</p>
                  {item.persona && <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-gray-700 text-gray-400 uppercase">{item.persona}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-black/50 relative">
            <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
               <div className="flex flex-col min-w-0">
                 <span className="font-bold text-white tracking-wide text-base">
                   {isMooniUi && boundDestinationSlug
                     ? `${introDestinationRaw} · MOONi`
                     : isMooniUi
                       ? 'MOONi'
                       : introDestinationRaw || 'MOONi'}
                 </span>
                 <span className="text-[11px] text-cyan-300/80 font-medium truncate">
                   {isMooniUi
                     ? boundDestinationSlug
                       ? `${introDestinationRaw} 여행 대화 · ${currentPersona}`
                       : `여행 AI 도우미 · ${currentPersona}`
                     : `${introDestinationRaw || '여행'} 대화 · ${currentPersona}`}
                 </span>
               </div>
               <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 custom-scrollbar">
              {!isMooniUi && (placeIntro || placeIntroLoading || placeIntroError) && (
                <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 to-gray-900/60 p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300/90">
                    <Sparkles size={16} className="shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wide">이 장소 한눈에 보기</span>
                  </div>
                  {placeIntroLoading && !placeIntro && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Loader2 className="animate-spin shrink-0" size={18} />
                      <span>여행지 요약을 준비하고 있어요...</span>
                    </div>
                  )}
                  {placeIntroError && (
                    <p className="text-sm text-red-400">{placeIntroError}</p>
                  )}
                  {placeIntro && (
                    <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{placeIntro}</p>
                  )}
                </div>
              )}
              {isMooniUi && messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-start w-full">
                  <span className="text-[10px] font-bold mb-1 px-1 text-cyan-400 uppercase tracking-wider">MOONi</span>
                  <div className="w-full p-4 rounded-2xl text-base shadow-md bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed">
                    안녕하세요! 저는 MOONi예요. 가고 싶은 여행지, 일정, 교통·예약 궁금한 점 무엇이든 물어보세요.
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  ref={idx === lastUserIdx ? lastQuestionRef : null}
                  className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <span className={`text-[10px] font-bold mb-1 px-1 uppercase tracking-wider ${
                    msg.role === 'user' ? 'text-blue-400' : msg.role === 'error' ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {msg.role === 'user' ? 'Me' : 'MOONi'}
                  </span>
                  <div className={`p-4 rounded-2xl text-base shadow-md w-full ${
                    msg.role === 'user'
                      ? 'max-w-full md:max-w-[80%] bg-blue-600 text-white rounded-tr-sm'
                      : msg.role === 'error'
                        ? 'bg-red-950/50 text-red-200 rounded-tl-sm'
                        : 'bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed'
                  }`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{typeof msg.text === 'object' ? (msg.text.text || "내용 없음") : msg.text}</div>
                    {(msg.confirmedDestination || (msg.destinationCandidates?.length > 0 && msg.destinationPrompt)) && (
                      <DestinationResolutionChips
                        confirmed={msg.confirmedDestination}
                        candidates={msg.destinationCandidates}
                        onSelectCandidate={(c) => handleSelectDestinationCandidate(c, idx)}
                      />
                    )}
                    {msg.role === 'model' && msg.bookingActions?.length > 0 && (
                      <BookingActionCards
                        actions={msg.bookingActions}
                        slug={msg.bookingMeta?.slug}
                        plannerUrl={msg.bookingMeta?.plannerUrl}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 items-center">
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-300 animate-pulse font-medium">{loadingStatus}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 md:p-6 bg-gray-900 border-t border-gray-800">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="메시지 입력..." className="w-full bg-gray-800 text-white text-[16px] md:text-base pl-6 pr-14 py-4 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500" disabled={isLoading} autoFocus />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full text-white"><Send size={20} /></button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
