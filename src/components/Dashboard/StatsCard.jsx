import React from 'react';
import { Calendar, FileText, ChevronDown } from 'lucide-react';

const StatsCard = ({ viewYear, setViewYear, viewMonth, setViewMonth, availableYears, count }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-500 text-sm flex items-center gap-1">
          <Calendar size={14} /> 기간 선택
        </span>
        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></span>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <select 
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14} />
        </div>
        <div className="relative flex-1">
          <select 
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-2 pr-6 rounded text-sm font-bold focus:outline-blue-500 cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i + 1}월</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>
      
      <div className="flex items-end gap-2">
        <p className="text-4xl font-bold text-gray-800">{count}</p>
        <span className="text-gray-500 mb-1">건 작성</span>
      </div>
    </div>
  );
};

export default StatsCard;