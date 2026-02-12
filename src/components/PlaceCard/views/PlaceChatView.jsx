import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

const PlaceChatView = ({ 
  chatHistory, 
  isAiLoading, 
  onSendMessage, 
  locationName 
}) => {
  const [inputStr, setInputStr] = useState("");
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
      if (chatHistory.length <= 1) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, []); 

  const handleSend = () => {
    if (!inputStr.trim()) return;
    onSendMessage(inputStr);
    setInputStr("");
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      
      {/* 1. Message List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
         {/* 🚨 [Fix] 스크롤바 상시 노출 */}
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        {chatHistory.length === 0 && !isAiLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4 opacity-70">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 flex items-center justify-center mb-2">
              <Sparkles size={24} className="text-blue-300" />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-blue-300 font-bold text-base block mb-1">{locationName}</span>
              여행 계획을 도와드릴까요?<br/>맛집, 숙소, 숨은 명소 등 무엇이든 물어보세요.
            </p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            // 🚨 [Fix] 간격 조정: User 메시지(질문) 위에 큰 마진(mt-8)을 주어 문답 쌍을 시각적으로 분리
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end mt-8' : 'items-start mt-2'} animate-fade-in-up w-full`}>
              
              <span className={`text-[10px] font-bold mb-1 px-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {msg.role === 'user' ? 'Me' : 'AI Docent'}
              </span>

              <div className={`relative px-5 py-4 rounded-2xl text-[13.5px] border leading-7 w-full shadow-sm transition-all
                  ${msg.role === 'user' 
                      ? 'bg-[#1A1D21]/80 border-blue-500/20 text-white rounded-tr-sm' 
                      : 'bg-[#0F1115]/60 border-white/5 text-gray-200 rounded-tl-sm'
                  }`}>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
                    {msg.text}
                </div>
              </div>
            </div>
          ))
        )}

        {isAiLoading && (
          <div className="flex flex-col items-start w-full animate-pulse mt-2">
            <span className="text-[10px] font-bold mb-1 px-1 uppercase tracking-wider text-purple-400">AI Docent</span>
            <div className="bg-[#0F1115]/60 px-5 py-4 rounded-2xl rounded-tl-sm text-xs text-gray-400 border border-white/5 flex items-center gap-2 w-full">
               <Loader2 size={14} className="animate-spin text-purple-400" />
               <span>답변을 생성하고 있습니다...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* 2. Input Area (Fixed Bottom) */}
      <div className="pt-4 mt-auto shrink-0 z-10 bg-gradient-to-t from-[#05070a] via-[#05070a] to-transparent">
        <div className="relative group w-full h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-full flex items-center px-1 transition-all shadow-lg">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center shrink-0 ml-1">
              <Sparkles size={14} className="text-blue-300 group-hover:scale-110 transition-transform" />
          </div>
          <input 
            type="text" 
            value={inputStr}
            onChange={(e) => setInputStr(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 내용을 입력하세요..."
            disabled={isAiLoading}
            className="flex-1 bg-transparent border-none h-full focus:outline-none text-sm text-white placeholder-gray-400 pl-3 pr-12 disabled:opacity-50" 
            autoComplete="off"
          />
          <button 
            onClick={handleSend}
            disabled={isAiLoading || !inputStr.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all disabled:bg-transparent disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceChatView;