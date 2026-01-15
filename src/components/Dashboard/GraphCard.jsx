import React from 'react';
import { TrendingUp, BarChart2, PieChart, ChevronDown } from 'lucide-react';

const GraphCard = ({ showGraph, setShowGraph, graphYear, setGraphYear, availableYears, yearlyTrend, totalCount, maxCount }) => {
  return (
    <div 
      onClick={() => setShowGraph(!showGraph)}
      className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2 z-10">
        <span className="text-gray-500 text-sm flex items-center gap-1">
          {showGraph ? <BarChart2 size={14} /> : <TrendingUp size={14} />}
          {showGraph ? `${graphYear}년 추이` : '전체 누적 기록'}
        </span>
        
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <select 
            value={graphYear}
            onChange={(e) => setGraphYear(Number(e.target.value))}
            className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg text-xs font-bold focus:outline-blue-500 cursor-pointer transition-colors"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1.5 text-gray-500 pointer-events-none" size={12} />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end min-h-[120px]">
        {showGraph ? (
          <div className="flex items-end justify-between w-full h-full gap-1 pt-4 animate-in fade-in duration-300">
            {yearlyTrend.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group/bar">
                <div className="w-full relative flex items-end h-full">
                   <div 
                    style={{ height: `${(item.count / maxCount) * 100}%` }}
                    className={`w-full rounded-t-sm transition-all duration-500 ${item.count > 0 ? 'bg-blue-400 group-hover/bar:bg-blue-500' : 'bg-gray-100'}`}
                  ></div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    {item.count}건
                  </div>
                </div>
                <span className="text-[9px] text-gray-400 font-medium">
                  {idx % 2 === 0 ? item.label : ''} 
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-baseline justify-between w-full animate-in fade-in duration-300">
            <div>
               <p className="text-4xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                 {totalCount}
               </p>
               <span className="text-gray-500 text-sm">Total Reports</span>
            </div>
            <div className="flex items-end gap-1 opacity-20 grayscale group-hover:grayscale-0 transition-all">
               <div className="w-2 h-4 bg-blue-500 rounded-t"></div>
               <div className="w-2 h-6 bg-blue-500 rounded-t"></div>
               <div className="w-2 h-3 bg-blue-500 rounded-t"></div>
               <div className="w-2 h-8 bg-blue-500 rounded-t"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphCard;