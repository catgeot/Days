// src/components/TicketModal.jsx

import React, { useState } from 'react';
import { X, Plane } from 'lucide-react'; // 아이콘 사용 (없으면 생략 가능하지만 설치 추천)

export default function TicketModal({ isOpen, onClose }) {
  // 모달이 닫혀있으면(isOpen이 false면) 아무것도 보여주지 않음
  if (!isOpen) return null;

  // 사용자의 선택을 저장하는 상태 (State)
  const [ticketData, setTicketData] = useState({
    seat: null,      // 1. 좌석 등급
    purpose: null,   // 2. 여행 목적
    companion: null, // 3. 동행인
    flightTime: null // 4. 비행 시간
  });

  // 버튼을 클릭했을 때 선택 상태를 업데이트하는 함수
  const handleSelect = (category, value) => {
    setTicketData((prev) => ({
      ...prev,           // 기존 선택값들은 유지하고
      [category]: value  // 클릭한 카테고리의 값만 변경
    }));
  };

  // 선택지 데이터 (질문과 선택지들)
  const questions = [
    {
      id: 'seat',
      title: '1. 좌석 등급 (나의 여행 레벨)',
      desc: '이번 여행의 예산 규모를 알려주세요.',
      options: ['첫비행','여행초보', '가끔떠남', '모험가']
    },
    {
      id: 'purpose',
      title: '2. 여행 목적 (지금 내 마음)',
      desc: '어떤 기분으로 떠나고 싶으신가요?',
      options: ['힐링/휴식', '액티비티/모험', '맛집 탐방', '도시/쇼핑']
    },
    {
      id: 'companion',
      title: '3. 동행인 (누구와 함께?)',
      desc: '여행을 함께할 파트너는 누구인가요?',
      options: ['나홀로', '친구/연인', '아이와함께', '부모님']
    },
    {
      id: 'flightTime',
      title: '4. 비행 시간 (거리 부담감)',
      desc: '비행기 안에서 얼마나 버틸 수 있나요?',
      options: ['단거리 (4시간 ↓)', '중거리 (4~10시간)', '상관없음']
    }
  ];

  return (
    // 배경: 어두운 투명 배경 (클릭 시 닫힘 방지 등을 위해 전체 화면 덮음)
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      
      {/* 모달 창 본체: 티켓 모양 */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-fadeInUp">
        
        {/* 상단 헤더: 닫기 버튼 */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plane size={24} />
            GATE 0 : 탑승권 발권
          </h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition">
            <X size={24} />
          </button>
        </div>

        {/* 본문: 스크롤 가능한 영역 */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <p className="text-gray-500 mb-6 text-sm text-center">
            당신의 취향을 선택하면 AI가 최적의 여행지를 추천해 드립니다.
          </p>

          {/* 4가지 질문 리스트 렌더링 */}
          <div className="space-y-8">
            {questions.map((q) => (
              <div key={q.id} className="border-b border-dashed border-gray-300 pb-6 last:border-0">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{q.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{q.desc}</p>
                
                {/* 선택지 버튼들 */}
                <div className="flex flex-wrap gap-2">
                  {q.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(q.id, option)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                        ${
                          ticketData[q.id] === option
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' // 선택되었을 때 스타일
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:border-gray-400' // 선택 안 됐을 때 스타일
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 버튼: 발권 완료 */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <button 
            onClick={() => {
              alert('여행지 탐색을 시작합니다! (기능 준비중)');
              onClose();
            }}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg"
          >
            ✈️ 티켓 발권하기
          </button>
        </div>

      </div>
    </div>
  );
}