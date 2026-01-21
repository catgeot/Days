import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, MessageSquare, Star, Trash2, RefreshCcw } from 'lucide-react';

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
  
  const lastQuestionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const hasSentInitialRef = useRef(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const SYSTEM_PROMPT = `
    당신은 'Gate 0'의 여행 가이드입니다.
    [가이드] 감성적 톤앤매너(✈️, 🌊), 스케줄 나열보다 분위기 묘사 위주, 3~4문단 핵심 요약.
  `;

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
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
      }
    }
  }, [activeChatId, isOpen, chatHistory]); 

  useEffect(() => {
    if (isOpen && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      handleSend(initialQuery.text || initialQuery.display || initialQuery);
    } else if (!isOpen) {
      hasSentInitialRef.current = false;
    }
  }, [isOpen, initialQuery]);

  const handleSend = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages); 
    setInput('');
    setIsLoading(true);

    if (activeChatId) {
      onUpdateChat(activeChatId, newMessages);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n사용자 질문: ${text}` }] }]
          })
        }
      );

      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다.";
      
      const finalMessages = [...newMessages, { role: 'model', text: aiReply }];
      setMessages(finalMessages); 

      if (activeChatId) {
        onUpdateChat(activeChatId, finalMessages);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', text: "Error: " + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSidebarClick = (id) => {
    if (onSwitchChat) onSwitchChat(id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-900 w-[95vw] max-w-6xl h-[90vh] rounded-3xl border border-gray-700 shadow-2xl flex overflow-hidden relative transition-all">
        
        {/* 사이드바 */}
        <div className="hidden md:flex w-72 bg-gray-900 border-r border-gray-700 flex-col">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-400" />
              <span className="font-bold text-gray-200 text-sm">대화 기록</span>
            </div>
            <button onClick={onClearChats} className="text-gray-500 hover:text-white transition-colors" title="전체 삭제">
              <RefreshCcw size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {chatHistory.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handleSidebarClick(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all group relative ${
                  activeChatId === item.id 
                  ? 'bg-gray-800 border-blue-500/50' 
                  : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-300 text-sm truncate max-w-[140px]">{item.destination}</span>
                  <div className="flex gap-1">
                     <button onClick={(e) => { e.stopPropagation(); onToggleBookmark && onToggleBookmark(item.id); }}>
                        {/* 🚨 [Fix] isBookmarked -> is_bookmarked (DB 컬럼명 일치) */}
                        <Star size={14} className={item.is_bookmarked ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-yellow-400"} />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteChat && onDeleteChat(item.id); }}>
                        <Trash2 size={14} className="text-gray-600 hover:text-red-400" />
                     </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500">{item.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 채팅창 */}
        <div className="flex-1 flex flex-col bg-black/50 relative">
            <div className="bg-gray-800/50 p-4 flex justify-between items-center border-b border-gray-700 backdrop-blur-md">
               <div className="flex items-center gap-2">
                 <Bot size={18} className="text-white" />
                 <span className="text-white font-bold text-sm">Gate 0 AI</span>
               </div>
               <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isLastUser = msg.role === 'user' && idx >= messages.length - 2;
                return (
                  <div 
                    key={idx} 
                    ref={isLastUser ? lastQuestionRef : null} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-transparent'}`}>
                      {msg.role === 'user' ? <User size={20} className="text-gray-300" /> : <Bot size={24} className="text-blue-400" />}
                    </div>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-base shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-4"><Loader2 size={20} className="text-blue-400 animate-spin" /></div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-gray-900 border-t border-gray-800">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="relative">
                <input 
                  type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지 입력..." 
                  className="w-full bg-gray-800 text-white pl-6 pr-14 py-4 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500"
                  disabled={isLoading} autoFocus
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 top-2 p-2 bg-blue-600 rounded-full text-white"><Send size={20} /></button>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;