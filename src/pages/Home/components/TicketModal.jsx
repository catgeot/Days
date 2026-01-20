import React, { useState, useEffect } from 'react';
import { X, Ticket, MapPin, Search, QrCode, Plane } from 'lucide-react';
import { getAddressFromCoordinates } from '../../../lib/geocoding';

const SELECTION_STEPS = [
  { id: 'level', label: '🛫 여행 레벨', options: ['두근두근 첫 비행', '아직은 초보', '가끔 떠나는 일탈', '프로 모험러'] },
  { id: 'companion', label: '👨‍👩‍👧‍👦 누구와?', options: ['나 혼자만의 시간', '사랑하는 연인과', '아이와 함께 추억', '부모님과 효도여행'] },
  { id: 'purpose', label: '🎨 여행 목적', options: ['아무것도 안 하기(멍)', '새로운 영감 충전', '미식 탐방', '인생샷 남기기'] },
  { id: 'flight', label: '⏰ 비행 시간', options: ['가볍게(단거리)', '적당히(중거리)', '멀리 떠날래(장거리)', '상관없음'] },
  { id: 'activity', label: '🎡 하고 싶은 것', options: ['눈에 담는 관광', '직접 해보는 체험', '쇼핑 플렉스', '현지의 밤 즐기기'] }
];

export default function TicketModal({ isOpen, onClose, onIssue, preFilledDestination }) {
  const [destination, setDestination] = useState('');
  const [isLoadingAddr, setIsLoadingAddr] = useState(false);
  const [selections, setSelections] = useState({ level: '', companion: '', purpose: '', flight: '', activity: '' });

  // 🚨 [추가] 좌측 티켓 디자인을 위한 짧은 코드/국가명 추출
  const [ticketCode, setTicketCode] = useState('G0');

  useEffect(() => {
    if (isOpen) {
      setSelections({ level: '', companion: '', purpose: '', flight: '', activity: '' });
      setTicketCode('G0'); // 초기화
      
      const resolveAddress = async () => {
        if (!preFilledDestination) { setDestination(''); return; }
        if (typeof preFilledDestination === 'string') { 
            setDestination(preFilledDestination); 
            setTicketCode(preFilledDestination.substring(0, 3).toUpperCase()); // 예: OSA
            return; 
        }
        
        if (preFilledDestination.name && preFilledDestination.name !== 'My Pick') {
           const locationName = preFilledDestination.country 
            ? `${preFilledDestination.country}, ${preFilledDestination.name}` 
            : preFilledDestination.name;
          setDestination(locationName);
          setTicketCode(preFilledDestination.name.substring(0, 3).toUpperCase());
          return;
        }

        if (preFilledDestination.lat && preFilledDestination.lng) {
          setIsLoadingAddr(true);
          setDestination("위치 확인 중..."); 
          const addr = await getAddressFromCoordinates(preFilledDestination.lat, preFilledDestination.lng);
          if (addr) {
            const finalName = addr.country ? `${addr.country} ${addr.city}` : addr.fullAddress;
            setDestination(finalName);
            // 도시 이름의 앞 3글자를 티켓 코드로 사용
            const code = (addr.city || addr.country || "GPS").substring(0, 3).toUpperCase();
            setTicketCode(code);
          } else {
            setDestination(`위도 ${preFilledDestination.lat.toFixed(2)}`);
          }
          setIsLoadingAddr(false);
        }
      };
      resolveAddress();
    }
  }, [isOpen, preFilledDestination]);

  const handleSelect = (category, value) => {
    setSelections(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasSelections = Object.values(selections).some(val => val !== '');
    if (!destination && !hasSelections) { alert("여행하고 싶은 기분이나 목적지를 하나라도 알려주세요!"); return; }

    const promptText = `
    [역할] 당신은 여행지의 감성을 전하는 에세이스트이자 가이드입니다.
    [사용자 요청]
    - 목적지: ${destination ? destination : '추천 필요'}
    - 분위기/상황: ${Object.values(selections).filter(v => v).join(', ')}
    [요청 사항] 딱딱한 일정 말고, 감성과 영감을 주는 분위기 위주로 추천해줘.
    `;

    // 🚨 [수정] 채팅창에 보여줄 짧은 문구와 실제 프롬프트를 객체로 전달
    const payload = {
      text: promptText,
      display: `🎫 [${destination || '여행지 추천'}] 감성 여행 계획을 요청했습니다.`
    };

    onIssue(payload);
    onClose();
  };

  if (!isOpen) return null;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl animate-fade-in-up flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)]">
        
        {/* [좌측] Ticket Stub (Dynamic Destination Info) */}
        <div className="hidden md:flex w-72 bg-gradient-to-b from-blue-900 to-black p-8 flex-col justify-between relative border-r-2 border-dashed border-white/20">
           <div className="absolute -right-3 top-1/2 w-6 h-6 bg-black rounded-full z-10"></div>
           <div>
             <div className="flex justify-between items-center mb-10">
               <span className="text-xl font-black text-white tracking-tighter">GATE 0</span>
               <QrCode className="text-white/80" size={24} />
             </div>
             
             <div className="space-y-8">
               {/* 🚨 [수정] 현재 선택한 목적지 정보 표시 */}
               <div>
                 <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">DESTINATION</p>
                 <p className="text-3xl font-black text-white tracking-tighter">{ticketCode}</p>
                 <p className="text-xs text-gray-400 mt-1 truncate">{destination || "SELECTING..."}</p>
               </div>
               <div>
                 <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">DATE</p>
                 <p className="text-md font-bold text-white">{today}</p>
               </div>
               <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                 <Plane size={14} className="text-blue-400" />
                 <span className="text-[10px] text-white tracking-widest">BOARDING NOW</span>
               </div>
             </div>
           </div>
           <div className="mt-auto opacity-50 text-[10px] text-white tracking-widest text-center">
             YOUR JOURNEY BEGINS
           </div>
        </div>

        {/* [우측] 폼 영역 */}
        <div className="flex-1 bg-gray-900/95 backdrop-blur-xl p-6 md:p-8 overflow-y-auto max-h-[85vh] custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              Where to next?
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
              <X className="text-gray-400 group-hover:text-red-400" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className={`p-1 rounded-2xl bg-gradient-to-r ${destination ? 'from-blue-500/20 to-purple-500/20' : 'from-gray-800 to-gray-800'} transition-all duration-500`}>
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                <label className="text-[10px] font-bold text-blue-300 tracking-wider mb-2 block flex items-center gap-2">
                  <MapPin size={12} /> DESTINATION
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="어디로 떠나고 싶으신가요?"
                    className={`w-full bg-transparent text-xl font-bold text-white placeholder-gray-600 focus:outline-none ${isLoadingAddr ? 'animate-pulse' : ''}`}
                    disabled={isLoadingAddr} 
                  />
                  {isLoadingAddr && <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-blue-400">Searching...</div>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {SELECTION_STEPS.map((step) => (
                <div key={step.id} className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <label className="text-xs font-bold text-gray-400 mb-3 block">{step.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {step.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(step.id, option)}
                        className={`text-sm px-4 py-2.5 rounded-full border transition-all duration-300 ease-out ${selections[step.id] === option ? 'bg-white text-black border-white font-bold scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="group w-full relative overflow-hidden bg-white text-black font-black text-lg py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.01] mt-6">
              <span className="relative flex items-center justify-center gap-2">
                <Ticket size={20} />
                {destination ? 'ISSUE TICKET' : 'RECOMMEND ME'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}