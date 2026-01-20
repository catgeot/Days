import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
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
      // 🚨 [수정 1] "반갑습니다..." 초기 인사말 삭제
      // 대신 메시지가 아예 없으면 비워둠 (깔끔함)
      
      // 🚨 [유지] 외부 질문(initialQuery)이 있으면 즉시 실행
      if (initialQuery) {
        if (typeof initialQuery === 'object') {
          handleSend(initialQuery.text, initialQuery.display);
        } else {
          handleSend(initialQuery);
        }
      }
    }
  }, [isOpen, initialQuery]);

  // 스크롤 로직 (질문 시 바닥, 답변 시 유지)
  useEffect(() => {
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text, displayText = null) => {
    if (!text.trim() || isLoading) return;

    const visibleText = displayText || text;
    const userMsg = { role: 'user', text: visibleText };
    setMessages(prev => [...prev, userMsg]);
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
      if (!response.ok) throw new Error("Gemini API Error");

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";
      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      {/* 🚨 [수정 2] 모달 크기 대폭 확장 (w-[90vw], max-w-[1200px]) */}
      <div className="bg-gray-900 w-[90vw] max-w-[1200px] h-[85vh] rounded-3xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative transition-all">
        
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-gray-900 to-black custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
              {/* 아이콘 */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                {msg.role === 'user' ? <User size={20} className="text-gray-300" /> : <Bot size={24} className="text-blue-400" />}
              </div>
              
              {/* 말풍선 (너비 조정) */}
              <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-md ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
              }`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="font-bold text-blue-300">{part}</span> : part)}
                </div>
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

        {/* Input Area */}
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
  );
};

export default ChatModal;