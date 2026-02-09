// src/pages/Home/components/TicketModal.jsx
import React, { useState, useEffect } from 'react';
// 🚨 [Fix] MessageSquare import 추가
import { X, Calendar, MapPin, CreditCard, Ticket, Trash2, Plane, MessageSquare } from 'lucide-react';

const TicketModal = ({ 
  isOpen, onClose, onIssue, preFilledDestination, 
  scoutedPins, 
  savedTrips = [] // Home에서 전달받은 대화 이력
}) => {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preFilledDestination?.name) setDestination(preFilledDestination.name);
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [isOpen, preFilledDestination]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* Left Panel: Chat History (Planning Candidates) */}
        <div className="w-1/3 bg-black/30 border-r border-white/5 p-6 flex flex-col">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
            <MessageSquare size={14} /> RECENT CHATS
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {savedTrips.length === 0 ? (
                <div className="text-center text-gray-600 text-xs py-10">대화 기록이 없습니다.</div>
            ) : (
                savedTrips.map((trip) => (
                  <button 
                    key={trip.id}
                    onClick={() => setDestination(trip.destination)}
                    className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-white">{trip.destination}</span>
                      <span className="text-[10px] text-gray-500">{trip.date}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">{trip.prompt_summary}</div>
                  </button>
                ))
            )}
          </div>
        </div>

        {/* Right Panel: Booking Form */}
        <div className="w-2/3 p-8 relative">
           <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
           <h2 className="text-3xl font-bold text-white mb-1">Boarding Pass</h2>
           <p className="text-sm text-gray-400 mb-8">여행 계획을 확정하고 티켓을 발권하세요.</p>
           
           <div className="space-y-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</label>
               <div className="flex items-center gap-3 bg-black/50 border border-white/10 p-4 rounded-xl">
                 <MapPin className="text-blue-500" />
                 <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="bg-transparent text-xl font-bold text-white w-full focus:outline-none" placeholder="Enter City" />
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
               <div className="flex items-center gap-3 bg-black/50 border border-white/10 p-4 rounded-xl">
                 <Calendar className="text-purple-500" />
                 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent text-xl font-bold text-white w-full focus:outline-none" />
               </div>
             </div>
           </div>

           <button onClick={() => { onIssue({ text: `${destination} 여행 계획 세워줘` }); onClose(); }} className="absolute bottom-8 right-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
             <Ticket size={18} /> 발권하기 (Issue Ticket)
           </button>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;