import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // 🚨 [추가] 마지막 메시지 위치를 잡기 위한 Ref (스크롤 제어용)
  const lastUserMessageRef = useRef(null);

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
      if (messages.length === 0) {
        setMessages([{ role: 'model', text: '반갑습니다! 떠나고 싶은 곳이 있나요? 아니면 막연한 기분만 들고 오셨나요? 무엇이든 들어드릴게요. ✈️' }]);
      }
      
      // 🚨 [수정] 티켓 발권(긴 프롬프트)으로 들어왔으면 '즉시 전송'
      // 일반 검색(짧은 질문)도 엔터치고 들어온 거니까 '즉시 전송'이 맞음.
      // Home.jsx에서 'draftInput'은 UI에만 뿌리고, 'initialQuery'는 실행하라고 주는 것이므로
      // 여기서는 무조건 실행합니다.
      if (initialQuery) {
        handleSend(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  // 🚨 [수정] 스크롤 로직 변경
  // isLoading이 true가 되었다(사용자가 질문함) -> 맨 밑으로 내림
  // isLoading이 false가 되었다(AI 답변 옴) -> 스크롤 유지 (혹은 사용자 질문 위치 유지)
  useEffect(() => {
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // AI 답변이 왔을 때는 스크롤을 강제로 내리지 않음으로써
      // 사용자가 방금 보낸 질문과 답변의 시작 부분을 볼 수 있게 함.
    }
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', text };
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
      <div className="bg-gray-900 w-full max-w-2xl h-[80vh] rounded-3xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative">
        <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold block text-sm">Gate 0 가이드</span>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700/50 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-gray-900 to-black custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-300" /> : <Bot size={20} className="text-blue-400" />}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
              }`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="font-bold text-blue-300">{part}</span> : part)}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 flex-shrink-0"></div>
               <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                 <Loader2 size={16} className="text-blue-400 animate-spin" />
                 <span className="text-xs text-gray-400">생각하는 중...</span>
               </div>
            </div>
          )}
          {/* 🚨 [수정] 여기가 자동 스크롤의 타겟. 로딩이 끝났을 때는 여기로 강제 이동 안 함. */}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 점을 물어보세요..."
              className="w-full bg-gray-800 text-white pl-5 pr-12 py-3.5 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg disabled:opacity-50">
              {isLoading ? <Sparkles size={18} className="animate-pulse" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;