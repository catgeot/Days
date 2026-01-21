import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, AlertTriangle, RefreshCcw, MessageSquare, Star } from 'lucide-react';

// 🚨 [신규] chatHistory prop 추가
const ChatModal = ({ isOpen, onClose, initialQuery, chatHistory = [] }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  useEffect(() => {
    if (isOpen) {
      if (initialQuery && !hasSentInitialRef.current) {
        hasSentInitialRef.current = true; 
        if (typeof initialQuery === 'object') {
          handleSend(initialQuery.text, initialQuery.display);
        } else {
          handleSend(initialQuery);
        }
      }
    } else {
      hasSentInitialRef.current = false;
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

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
        const status = response.status;
        console.warn(`Gemini API Error: ${status}`, data);

        if (status === 429) throw new Error("⏳ 사용량이 많아 잠시 쉬고 있습니다. (무료 한도 초과)");
        else if (status === 503) throw new Error("🔧 구글 서버가 점검 중입니다.");
        else throw new Error(`오류가 발생했습니다. (Code: ${status})`);
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";
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

  // 🚨 사이드바의 리스트 클릭 시 (재질문/대화복구 등 추후 구현)
  const handleHistoryClick = (item) => {
    // Phase 2에서 대화 복구 로직 구현 예정
    // 지금은 간단히 입력창에 텍스트 세팅
    setInput(`${item.destination} 여행에 대해 다시 알려줘`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      {/* 🚨 [구조 변경] 좌측 사이드바 + 우측 채팅창 (Grid Layout) */}
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] rounded-3xl border border-gray-700 shadow-2xl flex overflow-hidden relative transition-all">
        
        {/* [좌측 사이드바] 지난 대화 기록 */}
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
                  className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-blue-500/30 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-300 text-sm truncate">{item.destination}</span>
                    <span className="text-[10px] text-gray-500">{item.date?.slice(5)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-1 group-hover:text-gray-400">
                    {item.promptSummary || "상세 정보 요청됨"}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-600 text-xs">
                기록된 대화가 없습니다.
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-800 text-[10px] text-gray-500 text-center">
            기록은 브라우저에 저장됩니다
          </div>
        </div>

        {/* [우측 메인] 채팅 영역 */}
        <div className="flex-1 flex flex-col bg-black/50 relative">
            
            {/* Header */}
            <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <span className="text-white font-bold block text-sm">Gate 0 AI</span>
                  <span className="text-xs text-gray-400">Ambient Intelligence</span>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700/50 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                    msg.role === 'user' ? 'bg-gray-700' : msg.role === 'error' ? 'bg-red-900/50' : 'bg-transparent'
                  }`}>
                    {msg.role === 'user' ? <User size={20} className="text-gray-300" /> : 
                     msg.role === 'error' ? <AlertTriangle size={20} className="text-red-400" /> :
                     <Bot size={24} className="text-blue-400" />}
                  </div>
                  
                  <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-md flex flex-col gap-3 ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 
                    msg.role === 'error' ? 'bg-red-900/20 text-red-200 border border-red-500/30' :
                    'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
                  }`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    {msg.role === 'error' && (
                      <button onClick={() => handleRetry(msg.originalText)} className="flex items-center gap-2 bg-red-800/50 hover:bg-red-700/50 text-white text-xs px-3 py-2 rounded-lg w-fit transition-colors">
                        <RefreshCcw size={12} /> 다시 시도하기
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 flex-shrink-0"></div>
                   <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                     <Loader2 size={20} className="text-blue-400 animate-spin" />
                     <span className="text-sm text-gray-400">Gate 0가 여행지를 분석하고 있습니다...</span>
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
                  placeholder="추가로 궁금한 점을 물어보세요..."
                  className="w-full bg-gray-800 text-white pl-6 pr-14 py-4 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 text-base"
                  disabled={isLoading}
                  autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg disabled:opacity-50">
                  {isLoading ? <Sparkles size={20} className="animate-pulse" /> : <Send size={20} />}
                </button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;