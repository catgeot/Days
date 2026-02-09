// 🚨 [Fix/New] 수정 이유: 객체 형태의 initialQuery에서 텍스트를 정확히 추출하고 페르소냐를 적용함
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, MessageSquare, Star, Trash2, RefreshCcw } from 'lucide-react';
// 🚨 [New] 프롬프트 엔진 임포트
import { getSystemPrompt, PERSONA_TYPES } from '../lib/prompts';

const ChatModal = ({ 
  isOpen, 
  onClose, 
  initialQuery, 
  chatHistory = [], 
  onUpdateChat, 
  onToggleBookmark, 
  activeChatId, 
  onSwitchChat,
  onDeleteChat,
  onClearChats
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersona, setCurrentPersona] = useState(PERSONA_TYPES.GENERAL);
  const [loadingStatus, setLoadingStatus] = useState("AI가 답변을 준비 중입니다...");
  
  const lastQuestionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasSentInitialRef = useRef(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    let interval;
    if (isLoading) {
      const statuses = [
        "🗺️ 여행지 정보를 스캔하고 있습니다...",
        "🔍 현지 맛집과 명소를 찾는 중...",
        "✈️ 여행 계획을 정리하고 있습니다...",
        "✍️ 답변을 작성 중입니다..."
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
      if (lastQuestionRef.current) {
         setTimeout(() => {
            lastQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }, 100);
      } else {
         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && activeChatId) {
      const targetTrip = chatHistory.find(t => t.id === activeChatId);
      if (targetTrip) {
        setMessages(targetTrip.messages || []);
        if (targetTrip.persona) setCurrentPersona(targetTrip.persona);
      }
    }
  }, [activeChatId, isOpen, chatHistory]); 

  // 🚨 [Fix] 초기 쿼리에서 [object Object] 방지 및 텍스트 추출
  useEffect(() => {
    if (isOpen && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;

      let queryText = "";
      if (typeof initialQuery === 'string') {
        queryText = initialQuery;
      } else if (typeof initialQuery === 'object') {
        queryText = initialQuery.text || initialQuery.display || initialQuery.query || "";
      }

      if (!queryText || typeof queryText === 'object') {
        queryText = "여행지에 대해 알려줘"; 
      }

      const queryPersona = initialQuery.persona || PERSONA_TYPES.GENERAL;
      setCurrentPersona(queryPersona);
      handleSend(queryText, queryPersona); 
    } else if (!isOpen) {
      hasSentInitialRef.current = false;
    }
  }, [isOpen, initialQuery]);

  const handleSend = async (text, personaOverride = null) => {
    if (!text?.trim() || isLoading) return;

    // 🚨 텍스트가 객체로 넘어오는 것을 방지
    const cleanText = typeof text === 'object' ? (text.text || "질문 내용 확인 불가") : text;
    const personaToUse = personaOverride || currentPersona;

    const userMsg = { role: 'user', text: cleanText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); 
    setInput('');
    setIsLoading(true);

    if (activeChatId) onUpdateChat(activeChatId, newMessages);

    try {
      const systemInstruction = getSystemPrompt(personaToUse, activeChatId ? chatHistory.find(t => t.id === activeChatId)?.destination : ""); 

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ 
                role: "user", 
                parts: [{ text: `${systemInstruction}\n\n사용자 질문: ${cleanText}` }] 
            }]
          })
        }
      );

      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 정보를 불러오지 못했습니다.";
      
      const finalMessages = [...newMessages, { role: 'model', text: aiReply }];
      setMessages(finalMessages); 

      if (activeChatId) onUpdateChat(activeChatId, finalMessages);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', text: "Error: " + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSidebarClick = (id) => { if (onSwitchChat) onSwitchChat(id); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] rounded-3xl border border-gray-700 shadow-2xl flex overflow-hidden relative transition-all">
        
        <div className="hidden md:flex w-72 bg-gray-900 border-r border-gray-700 flex-col">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              <span className="font-bold text-gray-200 text-sm">대화 기록</span>
            </div>
            <button onClick={onClearChats} className="text-gray-500 hover:text-white transition-colors"><RefreshCcw size={14} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chatHistory.map((item) => (
              <div key={item.id} onClick={() => handleSidebarClick(item.id)} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeChatId === item.id ? 'bg-gray-800 border-blue-500/50' : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-300 text-sm truncate max-w-[140px]">{item.destination}</span>
                  <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(item.id); }}>
                        <Star size={14} className={item.is_bookmarked ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteChat(item.id); }}>
                        <Trash2 size={14} className="text-gray-600 hover:text-red-400" />
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
               <div className="flex items-center gap-2">
                 <Bot size={18} className="text-white" />
                 <span className="text-white font-bold text-sm">Days AI • {currentPersona}</span>
               </div>
               <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                    {msg.role === 'user' ? <User size={20} className="text-gray-300" /> : <Bot size={24} className="text-blue-400" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-base shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{typeof msg.text === 'object' ? (msg.text.text || "내용 없음") : msg.text}</div>
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

            <div className="p-6 bg-gray-900 border-t border-gray-800">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="메시지 입력..." className="w-full bg-gray-800 text-white pl-6 pr-14 py-4 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500" disabled={isLoading} autoFocus />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full text-white"><Send size={20} /></button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;