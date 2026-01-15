import React from 'react';
import { Calendar, FileText, ChevronDown, CheckCircle2 } from 'lucide-react';

const StatsCard = ({ viewYear, setViewYear, viewMonth, setViewMonth, availableYears, count }) => {
  
  // ✨ 이번 달이 며칠까지 있는지 계산 (28일? 30일? 31일?)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  
  // ✨ 달성률 계산 (작성수 / 전체일수)
  const achievementRate = Math.round((count / daysInMonth) * 100);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
      
      {/* 1. 헤더 */}
      <div className="flex items-center justify-between mb-4 z-10">
        <span className="text-gray-500 text-sm flex items-center gap-1 font-medium">
          <Calendar size={14} /> 기간 선택
        </span>
        {/* 달성률 뱃지 */}
        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
          <CheckCircle2 size={12} />
          달성률 {achievementRate}%
        </span>
      </div>

      {/* 2. 드롭다운 (연도/월 선택) */}
      <div className="flex gap-2 mb-6 z-10">
        <div className="relative flex-1">
          <select 
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-bold focus:outline-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" size={14} />
        </div>
        <div className="relative flex-1">
          <select 
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="w-full appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-bold focus:outline-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{i + 1}월</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" size={14} />
        </div>
      </div>
      
      {/* 3. 숫자 & 프로그레스 바 */}
      <div className="z-10 mt-auto">
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-4xl font-extrabold text-gray-800 tracking-tight">{count}</p>
          <span className="text-gray-500 font-medium">건 작성</span>
        </div>

        {/* 프로그레스 바 배경 */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          {/* 실제 게이지 (파란색) */}
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${achievementRate}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 text-right">
          이번 달 목표까지 화이팅! 🔥
        </p>
      </div>

      {/* ✨ 4. 배경 장식 (은은한 워터마크) */}
      <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-50 z-0 pointer-events-none transform rotate-12 group-hover:scale-110 transition-transform duration-500">
        <FileText size={140} />
      </div>

    </div>
  );
};

export default StatsCard;