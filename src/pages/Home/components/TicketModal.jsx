import React, { useState, useEffect } from 'react';
import { X, Plane, Ticket, MapPin, Search } from 'lucide-react';

// 5단계 선택지 데이터 (친근하고 감성적인 문구로 변환)
const SELECTION_STEPS = [
  {
    id: 'level',
    label: '🛫 여행 레벨',
    options: ['두근두근 첫 비행', '아직은 초보', '가끔 떠나는 일탈', '프로 모험러']
  },
  {
    id: 'companion',
    label: '👨‍👩‍👧‍👦 누구와?',
    options: ['나 혼자만의 시간', '사랑하는 연인과', '아이와 함께 추억', '부모님과 효도여행']
  },
  {
    id: 'purpose',
    label: '🎨 여행 목적',
    options: ['아무것도 안 하기(멍)', '새로운 영감 충전', '미식 탐방', '인생샷 남기기']
  },
  {
    id: 'flight',
    label: '⏰ 비행 시간',
    options: ['가볍게(단거리)', '적당히(중거리)', '멀리 떠날래(장거리)', '상관없음']
  },
  {
    id: 'activity',
    label: '🎡 하고 싶은 것',
    options: ['눈에 담는 관광', '직접 해보는 체험', '쇼핑 플렉스', '현지의 밤 즐기기']
  }
];

export default function TicketModal({ isOpen, onClose, onIssue, preFilledDestination }) {
  const [destination, setDestination] = useState('');
  
  // 사용자가 선택한 답변들을 저장하는 상태
  const [selections, setSelections] = useState({
    level: '',
    companion: '',
    purpose: '',
    flight: '',
    activity: ''
  });

  // 모달 열릴 때 초기화 및 목적지 자동 입력
  useEffect(() => {
    if (isOpen) {
      setDestination(preFilledDestination || '');
      setSelections({ level: '', companion: '', purpose: '', flight: '', activity: '' });
    }
  }, [isOpen, preFilledDestination]);

  const handleSelect = (category, value) => {
    setSelections(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 최소한의 선택 확인 (목적지나 선택지 중 하나라도 있어야 함)
    const hasSelections = Object.values(selections).some(val => val !== '');
    if (!destination && !hasSelections) {
      alert("여행하고 싶은 기분이나 목적지를 하나라도 알려주세요!");
      return;
    }

    // AI에게 보낼 풍성한 프롬프트 생성
    const prompt = `여행 계획을 제안해줘.
    - 목적지: ${destination ? destination : '아직 못 정했어, 아래 조건에 맞춰 추천해줘.'}
    - 여행자 레벨: ${selections.level || '상관없음'}
    - 동행인: ${selections.companion || '미정'}
    - 여행의 주된 목적: ${selections.purpose || '자유롭게'}
    - 선호 비행 시간: ${selections.flight || '상관없음'}
    - 선호 활동: ${selections.activity || '다양하게'}
    
    위의 상황에 처한 여행자에게 가장 현실적이고 매력적인 여행 코스와 팁을 알려줘.`;

    onIssue(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-white/20 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-fade-in-up max-h-[90vh]">
        
        {/* [좌측] 감성 영역 (좁게) */}
        <div className="hidden md:flex w-1/4 bg-blue-900/20 p-6 flex-col justify-between border-r border-white/10 relative">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
           <div>
             <span className="text-blue-400 text-xs font-bold tracking-[0.3em]">GATE 0</span>
             <h2 className="text-2xl font-bold text-white mt-4 leading-normal">
               꿈을<br/>현실로<br/>만드는<br/>티켓
             </h2>
           </div>
           <div className="text-xs text-gray-400 leading-relaxed">
             망설이지 마세요.<br/>
             당신의 취향을 선택하면<br/>
             여정이 시작됩니다.
           </div>
        </div>

        {/* [우측] 선택 영역 (넓게) */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plane className="text-blue-400" size={20} />
              Boarding Pass <span className="text-xs font-normal text-gray-500 ml-2">Preferences</span>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="text-gray-400 hover:text-white" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. 목적지 검색 (지구본/랭킹에서 안 골랐을 때 사용) */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="text-[10px] font-bold text-gray-500 tracking-wider mb-2 block">DESTINATION (목적지)</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                <input 
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="지구본을 클릭하거나, 직접 입력해서 검색하세요"
                  className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all placeholder-gray-600"
                />
                {/* 검색 아이콘 장식 */}
                <div className="absolute right-3 top-2.5 text-gray-600">
                  <Search size={14} />
                </div>
              </div>
            </div>

            {/* 2. 5단계 선택지 (한 줄에 하나씩) */}
            <div className="space-y-5">
              {SELECTION_STEPS.map((step) => (
                <div key={step.id} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <label className="text-xs font-bold text-blue-200 mb-3 block flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {step.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {step.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(step.id, option)}
                        className={`
                          text-xs px-3 py-2 rounded-lg border transition-all duration-200
                          ${selections[step.id] === option
                            ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] scale-105'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'}
                        `}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 발권 버튼 */}
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg mt-4 hover:shadow-blue-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <Ticket size={18} />
              <span>
                {destination ? `${destination}행 티켓 발권하기` : '나만의 여행지 추천받기'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}