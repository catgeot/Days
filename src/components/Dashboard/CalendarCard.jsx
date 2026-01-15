import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const CalendarCard = ({ viewYear, viewMonth, calendarDays }) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative transition-colors flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <span className="text-sm font-bold text-gray-700">
          {viewYear}년 {viewMonth + 1}월 현황
        </span>
        <Calendar size={16} className="text-purple-600" />
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs flex-1">
        {['일','월','화','수','목','금','토'].map(d => (
          <div key={d} className="text-gray-400 mb-1">{d}</div>
        ))}

        {calendarDays.map((item, index) => (
          <div key={index} className="aspect-square flex items-center justify-center">
            {item.day && (
              <>
                {item.active ? (
                  <Link 
                    to={`/report/${item.reportId}`}
                    title={`${item.day}일 일보 보기`}
                    className={`
                      w-6 h-6 flex items-center justify-center rounded-full 
                      bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all
                      ${item.isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
                    `}
                  >
                    {item.day}
                  </Link>
                ) : (
                  <div 
                    className={`
                      w-6 h-6 flex items-center justify-center rounded-full 
                      text-gray-400 bg-gray-50
                      ${item.isToday ? 'ring-2 ring-gray-300 ring-offset-1 font-bold text-gray-600' : ''}
                    `}
                  >
                    {item.day}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarCard;