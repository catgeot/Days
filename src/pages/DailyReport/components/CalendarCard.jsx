// src/pages/DailyReport/components/CalendarCard.jsx
// 🚨 [Fix/Subtraction] useReport 의존성 완전 제거 및 useNavigate 도입
// 🚨 [New] Query Parameter를 통한 작성 페이지 날짜 전달 (?date=YYYY-MM-DD)
// 🚨 [Safe Path] 데이터 존재 여부에 따른 명확한 라우팅 분기

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 🚨 [New] 라우터 훅 도입

const CalendarCard = ({ viewYear, viewMonth, calendarDays, onPrevMonth, onNextMonth }) => {
  const navigate = useNavigate(); // 🚨 [New]

  const handleDateClick = (dayItem) => {
    if (!dayItem.day) return; 
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}`;
    
    // 🚨 [Fix] Context 상태 변경 대신 URL 기반 강제 이동
    if (dayItem.active && dayItem.reportId) {
      // 기록이 있으면 상세 페이지(Detail)로 직행
      navigate(`/report/${dayItem.reportId}`);
    } else {
      // 빈 날짜면 작성 페이지(Write)로 가되 URL 파라미터로 날짜 전달
      navigate(`/report/write?date=${dateStr}`);
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
            
            {/* 파란 점 (네온 글로우) */}
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