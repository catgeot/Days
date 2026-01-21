import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, AlertTriangle, RefreshCcw, MessageSquare, Star } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery, chatHistory = [], onUpdateChat, onToggleBookmark }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTripId, setCurrentTripId] = useState(null); // 현재 대화 중인 여행 ID
  
  const messagesEndRef = useRef(null);
  const hasSentInitialRef = useRef(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const SYSTEM_PROMPT = `
    당신은 'Gate 0'라는 여행 웹사이트의 전설적인 여행 가이드입니다.
    [핵심 역할] 단순 정보가 아닌, 여행을 망설이는 사용자에게 '용기'와 '설렘'을 주는 멘토입니다.
    [답변 가이드]
    1. 톤앤매너: 감성적이고 따뜻하게, 이모지(✈️, 🌊) 사용.
    2. 추천방식: 스케줄 나열 금지. 분위기와 감정 위주로 서술.
    3. 길이: 너무 길지 않게, 3~4문단 정도로 핵심만.
    4. 강조: 중요한 장소는 **굵게**.
  `;

  // 메시지 변경 시 자동 스크롤 & 부모(Home) 데이터 업데이트
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // 메시지가 있고, 현재 여행 ID가 있다면 부모에게 저장 요청 (캐싱)
    if (currentTripId && messages.length > 0 && onUpdateChat) {
      onUpdateChat(currentTripId, messages);
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // 1. 신규 발권 (initialQuery가 객체로 넘어옴)
      if (initialQuery && typeof initialQuery === 'object' && !hasSentInitialRef.current) {
        hasSentInitialRef.current = true;
        // 새 여행이므로 ID는 아직 모름 (Home에서 생성된 마지막 Trip을 찾아야 하지만, 
        // 여기서는 간단히 로직 처리를 위해 initialQuery를 통해 막 처리함. 
        // 실제로는 Home에서 tripId를 넘겨주거나, 여기서 새로 생성된 Trip을 찾아야 함.)
        // -> 간소화를 위해: 가장 최신 Trip(방금 생성된 것)을 현재 Trip으로 간주
        if (chatHistory.length > 0) {
           setCurrentTripId(chatHistory[0].id);
        }
        handleSend(initialQuery.text, initialQuery.display);
      }
    } else {
      hasSentInitialRef.current = false;
      setMessages([]);
      setCurrentTripId(null);
    }
  }, [isOpen, initialQuery, chatHistory]); // chatHistory 의존성 추가 (최신 ID 확보)

  const handleSend = async (text, displayText = null) => {
    if (!text.trim() || isLoading) return;

    const visibleText = displayText || text;
    if (displayText !== 'RETRY') {
      const userMsg = { role: 'user', text: visibleText };
      setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n사용자 질문: ${text}` }] }
            ],
            generationConfig: { temperature: 1.0, maxOutputTokens: 2500 }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("AI 응답 오류");
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";
      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', text: error.message, originalText: text }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (originalText) => {
    setMessages(prev => prev.slice(0, -1)); 
    handleSend(originalText, 'RETRY'); 
  };

  // 🚨 [핵심] 사이드바 클릭 시: 캐시된 메시지 불러오기 (API 호출 X)
  const handleHistoryClick = (item) => {
    setCurrentTripId(item.id);
    
    // 저장된 메시지가 있으면 불러오기
    if (item.messages && item.messages.length > 0) {
      setMessages(item.messages);
    } else {
      // 메시지가 없으면(예전 데이터) 새로 시작하는 척하지만 API는 안 부름 (또는 요약만 보여줌)
      // 여기선 편의상 빈 화면 대신 요약이라도 보여줌
      setMessages([{ role: 'model', text: `[${item.destination}] 기록을 불러왔습니다. 무엇을 도와드릴까요?` }]);
    }
  };

  const handleStarClick = (e, id) => {
    e.stopPropagation();
    if(onToggleBookmark) onToggleBookmark(id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] rounded-3xl border border-gray-700 shadow-2xl flex overflow-hidden relative transition-all">
        
        {/* 사이드바 */}
        <div className="hidden md:flex w-72 bg-gray-900 border-r border-gray-700 flex-col">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-400" />
            <span className="font-bold text-gray-200 text-sm">지난 대화 기록</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chatHistory && chatHistory.length > 0 ? (
              chatHistory.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleHistoryClick(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all group relative ${
                    currentTripId === item.id 
                    ? 'bg-gray-800 border-blue-500/50' 
                    : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-300 text-sm truncate max-w-[180px]">{item.destination}</span>
                    
                    {/* 🚨 [신규] 별표 버튼 */}
                    <button 
                      onClick={(e) => handleStarClick(e, item.id)}
                      className="text-gray-600 hover:text-yellow-400 transition-colors"
                    >
                      <Star size={14} fill={item.isBookmarked ? "#FBBF24" : "none"} className={item.isBookmarked ? "text-yellow-400" : ""} />
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-gray-500 line-clamp-1 flex-1">
                        {item.date}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-600 text-xs">
                기록된 대화가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 채팅창 (우측) */}
        <div className="flex-1 flex flex-col bg-black/50 relative">
            {/* ... Header (동일) ... */}
            <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <span className="text-white font-bold block text-sm">Gate 0 AI</span>
                  <span className="text-xs text-gray-400">Travel Guide</span>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700/50 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                    msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'
                  }`}>
                    {msg.role === 'user' ? <User size={20} className="text-gray-300" /> : <Bot size={24} className="text-blue-400" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-md ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
                  }`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 flex-shrink-0"></div>
                   <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                     <Loader2 size={20} className="text-blue-400 animate-spin" />
                     <span className="text-sm text-gray-400">작성 중...</span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-gray-900 border-t border-gray-800">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center max-w-4xl mx-auto">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="추가 질문을 입력하세요..."
                  className="w-full bg-gray-800 text-white pl-6 pr-14 py-4 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500"
                  disabled={isLoading}
                  autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg">
                  <Send size={20} />
                </button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;