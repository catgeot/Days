// 🚨 [Fix] 라우터(useNavigate) 철거 및 Context(useReport) 화면 전환 도입 완료

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// 🚨 [New] 전역 리모컨 로드
import { useReport } from '../../../context/ReportContext';

const CalendarCard = ({ viewYear, viewMonth, calendarDays, onPrevMonth, onNextMonth }) => {
  // 🚨 [Fix] 파이프 교체
  const { setCurrentView, setSelectedId, setPreSelectedDate } = useReport(); 

  const handleDateClick = (dayItem) => {
    if (!dayItem.day) return; 

    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayItem.day).padStart(2, '0')}`;

    if (dayItem.active && dayItem.reportId) {
      // 🅰️ 일보가 있으면 -> 수정 모드('write')로 뷰 전환 및 ID 전달
      setSelectedId(dayItem.reportId);
      setCurrentView('write');
    } else {
      // 🅱️ 일보가 없으면 -> 작성 페이지로 이동하되, 날짜(preSelectedDate)를 Context에 임시 저장
      setPreSelectedDate(dateStr);
      setSelectedId(null);
      setCurrentView('write');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-full">
      
      {/* 달력 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          {viewYear}년 {viewMonth + 1}월
        </h3>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={onNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 font-bold mb-2">
        <div className="text-red-400">일</div>
        <div>월</div><div>화</div><div>수</div><div>목</div><div>금</div>
        <div className="text-blue-400">토</div>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1 flex-1 text-sm">
        {calendarDays.map((d, i) => (
          <div 
            key={i} 
            onClick={() => handleDateClick(d)} 
            className={`
              aspect-square flex items-center justify-center rounded-lg relative cursor-pointer transition-all
              ${!d.day ? 'pointer-events-none' : 'hover:bg-blue-50 hover:scale-110 hover:z-10'} 
              ${d.isToday ? 'font-bold ring-2 ring-blue-600 ring-offset-1 z-10' : ''}
              ${d.active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600'}
            `}
          >
            {d.day}
            
            {/* 작성된 일보가 있으면 파란 점 표시 */}
            {d.active && (
              <span className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full"></span>
            )}
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default CalendarCard;