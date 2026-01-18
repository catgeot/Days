import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const messagesEndRef = useRef(null);

  // 시스템 프롬프트 (AI의 성격 부여)
  const SYSTEM_PROMPT = `
    당신은 'Gate 0'라는 여행 웹사이트의 AI 가이드입니다.
    당신의 임무는 단순 정보 전달이 아니라, 여행을 주저하는 사용자에게 '동기 부여'와 '안심'을 주는 것입니다.

    [대화 원칙]
    1. 말투: 여행을 많이 다녀본 친절한 선배처럼 따뜻하고 격려하는 어조 (존댓말).
    2. 공감: 사용자가 입력한 '여행 경험(초보/고수)'과 '현재 기분'을 최우선으로 고려해서 답변해.
    3. 길이: 가독성을 위해 300자 이내로 핵심만 감성적으로 전달해. 구구절절한 역사 설명 금지.
    4. 형식: 추천 여행지가 있다면 **굵게** 표시해줘.
    5. 마지막엔 항상 사용자가 안심할 수 있는 한마디를 덧붙여줘.
  `;

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', text: '반갑습니다! 여행 계획을 도와드릴까요? 막연한 생각이라도 좋으니 편하게 말씀해주세요. ✈️' }]);
      }
      if (initialQuery) {
        handleSend(initialQuery);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    // 1. 사용자 메시지 화면에 추가
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. OpenAI API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // 가성비 모델 사용
          messages: [
            { role: "system", content: SYSTEM_PROMPT }, // 페르소나 주입
            ...messages.map(m => ({ role: m.role, content: m.text })), // 이전 대화 기록
            { role: "user", content: text } // 현재 질문
          ],
          temperature: 0.7, // 창의성 조절 (0.7 정도가 감성적인 글쓰기에 적합)
          max_tokens: 500   // 답변 길이 제한
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const aiReply = data.choices[0].message.content;

      // 3. AI 응답 화면에 추가
      setMessages(prev => [...prev, { role: 'assistant', text: aiReply }]);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', text: "죄송합니다. 잠시 통신 장애가 발생했어요. 다시 한번 말씀해 주시겠어요? 😥" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-2xl h-[80vh] rounded-3xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* 헤더 */}
        <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold block text-sm">Gate 0 가이드</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-700/50 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-gray-900 to-black custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
              
              {/* 아이콘 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-300" /> : <Bot size={20} className="text-blue-400" />}
              </div>
              
              {/* 말풍선 */}
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'
              }`}>
                {/* 마크다운 스타일 렌더링 (간단히 구현) */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('**').map((part, i) => 
                    i % 2 === 1 ? <span key={i} className="font-bold text-blue-300">{part}</span> : part
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 flex-shrink-0"></div>
               <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                 <Loader2 size={16} className="text-blue-400 animate-spin" />
                 <span className="text-xs text-gray-400">답변을 생각하는 중...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="여행에 대해 궁금한 점을 물어보세요..."
              className="w-full bg-gray-800 text-white pl-5 pr-12 py-3.5 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 text-sm"
              disabled={isLoading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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