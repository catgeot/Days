import React, { useState, useEffect } from 'react';
import { X, Plane, QrCode, Sparkles, Check } from 'lucide-react'; 

export default function TicketModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [ticketData, setTicketData] = useState({
    seat: null,
    purpose: null,
    companion: null,
    flightTime: null
  });

  // 모든 항목이 선택되었는지 확인
  const isReady = Object.values(ticketData).every(val => val !== null);

  const handleSelect = (category, value) => {
    setTicketData((prev) => ({ ...prev, [category]: value }));
  };

  // ✨ [핵심] 선택 데이터를 AI가 이해할 수 있는 프롬프트로 변환
  const generateAIPrompt = () => {
    const { seat, purpose, companion, flightTime } = ticketData;
    // 나중에 이 문장을 AI API에 보낼 것입니다.
    return `나는 여행 경험이 '${seat}' 수준이고, 이번엔 '${companion}'와(과) 함께 '${purpose}'을(를) 즐기고 싶어. 비행 시간은 '${flightTime}' 정도가 적당해. 이 조건에 맞는 여행지 3곳과 각 여행지의 매력 포인트를 알려줘.`;
  };

  const handleIssueTicket = () => {
    if (!isReady) return;
    
    const prompt = generateAIPrompt();
    console.log("생성된 AI 프롬프트:", prompt);
    
    // TODO: 여기서 AI 검색 페이지로 이동하거나, 결과를 보여주는 로직 연결
    alert(`[티켓 발권 완료!]\n\nAI에게 다음 질문을 던집니다:\n"${prompt}"`);
    onClose();
  };

  const questions = [
    { id: 'seat', title: 'LEVEL', desc: '나의 여행 레벨', options: ['첫 비행','여행 초보', '가끔 떠남', '프로 여행러'] },
    { id: 'purpose', title: 'MOOD', desc: '여행의 목적', options: ['완벽한 휴식', '미친 액티비티', '식도락 탐방', '쇼핑/도시'] },
    { id: 'companion', title: 'WITH', desc: '동행인', options: ['나 홀로', '연인과', '친구들과', '가족/아이'] },
    { id: 'flightTime', title: 'TIME', desc: '비행 시간', options: ['단거리(4H↓)', '중거리(4~10H)', '어디든(10H↑)'] }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in">
      
      {/* 티켓 전체 컨테이너 */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* 1. 티켓 헤더 (파란색) */}
        <div className="bg-blue-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Plane size={100} /></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-2xl font-black tracking-widest">BOARDING PASS</h2>
              <p className="text-blue-200 text-sm font-mono mt-1">AI TRAVELER TICKET</p>
            </div>
            <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
          </div>
        </div>

        {/* 2. 티켓 바디 (질문 영역) - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
          
          {/* 절취선 효과 */}
          <div className="w-full border-b-2 border-dashed border-gray-300 mb-6 relative">
            <div className="absolute -left-8 -bottom-3 w-6 h-6 bg-black/80 rounded-full"></div>
            <div className="absolute -right-8 -bottom-3 w-6 h-6 bg-black/80 rounded-full"></div>
          </div>

          <div className="space-y-8">
            {questions.map((q) => (
              <div key={q.id}>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{q.title}</span>
                  <span className="text-sm text-gray-500">{q.desc}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(q.id, option)}
                      className={`
                        py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 relative
                        ${ticketData[q.id] === option
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-[1.02]' 
                          : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300 hover:text-gray-600'
                        }
                      `}
                    >
                      {option}
                      {ticketData[q.id] === option && <Check size={14} className="absolute top-2 right-2 opacity-50"/>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 티켓 푸터 (발권 버튼) */}
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 opacity-50">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-widest text-gray-400">Flight No.</span>
               <span className="font-mono font-bold text-lg">AI-808</span>
             </div>
             <QrCode size={40} />
          </div>

          <button 
            onClick={handleIssueTicket}
            disabled={!isReady}
            className={`
              w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl
              ${isReady 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-[1.02] cursor-pointer' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isReady ? <><Sparkles size={20} /> 티켓 발권하기</> : '옵션을 모두 선택해주세요'}
          </button>
        </div>

      </div>
    </div>
  );
}