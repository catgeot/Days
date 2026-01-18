import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User } from 'lucide-react';

const ChatModal = ({ isOpen, onClose, initialQuery }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // 모달이 열릴 때 초기 질문이 있으면 바로 채팅창에 반영
  useEffect(() => {
    if (isOpen) {
      setMessages([
        { role: 'assistant', text: '반갑습니다! 여행 계획을 도와드릴까요? 떠나고 싶은 곳이나 스타일을 말씀해주세요.' }
      ]);
      if (initialQuery) {
        handleSend(initialQuery);
      }
    }
  }, [isOpen]);

  // 스크롤 자동 내리기
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // 1. 내 메시지 추가
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // 2. AI 응답 (지금은 가짜 응답, 나중에 진짜 AI 연결)
    setTimeout(() => {
      const aiMsg = { role: 'assistant', text: `"${text}"에 대한 여행 정보를 찾고 있어요... ✈️ (AI 기능 연결 예정)` };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-full max-w-2xl h-[80vh] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* 헤더 */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-400" />
            <span className="text-white font-bold">AI Travel Agent</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {msg.role === 'user' ? <User size={16} text-white /> : <Bot size={16} text-white />}
              </div>
              <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="무엇이든 물어보세요..."
              className="w-full bg-gray-900 text-white pl-4 pr-12 py-3 rounded-full border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button type="submit" className="absolute right-2 p-2 bg-blue-600 rounded-full hover:bg-blue-500 text-white transition-colors">
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ChatModal;