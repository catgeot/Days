import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useReport } from '../../../context/ReportContext';

const CalendarCard = ({ viewYear, viewMonth, calendarDays, onPrevMonth, onNextMonth }) => {
  const { setCurrentView, setSelectedId, setPreSelectedDate } = useReport(); 

  const handleDateClick = (dayItem) => {
    if (!dayItem.day) return; 
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}`;
    if (dayItem.active && dayItem.reportId) {
      setSelectedId(dayItem.reportId);
      setCurrentView('write');
    } else {
      setPreSelectedDate(dateStr);
      setSelectedId(null);
      setCurrentView('write');
    }
  };

  return (
    // 🚨 [Fix] 높이 고정 및 테마 적용
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 shadow-2xl flex flex-col h-full min-h-[350px]">
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Calendar className="text-blue-400" size={20} />
          {viewYear}년 {viewMonth + 1}월
        </h3>
        <div className="flex gap-2">
          <button onClick={onPrevMonth} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={onNextMonth} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-slate-500 font-bold mb-3 uppercase tracking-wider">
        <div className="text-red-400">Sun</div>
        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div>
        <div className="text-blue-400">Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1 text-sm content-start">
        {calendarDays.map((d, i) => (
          <div 
            key={i} 
            onClick={() => handleDateClick(d)} 
            className={`
              aspect-square flex items-center justify-center rounded-xl relative cursor-pointer transition-all duration-300
              ${!d.day ? 'pointer-events-none' : 'hover:bg-slate-800 hover:scale-110 hover:z-10 hover:shadow-lg'} 
              ${d.isToday ? 'font-bold ring-1 ring-blue-500/50 bg-slate-800/50 z-10 text-white' : ''}
              ${d.active ? 'bg-blue-900/40 text-blue-300 font-bold shadow-[inset_0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30' : 'text-slate-400'}
            `}
          >
            {d.day}
            
            {/* 파란 점 (네온 글로우) */}
            {d.active && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,1)]"></span>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default CalendarCard;