import React from 'react';
import { Calendar, FileText, ChevronDown, CheckCircle2 } from 'lucide-react';

const StatsCard = ({ viewYear, setViewYear, viewMonth, setViewMonth, availableYears, count }) => {
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const achievementRate = Math.round((count / daysInMonth) * 100);

  return (
    // 🚨 [Fix] 높이 고정(min-h-[350px]) 및 다크 글래스모피즘 테마 적용
    <div className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col justify-between relative overflow-hidden group h-full min-h-[350px]">
      
      <div className="flex items-center justify-between mb-4 z-10">
        <span className="text-slate-400 text-sm flex items-center gap-1 font-medium">
          <Calendar size={14} /> 기간 선택
        </span>
        <span className="text-xs font-bold px-3 py-1 bg-blue-900/40 text-blue-300 border border-blue-800/50 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
          <CheckCircle2 size={12} /> 달성률 {achievementRate}%
        </span>
      </div>

      <div className="flex gap-2 mb-6 z-10">
        <div className="relative flex-1">
          <select 
            value={viewYear}
            onChange={(e) => setViewYear(Number(e.target.value))}
            className="w-full appearance-none bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {availableYears.map(year => <option key={year} value={year}>{year}년</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative flex-1">
          <select 
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="w-full appearance-none bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}월</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>
      
      <div className="z-10 mt-auto">
        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-5xl font-extrabold text-white tracking-tight">{count}</p>
          <span className="text-slate-400 font-medium text-lg">건 기록됨</span>
        </div>

        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
          <div 
            className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.8)] relative"
            style={{ width: `${achievementRate}%` }}
          >
             <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-right">
          우주의 궤적을 채워가고 있습니다 🚀
        </p>
      </div>

      <div className="absolute -bottom-6 -right-6 text-slate-800/40 opacity-50 z-0 pointer-events-none transform rotate-12 group-hover:scale-110 group-hover:text-slate-700/30 transition-all duration-700">
        <FileText size={160} />
      </div>
    </div>
  );
};

export default StatsCard;