import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // API 키 가져오기
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // 시스템 프롬프트 (감성 여행 가이드)
  const SYSTEM_PROMPT = `
    당신은 'Gate 0'라는 여행 웹사이트의 전설적인 여행 가이드입니다.
    
    [핵심 역할]
    단순한 정보 검색기가 아닙니다. 여행을 망설이는 사용자에게 '용기'와 '설렘'을 불어넣어 주는 따뜻한 멘토가 되어주세요.

    [답변 가이드]
    1. 톤앤매너: 친절하고 다정하게, 이모지(✈️, 🌊, ✨)를 적절히 섞어서 생동감 있게 표현하세요.
    2. 공감하기: 사용자의 질문 뒤에 숨겨진 '걱정'이나 '기대'를 먼저 읽어주고 공감해주세요.
    3. 추천방식: 장소만 툭 던지지 말고, "거기서 무엇을 느끼면 좋은지" 감성적인 팁을 덧붙여주세요.
    4. 길이: 너무 길지 않게, 하지만 문장이 중간에 끊기지 않도록 완결된 문장으로 끝맺어주세요.
    5. 강조: 중요한 여행지나 팁은 **굵게** 표시해주세요.
  `;

  // 🚨 [수정된 useEffect]
  // 모달이 열릴 때, initialQuery가 있으면 '전송'하지 않고 '입력창'에만 채워둡니다.
  useEffect(() => {
    if (isOpen) {
      // 1. 첫 인사 메시지 (대화가 비어있을 때만)
      if (messages.length === 0) {
        setMessages([{ role: 'model', text: '반갑습니다! 떠나고 싶은 곳이 있나요? 아니면 막연한 기분만 들고 오셨나요? 무엇이든 들어드릴게요. ✈️' }]);
      }
      
      // 2. 외부에서 들어온 질문이 있다면? -> 입력창에 Draft(초안) 작성
      if (initialQuery) {
        setInput(initialQuery);
        // handleSend(initialQuery); // <--- 이 부분을 삭제하여 자동 전송 막음
      }
    }
  }, [isOpen, initialQuery]);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${SYSTEM_PROMPT}\n\n사용자 질문: ${text}` }]
              }
            ],
            generationConfig: {
              temperature: 1.0, 
              maxOutputTokens: 2500,
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Gemini API Error:", data);
        const errorCode = data.error?.code || response.status;
        if (errorCode === 429) throw new Error("사용량이 많아 잠시 쉬고 있습니다. 10초 뒤에 다시 말해주세요! ☕");
        throw new Error(data.error?.message || "오류가 발생했습니다.");
      }

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. 답변을 생성하지 못했습니다.";

      setMessages(prev => [...prev, { role: 'model', text: aiReply }]);

    } catch (error) {
      console.error("Chat Logic Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-2xl h-[80vh] rounded-3xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold block text-sm">Gate 0 가이드</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online (Gemini Flash)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700/50 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-gray-900 to-black custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-300" /> : <Bot size={20} className="text-blue-400" />}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
              }`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('**').map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="font-bold text-blue-300">{part}</span> : part
                  )}
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
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
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
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg disabled:opacity-50"
            >
              {isLoading ? <Sparkles size={18} className="animate-pulse" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;