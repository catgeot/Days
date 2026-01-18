// src/pages/Home/TicketModal.jsx

import React, { useState } from 'react';
import { X, Plane, QrCode, Sparkles, Check } from 'lucide-react';

// ✨ [수정 1] onIssue prop을 받아옵니다.
export default function TicketModal({ isOpen, onClose, onIssue }) {
  if (!isOpen) return null;

  // ✨ [수정 2] 'activity' 항목 추가
  const [ticketData, setTicketData] = useState({
    seat: null,
    purpose: null,
    companion: null,
    flightTime: null,
    activity: null 
  });

  // 5개 항목이 모두 선택되었는지 확인
  const isReady = Object.values(ticketData).every(val => val !== null);

  const handleSelect = (category, value) => {
    setTicketData((prev) => ({ ...prev, [category]: value }));
  };

  const generateAIPrompt = () => {
    // ✨ [수정 3] 프롬프트에 'activity' 내용 반영
    const { seat, purpose, companion, flightTime, activity } = ticketData;
    return `나는 여행 레벨이 '${seat}'이고, 이번엔 '${companion}'와(과) 함께 '${purpose}'을(를) 느끼고 싶어. 비행 시간은 '${flightTime}' 정도가 좋고, 가서 '${activity}'을(를) 주로 하고 싶어. 이 조건에 딱 맞는 여행지 3곳을 추천해줘.`;
  };

  const handleIssueTicket = () => {
    if (!isReady) return;
    
    const prompt = generateAIPrompt();
    
    // ✨ [수정 4] alert 삭제 -> onIssue 호출 (채팅창으로 연결)
    onIssue(prompt); 
    onClose();
  };

  // ✨ [수정 5] 'activity' 질문 항목 추가
  const questions = [
    { id: 'seat', title: 'LEVEL', desc: '나의 여행 레벨', options: ['첫 비행(왕초보)', '이코노미(가끔)', '퍼스트(고수)'] },
    { id: 'purpose', title: 'MOOD', desc: '여행의 목적', options: ['방전됨(휴식)', '영감 필요(자극)', '배고픔(미식)', '인생샷'] },
    { id: 'companion', title: 'WITH', desc: '동행인', options: ['나 홀로', '연인과', '친구들과', '부모님'] },
    { id: 'flightTime', title: 'TIME', desc: '비행 시간', options: ['가볍게(단거리)', '큰맘 먹고(장거리)', '상관없음'] },
    { id: 'activity', title: 'ACT', desc: '주요 활동', options: ['보는 것(관광)', '하는 것(체험)', '사는 것(쇼핑)', '마시는 것(유흥)'] }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm animate-fade-in">
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden relative flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="bg-blue-600 p-6 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Plane size={100} /></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-2xl font-black tracking-widest">BOARDING PASS</h2>
              <p className="text-blue-200 text-sm font-mono mt-1">AI TRAVELER TICKET</p>
            </div>
            <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
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
                        py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 border-2 relative
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

        {/* 푸터 */}
        <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
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