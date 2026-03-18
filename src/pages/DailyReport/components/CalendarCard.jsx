import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CalendarCard = ({ viewYear, viewMonth, calendarDays, onPrevMonth, onNextMonth, isPublicMode }) => {
  const navigate = useNavigate();

  const handleDateClick = (dayItem) => {
    if (!dayItem.day) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}`;

    if (dayItem.active && dayItem.reportId) {
      navigate(isPublicMode ? `/p/${dayItem.reportId}` : `/blog/${dayItem.reportId}`);
    } else {
      navigate(`/blog/write?date=${dateStr}`);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col h-full min-h-[350px]">

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Calendar className="text-blue-500" size={20} />
          {viewYear}년 {viewMonth + 1}월
        </h3>
        <div className="flex gap-2">
          <button onClick={onPrevMonth} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={onNextMonth} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider">
        <div className="text-red-500">Sun</div>
        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div>
        <div className="text-blue-500">Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 flex-1 text-sm content-start">
        {calendarDays.map((d, i) => (
          <div
            key={i}
            onClick={() => handleDateClick(d)}
            className={`
              aspect-square flex items-center justify-center rounded-xl relative cursor-pointer transition-all duration-300
              ${!d.day ? 'pointer-events-none' : 'hover:bg-gray-100 hover:scale-110 hover:z-10 hover:shadow-md'}
              ${d.isToday ? 'font-bold ring-1 ring-blue-500/50 bg-blue-50/50 z-10 text-blue-600' : ''}
              ${d.active ? 'bg-blue-50 text-blue-600 font-bold shadow-sm ring-1 ring-blue-200' : 'text-gray-500'}
            `}
          >
            {d.day}

            {d.active && (
              <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm"></span>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};

export default CalendarCard;
