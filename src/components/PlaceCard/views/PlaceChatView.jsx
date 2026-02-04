import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

// 🚨 [New] 채팅 UI 전담 컴포넌트 (로직 없음, Props로 데이터 수신)
const PlaceChatView = ({ 
  chatHistory, 
  isAiLoading, 
  onSendMessage, 
  locationName 
}) => {
  const [inputStr, setInputStr] = React.useState("");
  const messagesEndRef = useRef(null);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiLoading]);

  const handleSend = () => {
    if (!inputStr.trim()) return;
    onSendMessage(inputStr);
    setInputStr("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSend();
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* 1. Message List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-blue pr-2 space-y-4">
        {chatHistory.length === 0 && !isAiLoading ? (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-sm text-gray-200 border border-white/5">
              <span className="text-blue-300 font-bold">{locationName}</span> 여행 계획을 도와드릴까요? 맛집, 숙소, 액티비티 등 무엇이든 물어보세요.
            </div>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0"><Bot size={14} className="text-white" /></div>}
              {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0"><User size={14} className="text-gray-300" /></div>}
              
              <div className={`p-4 rounded-2xl text-sm border max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600/20 border-blue-500/30 text-white' : 'bg-white/5 border-white/5 text-gray-200'}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isAiLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0 animate-pulse"><Loader2 size={14} className="text-white animate-spin" /></div>
            <div className="bg-white/5 p-4 rounded-2xl text-sm text-gray-400 border border-white/5 animate-pulse">
              답변을 생성하고 있습니다...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Input Area */}
      <div className="pt-4 mt-auto shrink-0">
        <div className="relative group">
          <input 
            type="text" 
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${locationName} 맛집 알려줘...`}
            disabled={isAiLoading}
            className="w-full bg-black/40 border border-white/10 rounded-full py-4 pl-6 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner disabled:opacity-50" 
          />
          <button 
            onClick={handleSend}
            disabled={isAiLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-all shadow-lg disabled:bg-gray-700"
          >
            {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceChatView;