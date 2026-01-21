import React, { useState, useEffect } from 'react';
import { X, Ticket, MapPin, Trash2, Map, QrCode } from 'lucide-react';
import { getAddressFromCoordinates } from '../../../lib/geocoding';

const SELECTION_STEPS = [
  { id: 'level', label: '🛫 여행 레벨', options: ['첫 비행', '초보', '가끔 일탈', '프로'] },
  { id: 'companion', label: '👥 누구와?', options: ['혼자', '연인', '가족', '친구'] },
  { id: 'purpose', label: '🎨 여행 목적', options: ['휴식(멍)', '영감', '미식', '사진'] },
  { id: 'flight', label: '⏰ 비행 시간', options: ['단거리', '중거리', '장거리', '상관X'] },
  { id: 'activity', label: '🎡 활동', options: ['관광', '체험', '쇼핑', '현지문화'] }
];

export default function TicketModal({ isOpen, onClose, onIssue, preFilledDestination, scoutedPins, onScoutDelete }) {
  const [destination, setDestination] = useState('');
  const [isLoadingAddr, setIsLoadingAddr] = useState(false);
  const [selections, setSelections] = useState({ level: '', companion: '', purpose: '', flight: '', activity: '' });

  useEffect(() => {
    if (isOpen) {
      setSelections({ level: '', companion: '', purpose: '', flight: '', activity: '' });
      
      const resolveAddress = async () => {
        if (!preFilledDestination) { setDestination(''); return; }
        
        if (preFilledDestination.name && preFilledDestination.name !== 'Selecting...') {
          setDestination(preFilledDestination.name);
          return;
        }

        if (preFilledDestination.lat && preFilledDestination.lng) {
          setIsLoadingAddr(true);
          setDestination("위치 확인 중..."); 
          const addr = await getAddressFromCoordinates(preFilledDestination.lat, preFilledDestination.lng);
          
          if (addr && addr.city) {
            setDestination(addr.city);
          } else if (addr && addr.country) {
            setDestination(addr.country);
          } else {
            setDestination("Unknown Point");
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

  const handleScoutClick = (name) => {
    setDestination(name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasSelections = Object.values(selections).some(val => val !== '');
    if (!destination && !hasSelections) { alert("목적지나 취향을 하나라도 선택해주세요."); return; }

    const prompt = `[Request] Destination: ${destination}, Style: ${Object.values(selections).filter(Boolean).join(', ')}`;
    const payload = { text: prompt, display: `🎫 [${destination}] 여행 정보 요청` };
    
    onIssue(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-fade-in-up bg-gray-900 border border-white/10">
        
        {/* [좌측] 탐색 핀 리스트 (Exploration Pins) */}
        <div className="hidden md:flex w-80 bg-gradient-to-b from-blue-900 via-gray-900 to-black p-8 flex-col border-r-2 border-dashed border-white/10 relative">
           <div className="absolute -right-3 top-1/2 w-6 h-6 bg-black rounded-full z-10 border border-white/20"></div>

           <div className="flex justify-between items-center mb-6 z-10">
             <span className="text-2xl font-black text-white tracking-tighter">GATE 0</span>
             <QrCode className="text-white/70" size={24} />
           </div>

           <div className="z-10 mb-3 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
             {/* 🚨 명칭 변경: 탐색 핀 리스트 */}
             <p className="text-xs text-blue-300 uppercase tracking-[0.05em] font-bold">📍 탐색 핀 리스트</p>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-3 pr-2 mask-gradient-bottom">
             {scoutedPins && scoutedPins.length > 0 ? (
               scoutedPins.map(pin => (
                 <div 
                   key={pin.id} 
                   onClick={() => handleScoutClick(pin.name)}
                   className="group relative bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 hover:border-blue-500/40 transition-all cursor-pointer"
                 >
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="text-sm font-bold text-white truncate max-w-[120px]">{pin.name}</div>
                       <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                          <Map size={10} /> {pin.time} 탐색됨
                       </div>
                     </div>
                     <span className="text-xl font-black text-white/20 group-hover:text-blue-400 transition-colors">{pin.code}</span>
                   </div>
                   
                   <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onScoutDelete(pin.id); 
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               ))
             ) : (
               <div className="h-32 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5 mt-4">
                 <MapPin size={24} className="mb-2 opacity-50" />
                 <span className="text-[10px] tracking-wider">탐색한 핀이 없습니다</span>
               </div>
             )}
           </div>

           <div className="pt-6 border-t border-white/10 z-10 text-[10px] text-gray-500 text-center tracking-widest">
             리스트를 클릭하여 목적지 설정
           </div>
        </div>

        {/* [우측] 입력 폼 */}
        <div className="flex-1 bg-gray-900/95 backdrop-blur-xl p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              여행 정보 요청
              <span className="text-xs font-normal text-gray-500 ml-2">Preferences</span>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
              <X className="text-gray-400 group-hover:text-red-400" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            
            <div className="bg-black/40 rounded-2xl p-4 border border-white/10 mb-6 shrink-0">
              <label className="text-[10px] font-bold text-blue-400 tracking-wider mb-2 block flex items-center gap-2">
                <MapPin size={12} /> 목적지 (DESTINATION)
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="어디로 떠나시나요?"
                  className={`w-full bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none ${isLoadingAddr ? 'animate-pulse' : ''}`}
                  disabled={isLoadingAddr} 
                />
                {isLoadingAddr && <div className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-blue-400 font-mono">위치 확인 중...</div>}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 content-start overflow-y-auto custom-scrollbar pr-2 mb-4">
              {SELECTION_STEPS.map((step) => (
                <div key={step.id} className="py-2">
                  <label className="text-xs font-bold text-gray-400 mb-2 block">{step.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {step.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleSelect(step.id, option)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-all duration-200
                          ${selections[step.id] === option
                            ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-lg shadow-blue-900/50'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 🚨 버튼 문구 변경: 상세 정보 알아보기 */}
            <button 
              type="submit"
              className="w-full shrink-0 bg-white text-black font-black text-lg py-4 rounded-xl shadow-xl hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2 mt-auto"
            >
              <Ticket size={20} />
              <span>상세 정보 알아보기</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}